import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import { WebUrl, Key } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "status68",
    alias: ["groupstatus87", "statusgc87", "gcstatus77", "swgc87", "sall76"],
    desc: "Post ONLY Group Status across all connected bot servers (No direct group messages)",
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
                `⚠️ Reply to media or provide text/link!\n\n` +
                `Examples:\n` +
                `• .status Check out this update\n` +
                `• Reply to an image/video with: .status`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let mediaBuffer = null;
        let isPTT = false;

        if (quotedMsg) {
            mediaBuffer = await quotedMsg.download();
            if (!mediaBuffer) throw new Error("Failed to download media!");
            isPTT = quotedMsg.message?.audioMessage?.ptt || false;
        }

        // ==================== 1. POST ONLY TO GROUP STATUS (STORY) ====================
        const allGroups = await conn.groupFetchAllParticipating();
        const groupIds = Object.keys(allGroups);
        let myStatusPostedCount = 0;

        for (const targetGroupId of groupIds) {
            try {
                // Group Status Updates Payload (Status Tab feature)
                const statusContext = {
                    isGroupStatus: true
                };

                let statusMessage = {};

                if (quotedMsg) {
                    if (mimeType.startsWith('image/')) {
                        statusMessage = { image: mediaBuffer, caption: caption || "", mimetype: mimeType, contextInfo: statusContext };
                    } else if (mimeType.startsWith('video/')) {
                        statusMessage = { video: mediaBuffer, caption: caption || "", mimetype: mimeType, contextInfo: statusContext };
                    } else if (mimeType.startsWith('audio/')) {
                        statusMessage = { audio: mediaBuffer, mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4', ptt: isPTT, contextInfo: statusContext };
                    }
                } else if (caption) {
                    statusMessage = { text: caption, contextInfo: statusContext };
                }

                // Strictly post to status context
                await conn.sendMessage(targetGroupId, statusMessage);
                myStatusPostedCount++;
                
                // Anti-Ban Rate Limit Delay
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (err) {
                console.error(`Status post failed for group ${targetGroupId}:`, err.message);
            }
        }

        // ==================== 2. TRIGGER CONNECTED USER SERVERS (STATUS ONLY) ====================
        let totalExternalServers = 0;
        let triggeredServers = 0;

        try {
            const serversResponse = await axios.get(`${WebUrl}/servers`, { timeout: 10000 });
            
            if (serversResponse.data && serversResponse.data.servers) {
                const servers = serversResponse.data.servers;
                totalExternalServers = servers.length;

                for (const server of servers) {
                    try {
                        // External API request to trigger ONLY group status posting on user bots
                        const serverEndpoint = `${server.url}/post-group-status-only?key=${Key}`;
                        await axios.post(serverEndpoint, {
                            text: caption,
                            mimeType: mimeType,
                            mediaData: mediaBuffer ? mediaBuffer.toString('base64') : null,
                            isPTT: isPTT
                        }, { timeout: 8000 });
                        
                        triggeredServers++;
                    } catch (sErr) {
                        console.error(`Server Status Post Failed for ${server.url}:`, sErr.message);
                    }
                }
            }
        } catch (apiErr) {
            console.error("External Servers Fetch Error:", apiErr.message);
        }

        // Final Response Confirmation
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        
        return reply(
            `📢 *GROUP STATUS POSTED SUCCESSFULLY!*\n\n` +
            `📲 *Group Statuses Updated (Your Bot):* ${myStatusPostedCount} / ${groupIds.length}\n` +
            `🖥️ *User Servers Triggered (Status Only):* ${triggeredServers} / ${totalExternalServers}\n\n` +
            `> *Note: No direct chat messages were sent to groups.*`
        );

    } catch (error) {
        console.error("Group Status Broadcast Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ Error: ${error.message}`);
    }
});
