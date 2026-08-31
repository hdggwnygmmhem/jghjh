import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
const __filename = fileURLToPath(import.meta.url);

const CHANNEL_JID = "120363426641229472@newsletter";
const CHANNEL_NAME = "DOCTOR MD SUPPORT";

cmd({
    pattern: "ch",
    alias: ["channel", "postch", "cstatus"],
    desc: "Post to Channel - Fixed v14",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { q, reply, isCreator, prefix }) => {

    if (!isCreator) return reply("❌ *Sirf Owner*");

    const quoted = m.quoted;
    let caption = q?.trim() || "";

    if (!quoted && !caption) {
        return reply(`*استعمال:* Image reply + \`${prefix}ch کیپشن\``);
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: "⏳", key: mek.key } });

        let sendContent = {};

        if (quoted) {
            // ✅ FIX 1: dono jagah check karo message ya msg
            const msg = quoted.message || quoted.msg;
            const type = quoted.mtype || Object.keys(msg)[0];

            // ✅ FIX 2: downloadMediaMessage se buffer lo - ye sabse stable hai
            const mediaBuffer = await downloadMediaMessage(quoted, 'buffer', {}, {
                logger: conn.logger,
                reuploadRequest: conn.updateMediaMessage
            });

            if (!mediaBuffer) throw new Error("Media download nahi hua");

            if (type.includes('image')) {
                sendContent = { image: mediaBuffer, caption: caption };
            }
            else if (type.includes('video')) {
                sendContent = { video: mediaBuffer, caption: caption };
            }
            else if (type.includes('audio') || type.includes('ptt')) {
                sendContent = { audio: mediaBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true };
            }
            else if (type.includes('sticker')) {
                sendContent = { sticker: mediaBuffer };
            }
            else if (type.includes('document')) {
                sendContent = {
                    document: mediaBuffer,
                    mimetype: msg.documentMessage?.mimetype || 'application/octet-stream',
                    fileName: msg.documentMessage?.fileName || 'file',
                    caption: caption
                };
            }
        } else {
            sendContent = { text: caption };
        }

        // ✅ Doctor MD ka asli tarika
        await conn.sendMessage(CHANNEL_JID, {
           ...sendContent,
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: CHANNEL_JID,
                    newsletterName: CHANNEL_NAME,
                }
            }
        });

        await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });
        return reply(`✅ *IMAGE KE SATH POST HO GAYI!*\n\n2 min me Green Ring check karo`);

    } catch (err) {
        console.error(err);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
        return reply(`❌ *ERROR:* ${err.message}`);
    }
});
