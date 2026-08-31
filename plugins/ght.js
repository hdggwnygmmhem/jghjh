import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const CHANNEL_JID = "120363426641229472@newsletter"; // 👈 اپنا Channel ID یہاں لگاؤ
const CHANNEL_NAME = "DOCTOR MD SUPPORT";

cmd({
    pattern: "cstatus",
    alias: ["chstatus", "postch", "ch"],
    desc: "Broadcast status/media/links to Channel",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator }) => {

    // Sirf Owner/Creator hi chala sakta hai
    if (!isCreator) return reply("❌ This command is only for owner!");

    try {
        // Quoted (Reply kiya hua) message nikalna
        const quotedMsg = m.quoted;

        // Mime type check karna
        const mimeType = quotedMsg? (quotedMsg.msg || quotedMsg).mimetype || '' : '';

        // Caption ya link text extract karna
        const caption = text?.trim() || "";

        // Agar na media par reply hai na hi koi text/link likha hai
        if (!quotedMsg &&!caption) {
            return reply(
                `⚠️ Reply to media/audio or provide text/link!\n\n` +
                `Examples:\n` +
                `•.cstatus https://whatsapp.com/channel/xxx\n` +
                `• Reply to an image/video/audio with:.cstatus NEW UPDATE`
            );
        }

        // Loading Reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Media Buffer Download karna
        let mediaBuffer = null;
        let isPTT = false;
        let msgType = '';

        if (quotedMsg) {
            mediaBuffer = await quotedMsg.download();
            if (!mediaBuffer) throw new Error("Failed to download media!");

            isPTT = quotedMsg.message?.audioMessage?.ptt || false;
            msgType = Object.keys(quotedMsg.message || {})[0];
        }

        let messageContent = {};

        // Media Broadcast Logic
        if (quotedMsg) {
            if (mimeType.startsWith('image/') || msgType === 'imageMessage') {
                messageContent = {
                    image: mediaBuffer,
                    caption: caption || "",
                    mimetype: mimeType || 'image/jpeg',
                };
            } else if (mimeType.startsWith('video/') || msgType === 'videoMessage') {
                messageContent = {
                    video: mediaBuffer,
                    caption: caption || "",
                    mimetype: mimeType || 'video/mp4',
                };
            } else if (mimeType.startsWith('audio/') || msgType === 'audioMessage' || msgType === 'pttMessage') {
                messageContent = {
                    audio: mediaBuffer,
                    mimetype: isPTT? 'audio/ogg; codecs=opus' : 'audio/mp4',
                    ptt: isPTT,
                };
            } else if (msgType === 'stickerMessage') {
                messageContent = { sticker: mediaBuffer };
            }
        }
        // Simple Text / Link Broadcast Logic
        else if (caption) {
            messageContent = { text: caption };
        }

        // ✅ CHANNEL MEIN SEND KAREIN - YAHI FARQ HAI
        await conn.sendMessage(CHANNEL_JID, messageContent);

        // Broadcast Complete Reaction & Summary
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        return reply(
            `📢 *CHANNEL STATUS POSTED!*\n\n` +
            `📍 *Channel:* ${CHANNEL_NAME}\n` +
            `✅ *Status Successfully Sent!*\n\n` +
            `> *2 min me DP par Green Ring aa jayegi*`
        );

    } catch (error) {
        console.error("Channel Status Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ Error: ${error.message}`);
    }
});
