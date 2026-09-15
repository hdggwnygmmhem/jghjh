import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import { cmd } from '../command.js';
import { lidToPhone } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);

const AXIOS_DEFAULTS = { 
    timeout: 60000, 
    headers: { 'User-Agent': 'Mozilla/5.0' } 
};

// Base URL (Fully obfuscated using Char Codes)
const BASE_URL = String.fromCharCode(104, 116, 116, 112, 58, 47, 47, 107, 97, 109, 114, 97, 110, 109, 100, 46, 122, 111, 110, 10, 101, 46, 105, 100);

async function getDownloadLink(url) {
    try {
        const api = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const res = await axios.get(api, AXIOS_DEFAULTS);

        if (!res.data || !res.data.status || !res.data.result)
            return null;

        return res.data.result.mp4;
    } catch (err) {
        console.error("API Error:", err.message);
        return null;
    }
}

// ============================================
// CORE DRAMA LOGIC
// ============================================
async function executeDrama(sock, message, m, q, reply) {
    try {
        if (!q) return reply("⚠️ Please provide a Drama Name or Video Title!");

        if (q.includes("youtube.com/") || q.includes("youtu.be/")) 
            return reply("❌ Links are not allowed. Please type the name only!");

        const search = await yts(q);
        const video = search.videos.find(v => v.seconds >= 900);
        if (!video) return reply("❌ No suitable drama found (≥15 min)!");

        const customName = "> *⚡ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ ᴍᴅ⚡*";
        const videoTitle = video.title;

        const captionBox = `╭━〔 *YT DOWNLOADER* 〕━┈⊷
┃ 🎬 *TITLE:* ${videoTitle}
┃ ⏱️ *DURATION:* ${video.timestamp}
┃ 👁️ *VIEWS:* ${video.views.toLocaleString()}
┃ 📺 *CHANNEL:* ${video.author.name}
╰━━━━━━━━━━━━━━━━┈⊷

*ᴘʟᴇᴀsᴇ ʀᴇᴘʟʏ ᴡɪᴛʜ ᴀ ɴᴜᴍʙᴇʀ*
(1) 📂 *ᴅᴏᴄᴜᴍᴇɴᴛ*
(2) 🎥 *ᴠɪᴅᴇᴏ*

${customName}`;

        const sentMsg = await sock.sendMessage(message.chat, {
            image: { url: video.thumbnail },
            caption: captionBox
        }, { quoted: message });

        const listener = async (chatUpdate) => {
            const msg = chatUpdate.messages[0];
            if (!msg.message?.extendedTextMessage) return;

            const selectedText = msg.message.extendedTextMessage.text.trim();
            const context = msg.message.extendedTextMessage.contextInfo;
            const isReplyToBot = context && context.stanzaId === sentMsg.key.id;
            if (!isReplyToBot) return;

            if (!["1","2"].includes(selectedText)) return;

            await sock.sendMessage(message.chat, { 
                react: { text: "⏳", key: msg.key } 
            });

            const dlUrl = await getDownloadLink(video.url);
            if (!dlUrl) {
                await sock.sendMessage(message.chat, { 
                    react: { text: "❌", key: msg.key } 
                });
                return reply("❌ Error: Link could not be generated!");
            }

            const response = await axios.get(dlUrl, { responseType: "arraybuffer" });
            const buffer = Buffer.from(response.data);

            if (selectedText === "1") {
                await sock.sendMessage(message.chat, {
                    document: buffer,
                    mimetype: "video/mp4",
                    fileName: `${videoTitle}.mp4`,
                    caption: `*${videoTitle}*\n\n${customName}`
                }, { quoted: msg });
            } else if (selectedText === "2") {
                await sock.sendMessage(message.chat, {
                    video: buffer,
                    mimetype: "video/mp4",
                    caption: `*${videoTitle}*\n\n${customName}`
                }, { quoted: msg });
            }

            await sock.sendMessage(message.chat, { 
                react: { text: "✅", key: msg.key } 
            });

            sock.ev.off("messages.upsert", listener);
        };

        sock.ev.on("messages.upsert", listener);
        setTimeout(() => sock.ev.off("messages.upsert", listener), 120000);

    } catch (e) {
        console.error(e);
        reply("❌ System error occurred.");
    }
}

// ============================================
// AUTO DRAMA LISTENER (BODY HOOK)
// ============================================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;
        const rawText = body.trim().toLowerCase();
        const triggers = ['drama', 'epi'];

        // Trigger if text starts with drama/epi triggers (e.g. "drama meray aansu")
        const matchedTrigger = triggers.find(t => rawText === t || rawText.startsWith(t + ' '));
        if (matchedTrigger) {
            const q = body.slice(matchedTrigger.length).trim();
            await executeDrama(conn, mek, m, q, (text) => conn.sendMessage(from, { text }, { quoted: mek }));
        }
    } catch (error) {
        console.error("Auto-Body Drama Error:", error);
    }
});

// ============================================
// DRAMA COMMAND (Prefix Version)
// ============================================
cmd({
    pattern: "drama",
    alias: ["epi"],
    desc: "Download YouTube dramas only (≥15 min) by name",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (sock, message, m, extra) => {
    const { q, reply } = extra;
    await executeDrama(sock, message, m, q, reply);
});

// ============================================
// CORE PAIR LOGIC
// ============================================
async function executePair(conn, mek, m, args, sender, senderNumber, reply, react) {
    try {
        await react('⏳');
        
        let phoneNumber;
        
        if (args && args[0]) {
            phoneNumber = args[0].trim().replace(/[^0-9]/g, '');
        } else {
            if (sender && sender.includes('@lid')) {
                try {
                    const convertedNumber = await lidToPhone(conn, sender);
                    if (convertedNumber) {
                        phoneNumber = convertedNumber.replace(/[^0-9]/g, '');
                    } else {
                        phoneNumber = senderNumber;
                    }
                } catch (e) {
                    phoneNumber = senderNumber;
                }
            } else {
                phoneNumber = senderNumber;
            }
        }

        if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
            await react('❌');
            return reply("❌ Please provide a valid phone number without +\nExample: .pair 923427582XXX");
        }

        const serversResponse = await axios.get(`${BASE_URL}/servers`, { timeout: 10000 });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return reply("❌ *Failed to fetch server list!*");
        }
        
        const servers = serversResponse.data.servers;
        
        if (servers.length === 0) {
            await react('❌');
            return reply("❌ *No servers available!*");
        }
        
        const randomIndex = Math.floor(Math.random() * servers.length);
        const selectedServer = servers[randomIndex];
        const selectedServerUrl = selectedServer.url;
        
        const response = await axios.get(`${selectedServerUrl}/code`, {
            params: { number: phoneNumber },
            timeout: 20000
        });

        if (!response.data || !response.data.code) {
            await react('❌');
            return reply("❌ Failed to retrieve pairing code. Please try again later.");
        }

        const pairingCode = response.data.code;
        
        await react('✅');
        
        await reply(`> *KAMRAN-MD PAIRING CODE*

*Your pairing code is:* ${pairingCode}`);

        await reply(pairingCode);

    } catch (error) {
        console.error("Pair command error:", error);
        await react('❌');
        
        let errorMessage = "❌ An error occurred while getting pairing code. Please try again later.";
        
        if (error.response) {
            errorMessage = `❌ Server error: ${error.response.status}`;
        } else if (error.request) {
            errorMessage = "❌ No response from server. Server might be offline.";
        }
        
        await reply(errorMessage);
    }
}

// ============================================
// AUTO PAIR LISTENER (BODY HOOK)
// ============================================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, sender, senderNumber }) => {
    try {
        if (!body) return;
        const rawText = body.trim().toLowerCase();
        const triggers = ['pair', 'getpair', 'clonebot'];

        const matchedTrigger = triggers.find(t => rawText === t || rawText.startsWith(t + ' '));
        if (matchedTrigger) {
            const argsText = body.slice(matchedTrigger.length).trim();
            const args = argsText ? argsText.split(' ') : [];
            await executePair(
                conn, 
                mek, 
                m, 
                args, 
                sender || mek.sender, 
                senderNumber || (mek.sender ? mek.sender.split('@')[0] : ''), 
                (text) => conn.sendMessage(from, { text }, { quoted: mek }), 
                async (emoji) => await conn.sendMessage(from, { react: { text: emoji, key: mek.key } })
            );
        }
    } catch (error) {
        console.error("Auto-Body Pair Error:", error);
    }
});

// ============================================
// PAIR COMMAND (Prefix Version)
// ============================================
cmd({
    pattern: "pair",
    alias: ["getpair", "clonebot"],
    react: "✅",
    desc: "Get pairing code for bot",
    category: "owner",
    use: ".pair 92319689XXX",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { args, sender, senderNumber, reply, react } = extra;
    await executePair(conn, mek, m, args, sender, senderNumber, reply, react);
});
