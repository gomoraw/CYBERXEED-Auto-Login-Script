// ==UserScript==
// @name         CYBERXEED - グリッド全行表示
// @namespace    https://github.com/gomoraw/BrowseOps
// @version      1.8.0
// @description  cx-grid の高さを自動調整して申請項目を全行表示する（後続コンテンツなし時は vpMax キャップ解除・ページスクロール）
// @author       gomoraw
// @match        https://cxg9.i-abs.co.jp/CYBERXEED/*
// @match        https://cxg9.i-abs.co.jp/CYBERXEED/
// @grant        none
// @run-at       document-idle
// ==/UserScript==
/* jshint esversion: 6 */

(function () {
  'use strict';

  const VERSION        = '1.8.0';
  const PAGER_H        = 28;
  const MARGIN         = 4;
  const TAG            = '[grid-expand]';
  const POLL_MS        = 1000;   // cx-grid 出現監視間隔
  const DEBOUNCE_MS    = 150;    // MutationObserver デバウンス幅
  const MAX_VP_RATIO   = 0.90;   // ビューポート高さに対する最大割合

  // ── ログパネル（デフォルト非表示 / Alt+Shift+L でトグル）──────────────
  const panel = document.createElement('div');
  panel.id = 'grid-expand-log';
  panel.style.cssText = [
    'position:fixed', 'bottom:36px', 'right:8px', 'z-index:2147483647',
    'width:380px', 'max-height:240px', 'overflow-y:auto',
    'background:rgba(0,0,0,0.88)', 'color:#0f0', 'font:11px/1.4 monospace',
    'padding:6px 8px', 'border-radius:6px', 'pointer-events:none',
    'white-space:pre-wrap', 'word-break:break-all',
    'display:none'
  ].join(';');

  const toggle = document.createElement('div');
  toggle.id = 'grid-expand-toggle';
  toggle.title = 'Alt+Shift+L でもトグル';
  toggle.style.cssText = [
    'position:fixed', 'bottom:8px', 'right:8px', 'z-index:2147483647',
    'width:24px', 'height:24px', 'border-radius:4px',
    'background:rgba(0,0,0,0.45)', 'color:#0f0', 'font:11px/24px monospace',
    'text-align:center', 'cursor:pointer', 'user-select:none'
  ].join(';');
  toggle.textContent = 'G';

  function attachUI() {
    var root = document.body || document.documentElement;
    if (!document.getElementById('grid-expand-toggle')) root.appendChild(toggle);
    if (!document.getElementById('grid-expand-log'))    root.appendChild(panel);
  }

  function togglePanel() {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }

  toggle.addEventListener('click', togglePanel);
  document.addEventListener('keydown', function (e) {
    if (e.altKey && e.shiftKey && e.key === 'L') togglePanel();
  });

  attachUI();

  const LOG_COLOR = { info: '#0f0', warn: '#ff0', error: '#f66', debug: '#88f' };

  function log(msg, level, data) {
    level = level || 'info';
    const ts = new Date().toTimeString().slice(0, 8);
    const dataStr = data !== undefined ? ' ' + JSON.stringify(data) : '';
    const full = ts + ' [' + level.toUpperCase() + '] ' + msg + dataStr;
    console.log(TAG, full);
    const line = document.createElement('div');
    line.style.color = LOG_COLOR[level] || '#0f0';
    line.textContent = full;
    panel.appendChild(line);
    while (panel.children.length > 80) panel.removeChild(panel.firstChild);
    panel.scrollTop = panel.scrollHeight;
  }

  // ── タブ非表示中はポーリング停止 ────────────────────────────────────────
  let tabVisible = !document.hidden;
  document.addEventListener('visibilitychange', function () {
    tabVisible = !document.hidden;
    log('タブ ' + (tabVisible ? '表示再開' : '非表示：ポーリング停止'), 'info');
  });

  // ── Shadow DOM 透過クエリ ────────────────────────────────────────────────
  // Angular の ViewEncapsulation.ShadowDom が使われている場合に備えた再帰探索
  function deepQuery(selector, root) {
    root = root || document;
    var el = root.querySelector(selector);
    if (el) return el;
    var hosts = root.querySelectorAll('*');
    for (var i = 0; i < hosts.length; i++) {
      if (hosts[i].shadowRoot) {
        var found = deepQuery(selector, hosts[i].shadowRoot);
        if (found) return found;
      }
    }
    return null;
  }

  // ── デバウンス ──────────────────────────────────────────────────────────
  function debounce(fn, ms) {
    var timer;
    return function () {
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(null, args); }, ms);
    };
  }

  // ── グリッド高さ拡張 ────────────────────────────────────────────────────
  // .cx-grid-scrollbar の scrollHeight = 全行を含むスクロール可能な総コンテンツ高さ
  //   clientHeight = 現在可視部分（コンテナに依存）
  //   scrollHeight = 全行の合計高さ（コンテナサイズ非依存）← これを使う
  // lastSetContH ガードで MutationObserver のフィードバックループを防止
  var expandCount  = 0;
  var lastSetContH = -1;

  function expandGrid(trigger) {
    var cont     = deepQuery('.cx-grid-container');
    var frame    = deepQuery('.cx-grid-frame');
    var scrollEl = deepQuery('.cx-grid-scrollbar');

    if (!cont || !frame || !scrollEl) {
      log('expandGrid(' + trigger + '): 要素なし', 'warn',
          { cont: !!cont, frame: !!frame, scrollEl: !!scrollEl });
      return false;
    }

    var currentH = parseInt(cont.style.height, 10) || 0;

    // 自分が設定した高さへの Observer 発火を無視（フィードバックループ防止）
    if (currentH === lastSetContH) {
      log(trigger + ': 自己トリガー スキップ', 'debug');
      return true;
    }

    var totalH = scrollEl.scrollHeight;
    if (totalH <= 0) {
      log(trigger + ': scrollH=0 スキップ', 'debug');
      return false;
    }

    // 後続 .app-content（振替日数一覧など）が実質的な高さを持つ場合のみ上限を下げる
    // DOM解析結果: cx-grid の後続 .app-content[1+] が振替日数一覧に該当（高さ約150px）
    // afterH が80px以下の場合（後続コンテンツなし・小さいフッターのみ）は制限しない
    var afterH = 0;
    var appContents = document.querySelectorAll('.app-content');
    for (var i = 1; i < appContents.length; i++) {
      afterH += appContents[i].offsetHeight || 0;
    }

    // vpMax はグリッド開始位置より下の使用可能高さを基準にする
    // window.innerHeight 全体で計算すると、ヘッダー・ツールバー分（実測 ~160px）を
    // 無視して targetContH が過大になり、振替日数一覧を覆い隠す原因になる
    var contRect = cont.getBoundingClientRect();
    var availH  = window.innerHeight - Math.max(0, contRect.top);
    var vpMax   = Math.floor(availH * MAX_VP_RATIO);
    var maxH    = vpMax;
    if (afterH > 80) {
      var safeMax = Math.floor(vpMax - afterH - MARGIN * 4);
      if (safeMax > 80) maxH = safeMax;
    }
    var contentH = afterH > 80 ? Math.min(totalH, maxH) : totalH;
    var targetContH = contentH + PAGER_H + MARGIN;

    log(trigger + ': scrollH=' + totalH + 'px afterH=' + afterH + 'px availH=' + availH + 'px vpMax=' + vpMax + 'px → target=' + targetContH + 'px', 'debug');

    if (currentH >= targetContH) {
      log(trigger + ': 高さ十分 (' + currentH + 'px)', 'debug');
      return true;
    }

    lastSetContH = targetContH;
    cont.style.height  = targetContH + 'px';
    frame.style.height = (contentH + PAGER_H) + 'px';

    // Angular が制御する親要素（CX-GRID・app-content[0]）も高さを強制設定する
    // これをしないと cx-grid-container のオーバーフローが振替日数一覧を canvas で覆い隠す
    var cxGridEl = deepQuery('cx-grid');
    if (cxGridEl) cxGridEl.style.height = targetContH + 'px';
    if (appContents[0]) appContents[0].style.minHeight = targetContH + 'px';

    window.dispatchEvent(new Event('resize'));

    expandCount++;
    log(trigger + ': ' + currentH + 'px → ' + targetContH + 'px (scrollH=' + totalH + 'px, #' + expandCount + ')', 'info');
    return true;
  }

  var debouncedExpand = debounce(expandGrid, DEBOUNCE_MS);

  // ── MutationObserver 群（cx-grid 存在中のみ有効）───────────────────────
  var gridObservers = [];

  function teardownGridObservers() {
    for (var i = 0; i < gridObservers.length; i++) gridObservers[i].disconnect();
    gridObservers = [];
    log('Observer 解除', 'debug');
  }

  function setupGridObservers() {
    teardownGridObservers();

    var cont   = deepQuery('.cx-grid-container');
    var canvas = cont ? cont.querySelector('canvas') : null;
    var pager  = deepQuery('.cx-grid-pager') || deepQuery('grd-pager');
    var hasShadow = !!(deepQuery('cx-grid') && deepQuery('cx-grid').shadowRoot);

    var scrollEl = deepQuery('.cx-grid-scrollbar');
    log('Observer 設定', 'info', {
      cont:        !!cont,
      scrollEl:    scrollEl ? ('scrollH=' + scrollEl.scrollHeight + ' clientH=' + scrollEl.clientHeight) : null,
      canvas:      canvas ? ('#' + canvas.id) : null,
      pager:       pager ? (pager.className || pager.tagName) : null,
      shadow:      hasShadow,
      lastSetH:    lastSetContH
    });

    if (cont) {
      var o1 = new MutationObserver(function () { debouncedExpand('style'); });
      o1.observe(cont, { attributes: true, attributeFilter: ['style'] });
      gridObservers.push(o1);
    }

    if (canvas) {
      var o2 = new MutationObserver(function () {
        log('canvas 変化 ' + canvas.width + '×' + canvas.height, 'debug');
        debouncedExpand('canvas');
      });
      o2.observe(canvas, { attributes: true, attributeFilter: ['height', 'width'] });
      gridObservers.push(o2);
    }

    if (pager) {
      var o3 = new MutationObserver(function () {
        log('pager 変化: ' + pager.textContent.trim().slice(0, 40), 'debug');
        debouncedExpand('pager');
      });
      o3.observe(pager, { childList: true, subtree: true, characterData: true });
      gridObservers.push(o3);
    }

    expandGrid('init');
  }

  // ── cx-grid 出現監視（setInterval ポーリング、タブ非表示中停止）─────────
  var gridActivated = false;

  setInterval(function () {
    if (!tabVisible) return;
    var gridExists = !!deepQuery('cx-grid');
    if (gridExists && !gridActivated) {
      log('cx-grid 出現 → setup', 'info');
      gridActivated = true;
      setupGridObservers();
    } else if (!gridExists && gridActivated) {
      log('cx-grid 消滅 → teardown', 'info');
      gridActivated = false;
      lastSetContH = -1; // 次回の cx-grid 出現に備えてリセット
      teardownGridObservers();
    }
  }, POLL_MS);

  log('v' + VERSION + ' 起動 - cx-grid ポーリング開始', 'info');

  if (deepQuery('cx-grid')) {
    log('cx-grid 即時検出', 'info');
    gridActivated = true;
    setupGridObservers();
  }
})();
