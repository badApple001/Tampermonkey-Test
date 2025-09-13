// remote_logic.js
(function (callAPI) {
    return {
        deepSeekLock: false, // 锁放在模块里，防止同时多次调用
        unlockIndex: -1,
        topics: [],
        end: false,
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
                            options.push({ key, text, li });
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

            //做完了
            //做完题后 检测倒计时 是否可以交卷
            if (this.unlockIndex >= this.topics.length) {

                if (this.end === true) {
                    return;
                }

                // 只取最短交作业的倒计时
                const countdownEl = document.querySelector(".countdown .shortTime p.text-red");
                if (!countdownEl) return;
                const timeText = countdownEl.innerText.trim(); // 例如 "00:01:18"
                const parts = timeText.split(":").map(Number);
                if (parts.length !== 3) return;
                const totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                console.log("最短剩余秒数:", totalSeconds);
                if (totalSeconds === 1) {

                    console.log("题目已经做完");
                    this.play_over_effect();

                    setTimeout(() => {

                        // 找到包含文本为 "提交" 的按钮
                        const submitButton = Array.from(document.querySelectorAll("button"))
                            .find(btn => btn.innerText.trim() === "提交");

                        // 如果找到了就点击
                        if (submitButton) {
                            submitButton.click();
                            console.log("提交按钮已点击");

                            setTimeout(() => {

                                // 找到当前页面中所有弹窗
                                const messageBoxes = document.querySelectorAll(".el-message-box");

                                messageBoxes.forEach(box => {
                                    // 找到按钮区域
                                    const btns = box.querySelectorAll(".el-message-box__btns button");
                                    // 找到文本为“确定”的按钮
                                    const confirmBtn = Array.from(btns).find(btn => btn.innerText.trim() === "确定");

                                    if (confirmBtn) {
                                        confirmBtn.click();
                                        console.log("弹窗确定按钮已点击");
                                        this.end = true;
                                    }
                                });

                            }, 200); // 给选项点击留一点延迟

                        } else {
                            console.log("未找到提交按钮");
                        }

                    }, 2000);

                }
            }
            else {
                await this.handle_question_dialog();
            }

        },

        handle_question_dialog: async function () {
            if (this.deepSeekLock) return; // 已锁，直接返回
            this.deepSeekLock = true;

            let topic = this.topics[this.unlockIndex];
            let type = topic.type;
            let question = topic.question;
            let options = topic.options;

            try {
                let prompt = `题目类型: ${type}\n题目: ${question}\n选项:\n` +
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
                            if (opt && opt.li) {
                                opt.li.click();
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
                        if (opt && opt.li) {
                            opt.li.click();
                        }
                    }
                    else {
                        //多选
                        options.forEach(opt => {
                            if (opt && opt.li) {
                                opt.li.click();
                            }
                        });
                    }
                }

                // === 点击确定按钮 ===
                setTimeout(() => {
                    this.play_unlock_effect();
                    this.unlockIndex++;
                }, 500); // 给选项点击留一点延迟

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
        },
        play_over_effect: function () {

            // 你可以用网络音频文件，也可以用 base64 音频
            const audio = new Audio("https://raw.githubusercontent.com/badApple001/Tampermonkey-Test/main/over.wav");
            audio.volume = 0.5; // 设置音量 (0.0 ~ 1.0)
            // 延时2秒播放
            setTimeout(() => {
                audio.play().catch(err => console.log("播放失败:", err));
            }, 2000);
        }

    };
});
