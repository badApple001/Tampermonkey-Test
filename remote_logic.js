// remote_logic.js
({
    tick: function () {
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
    handle_question_dialog: function (dialog) {
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

        console.log("[远程逻辑] 提问弹窗:", {
            type,
            mode,
            question,
            options
        });

        // 调用 DeepSeek 获取答案
        this.query_deepseek(question, options, mode);
    },


    query_deepseek: function (question, options, mode) {
        const API_KEY = "sk-igziwygvqdbbiartmjtbudotbhtlrmfpvsljnkydxfugcgrx"; // 替换成你的 SiliconCloud API Key
        const API_URL = "https://api.siliconcloud.ai/v1/chat/completions"; // 硅基流动 API 地址

        let prompt = `题目类型: ${mode === 2 ? "多选题" : "单选题"}\n题目: ${question}\n选项:\n` +
            options.map(o => `${o.key}. ${o.text}`).join("\n") +
            `\n请直接回答选项字母，不要解释。`;
        console.log(prompt);
        GM_xmlhttpRequest({
            method: "POST",
            url: API_URL,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            data: JSON.stringify({
                model: "deepseek-chat", // 或其他 DeepSeek 模型
                messages: [{ role: "user", content: prompt }]
            }),
            onload: function (res) {
                try {
                    let data = JSON.parse(res.responseText);
                    let answer = data.choices[0].message.content.trim();
                    console.log("[DeepSeek 答案]", answer);
                } catch (e) {
                    console.error("[DeepSeek 错误解析]", e, res.responseText);
                }
            },
            onerror: function (err) {
                console.error("[DeepSeek 请求失败]", err);
            }
        });
    },

    // 处理视频播放完成
    handle_video_finished: function (video) {
        console.log("[远程逻辑] 视频播放完成:", video.currentSrc);



    },
    handle_video_progress: function (video) {
        // 打印当前播放进度
        const current = video.currentTime.toFixed(1);
        const total = video.duration.toFixed(1);
        console.log(`[远程逻辑] 视频进度: ${current} / ${total} 秒`);
    }

})
