// ==UserScript==
// @name         CYBERXEED - グリッド全行表示
// @namespace    https://github.com/yourusername/CYBERXEED-Auto-Login-Script
// @version      1.0.0
// @description  cx-grid の高さを自動調整して申請項目を全行表示する
// @author       gomoraw
// @match        https://cxg9.i-abs.co.jp/CYBERXEED/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const PAGER_H = 28;    // ページャー行の高さ
  const MARGIN   = 4;    // 余白

  function expandGrid() {
    const cont     = document.querySelector('.cx-grid-container');
    const frame    = document.querySelector('.cx-grid-frame');
    const scrollEl = document.querySelector('.cx-grid-scrollbar');

    if (!cont || !frame || !scrollEl) return false;

    const totalH = scrollEl.scrollHeight;
    if (totalH <= 0) return false;

    const targetContH  = totalH + PAGER_H + MARGIN;
    const targetFrameH = totalH + PAGER_H;

    // すでに十分な高さなら何もしない
    if (parseInt(cont.style.height, 10) >= targetContH) return true;

    cont.style.height  = targetContH + 'px';
    frame.style.height = targetFrameH + 'px';
    window.dispatchEvent(new Event('resize'));
    return true;
  }

  // Angular が style.height を上書きするのを検知して再適用する
  function watchAndExpand() {
    const cont = document.querySelector('.cx-grid-container');
    if (!cont) return;

    const observer = new MutationObserver(() => {
      // Angular が高さを縮小した場合だけ再適用
      expandGrid();
    });

    observer.observe(cont, { attributes: true, attributeFilter: ['style'] });
    expandGrid();
  }

  // cx-grid の DOM 出現を待つ
  function waitForGrid(callback, timeout = 15000) {
    const start = Date.now();
    const check = () => {
      const grid = document.querySelector('cx-grid');
      if (grid) {
        // cx-grid 出現後、スクロール領域のデータ描画を少し待つ
        setTimeout(callback, 400);
        return;
      }
      if (Date.now() - start < timeout) setTimeout(check, 200);
    };
    check();
  }

  // Angular SPA のページ遷移に追従する
  const origPushState    = history.pushState.bind(history);
  const origReplaceState = history.replaceState.bind(history);

  history.pushState = (...args) => {
    origPushState(...args);
    waitForGrid(watchAndExpand);
  };
  history.replaceState = (...args) => {
    origReplaceState(...args);
    waitForGrid(watchAndExpand);
  };

  window.addEventListener('popstate', () => waitForGrid(watchAndExpand));

  // 初回ロード
  waitForGrid(watchAndExpand);
})();
