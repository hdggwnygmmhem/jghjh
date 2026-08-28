import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { WebUrl, Key } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);

const ALLOWED_USERS = [
    '63334141399102@lid',
    '129712961679592@lid',
    '274457654493407@lid',
    '281123343040696@lid',
    '923195068309@s.whatsapp.net',
    '923196891871@s.whatsapp.net',
    '923298605468@s.whatsapp.net',
    '923110741871@s.whatsapp.net',
    '923219300532@s.whatsapp.net'
];

cmd({
    pattern: "status900",
    alias: ["mstatus900", "statusgc900", "statusgc900", "sall900"],
    react: "👑",
    desc: "Non-Blocking Crash-Proof Group Story Broadcast",
    category: "owner",
    use: ".status <reply to video/image>",
    filename: __filename
}, async (conn, mek, m, { q, sender, reply, react }) => {
    let tempFilePath = null;
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
            // Memory Freeing Buffer Download
            mediaBuffer = await targetMsg.download().catch(() => null);
            
            if (!mediaBuffer) {
                await react('❌');
                return reply("❌ *Media download nahi ho saka! Code short video ke liye optimized hai.*");
            }

            // Size Check (Max 15MB)
            if (mediaBuffer.length > 15 * 1024 * 1024) {
                await react('❌');
                return reply("⚠️ *Video file 15MB se badi hai! Short video try karein.*");
            }

            isPTT = targetMsg.msg?.ptt || false;

            // Save to temp file to avoid Event Loop Freeze
            const ext = mime.split('/')[1] || 'tmp';
            tempFilePath = path.join('./', `temp_status_${Date.now()}.${ext}`);
            await fs.promises.writeFile(tempFilePath, mediaBuffer);
        }

        // 1. Non-Blocking Local Status Upload (Bina group IDs ke, taake group mein message na jaye)
        let localSuccess = false;
        try {
            if (mime && tempFilePath) {
                const fileStream = fs.readFileSync(tempFilePath);
                if (mime.startsWith('image/')) {
                    await conn.sendMessage('status@broadcast', { image: fileStream, caption: statusContent || "" });
                } else if (mime.startsWith('video/')) {
                    await conn.sendMessage('status@broadcast', { video: fileStream, caption: statusContent || "" });
                } else if (mime.startsWith('audio/')) {
                    await conn.sendMessage('status@broadcast', { audio: fileStream, ptt: isPTT, mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4' });
                }
            } else if (statusContent) {
                await conn.sendMessage('status@broadcast', { text: statusContent });
            }
            localSuccess = true;
        } catch (e) {
            console.error("Local Story Error:", e.message);
        }

        // 2. Non-Blocking External Server Trigger
        let totalServers = 0;
        let triggeredServers = 0;

        // Async Background Triggering so Main Bot never gets stuck
        axios.get(`${WebUrl}/servers`, { timeout: 8000 }).then(async (serversResponse) => {
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
                    }, { timeout: 8000 })
                    .then(() => { triggeredServers++; })
                    .catch(() => {});
                });

                await Promise.allSettled(requests);
            }
        }).catch(() => {});

        // Cleanup Temp File
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        await react('✅');

        return reply(
            `📢 *STATUS BROADCAST EXECUTED!*\n\n` +
            `🟢 *Master Status:* ${localSuccess ? 'Posted' : 'Failed'}\n` +
            `🖥️ *Trigger Signal Sent To All Active Servers*\n\n` +
            `> *© Powered By KAMRAN MD*`
        );

    } catch (error) {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        console.error("Status Master Command Error:", error);
        await react('❌');
        await reply(`❌ *Error:* ${error.message}`);
    }
});
