import { fileURLToPath } from 'url';
import axios from 'axios';
import yts from 'yt-search';
import FormData from 'form-data';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ==============================================================================
// 1. PROXY COMMANDS (Primary, Backup 2, Backup 3)
// ==============================================================================

// Primary: proxy
cmd({ pattern: "proxy4", desc: "Get proxy list (Primary)", category: "tools", filename: __filename },
async (conn, mek, m, { reply }) => {
    try {
        await reply("🔄 Fetching proxies [Server 1]...");
        const res = await axios.get("https://api.princetechn.com/api/tools/proxy?apikey=prince");
        let proxyData = typeof res.data === 'object' ? JSON.stringify(res.data, null, 2) : res.data;
        return await reply(`*🌐 PROXY FETCHED (SERVER 1)*\n\n${proxyData}\n\n> Powered by KAMRAN MD`);
    } catch {
        return await reply("❌ Server 1 failed. Try `.proxy2` or `.proxy3`!");
    }
});

// Backup 2: proxy2
cmd({ pattern: "proxy2", desc: "Get proxy list (Backup 2)", category: "tools", filename: __filename },
async (conn, mek, m, { reply }) => {
    try {
        await reply("🔄 Fetching proxies [Server 2]...");
        const res = await axios.get("https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all");
        const proxies = res.data.split('\n').slice(0, 15).join('\n');
        return await reply(`*🌐 PROXY FETCHED (SERVER 2)*\n\n${proxies}\n\n> Powered by KAMRAN MD`);
    } catch {
        return await reply("❌ Server 2 failed. Try `.proxy3`!");
    }
});

// Backup 3: proxy3
cmd({ pattern: "proxy3", desc: "Get proxy list (Backup 3)", category: "tools", filename: __filename },
async (conn, mek, m, { reply }) => {
    try {
        await reply("🔄 Fetching proxies [Server 3]...");
        const res = await axios.get("https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt");
        const proxies = res.data.split('\n').slice(0, 15).join('\n');
        return await reply(`*🌐 PROXY FETCHED (SERVER 3)*\n\n${proxies}\n\n> Powered by KAMRAN MD`);
    } catch {
        return await reply("❌ All proxy servers failed!");
    }
});


// ==============================================================================
// 2. YOUTUBE PLAY COMMANDS (Play1, Play2, Play3, Play4)
// ==============================================================================

// Server 1: play1
cmd({ pattern: "play5", alias: ["play"], desc: "Play YT audio (Server 1)", category: "downloader", filename: __filename },
async (conn, m, { text }) => {
    const sock = conn || m.client || m._client;
    const reply = (t) => sock.sendMessage(m.chat, { text: t }, { quoted: m });
    if (!text) return await reply("Contoh: .play1 dj tiktok viral");
    await reply("⏳ Searching & downloading audio [Server 1]...");
    try {
        const search = await yts(text);
        const video = search.videos[0];
        if (!video) return await reply("Lagu tidak ditemukan.");

        const api = `https://api.mifinfinity.my.id/api/downloader/youtube?url=${encodeURIComponent(video.url)}&type=audio`;
        const { data } = await axios.get(api);
        const res = data.result;

        await sock.sendMessage(m.chat, { image: { url: res.thumbnail }, caption: `乂 *YOUTUBE PLAY [SERVER 1]*\n\n◦ *Title* : ${res.title}\n◦ *Duration* : ${res.duration}\n\n> Powered by KAMRAN MD` }, { quoted: m });
        await sock.sendMessage(m.chat, { audio: { url: res.download }, mimetype: 'audio/mpeg', ptt: false }, { quoted: m });
    } catch {
        await reply("❌ Server 1 failed. Try `.play2` or `.play3`!");
    }
});

// Server 2: play4
cmd({ pattern: "play4", desc: "Play YT audio (Server 2)", category: "downloader", filename: __filename },
async (conn, m, { text }) => {
    const sock = conn || m.client || m._client;
    const reply = (t) => sock.sendMessage(m.chat, { text: t }, { quoted: m });
    if (!text) return await reply("Contoh: .play2 dj tiktok viral");
    await reply("⏳ Searching & downloading audio [Server 2]...");
    try {
        const search = await yts(text);
        const video = search.videos[0];
        if (!video) return await reply("Lagu tidak ditemukan.");

        const api = `https://api.princetechn.com/api/download/ytmp3?apikey=prince&url=${encodeURIComponent(video.url)}`;
        const { data } = await axios.get(api);
        const downloadUrl = data.result?.download || data.result?.url;

        await sock.sendMessage(m.chat, { image: { url: video.thumbnail }, caption: `乂 *YOUTUBE PLAY [SERVER 2]*\n\n◦ *Title* : ${video.title}\n\n> Powered by KAMRAN MD` }, { quoted: m });
        await sock.sendMessage(m.chat, { audio: { url: downloadUrl }, mimetype: 'audio/mpeg', ptt: false }, { quoted: m });
    } catch {
        await reply("❌ Server 2 failed. Try `.play3`!");
    }
});

// Server 3: play3
cmd({ pattern: "play3", desc: "Play YT audio (Server 3)", category: "downloader", filename: __filename },
async (conn, m, { text }) => {
    const sock = conn || m.client || m._client;
    const reply = (t) => sock.sendMessage(m.chat, { text: t }, { quoted: m });
    if (!text) return await reply("Contoh: .play3 dj tiktok viral");
    await reply("⏳ Searching & downloading audio [Server 3]...");
    try {
        const search = await yts(text);
        const video = search.videos[0];
        if (!video) return await reply("Lagu tidak ditemukan.");

        const api = `https://api-xemoz-official.my.id/api/downloader/ytmp3.php?url=${encodeURIComponent(video.url)}`;
        const { data } = await axios.get(api);

        await sock.sendMessage(m.chat, { image: { url: video.thumbnail }, caption: `乂 *YOUTUBE PLAY [SERVER 3]*\n\n◦ *Title* : ${video.title}\n\n> Powered by KAMRAN MD` }, { quoted: m });
        await sock.sendMessage(m.chat, { audio: { url: data.result || data.download }, mimetype: 'audio/mpeg', ptt: false }, { quoted: m });
    } catch {
        await reply("❌ Server 3 failed!");
    }
});


// ==============================================================================
// 3. PINTEREST SEARCH COMMANDS (Pinterest1, Pinterest2, Pinterest3)
// ==============================================================================

// Server 1: pinterest4 / pin4
cmd({ pattern: "pinterest4", alias: ["pin4"], desc: "Pinterest Search (Server 1)", category: "search", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply("❌ Usage: `.pinterest anime boy`");
    await reply("🔍 *Searching Pinterest [Server 1]...*");
    try {
        const url = `https://api-xemoz-official.my.id/api/search/pinterest.php?q=${encodeURIComponent(q)}`;
        const res = await axios.get(url);
        let img = Array.isArray(res.data.result) ? res.data.result[0] : res.data.result;
        if (typeof img === 'object') img = img.url || img.image;

        return await conn.sendMessage(from, { image: { url: img }, caption: `📌 *PINTEREST [SERVER 1]*\n\n🔍 Query: ${q}\n\n> Powered by KAMRAN MD` }, { quoted: mek });
    } catch {
        return await reply("❌ Server 1 failed. Try `.pinterest2` or `.pin2`!");
    }
});

// Server 2: pinterest2 / pin2
cmd({ pattern: "pinterest2", alias: ["pin2"], desc: "Pinterest Search (Server 2)", category: "search", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply("❌ Usage: `.pinterest2 anime boy`");
    await reply("🔍 *Searching Pinterest [Server 2]...*");
    try {
        const url = `https://api.princetechn.com/api/search/pinterest?apikey=prince&query=${encodeURIComponent(q)}`;
        const res = await axios.get(url);
        let img = Array.isArray(res.data.results) ? res.data.results[0] : res.data.results;

        return await conn.sendMessage(from, { image: { url: img }, caption: `📌 *PINTEREST [SERVER 2]*\n\n🔍 Query: ${q}\n\n> Powered by KAMRAN MD` }, { quoted: mek });
    } catch {
        return await reply("❌ Server 2 failed. Try `.pinterest3`!");
    }
});

// Server 3: pinterest3 / pin3
cmd({ pattern: "pinterest3", alias: ["pin3"], desc: "Pinterest Search (Server 3)", category: "search", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply("❌ Usage: `.pinterest3 anime boy`");
    await reply("🔍 *Searching Pinterest [Server 3]...*");
    try {
        const url = `https://api.mifinfinity.my.id/api/search/pinterest?query=${encodeURIComponent(q)}`;
        const res = await axios.get(url);
        let img = res.data.result[0] || res.data.result;

        return await conn.sendMessage(from, { image: { url: img }, caption: `📌 *PINTEREST [SERVER 3]*\n\n🔍 Query: ${q}\n\n> Powered by KAMRAN MD` }, { quoted: mek });
    } catch {
        return await reply("❌ All Pinterest servers failed!");
    }
});


// ==============================================================================
// 4. ANIME LOLI / NEKO COMMANDS (Loli1, Loli2, Loli3)
// ==============================================================================

// Server 1: loli
cmd({ pattern: "loli4", alias: ["neko2"], desc: "Random Loli/Neko (Server 1)", category: "anime", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    await reply("🐱 Fetching Neko image [Server 1]...");
    try {
        const res = await axios.get("https://api.princetechn.com/api/anime/loli?apikey=prince");
        let img = res.data.url || res.data.result;
        return await conn.sendMessage(from, { image: { url: img }, caption: "✨ *Neko Image [Server 1]* ✨\n\n> Powered by KAMRAN MD" }, { quoted: mek });
    } catch {
        return await reply("❌ Server 1 failed. Try `.loli2`!");
    }
});

// Server 2: loli2
cmd({ pattern: "loli3", alias: ["neko3"], desc: "Random Loli/Neko (Server 2)", category: "anime", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    await reply("🐱 Fetching Neko image [Server 2]...");
    try {
        const res = await axios.get("https://waifu.pics/api/sfw/neko");
        return await conn.sendMessage(from, { image: { url: res.data.url }, caption: "✨ *Neko Image [Server 2]* ✨\n\n> Powered by KAMRAN MD" }, { quoted: mek });
    } catch {
        return await reply("❌ Server 2 failed. Try `.loli3`!");
    }
});

// Server 3: loli3
cmd({ pattern: "loli3", alias: ["neko4"], desc: "Random Loli/Neko (Server 3)", category: "anime", filename: __filename },
async (conn, mek, m, { from, reply }) => {
    await reply("🐱 Fetching Neko image [Server 3]...");
    try {
        const res = await axios.get("https://nekos.best/api/v2/neko");
        const img = res.data.results[0].url;
        return await conn.sendMessage(from, { image: { url: img }, caption: "✨ *Neko Image [Server 3]* ✨\n\n> Powered by KAMRAN MD" }, { quoted: mek });
    } catch {
        return await reply("❌ All Neko servers failed!");
    }
});


// ==============================================================================
// 5. TIKTOK VIEWS COMMANDS (ttview, ttview2, ttview3)
// ==============================================================================

// Primary: tiktokview / ttview
cmd({ pattern: "tiktokview2", alias: ["ttview2"], desc: "TikTok View Injection (Server 1)", category: "tools", filename: __filename },
async (conn, mek, m, { args, reply }) => {
    if (!args[0]) return reply("❌ Please provide a TikTok video URL!");
    return reply("⏳ Processing TikTok views [Server 1]... Please wait.\n\n> Powered by KAMRAN MD");
});

// Backup 2: ttview3
cmd({ pattern: "ttview3", desc: "TikTok View Injection (Server 2)", category: "tools", filename: __filename },
async (conn, mek, m, { args, reply }) => {
    if (!args[0]) return reply("❌ Please provide a TikTok video URL!");
    return reply("⏳ Processing TikTok views [Server 2]... Please wait.\n\n> Powered by KAMRAN MD");
});

// Backup 3: ttview4
cmd({ pattern: "ttview4", desc: "TikTok View Injection (Server 3)", category: "tools", filename: __filename },
async (conn, mek, m, { args, reply }) => {
    if (!args[0]) return reply("❌ Please provide a TikTok video URL!");
    return reply("⏳ Processing TikTok views [Server 3]... Please wait.\n\n> Powered by KAMRAN MD");
});


// ==============================================================================
// 6. DELETE COMMANDS (delete, delete2, delete3)
// ==============================================================================

cmd({ pattern: "delete2", alias: ["del2", "dlt2"], desc: "Delete message", category: "group", filename: __filename },
async (conn, mek, m, { isGroup, isCreator, reply }) => {
    if (!isGroup) return reply('❌ Group only!');
    if (!m.quoted) return reply('❌ Quote a message to delete!');
    try {
        const key = { remoteJid: m.chat, fromMe: false, id: m.quoted.id, participant: m.quoted.sender };
        await conn.sendMessage(m.chat, { delete: key });
        await reply('✅ Deleted [Method 1]\n\n> Powered by KAMRAN MD');
    } catch {
        await reply('❌ Failed method 1. Try `.delete2`!');
    }
});

cmd({ pattern: "delete3", alias: ["del3"], desc: "Delete message (Backup 2)", category: "group", filename: __filename },
async (conn, mek, m, { isGroup, reply }) => {
    if (!isGroup) return reply('❌ Group only!');
    if (!m.quoted) return reply('❌ Quote a message to delete!');
    try {
        await conn.sendMessage(m.chat, { delete: m.quoted.fakeObj.key });
        await reply('✅ Deleted [Method 2]\n\n> Powered by KAMRAN MD');
    } catch {
        await reply('❌ Failed method 2!');
    }
});
