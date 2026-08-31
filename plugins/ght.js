import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
const __filename = fileURLToPath(import.meta.url);

const CHANNEL_JID = "120363426641229472@newsletter"; // آپ کا channel ID

cmd({
    pattern: "ch",
    alias: ["channel", "postch", "cstatus"],
    desc: "Post Image, Video, Audio, Text to Channel with Status Style",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { q, reply, isCreator }) => {
    
    if (!isCreator) return reply("❌ Sirf Owner!");

    const quoted = m.quoted;
    let caption = q?.trim() || "";

    if (!quoted && !caption) {
        return reply(`*استعمال:*
1. Text: *.ch* آپ کا میسج
2. Image/Video: Media کو reply کر کے *.ch* کیپشن
3. Voice: Voice کو reply کر کے *.ch*`);
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: "⏳", key: mek.key } });

        let contentToSend = {};
        let messageType = 'text';
        
        if (quoted) {
            const type = quoted.mtype;
            const mediaBuffer = await quoted.download();
            
            if (type === 'imageMessage') {
                messageType = 'image';
                contentToSend = { image: mediaBuffer, caption: caption };
            } 
            else if (type === 'videoMessage') {
                messageType = 'video';
                contentToSend = { video: mediaBuffer, caption: caption };
            }
            else if (type === 'audioMessage' || type === 'pttMessage') {
                messageType = 'audio';
                contentToSend = { audio: mediaBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true };
            }
            else {
                contentToSend = { text: caption || quoted.text };
            }
        } else {
            contentToSend = { text: caption };
        }

        // ✅ یہاں WhatsApp کی مکمل چیزیں add کر دیں
        // تاکہ channel میں "Status" کی طرح show ہو + Green Ring آئے
        await conn.sendMessage(CHANNEL_JID, {
            ...contentToSend,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: false,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: CHANNEL_JID,
                    newsletterName: "DOCTOR MD SUPPORT",
                    serverMessageId: 1
                }
            }
        }, { 
            messageId: mek.key.id,
            statusJidList: [CHANNEL_JID] // ✅ یہ سب سے اہم ہے Status Style کے لیے
        });
        
        await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });
        return reply(`✅ *CHANNEL STATUS POSTED!*\n\nاب Green Ring ضرور آئے گی 🔥\nType: ${messageType}`);

    } catch (err) {
        console.error(err);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Error: ${err.message}`);
    }
});
