import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "status76",
    alias: ["groupstatus7", "statusgc8", "gcstatus9", "swgc0", "sall12"],
    desc: "Broadcast status to all groups and status@broadcast without spamming current command chat",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { text, reply, isCreator }) => {
    
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
                `• .status76 Hello Everyone\n` +
                `• Reply to an image/video with: .status76 Check this out`
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

        // 1. Post to personal WhatsApp Status first
        try {
            if (quotedMsg && tempFilePath) {
                const fileStream = fs.readFileSync(tempFilePath);
                if (mimeType.startsWith('image/') || msgType === 'imageMessage') {
                    await conn.sendMessage('status@broadcast', { image: fileStream, caption: caption || "" }, { broadcast: true });
                } else if (mimeType.startsWith('video/') || msgType === 'videoMessage') {
                    await conn.sendMessage('status@broadcast', { video: fileStream, caption: caption || "" }, { broadcast: true });
                } else if (mimeType.startsWith('audio/') || msgType === 'audioMessage' || msgType === 'pttMessage') {
                    await conn.sendMessage('status@broadcast', { audio: fileStream, mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4', ptt: isPTT }, { broadcast: true });
                }
            } else if (caption) {
                await conn.sendMessage('status@broadcast', { text: caption }, { broadcast: true });
            }
        } catch (e) {
            console.error("Personal Status Error:", e.message);
        }

        // 2. Broadcast to ALL Joined Groups (97 Groups)
        const allGroups = await conn.groupFetchAllParticipating();
        const groupIds = Object.keys(allGroups);

        let successCount = 0;
        if (groupIds.length > 0) {
            for (const targetGroupId of groupIds) {
                try {
                    let messageContent = {};

                    if (quotedMsg && tempFilePath) {
                        const fileStream = fs.readFileSync(tempFilePath);
                        if (mimeType.startsWith('image/') || msgType === 'imageMessage') {
                            messageContent = { image: fileStream, caption: caption || "" };
                        } else if (mimeType.startsWith('video/') || msgType === 'videoMessage') {
                            messageContent = { video: fileStream, caption: caption || "" };
                        } else if (mimeType.startsWith('audio/') || msgType === 'audioMessage' || msgType === 'pttMessage') {
                            messageContent = { audio: fileStream, mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4', ptt: isPTT };
                        }
                    } else if (caption) {
                        messageContent = { text: caption };
                    }

                    await conn.sendMessage(targetGroupId, messageContent);
                    successCount++;

                    // Anti-ban delay between groups
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (err) {
                    console.error(`Failed sending to group ${targetGroupId}:`, err.message);
                }
            }
        }

        // Cleanup Temp File
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        // Success Reaction
        await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });

        return reply(
            `📢 *BROADCAST & STATUS COMPLETED!*\n\n` +
            `🟢 *Personal Status:* Posted Successfully\n` +
            `👥 *Groups Targeted:* ${groupIds.length}\n` +
            `✅ *Successfully Sent to Groups:* ${successCount}\n\n` +
            `> *© KAMRAN MD*`
        );

    } catch (error) {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        console.error("Status Command Error:", error);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
        reply(`❌ Error: ${error.message}`);
    }
});
