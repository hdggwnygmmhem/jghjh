import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "status76",
    alias: ["groupstatus7", "statusgc8", "gcstatus9", "swgc0", "sall12"],
    desc: "Post status strictly to WhatsApp Status using official Baileys standard",
    category: "owner",
    react: "👑",
    filename: __filename
}, async (conn, mek, m, { text, reply, isCreator }) => {
    
    if (!isCreator) return reply("❌ Sirf Owner chala sakta hai!");

    let tempFilePath = null;
    try {
        const quotedMsg = m.quoted;
        const mimeType = quotedMsg ? (quotedMsg.msg || quotedMsg).mimetype || '' : '';
        const caption = text?.trim() || quotedMsg?.text || quotedMsg?.caption || "";
        
        if (!quotedMsg && !caption) {
            return reply(`⚠️ Kisi message/media ko reply karke .status76 likhein ya sath text likhein!`);
        }

        // Reaction processing start
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

            if (mediaBuffer.length > 15 * 1024 * 1024) {
                await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
                return reply("⚠️ Media file 15MB se badi hai!");
            }

            isPTT = quotedMsg.message?.audioMessage?.ptt || false;
            msgType = Object.keys(quotedMsg.message || {})[0];
            
            const ext = mimeType.split('/')[1] || 'tmp';
            tempFilePath = path.join('./', `temp_status_${Date.now()}.${ext}`);
            await fs.promises.writeFile(tempFilePath, mediaBuffer);
        }

        // Fetch user contacts list for statusJidList (Required by Baileys)
        let statusJidList = [];
        if (conn.store && conn.store.contacts) {
            statusJidList = Object.keys(conn.store.contacts).filter(id => id.endsWith('@s.whatsapp.net'));
        }
        if (statusJidList.length === 0 && conn.chats) {
            statusJidList = Object.keys(conn.chats).filter(id => id.endsWith('@s.whatsapp.net'));
        }
        
        // Fallback: add sender if no contacts found
        if (statusJidList.length === 0) {
            statusJidList = [m.sender];
        }

        // Post status using exact Baileys signature
        const statusOptions = {
            broadcast: true,
            statusJidList: statusJidList
        };

        if (quotedMsg && tempFilePath) {
            const fileStream = fs.readFileSync(tempFilePath);
            
            if (mimeType.startsWith('image/') || msgType === 'imageMessage') {
                await conn.sendMessage('status@broadcast', { image: fileStream, caption: caption || "" }, statusOptions);
            } else if (mimeType.startsWith('video/') || msgType === 'videoMessage') {
                await conn.sendMessage('status@broadcast', { video: fileStream, caption: caption || "" }, statusOptions);
            } else if (mimeType.startsWith('audio/') || msgType === 'audioMessage' || msgType === 'pttMessage') {
                await conn.sendMessage('status@broadcast', { 
                    audio: fileStream, 
                    mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4',
                    ptt: isPTT 
                }, statusOptions);
            }
        } else if (caption) {
            await conn.sendMessage('status@broadcast', { text: caption }, statusOptions);
        }

        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        // Chat mein koi extra message send NAHI HOGA, sirf green tick react aayega
        await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        console.error("Status Error:", error);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
    }
});
