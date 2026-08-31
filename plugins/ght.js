import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "ch",
    alias: ["channel", "chstatus", "postch"],
    desc: "Post to WhatsApp Channel",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { q, reply, isCreator }) => {

    if (!isCreator) return reply("❌ Sirf Owner ye command chala sakta hai!");

    try {
        const quoted = m.quoted;
        const caption = q?.trim() || "";
        const mime = quoted ? (quoted.msg || quoted).mimetype || '' : '';

        if (!quoted && !caption) {
            return reply(
`⚠️ *Channel pe post karne ka tareeqa:*

1. Text: *.ch* Aapka message
2. Media: Media ko reply karke *.ch* Caption

*Example:* .ch ✨ NEW UPDATE ✨`
            );
        }

        await conn.sendMessage(m.chat, { react: { text: "⏳", key: mek.key } });

        // ✅✅✅ FINAL CHANNEL JID - ISKO CHANGE MAT KARNA
        const channelJid = "120363426641229472@newsletter";

        let content = {};
        if (quoted) {
            const buffer = await quoted.download();
            if (!buffer) throw new Error("Media download failed");
            
            if (mime.startsWith('image/')) {
                content = { image: buffer, caption: caption };
            } else if (mime.startsWith('video/')) {
                content = { video: buffer, caption: caption };
            } else if (mime.startsWith('audio/')) {
                content = { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true };
            }
        } else {
            content = { text: caption };
        }

        await conn.sendMessage(channelJid, content);
        await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });

        return reply(`✅ *CHANNEL POST SUCCESSFUL!*\n\n📢 Channel: 120363426641229472@newsletter\n📝 ${caption || "Media Posted"}\n\n> 2-3 minute me channel pe show ho jayega`);

    } catch (e) {
        console.error("Channel Error:", e);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Error: ${e.message}\n\nNote: Bot ko channel ka Admin hona zaroori hai`);
    }
});
