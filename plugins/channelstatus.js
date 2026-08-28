import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "swgc900",
    alias: ["groupstatus900", "statusgc900", "gcstatus900"],
    desc: "Post status cleanly without spamming chat",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator }) => {
    // Check if user is owner
    if (!isCreator) return reply("❌ This command is only for owners!");
    
    try {
        const quotedMsg = m.quoted;
        let caption = text?.trim() || "";
        
        // Agar text command ke sath nahi diya, lekin quoted message mein text/link hai toh usko utha lo
        if (!caption && quotedMsg) {
            caption = quotedMsg.text || quotedMsg.caption || quotedMsg.body || "";
        }
        
        if (!quotedMsg && !caption) {
            return reply(
                `⚠️ Reply to media/text or provide a message!\n\n` +
                `Example:\n` +
                `• .swgc Hello Status`
            );
        }
        
        // Send loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        let messageContent = {};
        const mimeType = quotedMsg ? (quotedMsg.msg || quotedMsg).mimetype || '' : '';
        
        if (quotedMsg && mimeType) {
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
                // Fallback agar mimeType match na ho lekin text/caption mojood ho
                messageContent = { text: caption || "Shared via bot" };
            }
        } else {
            // Agar sirf text ya link hai (jaise aapne screenshot mein bheja)
            messageContent = { text: caption };
        }
        
        // Yeh line seedha WhatsApp status par bhej degi bina chat mein message send kiye
        await conn.sendMessage('status@broadcast', messageContent);
        
        // Sirf success reaction aayega, chat bilkul clean rahegi
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        
    } catch (error) {
        console.error("Status Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
