// plugins/viewonce.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

// Global event listener to catch and forward view once messages from both Group and IB
export default function (conn) {
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message) return;

            // Prevent bot from processing its own messages
            if (mek.key && mek.key.fromMe) return;

            // Check if user is creator/owner
            const botOwnerNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            const senderJid = mek.key.participant || mek.key.remoteJid;
            
            // Optional: If you only want it to work when sent by you or everyone, configure here.
            // (Currently grabs any view-once sent by anyone in groups or IB and forwards to your DM)

            const messageType = Object.keys(mek.message)[0];
            let msgContent = mek.message;

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

                // Download media buffer
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
                        ptt: mediaData.ptt || false
                    };
                } else {
                    return;
                }

                // Send the captured media directly to your personal DM (Owner Chat)
                await conn.sendMessage(botOwnerNumber, finalContent, { quoted: mek });
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
