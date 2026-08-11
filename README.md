# CYBERXEED Auto Login Script 🚀

**毎日の面倒なログインを、一瞬で。**

このスクリプトは、CYBERXEEDとe-clockingのログインページを自動化し、あなたの貴重な時間を節約します。特にiPhoneとSafariの組み合わせに最適化されています。

![Platform Support](https://img.shields.io/badge/Platform-iPhone%20%7C%20Safari-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ このスクリプトを選ぶ理由

- **完全自動化**: ページを開くだけで、IDとパスワードが自動入力され、ログインが完了します。
- **デュアル対応**: CYBERXEED標準ページとe-clockingページの両方でシームレスに動作します。
- **iPhone特化**: iOSのSafari拡張機能「Makeover」で確実に動作することを確認済みです。
- **安全な設計**: ログイン情報はあなたのiPhone内にのみ保存され、外部に送信されることは一切ありません。

## 📱 iPhone (Safari + Makeover) での導入ガイド

このスクリプトをiPhoneで動かすには、「Makeover」というアプリが必要です。以下の5ステップで設定は完了します。

### Step 1: 必要なアプリを準備する

1.  **Makeoverをインストール**:
    App Storeで「**Makeover**」と検索し、インストールします。
    > [App StoreでMakeoverを開く](https://apps.apple.com/jp/app/makeover-custom-css/id6479110556)

2.  **Safari拡張機能を有効化**:
    - iPhoneの「設定」アプリを開きます。
    - `Safari` → `拡張機能` の順にタップします。
    - `Makeover` をオンにし、「すべてのWebサイト」の権限を「**許可**」に設定します。

### Step 2: スクリプトを設定する

1.  **Makeoverアプリを開きます**。
2.  画面下部の「**JavaScript**」タブをタップします。
3.  右上の「**+**」ボタンをタップして、新しいスクリプトを追加します。
4.  以下の2つの項目を設定します。
    - **サイト**: `*.i-abs.co.jp` と入力します。
    - **コード**: 下記のスクリプトコードをコピーして、そのまま貼り付けます。

    <details>
    <summary>ここをクリックしてスクリプトコードを表示</summary>

    ```javascript
    // ==UserScript==
    // @name         CYBERXEED Auto Login
    // @namespace    https://github.com/yourusername/CYBERXEED-Auto-Login-Script
    // @version      2.0
    // @description  Automates login for CYBERXEED & e-clocking on Safari with Makeover.
    // @author       Your Name
    // @match        https://*.i-abs.co.jp/cyberx/login.asp*
    // @match        https://*.i-abs.co.jp/CYBERXEED/*
    // @grant        none
    // @license      MIT
    // ==/UserScript==

    (function() {
        'use strict';

        // ▼▼▼ あなたのログイン情報に書き換えてください ▼▼▼
        const LOGIN_INFO = {
            companyCode: 'あなたの会社コード',
            employeeCode: 'あなたの個人コード',
            password: 'あなたのパスワード'
        };
        // ▲▲▲ 設定はここまで ▲▲▲

        function isEClockingPage() {
            return window.location.pathname.includes('/CX_e-clocking/');
        }

        function getLoginElements() {
            if (isEClockingPage()) {
                return {
                    company: document.querySelector('input[name="company"]'),
                    employee: document.querySelector('input[name="employee"]'),
                    password: document.querySelector('input[name="password"]'),
                    loginButton: document.querySelector('button.btn-login')
                };
            } else {
                return {
                    company: document.querySelector('input[placeholder*="会社コード"], input[placeholder*="Company Code"]'),
                    employee: document.querySelector('input[placeholder*="個人コード"], input[placeholder*="Employee Code"]'),
                    password: document.querySelector('input[placeholder*="パスワード"], input[placeholder*="Password"]'),
                    loginButton: Array.from(document.querySelectorAll('button')).find(btn => /LOGIN|ログイン/i.test(btn.textContent))
                };
            }
        }

        function triggerEvents(element) {
            ['input', 'change', 'blur'].forEach(type => element.dispatchEvent(new Event(type, { bubbles: true })));
        }

        function executeLogin() {
            const elements = getLoginElements();
            if (Object.values(elements).some(el => !el)) return false;

            elements.company.value = LOGIN_INFO.companyCode;
            elements.employee.value = LOGIN_INFO.employeeCode;
            elements.password.value = LOGIN_INFO.password;

            [elements.company, elements.employee, elements.password].forEach(triggerEvents);

            elements.loginButton.click();
            console.log('✅ CYBERXEED Auto Login: Success!');
            return true;
        }

        const observer = new MutationObserver(() => {
            if (executeLogin()) observer.disconnect();
        });

        if (!executeLogin()) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    })();
    ```
    </details>

5.  貼り付けたコード内の`LOGIN_INFO`セクションを、**あなた自身のログイン情報**に書き換えます。
6.  右上の「**保存**」をタップします。

以上で設定は完了です！SafariでCYBERXEEDのログインページを開いて、魔法を体験してください。

## 💡 よくある質問 (FAQ)

- **Q: WindowsやMacでも使えますか？**
  A: 理論上は[Tampermonkey](https://www.tampermonkey.net/)などの拡張機能で動作するはずですが、現在はiPhoneでのみ動作確認をしています。

- **Q: パスワードを変更した場合はどうすればいいですか？**
  A: Makeoverアプリを開き、保存したスクリプト内の`password`の値を新しいものに更新してください。

- **Q: 安全性は大丈夫ですか？**
  A: このスクリプトは、あなたのiPhone上のSafari内でのみ動作します。ログイン情報が開発者や第三者に送信されることはありませんのでご安心ください。ただし、スクリプトにパスワードを直接記述することのリスクはご理解の上、ご利用ください。

## 🖥️ おまけ: グリッド全行表示スクリプト (cyberxeed-grid-expand.user.js)

CYBERXEEDのグリッド（申請一覧など）は初期表示だと高さが固定され、行数が多いと内部スクロールになってしまいます。このスクリプトは cx-grid の高さを実データ量に合わせて自動調整し、ページ全体で全行を表示できるようにします。

- **対象**: Tampermonkeyなど、PCブラウザのユーザースクリプト拡張機能
- **導入方法**: Tampermonkeyのダッシュボードで「新規スクリプト作成」を開き、[cyberxeed-grid-expand.user.js](cyberxeed-grid-expand.user.js) の内容をそのまま貼り付けて保存します
- **動作確認画面右下**: 「G」ボタンでログパネルを開閉できます（`Alt+Shift+L` でもトグル可能）

> ⚠️ スクリプト内の `@match` は動作確認済みの特定テナントのホスト名です。別テナントで使う場合はご自身の環境のホスト名に書き換えてください。

## ⚠️ 免責事項

このスクリプトは個人の学習と利便性のために作成されたものであり、無保証で提供されます。本スクリプトの使用によって生じたいかなる損害についても、開発者は一切の責任を負いません。すべて自己責任でご利用ください。

## 📜 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。
