import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "groupstatus200",
    alias: ["statusgc900", "gcstatus900", "swgc900"],
    desc: "Post status directly from IB or chat without sending messages to chat",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator }) => {
    // Check if user is owner
    if (!isCreator) return reply("❌ This command is only for owners!");
    
    try {
        // Get the quoted message
        const quotedMsg = m.quoted;
        
        // Get mime type properly
        const mimeType = quotedMsg ? (quotedMsg.msg || quotedMsg).mimetype || '' : '';
        
        // Get caption/text
        const caption = text?.trim() || "";
        
        // Check if there's content to send
        if (!quotedMsg && !caption) {
            return reply(
                `⚠️ Reply to media or provide text!\n\n` +
                `Examples:\n` +
                `• .gcstatus Hello status\n` +
                `• Reply to an image with: .gcstatus`
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
                const msgType = Object.keys(quotedMsg.message || {})[0];
                
                if (msgType === 'imageMessage') {
                    messageContent = {
                        image: mediaBuffer,
                        caption: caption || ""
                    };
                }
                else if (msgType === 'videoMessage') {
                    messageContent = {
                        video: mediaBuffer,
                        caption: caption || ""
                    };
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
        // If only text status
        else if (caption) {
            messageContent = {
                text: caption
            };
        }
        
        // **YEH STATUS LAGANE WALA CODE HAI**: IB ya kahin se bhi command lagane par seedha status@broadcast par chalajayega
        // Aur agar sabhi ko status dikhana ho toh contacts list fetch karne ki zaroorat nahi, status@broadcast khud handle karta hai
        await conn.sendMessage('status@broadcast', messageContent);
        
        // Sirf success reaction aayega, chat mein koi message repeat nahi hoga
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        
    } catch (error) {
        console.error("Status Post Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
