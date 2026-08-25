import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { cmd } from '../command.js'; // اپنے بوٹ کے کمانڈ ہینڈلر کا صحیح پاتھ رکھیں

// Text2Video Class Exported for ESM
export class Text2Video {
    constructor() {
        this.baseURL = "https://www.freeaivideos.org";
        this.headers = {
            "user-agent": "NB Android/1.0.0",
            "origin": "https://www.freeaivideos.org",
            "referer": "https://www.freeaivideos.org/"
        };
    }

    async loadImage(image) {
        if (!image) return null;
        if (/^https?:\/\//.test(image)) {
            const { data } = await axios.get(image, {
                responseType: "arraybuffer"
            });
            return Buffer.from(data);
        }
        if (Buffer.isBuffer(image)) {
            return image;
        }
        return fs.readFileSync(image);
    }

    async create(prompt, image = null) {
        const buffer = await this.loadImage(image);
        const form = new FormData();
        form.append("prompt", prompt || "");
        if (buffer) {
            form.append("initialFrame", buffer, {
                filename: "image.jpg",
                contentType: "image/jpeg"
            });
        }

        const { data } = await axios.post(
            `${this.baseURL}/api/video_generation`,
            form,
            {
                headers: {
                    ...this.headers,
                    ...form.getHeaders()
                },
                timeout: 60000
            }
        );
        return data;
    }

    async polling(requestId, maxRetry = 200, delay = 3000) {
        for (let i = 0; i < maxRetry; i++) {
            await new Promise(r => setTimeout(r, delay));
            try {
                const { data } = await axios.get(
                    `${this.baseURL}/api/video_generation?request_id=${requestId}&prompt=`,
                    {
                        headers: this.headers
                    }
                );
                if (data?.video_url) {
                    return data;
                }
            } catch {}
        }
        return null;
    }

    async generate(prompt, image = null) {
        try {
            const create = await this.create(prompt, image);
            const requestId = create?.request_id;
            if (!requestId) {
                return {
                    status: false,
                    message: "Failed get request_id"
                };
            }

            const result = await this.polling(requestId);
            if (!result) {
                return {
                    status: false,
                    message: "Timeout video generate"
                };
            }

            return {
                status: true,
                result: {
                    task_id: requestId,
                    prompt,
                    video_mp4: result.video_url
                }
            };
        } catch (e) {
            return {
                status: false,
                message: e?.response?.data || e.message
            };
        }
    }
}

// ==========================================
//          WHATSAPP BOT COMMAND
// ==========================================

cmd({
    pattern: "t2v",
    alias: ["text2video", "makevideo", "aivideo"],
    desc: "Generate AI Video from Prompt or Image",
    category: "ai",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) {
            await react("❌");
            return reply("⚠️ *براہ کرم ویڈیو بنانے کے لیے ڈسکرپشن (Prompt) لکھیں!*\n\n*مثال:* `.t2v a cute cat walking in cyberpunk city at night`");
        }

        await react("🎬");
        await reply("⏳ *ویڈیو بنانے کا عمل شروع کر دیا گیا ہے، اس میں 1 سے 3 منٹ لگ سکتے ہیں۔ براہ کرم انتظار کریں...*");

        // Media support check (Image to Video if replied to image)
        let imageBuffer = null;
        const mime = (mek.msg || mek).mimetype || '';
        const quotedMime = mek.quoted ? (mek.quoted.msg || mek.quoted).mimetype : '';

        if (/image/.test(mime) || /image/.test(quotedMime)) {
            imageBuffer = await (mek.quoted ? mek.quoted.download() : mek.download());
        }

        const ai = new Text2Video();
        const res = await ai.generate(q, imageBuffer);

        if (!res.status || !res.result?.video_mp4) {
            await react("❌");
            return reply(`❌ *ویڈیو جنریٹ کرنے میں ناکامی ہوئی: ${res.message}*`);
        }

        const caption = `🎬 *AI Video Generator*\n📝 *Prompt:* ${res.prompt}\n🆔 *Task ID:* ${res.result.task_id}`;

        // Send MP4 Video File
        await conn.sendMessage(m.chat, {
            video: { url: res.result.video_mp4 },
            caption: caption,
            mimetype: 'video/mp4'
        }, { quoted: mek });

        await react("✅");

    } catch (err) {
        console.error("Text2Video Command Error:", err);
        await react("❌");
        await reply(`❌ *Error:* ${err.message}`);
    }
});
