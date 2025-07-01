\# CYBERXEED Auto Login Script 🚀



\*\*毎日の面倒なログインを、一瞬で。\*\*



このスクリプトは、CYBERXEEDとe-clockingのログインページを自動化し、あなたの貴重な時間を節約します。特にiPhoneとSafariの組み合わせに最適化されています。



!\[Platform Support](https://img.shields.io/badge/Platform-iPhone%20%7C%20Safari-blue.svg)

!\[License](https://img.shields.io/badge/License-MIT-green.svg)



---



\## ✨ このスクリプトを選ぶ理由



\*   \*\*完全自動化\*\*: ページを開くだけで、IDとパスワードが自動入力され、ログインが完了します。

\*   \*\*デュアル対応\*\*: CYBERXEED標準ページとe-clockingページの両方でシームレスに動作します。

\*   \*\*iPhone特化\*\*: iOSのSafari拡張機能「Makeover」で確実に動作することを確認済みです。

\*   \*\*安全な設計\*\*: ログイン情報はあなたのiPhone内にのみ保存され、外部に送信されることは一切ありません。



\## 📱 iPhone (Safari + Makeover) での導入ガイド



このスクリプトをiPhoneで動かすには、「Makeover」というアプリが必要です。以下の5ステップで設定は完了します。



\### Step 1: 必要なアプリを準備する



1\.  \*\*Makeoverをインストール\*\*:

&nbsp;   App Storeで「\*\*Makeover\*\*」と検索し、インストールします。

&nbsp;   > \[App StoreでMakeoverを開く](https://apps.apple.com/jp/app/makeover-custom-css/id6479110556)



2\.  \*\*Safari拡張機能を有効化\*\*:

&nbsp;   \*   iPhoneの「設定」アプリを開きます。

&nbsp;   \*   `Safari` → `拡張機能` の順にタップします。

&nbsp;   \*   `Makeover` をオンにし、「すべてのWebサイト」の権限を「\*\*許可\*\*」に設定します。



\### Step 2: スクリプトを設定する



1\.  \*\*Makeoverアプリを開きます\*\*。

2\.  画面下部の「\*\*JavaScript\*\*」タブをタップします。

3\.  右上の「\*\*+\*\*」ボタンをタップして、新しいスクリプトを追加します。

4\.  以下の2つの項目を設定します。

&nbsp;   \*   \*\*サイト\*\*: `\*.i-abs.co.jp` と入力します。

&nbsp;   \*   \*\*コード\*\*: 下記のスクリプトコードをコピーして、そのまま貼り付けます。



&nbsp;   <details>

&nbsp;   <summary>ここをクリックしてスクリプトコードを表示</summary>



&nbsp;   ```

&nbsp;   // ==UserScript==

&nbsp;   // @name         CYBERXEED Auto Login

&nbsp;   // @namespace    https://github.com/yourusername/CYBERXEED-Auto-Login-Script

&nbsp;   // @version      2.0

&nbsp;   // @description  Automates login for CYBERXEED \& e-clocking on Safari with Makeover.

&nbsp;   // @author       Your Name

&nbsp;   // @match        https://\*.i-abs.co.jp/cyberx/login.asp\*

&nbsp;   // @match        https://\*.i-abs.co.jp/CX\_e-clocking/\*

&nbsp;   // @grant        none

&nbsp;   // @license      MIT

&nbsp;   // ==/UserScript==



&nbsp;   (function() {

&nbsp;       'use strict';

&nbsp;       

&nbsp;       // ▼▼▼ あなたのログイン情報に書き換えてください ▼▼▼

&nbsp;       const LOGIN\_INFO = {

&nbsp;           companyCode: 'あなたの会社コード',

&nbsp;           employeeCode: 'あなたの個人コード',

&nbsp;           password: 'あなたのパスワード'

&nbsp;       };

&nbsp;       // ▲▲▲ 設定はここまで ▲▲▲



&nbsp;       function isEClockingPage() {

&nbsp;           return window.location.pathname.includes('/CX\_e-clocking/');

&nbsp;       }



&nbsp;       function getLoginElements() {

&nbsp;           if (isEClockingPage()) {

&nbsp;               return {

&nbsp;                   company: document.querySelector('input\[name="company"]'),

&nbsp;                   employee: document.querySelector('input\[name="employee"]'),

&nbsp;                   password: document.querySelector('input\[name="password"]'),

&nbsp;                   loginButton: document.querySelector('button.btn-login')

&nbsp;               };

&nbsp;           } else {

&nbsp;               return {

&nbsp;                   company: document.querySelector('input\[placeholder\*="会社コード"], input\[placeholder\*="Company Code"]'),

&nbsp;                   employee: document.querySelector('input\[placeholder\*="個人コード"], input\[placeholder\*="Employee Code"]'),

&nbsp;                   password: document.querySelector('input\[placeholder\*="パスワード"], input\[placeholder\*="Password"]'),

&nbsp;                   loginButton: Array.from(document.querySelectorAll('button')).find(btn => /LOGIN|ログイン/i.test(btn.textContent))

&nbsp;               };

&nbsp;           }

&nbsp;       }



&nbsp;       function triggerEvents(element) {

&nbsp;           \['input', 'change', 'blur'].forEach(type => element.dispatchEvent(new Event(type, { bubbles: true })));

&nbsp;       }



&nbsp;       function executeLogin() {

&nbsp;           const elements = getLoginElements();

&nbsp;           if (Object.values(elements).some(el => !el)) return false;

&nbsp;           

&nbsp;           elements.company.value = LOGIN\_INFO.companyCode;

&nbsp;           elements.employee.value = LOGIN\_INFO.employeeCode;

&nbsp;           elements.password.value = LOGIN\_INFO.password;

&nbsp;           

&nbsp;           \[elements.company, elements.employee, elements.password].forEach(triggerEvents);

&nbsp;           

&nbsp;           elements.loginButton.click();

&nbsp;           console.log('✅ CYBERXEED Auto Login: Success!');

&nbsp;           return true;

&nbsp;       }



&nbsp;       const observer = new MutationObserver(() => {

&nbsp;           if (executeLogin()) observer.disconnect();

&nbsp;       });

&nbsp;       

&nbsp;       if (!executeLogin()) {

&nbsp;           observer.observe(document.body, { childList: true, subtree: true });

&nbsp;       }

&nbsp;   })();

&nbsp;   ```

&nbsp;   </details>



5\.  貼り付けたコード内の`LOGIN\_INFO`セクションを、\*\*あなた自身のログイン情報\*\*に書き換えます。

6\.  右上の「\*\*保存\*\*」をタップします。



以上で設定は完了です！SafariでCYBERXEEDのログインページを開いて、魔法を体験してください。



\## 💡 よくある質問 (FAQ)



\*   \*\*Q: WindowsやMacでも使えますか？\*\*

&nbsp;   \*   A: 理論上は\[Tampermonkey](https://www.tampermonkey.net/)などの拡張機能で動作するはずですが、現在はiPhoneでのみ動作確認をしています。



\*   \*\*Q: パスワードを変更した場合はどうすればいいですか？\*\*

&nbsp;   \*   A: Makeoverアプリを開き、保存したスクリプト内の`password`の値を新しいものに更新してください。



\*   \*\*Q: 安全性は大丈夫ですか？\*\*

&nbsp;   \*   A: このスクリプトは、あなたのiPhone上のSafari内でのみ動作します。ログイン情報が開発者や第三者に送信されることはありませんのでご安心ください。ただし、スクリプトにパスワードを直接記述することのリスクはご理解の上、ご利用ください。



\## ⚠️ 免責事項



このスクリプトは個人の学習と利便性のために作成されたものであり、無保証で提供されます。本スクリプトの使用によって生じたいかなる損害についても、開発者は一切の責任を負いません。すべて自己責任でご利用ください。



\## 📜 ライセンス



このプロジェクトはMITライセンスの下で公開されています。詳細は\[LICENSE](LICENSE)ファイルをご覧ください。



