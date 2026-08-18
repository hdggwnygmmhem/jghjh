import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import { WebUrl, Key } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);

const ALLOWED_USERS = [
    '633341413102@lid',
    '1297129679592@lid',
    '2744576544407@lid',
    '2811233430496@lid',
    '923195068309@s.whatsapp.net',
    '923196891871@s.whatsapp.net',
    '923036338918@s.whatsapp.net',
    '923110741871@s.whatsapp.net',
    '923219300532@s.whatsapp.net'
];

cmd({
    pattern: "mstatus65",
    alias: ["status76", "statusgc76", "sall87"],
    react: "👑",
    desc: "Safe Crash-Proof Group Story Broadcast",
    category: "owner",
    use: ".mstatus <reply to video/image>",
    filename: __filename
}, async (conn, mek, m, { q, sender, reply, react }) => {
    try {
        if (!ALLOWED_USERS.includes(sender)) {
            await react('❌');
            return reply("*❌ | Access Denied! Owner Only.*");
        }

        await react('⏳');

        const targetMsg = m.quoted ? m.quoted : m;
        const mime = (targetMsg.msg || targetMsg).mimetype || '';
        let statusContent = q || targetMsg.text || targetMsg.caption || '';

        if (!mime && !statusContent) {
            await react('❌');
            return reply("❌ *Media ya Text provide karein!*");
        }

        let mediaBuffer = null;
        let isPTT = false;

        if (mime) {
            try {
                // Download Media Efficiently
                mediaBuffer = await targetMsg.download().catch(() => null);
                
                if (!mediaBuffer) {
                    await react('❌');
                    return reply("❌ *Video/Media download nahi ho saki! Short video try karein.*");
                }

                // Check File Size (Max 15MB allowed to prevent crash)
                const fileSizeMB = mediaBuffer.length / (1024 * 1024);
                if (fileSizeMB > 15) {
                    await react('❌');
                    return reply(`⚠️ *Video size zyada hai (${fileSizeMB.toFixed(1)}MB)!* Crash se bachne ke liye 15MB se kam ki video lagayein.`);
                }

                isPTT = targetMsg.msg?.ptt || false;
            } catch (dlErr) {
                console.error("Media Download Crash Error:", dlErr);
                await react('❌');
                return reply("❌ *Video process karne me error aaya!*");
            }
        }

        // Fetch Joined Groups
        const allGroups = await conn.groupFetchAllParticipating().catch(() => ({}));
        const groupIds = Object.keys(allGroups);

        // 1. Post Story on Local Bot Safely
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
            console.error("Local Story Upload Error:", e.message);
        }

        // 2. Trigger External Servers
        let totalServers = 0;
        let triggeredServers = 0;

        try {
            const serversResponse = await axios.get(`${WebUrl}/servers`, { timeout: 8000 }).catch(() => null);
            
            if (serversResponse?.data?.servers) {
                const servers = serversResponse.data.servers;
                totalServers = servers.length;

                const base64Data = mediaBuffer ? mediaBuffer.toString('base64') : null;

                const requests = servers.map(server => {
                    return axios.post(`${server.url}/post-group-story?key=${Key}`, {
                        content: statusContent,
                        mime: mime,
                        mediaData: base64Data,
                        isPTT: isPTT
                    }, { timeout: 10000 })
                    .then(() => { triggeredServers++; })
                    .catch(() => {});
                });

                await Promise.allSettled(requests);
            }
        } catch (apiErr) {
            console.error("External Servers Error:", apiErr.message);
        }

        await react('✅');

        return reply(
            `📢 *STATUS BROADCAST COMPLETED!*\n\n` +
            `🟢 *Master Status:* ${localSuccess ? 'Posted' : 'Failed'}\n` +
            `🖥️ *Servers Updated:* ${triggeredServers} / ${totalServers}\n\n` +
            `> *© Powered By KAMRAN MD*`
        );

    } catch (error) {
        console.error("Status Master Command Error:", error);
        await react('❌');
        await reply(`❌ *Error:* ${error.message}`);
    }
});
