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