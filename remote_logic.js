// remote_logic.js
({
    deepSeekLock: false, // 锁放在模块里，防止同时多次调用

    tick: async function () {
        // 1. 检查弹窗
        let dialog = document.querySelector('.dilog');
        if (dialog) {
            this.handle_question_dialog(dialog);
        }

        // 2. 检查视频播放完成
        let video = document.querySelector('video');
        if (video && video.ended) {
            this.handle_video_finished(video);
        }

        // 3. 检查视频播放进度
        if (video) {
            this.handle_video_progress(video);
        }
    },

    // 处理提问弹窗
    handle_question_dialog: async function (dialog) {
        if (this.deepSeekLock) return; // 已锁，直接返回
        this.deepSeekLock = true;

        let titleEl = dialog.querySelector('.choiceContent .title');
        let listEls = dialog.querySelectorAll('.choiceContent .list .li');

        if (!titleEl) return;
        let titleText = titleEl.innerText.trim();
        // 判断题目类型
        let type = titleText.includes("多选题") ? "多选题" : "单选题";
        let mode = type === "多选题" ? 2 : 1;

        // 提取题干（去掉前缀【多选题】1、）
        let question = titleText.replace(/【.*?】\s*\d+、/, "").trim();

        // 提取选项
        let options = [];
        listEls.forEach(li => {
            let key = li.querySelector('.unit')?.innerText.trim();
            let text = li.querySelector('.txt')?.innerText.trim();
            if (key && text) {
                options.push({ key, text });
            }
        });

        try {
            let prompt = `题目类型: ${mode === 2 ? "多选题" : "单选题"}\n题目: ${question}\n选项:\n` +
                options.map(o => `${o.key}. ${o.text}`).join("\n") +
                `\n请直接回答选项字母，不要解释。`;
            console.log("[DeepSeek请求内容]", prompt)

            const answer = await callAPI(prompt);
            console.log("[DeepSeek答案]", answer);
        } catch (e) {
            console.error("[DeepSeek错误]", e);
        } finally {
            // 2秒后释放锁
            setTimeout(() => this.deepSeekLock = false, 2000);
        }
    },

    // 处理视频播放完成
    handle_video_finished: function (video) {
        console.log("[远程逻辑] 视频播放完成:", video.currentSrc);

        // 找到所有视频列表项
        const items = document.querySelectorAll('li.pointer');
        if (!items.length) {
            console.log("没有找到视频列表....");
            return;
        }

        // 找到当前播放的视频索引
        let currentIndex = -1;
        items.forEach((item, idx) => {
            if (item.classList.contains('play')) { // 假设播放的li会有一个 playing 类
                currentIndex = idx;
            }
        });

        // 播放下一个视频
        if (currentIndex >= 0 && currentIndex < items.length - 1) {
            const nextItem = items[currentIndex + 1];
            nextItem.click();
            console.log('[远程逻辑] 自动播放下一集');
        } else {
            console.log('[远程逻辑] 已经是最后一集');
        }
    },

    handle_video_progress: function (video) {
        // 打印当前播放进度
        const current = video.currentTime.toFixed(1);
        const total = video.duration.toFixed(1);
        console.log(`[远程逻辑] 视频进度: ${current} / ${total} 秒`);
    }

})
