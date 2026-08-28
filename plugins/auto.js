import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "status76",
    alias: ["groupstatus7", "statusgc8", "gcstatus9", "swgc0", "sall12"],
    desc: "Post status directly to WhatsApp Status without sending anything to groups",
    category: "owner",
    react: "👑",
    filename: __filename
}, async (conn, mek, m, { text, reply, isCreator }) => {
    
    // Sirf Owner/Creator hi chala sakta hai
    if (!isCreator) return reply("❌ This command is only for owner!");

    let tempFilePath = null;
    try {
        const quotedMsg = m.quoted;
        const mimeType = quotedMsg ? (quotedMsg.msg || quotedMsg).mimetype || '' : '';
        const caption = text?.trim() || quotedMsg?.text || quotedMsg?.caption || "";
        
        if (!quotedMsg && !caption) {
            return reply(
                `⚠️ Reply to media/audio or provide text/link!\n\n` +
                `Examples:\n` +
                `• .status76 Hello Status\n` +
                `• Reply to an image/video with: .status76 My Caption`
            );
        }

        // Loading Reaction on command message
        await conn.sendMessage(m.chat, { react: { text: "⏳", key: mek.key } });

        let mediaBuffer = null;
        let isPTT = false;
        let msgType = '';

        if (quotedMsg) {
            mediaBuffer = await quotedMsg.download().catch(() => null);
            if (!mediaBuffer) {
                await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
                return reply("❌ Media download nahi ho saka!");
            }

            // Size Check (Max 15MB)
            if (mediaBuffer.length > 15 * 1024 * 1024) {
                await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
                return reply("⚠️ Video file 15MB se badi hai!");
            }

            isPTT = quotedMsg.message?.audioMessage?.ptt || false;
            msgType = Object.keys(quotedMsg.message || {})[0];
            
            // Save to temp file to handle stream safely
            const ext = mimeType.split('/')[1] || 'tmp';
            tempFilePath = path.join('./', `temp_status_${Date.now()}.${ext}`);
            await fs.promises.writeFile(tempFilePath, mediaBuffer);
        }

        let localSuccess = false;

        try {
            // STRICT WHATSAPP STATUS BROADCAST (Sirf status@broadcast par jayega, groups mein nahi)
            if (quotedMsg && tempFilePath) {
                const fileStream = fs.readFileSync(tempFilePath);
                
                if (mimeType.startsWith('image/') || msgType === 'imageMessage') {
                    await conn.sendMessage('status@broadcast', { 
                        image: fileStream, 
                        caption: caption || "" 
                    }, { broadcast: true });
                } else if (mimeType.startsWith('video/') || msgType === 'videoMessage') {
                    await conn.sendMessage('status@broadcast', { 
                        video: fileStream, 
                        caption: caption || "" 
                    }, { broadcast: true });
                } else if (mimeType.startsWith('audio/') || msgType === 'audioMessage' || msgType === 'pttMessage') {
                    await conn.sendMessage('status@broadcast', { 
                        audio: fileStream, 
                        mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4',
                        ptt: isPTT 
                    }, { broadcast: true });
                }
            } else if (caption) {
                await conn.sendMessage('status@broadcast', { 
                    text: caption 
                }, { broadcast: true });
            }
            localSuccess = true;
        } catch (err) {
            console.error("Status Broadcast Error:", err.message);
        }

        // Cleanup Temp File
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        // Success Reaction (Chat bilkul clean rahegi, sirf tick ayega)
        await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        console.error("Status Command Error:", error);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
        reply(`❌ Error: ${error.message}`);
    }
});
