import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
const __filename = fileURLToPath(import.meta.url);

// ✅ FINAL JID JO AAPNE DIYA HAI
const CHANNEL_JID = "120363426641229472@newsletter";

cmd({
    pattern: "ch",
    alias: ["channel", "postch", "chstatus"],
    desc: "Post to WhatsApp Channel",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { q, reply, isCreator }) => {
    
    if (!isCreator) return reply("❌ Sirf Owner command use kar sakta hai!");

    const quoted = m.quoted;
    const caption = q?.trim() || "";

    if (!quoted && !caption) {
        return reply(`*Channel me post kaise kare:*

1. Text: *.ch* Aapka message
2. Photo/Video: Media ko reply karke *.ch* Caption

Example: .ch NEW UPDATE 🔥`);
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: "⏳", key: mek.key } });

        let content = {};
        if (quoted) {
            const buffer = await quoted.download();
            const mime = (quoted.msg || quoted).mimetype || '';
            
            if (mime.startsWith("image")) {
                content = { image: buffer, caption: caption };
            } else if (mime.startsWith("video")) {
                content = { video: buffer, caption: caption };
            } else if (mime.startsWith("audio")) {
                content = { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: false };
            } else {
                content = { text: caption };
            }
        } else {
            content = { text: caption };
        }

        // ✅ YAHIN POST HOGI AAPKE CHANNEL PE
        await conn.sendMessage(CHANNEL_JID, content);
        
        await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });
        return reply(`✅ *CHANNEL POST SUCCESS!*\n\n📢 Channel JID: ${CHANNEL_JID}\n📝 Message: ${caption || "Media Posted"}\n\n2 min me channel pe show ho jayega`);

    } catch (err) {
        console.error(err);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Post nahi lagi.\n\nError: ${err.message}\n\n*Solution:* 1. Bot ko channel ka Admin banao  2. JID theek hai: ${CHANNEL_JID}`);
    }
});
