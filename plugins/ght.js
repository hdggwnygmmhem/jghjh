import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);

const CHANNEL_JID = "120363426641229472@newsletter"; // 👈 اپنا Channel ID یہاں لگاؤ
const CHANNEL_NAME = "DOCTOR MD SUPPORT"; // 👈 اپنا Channel Name

// Media type check karne ke liye
const getMediaType = (m) => {
    if (!m) return null;
    const type = Object.keys(m.message)[0];
    return type;
}

cmd({
    pattern: "ch",
    alias: ["channel", "postch", "cstatus", "post"],
    desc: "Post Image, Video, Audio, Sticker, Doc, Text to Channel",
    category: "owner",
    use: '<reply to media or type text>',
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { q, reply, isCreator, prefix }) => {

    if (!isCreator) return reply("❌ *Access Denied! Sirf Owner*");

    const quoted = m.quoted;
    let caption = q?.trim() || "";

    if (!quoted &&!caption) {
        return reply(`*━━━━━━━━━━━━━━━━━━*
*📢 CHANNEL POST COMMAND*
*━━━━━━━━━━━━━━━━━━*

*استعمال:*
1. *Text:* \`${prefix}ch آپ کا میسج\`
2. *Image:* Image reply + \`${prefix}ch کیپشن\`
3. *Video:* Video reply + \`${prefix}ch کیپشن\`
4. *Voice:* Voice reply + \`${prefix}ch\`
5. *Sticker:* Sticker reply + \`${prefix}ch\`
6. *Document:* Doc reply + \`${prefix}ch کیپشن\`

*نوٹ:* Image/Video سے Green Ring آتی ہے
*━━━━━━━━━━━━━━━━━━*`);
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: "⏳", key: mek.key } });
        console.log(`[CHANNEL] Posting to ${CHANNEL_NAME}...`);

        let sendContent = {};
        let mediaType = 'text';

        if (quoted) {
            mediaType = getMediaType(quoted);
            console.log(`[CHANNEL] Media Type: ${mediaType}`);

            // ✅ rc14 ka sahi download method
            const mediaBuffer = await downloadMediaMessage(quoted, 'buffer', {}, {
                logger: console,
                reuploadRequest: conn.updateMediaMessage
            });

            if (!mediaBuffer) throw new Error("Media download failed");

            switch (mediaType) {
                case 'imageMessage':
                    sendContent = { image: mediaBuffer, caption: caption };
                    break;

                case 'videoMessage':
                    sendContent = { video: mediaBuffer, caption: caption, mimetype: 'video/mp4' };
                    break;

                case 'audioMessage':
                case 'pttMessage':
                    sendContent = { audio: mediaBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true };
                    break;

                case 'stickerMessage':
                    sendContent = { sticker: mediaBuffer };
                    break;

                case 'documentMessage':
                    sendContent = {
                        document: mediaBuffer,
                        mimetype: quoted.message.documentMessage.mimetype,
                        fileName: quoted.message.documentMessage.fileName || 'Document',
                        caption: caption
                    };
                    break;

                default:
                    throw new Error("Unsupported media type");
            }
        } else {
            sendContent = { text: caption };
        }

        // ✅ BAILEYS RC14 OFFICIAL METHOD
        await conn.sendMessage(CHANNEL_JID, sendContent);
        console.log(`[CHANNEL] Posted successfully!`);

        await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });

        let displayType = mediaType.replace('Message','').toUpperCase();
        return reply(`*━━━━━━━━━━*
*✅ POSTED SUCCESSFULLY!*
*━━━━━━━━━━*

*Channel:* ${CHANNEL_NAME}
*Type:* ${displayType}
*Caption:* ${caption || 'None'}

*نوٹ:* 1-2 منٹ میں DP پر Green Ring آ جائے گی
*━━━━━━━━━━━━━━━━━━*`);

    } catch (err) {
        console.error("[CHANNEL ERROR]:", err);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
        return reply(`*━━━━━━━━━━━━━━━━━━*
*❌ ERROR OCCURRED*
*━━━━━━━━━━*

*Reason:* ${err.message}

*حل:*
1. Bot restart کرو: \`node.\`
2. Media dubara send کرو
3. Channel ID check کرو
*━━━━━━━━━━━━━━━━━━*`);
    }
});
