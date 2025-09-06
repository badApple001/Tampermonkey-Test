// remote_logic.js
(function (callAPI) {
    return {
        deepSeekLock: false, // 锁放在模块里，防止同时多次调用

        tick: async function () {
            let dialog = document.querySelector('.dilog');
            if (dialog) {
                await this.handle_question_dialog(dialog);
            }

            let faceDialog = document.querySelector('.el-message-box__wrapper');

            let video = document.querySelector('video');
            if (video && video.ended) {
                this.handle_video_finished(video);
            }

            if (video) {
                this.handle_video_progress(video);

                if (faceDialog) {
                    video.volume = 1;  // 弹窗出现，音量打开
                    video.muted = false;
                } else {
                    video.volume = 0;  // 没有弹窗，静音
                    video.muted = true;
                }
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

        handle_video_finished: function (video) {
            console.log("[远程逻辑] 视频播放完成:", video.currentSrc);

            const items = document.querySelectorAll('li.pointer');
            if (!items.length) return;

            let currentIndex = -1;
            items.forEach((item, idx) => {
                if (item.classList.contains('play')) currentIndex = idx;
            });

            if (currentIndex >= 0 && currentIndex < items.length - 1) {
                items[currentIndex + 1].click();
                console.log('[远程逻辑] 自动播放下一集');
            } else {
                console.log('[远程逻辑] 已经是最后一集');
            }
        },

        handle_video_progress: function (video) {
            const current = video.currentTime.toFixed(1);
            const total = video.duration.toFixed(1);
            console.log(`[远程逻辑] 视频进度: ${current} / ${total} 秒`);

        }
    };
});
