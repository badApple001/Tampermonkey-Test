// ==UserScript==
// @name         中国地质大学 - 提取作业答案
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

    setTimeout(() => {
        const result = [];
        const answers = [];
        document.querySelectorAll(".choice").forEach(choice => {
            const titleDiv = choice.querySelector(".title span");
            if (!titleDiv) return;

            // 题目
            const question = titleDiv.textContent.trim();

            // 选项
            const options = {};
            choice.querySelectorAll(".list .li").forEach(li => {
                const key = li.querySelector(".unit")?.textContent.trim();
                const text = li.querySelector(".txt")?.innerText.trim();
                if (key && text) {
                    options[key] = text;
                }
            });

            // 标准答案
            const analysisBox = choice.querySelector(".analysisBox");
            let answer = "";
            if (analysisBox) {
                const stdAns = Array.from(analysisBox.querySelectorAll("div"))
                    .find(d => d.textContent.includes("标准答案"));
                if (stdAns) {
                    answer = stdAns.textContent.replace("标准答案：", "").trim();
                }
            }

            result.push({
                question,
                options,
                answer
            });
            answers.push(answer);
        });

        console.log(JSON.stringify(result, null, 2));
        console.log(answers.join(','));
    }, 2000);



})();
