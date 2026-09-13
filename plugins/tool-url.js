// DR KAMRAN 

import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const API = 'https://pone.rs/upload.php';

function getExtFromMime(mime = '') {
    if (mime.includes('image/jpeg')) return '.jpg';
    if (mime.includes('image/png')) return '.png';
    if (mime.includes('image/webp')) return '.webp';
    if (mime.includes('image/gif')) return '.gif';
    if (mime.includes('video/mp4')) return '.mp4';
    if (mime.includes('video/webm')) return '.webm';
    if (mime.includes('audio/mpeg')) return '.mp3';
    if (mime.includes('audio/ogg')) return '.ogg';
    if (mime.includes('audio/mp4')) return '.m4a';
    if (mime.includes('application/pdf')) return '.pdf';
    if (mime.includes('application/zip')) return '.zip';
    return '.bin';
}

async function uploadPone(buffer, filename = 'file.bin') {
    const form = new FormData();
    form.append('files[]', buffer, { filename });

    try {
        const res = await axios.post(API, form, {
            headers: {
                ...form.getHeaders(),
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36',
                accept: '*/*',
                origin: 'https://pone.rs',
                referer: 'https://pone.rs/'
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            validateStatus: () => true
        });

        const data = res.data;
        const url = data?.files?.[0]?.url?.replaceAll('\\/', '/') || null;

        return {
            status: Boolean(data?.success && url),
            code: res.status,
            result_url: url
        };
    } catch (err) {
        return {
            status: false,
            code: err.response?.status || 500,
            result_url: null,
            error: err.message
        };
    }
}

cmd({
    pattern: "tourl",
    alias: ["tolink", "upload"],
    desc: "Upload media and convert to URL",
    category: "tools",
    react: "🔗",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        // Quoted message ya current message check karein media ke liye
        const targetMedia = quoted ? quoted : mek;
        const mime = targetMedia.mimetype || targetMedia.msg?.mimetype || '';

        if (!mime) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🔗 KAMRAN-MD TOURL 🔗   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Please reply or send any media (image, video, audio, document)!*\n\n` +
                `> 📌 *Example:* \`.tourl\` (replying to media)\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Buffer download function based on bot structure
        const buffer = typeof targetMedia.download === 'function' 
            ? await targetMedia.download() 
            : await conn.downloadMediaMessage(targetMedia);

        if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 1) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Failed to download media, buffer is empty!*");
        }

        let filename =
            targetMedia.fileName ||
            targetMedia.msg?.fileName ||
            `KAMRAN-MD-${Date.now()}${getExtFromMime(mime)}`;

        filename = path.basename(filename);

        const result = await uploadPone(buffer, filename);

        if (!result.status) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ *Upload gagal!*\n\nCode: ${result.code || '-'}\nError: ${result.error || 'Tidak diketahui'}`);
        }

        const urlBox = `
╔════════════════════════╗
║   🔗 KAMRAN-MD TOURL UPLOAD   
╚════════════════════════╝

📦 *File:* ${filename}
🔗 *URL:* ${result.result_url}

> ⚡ *Version:* \`10.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

        await reply(urlBox, {
            contextInfo: { 
                forwardingScore: 999, 
                isForwarded: true, 
                forwardedNewsletterMessageInfo: { 
                    newsletterJid: '120363418144382782@newsletter', 
                    newsletterName: 'DR KAMRAN', 
                    serverMessageId: 143 
                } 
            }
        });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ *Please reply or send any media (image, video, audio, document)!*");
    }
});
