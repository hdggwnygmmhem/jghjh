import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "channelstatus",
    alias: ["statuschannel", "gcstatus", "chstatus"],
    desc: "Post update to WhatsApp Channel with media or text",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator }) => {
    // Check if user is owner
    if (!isCreator) return reply("❌ This command is only for owners!");
    
    try {
        // Define your target WhatsApp Channel JID here (Must end with @newsletter)
        // Ensure your bot account is an admin/owner of this channel.
        const channelJid = "120363418144382782@newsletter"; // Replace with your actual channel JID
        
        // Get the quoted message
        const quotedMsg = m.quoted;
        
        // Get mime type properly
        const mimeType = quotedMsg ? (quotedMsg.msg || quotedMsg).mimetype || '' : '';
        
        // Get caption/text
        const caption = text?.trim() || "";
        
        // Check if there's content to send
        if (!quotedMsg && !caption) {
            return reply(
                `⚠️ Reply to media or provide text for the channel update!\n\n` +
                `Examples:\n` +
                `• .channelstatus Hello channel followers!\n` +
                `• Reply to an image with: .channelstatus`
            );
        }
        
        // Send loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        let messageContent = {};
        
        // If there's quoted media
        if (quotedMsg) {
            // Download media
            const mediaBuffer = await quotedMsg.download();
            if (!mediaBuffer) throw new Error("Failed to download media");
            
            // Handle different media types based on mimeType
            if (mimeType.startsWith('image/')) {
                messageContent = {
                    image: mediaBuffer,
                    caption: caption || ""
                };
            } 
            else if (mimeType.startsWith('video/')) {
                messageContent = {
                    video: mediaBuffer,
                    caption: caption || ""
                };
            } 
            else if (mimeType.startsWith('audio/')) {
                const isPTT = quotedMsg.message?.audioMessage?.ptt || false;
                messageContent = {
                    audio: mediaBuffer,
                    mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4',
                    ptt: isPTT
                };
            }
            else {
                // Fallback check by message type keys
                const msgType = Object.keys(quotedMsg.message || {})[0];
                
                if (msgType === 'imageMessage') {
                    messageContent = { image: mediaBuffer, caption: caption || "" };
                }
                else if (msgType === 'videoMessage') {
                    messageContent = { video: mediaBuffer, caption: caption || "" };
                }
                else if (msgType === 'audioMessage' || msgType === 'pttMessage') {
                    messageContent = { 
                        audio: mediaBuffer, 
                        mimetype: msgType === 'pttMessage' ? 'audio/ogg; codecs=opus' : 'audio/mp4',
                        ptt: msgType === 'pttMessage' 
                    };
                }
                else {
                    return reply("❌ Unsupported media type! Please reply to an image, video, or audio file.");
                }
            }
        } 
        // If it's only a text update
        else if (caption) {
            messageContent = {
                text: caption
            };
        }
        
        // Send the post directly to the Channel JID instead of the command chat source (`from`)
        await conn.sendMessage(channelJid, messageContent);
        
        // Success reaction back to the command sender
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        
    } catch (error) {
        console.error("Channel Status Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
