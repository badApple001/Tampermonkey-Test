// ==UserScript==
// @name         中国地质大学 - 刷课脚本 ( 自动答题，自动播放下一个视频 )
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  每秒调用远程逻辑，支持热更新模块
// @match        https://www.whxunw.com/student-web/*
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @connect      api.deepseek.com
// @connect      api.siliconcloud.ai
// ==/UserScript==

(function () {
    'use strict';

    // 配置参数
    const REMOTE_URL = "https://raw.githubusercontent.com/badApple001/Tampermonkey-Test/main/remote_logic.js";
    const API_KEY = 'sk-ebf67df8c64241d7bd28ee30d456f797'; // 在此处填写你的 API 密钥
    const API_URL = 'https://api.deepseek.com/v1/chat/completions';
    let lastCode = null;

    // 默认逻辑模块（远程拉取失败时用）
    let remoteModule = {
        tick: function () {
            let dialog = document.querySelector('.dilog');
            if (dialog) {
                console.log("[本地逻辑] 检测到了 .dilog 弹窗");
            }
        }
    };

    // 调用 API
    async function callDeepSeekAPI(message) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: API_URL,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`
                },
                data: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ role: "user", content: message }],
                    temperature: 0.7
                }),
                onload: function (response) {
                    const data = JSON.parse(response.responseText);
                    resolve(data.choices[0].message.content);
                },
                onerror: function (error) {
                    reject(error);
                }
            });
        });
    }


    // 定时拉取远程逻辑
    function fetchRemoteModule() {
        GM_xmlhttpRequest({
            method: "GET",
            url: REMOTE_URL,
            onload: function (res) {
                if (res.status === 200) {
                    const newCode = res.responseText.trim();
                    if (lastCode !== newCode) {
                        console.log("[热更] 检测到远程模块更新，正在替换...");
                        lastCode = newCode;
                        try {
                            // 执行远程代码，要求远程脚本必须返回一个对象
                            // let newModule = eval(newCode);
                            let newModule = eval(`(function(callAPI){return ${newCode}})(callDeepSeekAPI)`);
                            if (newModule && typeof newModule.tick === "function") {
                                remoteModule = newModule;
                                console.log("[热更] 模块替换成功");
                            } else {
                                console.warn("[热更] 远程代码没有返回有效模块，保持旧模块");
                            }
                        } catch (e) {
                            console.error("[热更] 执行远程代码失败:", e);
                        }
                    }
                }
            },
            onerror: function () {
                console.error("[热更] 拉取远程模块失败");
            }
        });
    }

    // 每秒调用当前模块逻辑
    setInterval(() => {
        remoteModule.tick().catch(e => console.error("[调用错误]", e));
    }, 1000);

    // 每 30 秒热更一次
    setInterval(fetchRemoteModule, 10000);
    console.log("脚本已启动，支持远程模块热更");
})();
