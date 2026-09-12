// ꜰᴀᴛɪᴍᴀ-ᴍᴅ

import { fileURLToPath } from 'url';
import axios from 'axios';
import FormData from 'form-data';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "editimg",
    desc: "Edit photos using AI with KAMRAN-MD style",
    category: "ai",
    react: "🎨",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply, usedPrefix }) => {
    try {
        const targetMsg = m.quoted ? m.quoted : m;
        const mime = (targetMsg.msg || targetMsg).mimetype || targetMsg.mediaType || '';

        let prompt = (q || '').trim();
        if (!prompt) prompt = 'Edit this character to smile';

        let imageUrl = null;

        if (/image/.test(mime)) {
            const media = await targetMsg.download();
            if (!media) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply("❌ *Upload failed, Uguu!*");
            }

            const form = new FormData();
            form.append('files[]', media, { filename: 'upload.' + mime.split('/')[1] });

            const upload = await axios.post('https://uguu.se/upload.php', form, {
                headers: form.getHeaders()
            });

            imageUrl = upload?.data?.files?.[0]?.url;
            if (!imageUrl) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply("❌ *Upload failed, Uguu!*");
            }
        } else {
            const urlMatch = (q || '').match(/https?:\/\/\S+/);
            if (urlMatch) {
                imageUrl = urlMatch[0];
                prompt = q.replace(imageUrl, '').trim() || prompt;
            }
        }

        if (!imageUrl) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🤖 KAMRAN-MD EDITIMG 🤖   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Send or reply to the photo you want to edit with a caption:*\n\n` +
                `> 📌 *Example:* \`${usedPrefix + command} Edit this character to smile\`\n` +
                `> ⚡ *Version:* \`8.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        await reply("⏳ *Please wait a moment, editing a photo...*");

        const apiUrl = `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;
        const res = await axios.get(apiUrl, {
            responseType: 'arraybuffer'
        });

        if (!res.data) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Failed to edit photo!*");
        }

        await conn.sendMessage(from, {
            image: Buffer.from(res.data),
            caption: 
`╔════════════════════════╗
║   🤖 KAMRAN-MD EDITIMG 🤖   
╚════════════════════════╝

✅ *Finished editing the photo ✨*

━━━━━━━━━━━━━━━━━━━━━━━━━━
> ⚡ *Version:* \`12.00\`
> 👑 *Powered by DR KAMRAN*`
        }, { 
            quoted: mek,
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
        console.error("EditImg Command Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ *Error occurred:* \`\`\`${e.message || e}\`\`\``);
    }
});
