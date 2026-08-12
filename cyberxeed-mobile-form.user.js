// ==UserScript==
// @name         CYBERXEED - 届出画面モバイル最適化
// @namespace    https://github.com/gomoraw/BrowseOps
// @version      0.7.0
// @description  CYBERXEED全画面をモバイル専用に最適化する。設計根拠は docs/cyberxeed-mobile-form-design.md 参照
// @author       gomoraw
// @match        https://cxg9.i-abs.co.jp/CYBERXEED/*
// @match        https://cxg9.i-abs.co.jp/CYBERXEED/
// @grant        none
// @run-at       document-idle
// ==/UserScript==
/* jshint esversion: 6 */

// 各CSSルールの設計根拠・DOM構造の実測結果は docs/cyberxeed-mobile-form-design.md を参照。
// このファイルにはロジックのみを置き、経緯説明はリポジトリのドキュメント側で管理する。

(function () {
  'use strict';

  const VERSION  = '0.7.0';
  const BREAKPT  = 820;   // これ未満の幅でのみ適用（PC表示は一切変えない）
  const STYLE_ID = 'cx-mobile-form-style';
  const NAV_OPEN_CLASS = 'cx-mobile-nav-open';

  const CSS = `
@media (max-width: ${BREAKPT}px) {
  /* 1-2. .page-dox-wrapper 直下のインライン min-width 直書きを解除し横あふれを解消 */
  .page-dox-wrapper > * {
    min-width: 0 !important;
  }
  .page-dox-wrapper {
    width: 100% !important;
    max-width: 100% !important;
  }
  .app-content {
    width: auto !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }

  /* 3. 横並び2カラムを縦積みに */
  .content-container {
    display: flex !important;
    flex-direction: column !important;
    flex-wrap: wrap !important;
  }
  .content-container > div,
  .content-container .content-right {
    width: auto !important;
    min-width: 0 !important;
    max-width: 100% !important;
    flex: 0 0 auto !important;
  }

  /* 4. 文字サイズを16px下限に統一（iOS自動ズーム抑止／可読性） */
  input, select, textarea,
  button,
  a,
  label,
  .menu-label,
  .menu-list,
  .sub-header {
    font-size: 16px !important;
  }

  /* 5. タップ領域確保（Apple HIG推奨の44px相当） */
  input:not([type="checkbox"]):not([type="radio"]),
  select,
  button {
    min-height: 44px !important;
  }
  input[type="checkbox"],
  input[type="radio"] {
    width: 20px !important;
    height: 20px !important;
  }
  a.menu-link {
    padding-top: 10px !important;
    padding-bottom: 10px !important;
  }
  .menu-item {
    margin-bottom: 4px !important;
  }
  .actions a.nav-link {
    padding: 10px 12px !important;
  }

  /* 6. ヘッダーの横あふれ修正。会社名・社員名は非表示、トップ/ログアウトは残す */
  .header .actions > div.nav-text {
    display: none !important;
  }
  .branding {
    flex-shrink: 1 !important;
    min-width: 0 !important;
    overflow: hidden !important;
  }
  .branding .sub-header {
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }
  .actions {
    flex-shrink: 0 !important;
  }

  /* 7. 左サイドメニューの折りたたみ化。既定は幅0、.${NAV_OPEN_CLASS} 時のみオーバーレイ表示 */
  .page-container > cx-splitter {
    width: 0 !important;
    min-width: 0 !important;
    overflow: hidden !important;
  }
  .cx-splitter-content {
    width: 0 !important;
    min-width: 0 !important;
  }
  body.${NAV_OPEN_CLASS} .page-container > cx-splitter {
    display: block !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    bottom: 0 !important;
    width: 78vw !important;
    max-width: 280px !important;
    min-width: 0 !important;
    height: 100% !important;
    z-index: 2000 !important;
    background: #fff !important;
    box-shadow: 2px 0 12px rgba(0, 0, 0, .35) !important;
    overflow: hidden !important;
  }
  body.${NAV_OPEN_CLASS} .cx-splitter-content {
    width: 100% !important;
    height: 100% !important;
    overflow-y: auto !important;
  }

  /* 8. ハンバーガーボタン（.header 先頭にJS側で挿入） */
  #cx-mobile-nav-toggle {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
    position: relative !important;
    z-index: 2100 !important;
    width: 44px !important;
    height: 44px !important;
    margin-right: 4px !important;
    padding: 0 !important;
    border: none !important;
    border-radius: 4px !important;
    background: rgba(255, 255, 255, .12) !important;
    color: #fff !important;
    font-size: 20px !important;
    line-height: 1 !important;
  }

  /* 9. バックドロップ（メニュー展開中のみ表示、タップで閉じる） */
  #cx-mobile-nav-backdrop {
    display: none;
  }
  body.${NAV_OPEN_CLASS} #cx-mobile-nav-backdrop {
    display: block !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: rgba(0, 0, 0, .4) !important;
    z-index: 1900 !important;
  }

  /* 10-11. 汎用フォールバック（構造未調査の画面向け）。inline style の width/min-width/flex を緩和 */
  .app-content [style*="width"] {
    max-width: 100% !important;
  }
  .app-content [style*="min-width"] {
    min-width: 0 !important;
  }
  .app-content [style*="flex"] {
    flex-wrap: wrap !important;
  }
}
`;

  function applyStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
    console.log('[cx-mobile-form] v' + VERSION + ' CSS 適用 (breakpoint=' + BREAKPT + 'px, innerWidth=' + window.innerWidth + 'px)');
  }

  // .header は Angular の再描画で作り直されるため、ボタンが見当たらなければ都度作り直す
  function ensureNavToggle() {
    const header = document.querySelector('.header');
    if (header && !document.getElementById('cx-mobile-nav-toggle')) {
      const btn = document.createElement('button');
      btn.id = 'cx-mobile-nav-toggle';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'メニュー開閉');
      btn.textContent = '☰';
      btn.style.display = 'none'; // デスクトップ幅では非表示。狭幅時は media query の !important が上書きする
      btn.addEventListener('click', function () {
        document.body.classList.toggle(NAV_OPEN_CLASS);
      });
      header.insertBefore(btn, header.firstChild);
    }
    if (!document.getElementById('cx-mobile-nav-backdrop')) {
      const backdrop = document.createElement('div');
      backdrop.id = 'cx-mobile-nav-backdrop';
      backdrop.addEventListener('click', function () {
        document.body.classList.remove(NAV_OPEN_CLASS);
      });
      document.body.appendChild(backdrop);
    }
  }

  // メニュー項目タップで画面遷移に合わせてメニューを自動で閉じる（body委譲で一度だけ登録）
  function bindNavAutoClose() {
    if (document.body.dataset.cxNavAutoCloseBound) return;
    document.body.dataset.cxNavAutoCloseBound = '1';
    document.body.addEventListener('click', function (ev) {
      if (ev.target.closest('.page-sidenav a.menu-link')) {
        document.body.classList.remove(NAV_OPEN_CLASS);
      }
    });
  }

  function applyAll() {
    applyStyle();
    ensureNavToggle();
    bindNavAutoClose();
  }

  applyAll();

  // Angular が <head>/.header を差し替えた場合に備えて存在確認だけ繰り返す。
  // レイアウト計測やリサイズ発火は一切しない（SPA のメインスレッドを固めないため）。
  setInterval(applyAll, 3000);
})();
