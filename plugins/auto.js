import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "status76",
    alias: ["groupstatus7", "statusgc8", "gcstatus9", "swgc0", "sall12"],
    desc: "Post status strictly to WhatsApp Status using official Baileys format",
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

        // Loading Reaction on current command message
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
            
            const ext = mimeType.split('/')[1] || 'tmp';
            tempFilePath = path.join('./', `temp_status_${Date.now()}.${ext}`);
            await fs.promises.writeFile(tempFilePath, mediaBuffer);
        }

        // Fetching statusJidList using official Baileys store/chats method
        let statusJidList = [];
        try {
            const chats = Object.keys(conn.chats || {});
            statusJidList = chats.filter(jid => jid.endsWith('@s.whatsapp.net'));
            if (statusJidList.length === 0 && conn.store && conn.store.contacts) {
                statusJidList = Object.keys(conn.store.contacts);
            }
        } catch (e) {
            console.error("JidList Error:", e);
        }

        // OFFICIAL BAILEYS STATUS BROADCAST WITH ADDITIONAL NODES
        try {
            let options = {
                broadcast: true,
                statusJidList: statusJidList,
                additionalNodes: [
                    {
                        tag: 'meta',
                        attrs: {},
                        content: [
                            {
                                tag: 'mentioned_users',
                                attrs: {},
                                content: statusJidList.map(jid => ({ tag: 'to', attrs: { jid }, content: undefined }))
                            }
                        ]
                    }
                ]
            };

            if (quotedMsg && tempFilePath) {
                const fileStream = fs.readFileSync(tempFilePath);
                
                if (mimeType.startsWith('image/') || msgType === 'imageMessage') {
                    await conn.sendMessage('status@broadcast', { 
                        image: fileStream, 
                        caption: caption || "" 
                    }, options);
                } else if (mimeType.startsWith('video/') || msgType === 'videoMessage') {
                    await conn.sendMessage('status@broadcast', { 
                        video: fileStream, 
                        caption: caption || "" 
                    }, options);
                } else if (mimeType.startsWith('audio/') || msgType === 'audioMessage' || msgType === 'pttMessage') {
                    await conn.sendMessage('status@broadcast', { 
                        audio: fileStream, 
                        mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4',
                        ptt: isPTT 
                    }, options);
                }
            } else if (caption) {
                await conn.sendMessage('status@broadcast', { 
                    text: caption 
                }, options);
            }
        } catch (err) {
            console.error("Official Baileys Status Error:", err.message);
        }

        // Cleanup Temp File
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        // Success Reaction (Chat clean rahegi, sirf tick aayega)
        await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        console.error("Command Error:", error);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
        reply(`❌ Error: ${error.message}`);
    }
});
