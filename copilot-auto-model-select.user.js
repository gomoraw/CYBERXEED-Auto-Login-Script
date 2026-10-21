// ==UserScript==
// @name         M365 Copilot - モデル自動選択（GPT-6.1 優先）
// @namespace    https://github.com/gomoraw/BrowseOps
// @version      1.4.0
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
  const POLL_MS = 50;
  const SWITCHER_TIMEOUT_MS = 30000;
  const MENU_TIMEOUT_MS = 2000;
  const RESET_TIMEOUT_MS = 2000;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => (s || '').toLowerCase().replace(/[\s\-_‐-―]/g, '');
  const startsWith = (s, label) => norm(s).startsWith(norm(label));
  const menuItems = () => [...document.querySelectorAll('[role="menuitem"]')];

  // fn() が真になるまで POLL_MS おきに確認する。時間切れなら null
  async function waitFor(fn, timeout) {
    const end = Date.now() + timeout;
    for (;;) {
      const v = fn();
      if (v) return v;
      if (Date.now() >= end) return null;
      await sleep(POLL_MS);
    }
  }

  const findSwitcher = () =>
    document.querySelector('#gptModeSwitcher') ||
    document.querySelector('button[aria-label="Model Selector"]');
  const isTop = (switcher) => startsWith(switcher.textContent, PRIORITY[0].label);

  // サブメニューを開いていると Escape 1 回では親メニューが残る
  async function closeMenu() {
    for (let i = 0; i < 3 && menuItems().length; i++) {
      const before = menuItems().length;
      (document.activeElement || document.body).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true })
      );
      await waitFor(() => menuItems().length < before, 300);
    }
  }

  async function trySelect() {
    const switcher = await waitFor(findSwitcher, SWITCHER_TIMEOUT_MS);
    if (!switcher) return true;
    if (isTop(switcher)) return true;

    switcher.click();
    if (!(await waitFor(() => menuItems().length, MENU_TIMEOUT_MS))) return false;

    for (const { label, submenu } of PRIORITY) {
      if (submenu) {
        const parent = menuItems().find(
          (el) => el.getAttribute('aria-haspopup') === 'menu' && startsWith(el.textContent, submenu)
        );
        if (!parent) continue;
        if (parent.getAttribute('aria-expanded') !== 'true') {
          const before = menuItems().length;
          parent.click();
          await waitFor(() => menuItems().length > before, MENU_TIMEOUT_MS);
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
      for (let i = 0; i < 3; i++) {
        if (await trySelect()) return;
        await closeMenu();
      }
    } finally {
      running = false;
    }
  }

  // 「新しいチャット」はページを読み直さずにモデルを既定へ戻すことがある。戻らなければ何もしない
  async function onNewChat() {
    if (await waitFor(() => { const sw = findSwitcher(); return sw && !isTop(sw); }, RESET_TIMEOUT_MS)) run();
  }

  document.addEventListener(
    'click',
    (e) => {
      const el = e.target.closest && e.target.closest('button, a');
      if (!el) return;
      const name = (el.getAttribute('aria-label') || '') + el.textContent;
      if (/新しいチャット|new chat/i.test(name)) onNewChat();
    },
    true
  );

  run();
})();
