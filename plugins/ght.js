import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "channel",
    alias: ["ch", "chstatus", "postch"],
    desc: "Post media/text/link to your WhatsApp Channel",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator, q }) => {

    if (!isCreator) return reply("❌ Sirf Owner ye command chala sakta hai!");

    try {
        const quotedMsg = m.quoted;
        const mimeType = quotedMsg? (quotedMsg.msg || quotedMsg).mimetype || '' : '';
        const caption = q?.trim() || "";

        if (!quotedMsg &&!caption) {
            return reply(
                `⚠️ Channel pe post karne ka tareeqa:\n\n` +
                `1. Text:.channel Aapka message\n` +
                `2. Media: Media ko reply karke.channel Caption\n\n` +
                `Example:.channel ✨ NEW UPDATE ✨`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let mediaBuffer = null;
        let msgType = '';

        if (quotedMsg) {
            mediaBuffer = await quotedMsg.download();
            if (!mediaBuffer) throw new Error("Media download nahi hui!");
            msgType = Object.keys(quotedMsg.message || {})[0];
        }

        // Yahan apna CHANNEL ID dalo
        const channelJid = "1203631xxxxx@newsletter"; // ← apna channel ka JID yahan

        let messageContent = {};

        if (quotedMsg) {
            if (mimeType.startsWith('image/') || msgType === 'imageMessage') {
                messageContent = {
                    image: mediaBuffer,
                    caption: caption || "",
                };
            } else if (mimeType.startsWith('video/') || msgType === 'videoMessage') {
                messageContent = {
                    video: mediaBuffer,
                    caption: caption || "",
                };
            } else if (mimeType.startsWith('audio/') || msgType === 'audioMessage') {
                messageContent = {
                    audio: mediaBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                };
            }
        } else if (caption) {
            messageContent = { text: caption };
        }

        await conn.sendMessage(channelJid, messageContent);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        return reply(`✅ *CHANNEL POST HO GAYA!*\n\nChannel: KAMRAN MD SUPPORT\nMessage: ${caption || "Media Posted"}`);

    } catch (error) {
        console.error("Channel Post Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ Error: ${error.message}`);
    }
});
