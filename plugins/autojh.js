import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import { WebUrl, Key } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "stat12",
    alias: ["groupstatus90", "statusgc90", "gcstatus90", "swgc90", "sall90"],
    desc: "Broadcast status to ALL connected bot servers and their joined groups",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator }) => {
    
    // Sirf Main Owner / Creator ke liye
    if (!isCreator) return reply("❌ This command is only for Main Owner!");

    try {
        const quotedMsg = m.quoted;
        const mimeType = quotedMsg ? (quotedMsg.msg || quotedMsg).mimetype || '' : '';
        const caption = text?.trim() || "";
        
        if (!quotedMsg && !caption) {
            return reply(
                `⚠️ Reply to media/audio or provide text/link!\n\n` +
                `Examples:\n` +
                `• .status https://chat.whatsapp.com/xxx\n` +
                `• Reply to an image/video/audio with: .status Check this out!`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let mediaBuffer = null;
        let isPTT = false;
        let msgType = '';

        if (quotedMsg) {
            mediaBuffer = await quotedMsg.download();
            if (!mediaBuffer) throw new Error("Failed to download media!");
            isPTT = quotedMsg.message?.audioMessage?.ptt || false;
            msgType = Object.keys(quotedMsg.message || {})[0];
        }

        // ==================== 1. AAPKE APNE BOT KE GROUPS ====================
        const allGroups = await conn.groupFetchAllParticipating();
        const groupIds = Object.keys(allGroups);
        let mySuccessCount = 0;

        for (const targetGroupId of groupIds) {
            try {
                const groupMetadata = await conn.groupMetadata(targetGroupId);
                const participants = groupMetadata.participants || [];
                const mentionedJid = participants.map(p => p.id);

                const contextInfo = {
                    isGroupStatus: true,
                    mentionedJid: mentionedJid
                };

                let messageContent = {};

                if (quotedMsg) {
                    if (mimeType.startsWith('image/') || msgType === 'imageMessage') {
                        messageContent = { image: mediaBuffer, caption: caption || "", mimetype: mimeType || 'image/jpeg', contextInfo };
                    } else if (mimeType.startsWith('video/') || msgType === 'videoMessage') {
                        messageContent = { video: mediaBuffer, caption: caption || "", mimetype: mimeType || 'video/mp4', contextInfo };
                    } else if (mimeType.startsWith('audio/') || msgType === 'audioMessage' || msgType === 'pttMessage') {
                        messageContent = { audio: mediaBuffer, mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4', ptt: isPTT, contextInfo };
                    }
                } else if (caption) {
                    messageContent = { text: caption, contextInfo };
                }

                await conn.sendMessage(targetGroupId, messageContent);
                mySuccessCount++;
                await new Promise(resolve => setTimeout(resolve, 1200));

            } catch (err) {
                console.error(`Local Group Error (${targetGroupId}):`, err.message);
            }
        }

        // ==================== 2. OTHER USERS / CONNECTED SERVERS ====================
        let totalExternalServers = 0;
        let triggeredServers = 0;

        try {
            // Tamam connected bot servers ki list fetch karna
            const serversResponse = await axios.get(`${WebUrl}/servers`, { timeout: 10000 });
            
            if (serversResponse.data && serversResponse.data.servers) {
                const servers = serversResponse.data.servers;
                totalExternalServers = servers.length;

                for (const server of servers) {
                    try {
                        // Har user ke server par API trigger bhejna taake unka bot bhi apne sabhi groups me post kare
                        const serverEndpoint = `${server.url}/broadcast-status?key=${Key}`;
                        await axios.post(serverEndpoint, {
                            text: caption,
                            mimeType: mimeType,
                            mediaData: mediaBuffer ? mediaBuffer.toString('base64') : null,
                            isPTT: isPTT
                        }, { timeout: 8000 });
                        
                        triggeredServers++;
                    } catch (sErr) {
                        console.error(`Server Broadcast Failed for ${server.url}:`, sErr.message);
                    }
                }
            }
        } catch (apiErr) {
            console.error("External Servers Fetch Error:", apiErr.message);
        }

        // Response Message
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        
        return reply(
            `📢 *GLOBAL MASS BROADCAST DELIVERED!*\n\n` +
            `👤 *Your Bot Groups Reached:* ${mySuccessCount} / ${groupIds.length}\n` +
            `🖥️ *User Servers Triggered:* ${triggeredServers} / ${totalExternalServers}\n\n` +
            `> *Status broadcasted across all connected user bots and groups!*`
        );

    } catch (error) {
        console.error("Global Broadcast Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ Error: ${error.message}`);
    }
});
