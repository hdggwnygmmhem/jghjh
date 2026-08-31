import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
const __filename = fileURLToPath(import.meta.url);

const CHANNEL_JID = "120363426641229472@newsletter";
const CHANNEL_NAME = "DOCTOR MD SUPPORT";

cmd({
    pattern: "ch",
    alias: ["channel", "postch", "cstatus"],
    desc: "Post Media to Channel",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { q, reply, isCreator, prefix }) => {

    if (!isCreator) return reply("❌ *Sirf Owner*");

    const quoted = m.quoted;
    let caption = q?.trim() || "";

    // ✅ FIX: Pehle check karo reply kiya hai ya nahi
    if (!quoted) {
        return reply(`*❌ غلط طریقہ*\n\n*صحیح طریقہ:*\n1. Image/Video/Voice بھیجو\n2. اسے Reply کرو\n3. \`${prefix}ch اپنا کیپشن\` لکھو\n\n*مثال:* Image reply + .ch NEW UPDATE`);
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: "⏳", key: mek.key } });

        // ✅ rc14 ka 100% working download
        const mediaBuffer = await downloadMediaMessage(quoted, 'buffer', {}, {
            logger: conn.logger,
            reuploadRequest: conn.updateMediaMessage
        });

        if (!mediaBuffer) throw new Error("Media download failed");

        const type = quoted.mtype;
        let sendContent = {};

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
                mimetype: quoted.msg.mimetype,
                fileName: quoted.msg.fileName,
                caption: caption
            };
        } else {
            return reply("❌ Ye media type support nahi hai");
        }

        // ✅ Channel me bhejne ka sahi tarika
        await conn.sendMessage(CHANNEL_JID, sendContent);

        await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });
        return reply(`✅ *POSTED SUCCESSFULLY!*\n\n*Channel:* ${CHANNEL_NAME}\n2 min me Green Ring aa jayegi`);

    } catch (err) {
        console.error(err);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
        return reply(`❌ *ERROR:* ${err.message}\n\nBot restart karo: node .`);
    }
});
