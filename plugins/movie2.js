// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "tourl",
    alias: ["url", "upload"],
    desc: "Upload quoted media (image, video, audio, document) to Catbox and ImgBB",
    category: "tools",
    react: "🔗",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        // Robust check for quoted message in Baileys
        const targetQuote = m.quoted ? m.quoted : (quoted ? quoted : null);

        if (!targetQuote) {
            return reply('❌ *Kripya kisi image, video, audio ya document ko quote karke .tourl likhein!*');
        }

        const mime = targetQuote.mimetype || targetQuote.mediaMessage?.mimetype || '';
        if (!mime && !targetQuote.imageMessage && !targetQuote.videoMessage && !targetQuote.audioMessage && !targetQuote.documentMessage) {
            return reply('❌ *Quoted message me koi media nahi mili!*');
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Download media buffer directly using Baileys built-in downloader helper
        let buffer;
        try {
            buffer = await targetQuote.download();
        } catch (_) {
            try {
                buffer = await conn.downloadMediaMessage(targetQuote);
            } catch (err) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply('❌ *Media download karne me asamarth!*');
            }
        }

        if (!buffer || buffer.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply('❌ *Media buffer empty hai!*');
        }

        // Determine media type string
        let mediaType = 'media';
        if (mime.includes('image') || targetQuote.imageMessage) mediaType = 'image';
        else if (mime.includes('video') || targetQuote.videoMessage) mediaType = 'video';
        else if (mime.includes('audio') || targetQuote.audioMessage) mediaType = 'audio';
        else if (mime.includes('document') || targetQuote.documentMessage) mediaType = 'document';

        const ext = mime.split('/')[1] || 'tmp';
        const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.${ext}`);
        fs.writeFileSync(tempFilePath, buffer);

        const fileSize = (buffer.length / 1024 / 1024).toFixed(2) + ' MB';
        const typeStr = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);

        let catboxUrl = '';
        let imgbbUrl = '';

        // Upload to Catbox
        try {
            const catboxForm = new FormData();
            catboxForm.append('fileToUpload', fs.createReadStream(tempFilePath));
            catboxForm.append('reqtype', 'fileupload');

            const catboxResponse = await axios.post('https://catbox.moe/user/api.php', catboxForm, {
                headers: catboxForm.getHeaders(),
                timeout: 30000
            });
            catboxUrl = catboxResponse.data.trim();
        } catch (catboxError) {
            console.error('Catbox upload error:', catboxError);
            catboxUrl = '❌ Upload failed';
        }

        // Upload to ImgBB
        try {
            const base64Data = buffer.toString('base64');
            const imgbbForm = new FormData();
            imgbbForm.append('key', 'e4b536bbf102cfccc5d8758489052547');
            imgbbForm.append('image', base64Data);

            const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', imgbbForm, {
                headers: imgbbForm.getHeaders(),
                timeout: 30000
            });

            if (imgbbResponse.data.success) {
                imgbbUrl = imgbbResponse.data.data.url;
            } else {
                imgbbUrl = '❌ Upload failed';
            }
        } catch (imgbbError) {
            console.error('ImgBB upload error:', imgbbError);
            imgbbUrl = '❌ Upload failed';
        }

        // Cleanup temp file
        try {
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        } catch (_) {}

        const txt = `
╔════════════════════════╗
║   🔗 KAMRAN-MD URL UPLOADER 🔗   
╚════════════════════════╝

📂 *Type:* ${typeStr}
📊 *Size:* ${fileSize}

📦 *Catbox URL:*
\`${catboxUrl}\`

📦 *ImgBB URL:*
\`${imgbbUrl}\`

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

        let thumbnailUrl = "https://cdn-icons-png.flaticon.com/512/337/337946.png";
        if (catboxUrl && !catboxUrl.includes('❌') && catboxUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
            thumbnailUrl = catboxUrl;
        } else if (imgbbUrl && !imgbbUrl.includes('❌')) {
            thumbnailUrl = imgbbUrl;
        }

        await conn.sendMessage(from, {
            text: txt,
            contextInfo: {
                externalAdReply: {
                    title: "Media Uploaded Successfully!",
                    body: "KAMRAN-MD Dual Upload Service",
                    thumbnailUrl: thumbnailUrl,
                    sourceUrl: catboxUrl && !catboxUrl.includes('❌') ? catboxUrl : (imgbbUrl && !imgbbUrl.includes('❌') ? imgbbUrl : 'https://whatsapp.com/channel/1203634120312190'),
                    mediaType: 1,
                    renderLargerThumbnail: true
                },
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '1203634120312190@newsletter',
                    newsletterName: 'DR KAMRAN',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error('ToUrl command error:', e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ *Media upload karne me error aa gaya!*");
    }
});
