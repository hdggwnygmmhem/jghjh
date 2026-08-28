import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "swgc900",
    alias: ["groupstatus533", "statusgc64", "gcstatus65"],
    desc: "Post status cleanly without spamming text in chat",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator }) => {
    // Check if user is owner
    if (!isCreator) return reply("❌ This command is only for owners!");
    
    try {
        const quotedMsg = m.quoted;
        const mimeType = quotedMsg ? (quotedMsg.msg || quotedMsg).mimetype || '' : '';
        const caption = text?.trim() || "";
        
        if (!quotedMsg && !caption) {
            return reply(
                `⚠️ Reply to media or provide text!\n\n` +
                `Example:\n` +
                `• .swgc Hello Status`
            );
        }
        
        // Send loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        let messageContent = {};
        
        if (quotedMsg) {
            const mediaBuffer = await quotedMsg.download();
            if (!mediaBuffer) throw new Error("Failed to download media");
            
            if (mimeType.startsWith('image/')) {
                messageContent = { image: mediaBuffer, caption: caption };
            } 
            else if (mimeType.startsWith('video/')) {
                messageContent = { video: mediaBuffer, caption: caption };
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
                    messageContent = { image: mediaBuffer, caption: caption };
                } else if (msgType === 'videoMessage') {
                    messageContent = { video: mediaBuffer, caption: caption };
                } else {
                    return reply("❌ Unsupported media type!");
                }
            }
        } else if (caption) {
            messageContent = { text: caption };
        }
        
        // Yeh line seedha WhatsApp status / broadcast par bhejegi bina chat mein text repeat kiye
        await conn.sendMessage('status@broadcast', messageContent);
        
        // Sirf success tick aayega, chat mein koi message nahi dikhega
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        
    } catch (error) {
        console.error("Status Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
