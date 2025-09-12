// remote_logic.js
(function (callAPI) {
    return {
        deepSeekLock: false, // 锁放在模块里，防止同时多次调用
        unlockIndex: -1,
        topics: [],
        tick: async function () {

            if (this.unlockIndex === -1) {
                const result = [];
                document.querySelectorAll(".liBox").forEach(box => {
                    const titleDiv = box.querySelector(".title");
                    if (!titleDiv) return;

                    // 获取题目类型（单选题/多选题）
                    const typeMatch = titleDiv.textContent.match(/【(单选题|多选题)】/);
                    const type = typeMatch ? typeMatch[1] : "未知类型";

                    // 获取题干
                    const question = titleDiv.querySelector("span")?.textContent.trim() || "";

                    // 获取选项
                    const options = [];
                    box.querySelectorAll(".list .li").forEach(li => {
                        const key = li.querySelector(".unit")?.textContent.trim();
                        const text = li.querySelector(".txt")?.textContent.trim();
                        if (key && text) {
                            options.push({ key, text });
                        }
                    });

                    result.push({
                        type,
                        question,
                        options
                    });
                });
                this.topics = result;
                this.unlockIndex++;
            }




        },

        handle_question_dialog: async function (dialog) {
            if (this.deepSeekLock) return; // 已锁，直接返回
            this.deepSeekLock = true;

            let titleEl = dialog.querySelector('.choiceContent .title');
            let listEls = dialog.querySelectorAll('.choiceContent .list .li');

            if (!titleEl) return;
            let titleText = titleEl.innerText.trim();
            let type = titleText.includes("多选题") ? "多选题" : "单选题";
            let mode = type === "多选题" ? 2 : 1;
            let question = titleText.replace(/【.*?】\s*\d+、/, "").trim();

            let options = [];
            listEls.forEach(li => {
                let key = li.querySelector('.unit')?.innerText.trim();
                let text = li.querySelector('.txt')?.innerText.trim();
                if (key && text) options.push({ key, text, el: li });
            });


            try {
                let prompt = `题目类型: ${mode === 2 ? "多选题" : "单选题"}\n题目: ${question}\n选项:\n` +
                    options.map(o => `${o.key}. ${o.text}`).join("\n") +
                    `\n请直接回答选项字母，不要解释。`;
                console.log("[DeepSeek请求内容]", prompt);

                const answer = await callAPI(prompt);
                console.log("[DeepSeek答案]", answer);

                // === 点击逻辑 ===
                if (answer) {
                    // 提取字母 (支持 "A,B,C"、"ACD"、"A C D" 等格式)
                    const letters = answer.match(/[A-Z]/g);
                    if (letters) {
                        letters.forEach(letter => {
                            let opt = options.find(o => o.key === letter);
                            if (opt && opt.el) {
                                opt.el.click();
                                console.log(`已点击选项: ${letter} ${opt.text}`);
                            }
                        });
                    }
                }
                else {
                    console.log("DeepSeek返回超时, 随机选择答案");
                    //单选
                    if (mode == 1) {
                        let i = Math.floor((Math.random() * options.length));
                        let opt = options[i];
                        if (opt && opt.el) {
                            opt.el.click();
                        }
                    }
                    else {
                        //多选
                        options.forEach(opt => {
                            if (opt && opt.el) {
                                opt.el.click();
                            }
                        });
                    }
                }

                // === 点击确定按钮 ===
                setTimeout(() => {
                    const confirmBtn = dialog.querySelector('.bottoms .el-button--primary');
                    if (confirmBtn) {
                        confirmBtn.click();
                        console.log("已点击确定按钮");
                    } else {
                        console.warn("未找到确定按钮");
                    }
                }, 500); // 给选项点击留一点延迟

                // === 点击关闭按钮 ===
                setTimeout(() => {
                    const closeBtn = dialog.querySelector('.bottoms .el-button--primary');
                    if (closeBtn) {
                        closeBtn.click();
                    } else {
                    }
                }, 1000);

            } catch (e) {
                console.error("[DeepSeek错误]", e);
            } finally {
                setTimeout(() => this.deepSeekLock = false, 2000);
            }
        },

        play_unlock_effect: function () {

            // 你可以用网络音频文件，也可以用 base64 音频
            const audio = new Audio("https://raw.githubusercontent.com/badApple001/Tampermonkey-Test/main/unlock.wav");
            audio.volume = 0.5; // 设置音量 (0.0 ~ 1.0)
            // 延时2秒播放
            setTimeout(() => {
                audio.play().catch(err => console.log("播放失败:", err));
            }, 2000);
        }


    };
});
