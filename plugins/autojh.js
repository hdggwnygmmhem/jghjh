import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import { WebUrl, Key } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "status97",
    alias: ["groupstatus76", "statusgc87", "gcstatus76", "swgc87", "sall98"],
    desc: "Post strictly to WhatsApp Status Story and trigger all connected user servers",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { text, reply, isCreator }) => {
    
    // Sirf Main Owner / Creator ke liye Authorization Check
    if (!isCreator) return reply("❌ This command is only for Main Owner!");

    try {
        const quotedMsg = m.quoted;
        const mimeType = quotedMsg ? (quotedMsg.msg || quotedMsg).mimetype || '' : '';
        const caption = text?.trim() || "";
        
        if (!quotedMsg && !caption) {
            return reply(
                `⚠️ Reply to media/audio or provide text/link!\n\n` +
                `Examples:\n` +
                `• .status Check out this link\n` +
                `• Reply to an image/video/audio with: .status`
            );
        }

        await conn.sendMessage(m.chat, { react: { text: "⏳", key: mek.key } });

        let mediaBuffer = null;
        let isPTT = false;

        if (quotedMsg) {
            mediaBuffer = await quotedMsg.download();
            if (!mediaBuffer) throw new Error("Failed to download media!");
            isPTT = quotedMsg.message?.audioMessage?.ptt || false;
        }

        // ==================== 1. POST STRICTLY TO OFFICIAL WHATSAPP STORY (NO GROUP CHAT) ====================
        let localStatusPosted = false;
        try {
            if (quotedMsg) {
                if (mimeType.startsWith('image/')) {
                    await conn.sendMessage('status@broadcast', { image: mediaBuffer, caption: caption || "" });
                } else if (mimeType.startsWith('video/')) {
                    await conn.sendMessage('status@broadcast', { video: mediaBuffer, caption: caption || "" });
                } else if (mimeType.startsWith('audio/')) {
                    await conn.sendMessage('status@broadcast', { audio: mediaBuffer, ptt: isPTT, mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4' });
                }
            } else if (caption) {
                await conn.sendMessage('status@broadcast', { text: caption });
            }
            localStatusPosted = true;
        } catch (statusErr) {
            console.error("Local WhatsApp Story Upload Error:", statusErr.message);
        }

        // ==================== 2. FIXED FAST MULTI-SERVER TRIGGER (ALL 100 SERVERS) ====================
        let totalExternalServers = 0;
        let triggeredServers = 0;

        try {
            // WebUrl se tamam connected user servers fetch karna
            const serversResponse = await axios.get(`${WebUrl}/servers`, { timeout: 10000 });
            
            if (serversResponse.data && (serversResponse.data.servers || Array.isArray(serversResponse.data))) {
                const servers = serversResponse.data.servers || serversResponse.data;
                totalExternalServers = servers.length;

                // Fire all requests concurrently using Promise.allSettled (Fast & Reliable)
                const promises = servers.map(server => {
                    const targetUrl = server.url || server;
                    const serverEndpoint = `${targetUrl}/post-status?key=${Key}`;
                    
                    return axios.post(serverEndpoint, {
                        text: caption,
                        mimeType: mimeType,
                        mediaData: mediaBuffer ? mediaBuffer.toString('base64') : null,
                        isPTT: isPTT
                    }, { timeout: 5000 })
                    .then(() => { triggeredServers++; })
                    .catch(() => {});
                });

                await Promise.allSettled(promises);
            }
        } catch (apiErr) {
            console.error("Servers Fetch Error:", apiErr.message);
        }

        // Output Confirmation
        await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });
        
        return reply(
            `📢 *WHATSAPP STATUS BROADCAST COMPLETE!*\n\n` +
            `📲 *Official Story Posted:* ${localStatusPosted ? 'SUCCESS 🟢' : 'FAILED 🔴'}\n` +
            `🖥️ *User Servers Triggered:* ${triggeredServers} / ${totalExternalServers}\n\n` +
            `> *Note: Direct group chat messages are disabled. Posted exclusively to status story.*`
        );

    } catch (error) {
        console.error("Status Broadcast Error:", error);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
        reply(`❌ Error: ${error.message}`);
    }
});
