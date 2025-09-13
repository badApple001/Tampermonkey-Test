// ==UserScript==
// @name         中国地质大学 - 批量填充作业答案
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

    // 延迟函数
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function run() {
        let answersstr = "C,A,A,C,C,B,C,D,C,C,D,D,A,A,B";
        let answers = answersstr.split(',');
        console.log("运行...");

        // 遍历所有题目
        for (const [key, box] of document.querySelectorAll(".liBox").entries()) {
            const answer = answers[key]?.trim();
            if (!answer) continue;

            const options = box.querySelectorAll(".li, .li.on");
            const title = box.querySelector(".title");
            console.log('题目: ' + title.innerText.trim());
            console.log('答案: ' + answer);

            // 遍历每个选项，逐个延迟点击
            for (const opt of options) {
                const unit = opt.querySelector(".unit");
                if (!unit) continue;

                const u = unit.innerText.trim().toLowerCase();

                if (answer.toLowerCase().includes(u)) {
                    if (!opt.classList.contains("on")) {
                        opt.click();
                        console.log("已选择:", u);
                        await sleep(200); // 点击后延迟
                    }
                } else if (opt.classList.contains("on")) {
                    opt.click();
                    console.log("取消选项:", u);
                    await sleep(200); // 点击后延迟
                }
            }

            console.log("\n\n$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$\n\n");
        }
    }


    console.log("脚本延迟执行..");
    // 等待4秒后开始
    setTimeout(async () => {
        await run();
    }, 4000);

})();
