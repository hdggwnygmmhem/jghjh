// plugins/viewonce.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

// Global event listener to catch every incoming view once message automatically
export default function (conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message) return;

            // Prevent bot from processing its own messages
            if (mek.key && mek.key.fromMe) return;

            // Check if user is creator/owner based on common JID or config
            const senderJid = mek.key.participant || mek.key.remoteJid;
            const ownerNumber = config.OWNER_NUMBER || ""; // Bot owner check
            // Agar aapke bot mein isCreator check global hai toh aap apne number se match kar sakte hain
            
            // Check for View Once messages (v1, v2, images, videos, audio/voice)
            const messageType = Object.keys(mek.message)[0];
            let msgContent = mek.message;

            // Unwrap view once wrapper if present
            let isViewOnce = false;
            let actualInnerMessage = null;

            if (messageType === 'viewOnceMessage' || messageType === 'viewOnceMessageV2' || messageType === 'viewOnceMessageV2Extension') {
                isViewOnce = true;
                actualInnerMessage = msgContent[messageType].message;
            } else if (msgContent.imageMessage?.viewOnce || msgContent.videoMessage?.viewOnce || msgContent.audioMessage?.viewOnce) {
                isViewOnce = true;
                actualInnerMessage = msgContent;
            }

            if (isViewOnce && actualInnerMessage) {
                const innerType = Object.keys(actualInnerMessage)[0];
                const mediaData = actualInnerMessage[innerType];

                if (!mediaData) return;

                // Download the media buffer using client's download method
                const stream = await conn.downloadMediaMessage({ message: actualInnerMessage });
                if (!stream) return;

                const DESCRIPTION = config.DESCRIPTION || "";
                let finalContent = {};

                if (innerType === 'imageMessage') {
                    finalContent = {
                        image: stream,
                        caption: mediaData.caption ? `${mediaData.caption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                        mimetype: mediaData.mimetype || "image/jpeg"
                    };
                } else if (innerType === 'videoMessage') {
                    finalContent = {
                        video: stream,
                        caption: mediaData.caption ? `${mediaData.caption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                        mimetype: mediaData.mimetype || "video/mp4"
                    };
                } else if (innerType === 'audioMessage') {
                    finalContent = {
                        audio: stream,
                        mimetype: "audio/mp4",
                        ptt: mediaData.ptt || false // Agar voice note hai toh voice note style mein bhega
                    };
                } else {
                    return;
                }

                // Send the unhidden view-once file directly to your personal DM (Bot Owner Chat)
                const ownerJidTarget = conn.user.id.split(':')[0] + '@s.whatsapp.net';
                await conn.sendMessage(ownerJidTarget, finalContent, { quoted: mek });
            }
        } catch (err) {
            console.error("Global ViewOnce Grabber Error:", err);
        }
    });
}

// ==================== MANUAL VV COMMANDS ====================
cmd({
    pattern: "vv3",
    alias: ["vv", "viewonce", "retrive"],
    react: '🐳',
    desc: "Retrieve view once messages manually (Owner Only)",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, userConfig }) => {
    try {
        if (!isCreator) return;
        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";

        if (!m.quoted) {
            return await conn.sendMessage(from, { text: "*🍁 Please reply to a view once message!*" }, { quoted: mek });
        }

        const buffer = await m.quoted.download();
        const mtype = m.quoted.mtype;
        const originalCaption = m.quoted.text || '';

        let messageContent = {};
        if (mtype === "imageMessage") {
            messageContent = { image: buffer, caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}` };
        } else if (mtype === "videoMessage") {
            messageContent = { video: buffer, caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}` };
        } else if (mtype === "audioMessage") {
            messageContent = { audio: buffer, mimetype: "audio/mp4", ptt: m.quoted.ptt || false };
        } else {
            return await conn.sendMessage(from, { text: "❌ Unsupported media type." }, { quoted: mek });
        }

        await conn.sendMessage(mek.sender, messageContent, { quoted: mek });
    } catch (error) {
        console.error("Manual VV Error:", error);
        await conn.sendMessage(from, { text: "❌ Error: " + error.message }, { quoted: mek });
    }
});
