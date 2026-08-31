import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
const __filename = fileURLToPath(import.meta.url);

const CHANNEL_JID = "120363426641229472@newsletter"; // اپنا channel
const CHANNEL_NAME = "DOCTOR MD SUPPORT";

// Buffer download karne ka function
const getBuffer = async (quoted, conn) => {
    const type = Object.keys(quoted.message)[0];
    const stream = await downloadContentFromMessage(quoted.message[type], type.replace('Message', ''));
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return { buffer, type };
}

cmd({
    pattern: "ch",
    alias: ["channel", "postch", "cstatus"],
    desc: "Post anything to Channel - Working 100%",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { q, reply, isCreator, prefix }) => {

    if (!isCreator) return reply("❌ *Sirf Owner*");

    const quoted = m.quoted;
    let caption = q?.trim() || "";

    if (!quoted &&!caption) {
        return reply(`*استعمال:*\nImage/Video/Voice reply + \`${prefix}ch کیپشن\``);
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: "⏳", key: mek.key } });

        let sendContent = {};

        if (quoted) {
            const { buffer, type } = await getBuffer(quoted, conn);

            if (type === 'imageMessage') {
                sendContent = { image: buffer, caption: caption };
            }
            else if (type === 'videoMessage') {
                sendContent = { video: buffer, caption: caption, mimetype: 'video/mp4' };
            }
            else if (type === 'audioMessage' || type === 'pttMessage') {
                sendContent = { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true };
            }
            else if (type === 'stickerMessage') {
                sendContent = { sticker: buffer };
            }
            else if (type === 'documentMessage') {
                sendContent = {
                    document: buffer,
                    mimetype: quoted.message.documentMessage.mimetype,
                    fileName: quoted.message.documentMessage.fileName,
                    caption: caption
                };
            }
        } else {
            sendContent = { text: caption };
        }

        // ✅ YEHI DOCTOR MD KA ASLI TARIKA HAI - contextInfo ke sath
        await conn.sendMessage(CHANNEL_JID, {
           ...sendContent,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 1,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: CHANNEL_JID,
                    newsletterName: CHANNEL_NAME,
                    serverMessageId: m.key.id
                }
            }
        });

        await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });
        return reply(`✅ *POSTED WITH MEDIA!*\n\n*Channel:* ${CHANNEL_NAME}\n2 min me Green Ring aa jayegi`);

    } catch (err) {
        console.error(err);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
        return reply(`❌ *ERROR:* ${err.message}`);
    }
});
