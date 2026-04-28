// ==UserScript==
// @name         CYBERXEED - グリッド全行表示
// @namespace    https://github.com/gomoraw/CYBERXEED-Auto-Login-Script
// @version      1.5.2
// @description  cx-grid の高さを自動調整して申請項目を全行表示する（scrollbar.scrollHeight 使用・全行表示対応）
// @author       gomoraw
// @date         2026-04-28
// @match        https://cxg9.i-abs.co.jp/CYBERXEED/*
// @match        https://cxg9.i-abs.co.jp/CYBERXEED/
// @grant        none
// @run-at       document-idle
// ==/UserScript==
/* jshint esversion: 6 */

(function () {
  'use strict';

  const VERSION        = '1.5.2';
  const PAGER_H        = 28;
  const MARGIN         = 4;
  const TAG            = '[grid-expand]';
  const POLL_MS        = 1000;   // cx-grid 出現監視間隔
  const PANEL_MS       = 2000;   // パネル存在確認間隔
  const DEBOUNCE_MS    = 150;    // MutationObserver デバウンス幅
  const MAX_VP_RATIO   = 0.90;   // ビューポート高さに対する最大割合

  // ── ログパネル ──────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'grid-expand-log';
  panel.style.cssText = [
    'position:fixed', 'bottom:8px', 'right:8px', 'z-index:2147483647',
    'width:380px', 'max-height:240px', 'overflow-y:auto',
    'background:rgba(0,0,0,0.88)', 'color:#0f0', 'font:11px/1.4 monospace',
    'padding:6px 8px', 'border-radius:6px', 'pointer-events:none',
    'white-space:pre-wrap', 'word-break:break-all'
  ].join(';');

  function ensurePanel() {
    if (!document.getElementById('grid-expand-log')) {
      (document.body || document.documentElement).appendChild(panel);
    }
  }
  setInterval(ensurePanel, PANEL_MS);
  ensurePanel();

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

    // ビューポート高さを上限にして過大展開を抑制
    var maxH     = Math.floor(window.innerHeight * MAX_VP_RATIO);
    var contentH = Math.min(totalH, maxH);
    var targetContH = contentH + PAGER_H + MARGIN;

    log(trigger + ': scrollH=' + totalH + 'px max=' + maxH + 'px → target=' + targetContH + 'px', 'debug');

    if (currentH >= targetContH) {
      log(trigger + ': 高さ十分 (' + currentH + 'px)', 'debug');
      return true;
    }

    lastSetContH = targetContH;
    cont.style.height  = targetContH + 'px';
    frame.style.height = (contentH + PAGER_H) + 'px';
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
