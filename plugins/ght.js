import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
const __filename = fileURLToPath(import.meta.url);

const CHANNEL_JID = "120363426641229472@newsletter"; // اپنا ID
const CHANNEL_NAME = "DOCTOR MD SUPPORT";

cmd({
    pattern: "ch",
    alias: ["channel", "postch", "cstatus", "post"],
    desc: "Post to Channel - Fixed for rc14",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { q, reply, isCreator, prefix }) => {

    if (!isCreator) return reply("❌ *Sirf Owner!*");

    const quoted = m.quoted;
    let caption = q?.trim() || "";

    if (!quoted && !caption) {
        return reply(`*استعمال:*\nImage/Video reply + \`${prefix}ch کیپشن\``);
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: "⏳", key: mek.key } });

        let sendContent = {};

        if (quoted) {
            // ✅ FIX: quoted.msg use karo, quoted.message nahi
            const msg = quoted.msg || quoted.message;
            const type = quoted.mtype;
            
            const mediaBuffer = await downloadMediaMessage(quoted, 'buffer', {}, {
                logger: console,
                reuploadRequest: conn.updateMediaMessage
            });

            if (!mediaBuffer) throw new Error("Media download failed");

            if (type === 'imageMessage') {
                sendContent = { image: mediaBuffer, caption: caption };
            } 
            else if (type === 'videoMessage') {
                sendContent = { video: mediaBuffer, caption: caption };
            }
            else if (type === 'audioMessage' || type === 'pttMessage') {
                sendContent = { audio: mediaBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true };
            }
            else if (type === 'stickerMessage') {
                sendContent = { sticker: mediaBuffer };
            }
            else if (type === 'documentMessage') {
                sendContent = { 
                    document: mediaBuffer, 
                    mimetype: msg.mimetype || 'application/octet-stream', // ✅ FIX
                    fileName: msg.fileName || 'file.pdf',
                    caption: caption 
                };
            }
            else {
                throw new Error("Ye media support nahi hai");
            }
        } else {
            sendContent = { text: caption };
        }

        // ✅ Seedha channel me bhejo
        await conn.sendMessage(CHANNEL_JID, sendContent);
        
        await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });
        return reply(`✅ *POSTED!*\n\n*Channel:* ${CHANNEL_NAME}\n2 min me Green Ring aa jayegi`);

    } catch (err) {
        console.error(err);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
        return reply(`❌ *ERROR:* ${err.message}`);
    }
});
