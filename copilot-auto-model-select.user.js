// ==UserScript==
// @name         M365 Copilot - モデル自動選択（GPT-6.1 優先）
// @namespace    https://github.com/gomoraw/BrowseOps
// @version      1.1.0
// @description  Copilot のモデル選択で GPT-6.1 を選び、無ければ Think deeper を選ぶ
// @author       gomoraw
// @match        https://m365.cloud.microsoft/*
// @match        https://copilot.microsoft.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  // 優先順のメニュー項目名（部分一致。大文字小文字・空白・ハイフンは無視）
  const PRIORITY = ['gpt-6.1', 'think deeper'];
  const MAX_TRIES = 40;
  const RETRY_MS = 750;
  const MENU_WAIT_MS = 150;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => (s || '').toLowerCase().replace(/[\s\-‐-―_]/g, '');
  const matches = (s, label) => norm(s).includes(norm(label));

  const findSwitcher = () =>
    document.querySelector('#gptModeSwitcher') ||
    document.querySelector('button[aria-label="Model Selector"]');

  async function trySelect() {
    const switcher = findSwitcher();
    if (!switcher) return false;
    if (matches(switcher.textContent, PRIORITY[0])) return true;

    switcher.click();
    await sleep(MENU_WAIT_MS);

    const items = [...document.querySelectorAll('[role="menuitemradio"]')];
    let item = null;
    for (const label of PRIORITY) {
      item = items.find((el) => matches(el.textContent, label));
      if (item) break;
    }
    if (!item) {
      switcher.click();
      return false;
    }
    if (item.getAttribute('aria-checked') === 'true') {
      switcher.click();
    } else {
      item.click();
    }
    return true;
  }

  (async () => {
    for (let i = 0; i < MAX_TRIES; i++) {
      if (await trySelect()) return;
      await sleep(RETRY_MS);
    }
  })();
})();
