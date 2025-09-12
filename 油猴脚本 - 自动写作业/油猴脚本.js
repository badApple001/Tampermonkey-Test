// ==UserScript==
// @name         中国地质大学 - 写作业脚本 ( 自动答题 )
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
    const REMOTE_URL = "https://raw.githubusercontent.com/badApple001/Tampermonkey-Test/main/dowork_remote_script.js";
    const API_KEY = 'sk-ebf67df8c64241d7bd28ee30d456f797'; // 在此处填写你的 API 密钥
    const API_URL = 'https://api.deepseek.com/v1/chat/completions';
    let lastCode = null;

    // 默认逻辑模块（远程拉取失败时用）
    let remoteModule = {
        tick: function () {
            console.log("内置Tick触发");
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
        console.log("[热更] 拉取远程模块");
        GM_xmlhttpRequest({
            method: "GET",
            url: REMOTE_URL,
            onload: function (res) {
                console.log("[热更] Requst返回: " + res.status);
                if (res.status === 200) {
                    console.log("[热更] 读取远程模块成功")
                    const newCode = res.responseText;
                    const strippedNewCode = newCode.replace(/\s+/g, '');
                    if (lastCode != strippedNewCode) {
                        console.log("[热更] 检测到远程模块更新，正在替换...");
                        lastCode = strippedNewCode;
                        try {
                            // 执行远程代码，要求远程脚本必须返回一个对象
                            let newModule = eval(`${newCode}`)(callDeepSeekAPI);
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
        if (remoteModule.tick) {
            // 如果 tick 是 async，返回 Promise
            const p = remoteModule.tick();
            if (p && typeof p.catch === "function") {
                p.catch(e => console.error("[tick错误]", e));
            }
        }
    }, 1000);

    // 每 30 秒热更一次
    setInterval(fetchRemoteModule, 10000);
    console.log("脚本已启动，支持远程模块热更");
})();
