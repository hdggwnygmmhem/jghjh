import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const CHANNEL_JID = "120363426641229472@newsletter"; // 👈 اپنا Channel ID
const CHANNEL_NAME = "DOCTOR MD SUPPORT"; // 👈 اپنا Channel Name

cmd({
    pattern: "cstatus",
    alias: ["ch", "postch", "channel"],
    desc: "Post Anything to Channel",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { text, reply, isCreator }) => {

    if (!isCreator) return reply("❌ *Sirf Owner*");

    const quoted = m.quoted;
    const caption = text?.trim() || "";

    if (!quoted &&!caption) {
        return reply(
`*📢 CHANNEL POST COMMAND*

*استعمال:*
1. Image/Video/Audio/Sticker/Doc کو Reply کرو +.cstatus کیپشن
2. صرف Text کے لیے:.cstatus اپنا میسج

*مثال:* Image reply +.cstatus NEW UPDATE`
        );
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: "⏳", key: mek.key } });

        let sendMsg = {};

        if (quoted) {
            const type = Object.keys(quoted.message)[0];
            const media = await conn.downloadMediaMessage(quoted);

            if (type === "imageMessage") {
                sendMsg = { image: media, caption: caption || quoted.message.imageMessage.caption || "" };
            }
            else if (type === "videoMessage") {
                sendMsg = { video: media, caption: caption || quoted.message.videoMessage.caption || "" };
            }
            else if (type === "audioMessage" || type === "pttMessage") {
                sendMsg = { audio: media, mimetype: 'audio/ogg; codecs=opus', ptt: quoted.message.pttMessage?.ptt || false };
            }
            else if (type === "stickerMessage") {
                sendMsg = { sticker: media };
            }
            else if (type === "documentMessage") {
                sendMsg = {
                    document: media,
                    mimetype: quoted.message.documentMessage.mimetype,
                    fileName: quoted.message.documentMessage.fileName,
                    caption: caption
                };
            }
            else {
                return reply("❌ یہ میڈیا سپورٹ نہیں ہے");
            }
        } else {
            sendMsg = { text: caption };
        }

        // ✅ CHANNEL POST KA ASLI CODE
        await conn.sendMessage(CHANNEL_JID, {
          ...sendMsg,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 1,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: CHANNEL_JID,
                    newsletterName: CHANNEL_NAME
                }
            }
        });

        await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });
        return reply(`📢 *CHANNEL ME POST HO GAYI!*\n\n*Type:* ${quoted? Object.keys(quoted.message)[0] : 'Text'}\n2 min me Green Ring check karo`);

    } catch (e) {
        console.log(e);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
        return reply(`❌ *Error:* ${e.message}`);
    }
});
