// ==UserScript==
// @name         M365 Copilot - モデル自動選択（GPT-6.1 優先）
// @namespace    https://github.com/gomoraw/BrowseOps
// @version      1.3.0
// @description  Copilot のモデル選択で GPT-6.1 を選び、無ければ Think deeper を選ぶ
// @author       gomoraw
// @match        https://copilot.cloud.microsoft/*
// @match        https://m365.cloud.microsoft/*
// @match        https://copilot.microsoft.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  // 優先順。label はメニュー表示名の先頭、submenu は親メニュー表示名の先頭（大文字小文字・空白・ハイフンは無視）
  const PRIORITY = [
    { label: 'gpt-6.1', submenu: 'gpt' },
    { label: 'think deeper' },
  ];
  const MAX_TRIES = 40;
  const RETRY_MS = 750;
  const MENU_WAIT_MS = 400;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => (s || '').toLowerCase().replace(/[\s\-_‐-―]/g, '');
  const startsWith = (s, label) => norm(s).startsWith(norm(label));
  const menuItems = () => [...document.querySelectorAll('[role="menuitem"]')];

  const findSwitcher = () =>
    document.querySelector('#gptModeSwitcher') ||
    document.querySelector('button[aria-label="Model Selector"]');

  // サブメニューを開いていると Escape 1 回では親メニューが残る
  async function closeMenu() {
    for (let i = 0; i < 3 && menuItems().length; i++) {
      (document.activeElement || document.body).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true })
      );
      await sleep(150);
    }
  }

  async function trySelect() {
    const switcher = findSwitcher();
    if (!switcher) return false;
    if (startsWith(switcher.textContent, PRIORITY[0].label)) return true;

    switcher.click();
    await sleep(MENU_WAIT_MS);
    if (!menuItems().length) return false;

    for (const { label, submenu } of PRIORITY) {
      if (submenu) {
        const parent = menuItems().find(
          (el) => el.getAttribute('aria-haspopup') === 'menu' && startsWith(el.textContent, submenu)
        );
        if (!parent) continue;
        if (parent.getAttribute('aria-expanded') !== 'true') {
          parent.click();
          await sleep(MENU_WAIT_MS);
        }
      }
      const item = menuItems().find((el) => startsWith(el.textContent, label));
      if (!item) continue;
      if (item.getAttribute('aria-checked') === 'true') {
        await closeMenu();
      } else {
        item.click();
      }
      return true;
    }
    await closeMenu();
    return true;
  }

  let running = false;
  async function run() {
    if (running) return;
    running = true;
    try {
      for (let i = 0; i < MAX_TRIES; i++) {
        if (await trySelect()) return;
        await sleep(RETRY_MS);
      }
    } finally {
      running = false;
    }
  }

  // 「新しいチャット」はページを読み直さずにモデルを既定へ戻す
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target.closest && e.target.closest('button, a');
      if (!el) return;
      const name = (el.getAttribute('aria-label') || '') + el.textContent;
      if (/新しいチャット|new chat/i.test(name)) setTimeout(run, 1000);
    },
    true
  );

  run();
})();
