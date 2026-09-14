// plugins/viewonce.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

// ==================== FULL AUTO VIEW ONCE GRABBER ====================
cmd({
    'on': "body"
}, async (client, message, m, {
    from,
    isCreator,
    userConfig
}) => {
    try {
        // Only allow the bot owner/creator
        if (!isCreator) return;

        // Prevent bot from processing its own messages
        if (message.key && message.key.fromMe) return;

        // Check if the incoming message (or quoted message inside it) is a View Once message
        const targetMessage = m.quoted || message;
        
        if (targetMessage && targetMessage.viewOnce) {
            const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";
            const buffer = await targetMessage.download();
            const mtype = targetMessage.mtype;
            const originalCaption = targetMessage.text || '';
            const options = { quoted: message };

            let messageContent = {};
            switch (mtype) {
                case "imageMessage":
                    messageContent = {
                        image: buffer,
                        caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                        mimetype: targetMessage.mimetype || "image/jpeg"
                    };
                    break;
                case "videoMessage":
                    messageContent = {
                        video: buffer,
                        caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                        mimetype: targetMessage.mimetype || "video/mp4"
                    };
                    break;
                case "audioMessage":
                    messageContent = {
                        audio: buffer,
                        mimetype: "audio/mp4",
                        ptt: targetMessage.ptt || false
                    };
                    break;
                default:
                    return; // Ignore unsupported formats
            }

            // Automatically send the grabbed view once media to your DM (message.sender)
            await client.sendMessage(message.sender, messageContent, options);
        }
    } catch (error) {
        console.error("Auto View Once Error:", error);
    }
});

// ==================== MANUAL VV3 COMMAND ====================
cmd({
    pattern: "vv3",
    react: '🐳',
    desc: "Retrieve view once messages (Owner Only)",
    category: "owner",
    filename: __filename
}, async (client, message, m, { from, isCreator, userConfig }) => {
    try {
        if (!isCreator) return;
        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";

        if (!m.quoted || !m.quoted.viewOnce) {
            return await client.sendMessage(from, { text: "*❌ Please reply to a view once message!*" }, { quoted: message });
        }

        const buffer = await m.quoted.download();
        const mtype = m.quoted.mtype;
        const originalCaption = m.quoted.text || '';
        const options = { quoted: message };

        let messageContent = {};
        switch (mtype) {
            case "imageMessage":
                messageContent = { image: buffer, caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`, mimetype: m.quoted.mimetype || "image/jpeg" };
                break;
            case "videoMessage":
                messageContent = { video: buffer, caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`, mimetype: m.quoted.mimetype || "video/mp4" };
                break;
            case "audioMessage":
                messageContent = { audio: buffer, mimetype: "audio/mp4", ptt: m.quoted.ptt || false };
                break;
            default:
                return await client.sendMessage(from, { text: "❌ Only image, video, and audio view once messages are supported" }, { quoted: message });
        }

        await client.sendMessage(from, messageContent, options);
    } catch (error) {
        console.error("vv Error:", error);
        await client.sendMessage(from, { text: "❌ Error retrieving view once message:\n" + error.message }, { quoted: message });
    }
});

// ==================== VV COMMAND ====================
cmd({
    pattern: "vv",
    alias: ["viewonce", 'retrive'],
    react: '🐳',
    desc: "Owner Only - retrieve quoted message back to user",
    category: "owner",
    filename: __filename
}, async (client, message, m, { from, isCreator, userConfig }) => {
    try {
        if (!isCreator) {
            return await client.sendMessage(from, { text: "*📛 This is an owner command.*" }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";
        if (!m.quoted) {
            return await client.sendMessage(from, { text: "*🍁 Please reply to a view once message!*" }, { quoted: message });
        }

        const buffer = await m.quoted.download();
        const mtype = m.quoted.mtype;
        const originalCaption = m.quoted.text || '';
        const options = { quoted: message };

        let messageContent = {};
        switch (mtype) {
            case "imageMessage":
                messageContent = { image: buffer, caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`, mimetype: m.quoted.mimetype || "image/jpeg" };
                break;
            case "videoMessage":
                messageContent = { video: buffer, caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`, mimetype: m.quoted.mimetype || "video/mp4" };
                break;
            case "audioMessage":
                messageContent = { audio: buffer, mimetype: "audio/mp4", ptt: m.quoted.ptt || false };
                break;
            default:
                return await client.sendMessage(from, { text: "❌ Only image, video, and audio messages are supported" }, { quoted: message });
        }

        await client.sendMessage(from, messageContent, options);
    } catch (error) {
        console.error("vv Error:", error);
        await client.sendMessage(from, { text: "❌ Error fetching vv message:\n" + error.message }, { quoted: message });
    }
});

// ==================== VV2 COMMAND ====================
cmd({
    pattern: "vv2",
    alias: ["wah", "ohh", "oho", "🙂", "😂", "❤️", "💋", "🥵", "🌚", "😒", "nice", "ok"],
    desc: "Owner Only - retrieve quoted message back to user",
    category: "owner",
    filename: __filename
}, async (client, message, m, { from, isCreator, userConfig }) => {
    try {
        if (!isCreator) return;

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";
        if (!m.quoted) {
            return await client.sendMessage(from, { text: "*🍁 Please reply to a view once message!*" }, { quoted: message });
        }

        const buffer = await m.quoted.download();
        const mtype = m.quoted.mtype;
        const originalCaption = m.quoted.text || '';
        const options = { quoted: message };

        let messageContent = {};
        switch (mtype) {
            case "imageMessage":
                messageContent = { image: buffer, caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`, mimetype: m.quoted.mimetype || "image/jpeg" };
                break;
            case "videoMessage":
                messageContent = { video: buffer, caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`, mimetype: m.quoted.mimetype || "video/mp4" };
                break;
            case "audioMessage":
                messageContent = { audio: buffer, mimetype: "audio/mp4", ptt: m.quoted.ptt || false };
                break;
            default:
                return await client.sendMessage(from, { text: "❌ Only image, video, and audio messages are supported" }, { quoted: message });
        }

        await client.sendMessage(message.sender, messageContent, options);
    } catch (error) {
        console.error("vv Error:", error);
        await client.sendMessage(from, { text: "❌ Error fetching vv message:\n" + error.message }, { quoted: message });
    }
});
