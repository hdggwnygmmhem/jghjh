import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== DRAMA VIDEO DOWNLOADER ====================
cmd({
    pattern: "drama",
    alias: ["epi", "da", "episode", "dramaepi"],
    desc: "Search and download drama video from YouTube",
    category: "downloader",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;
    
    try {
        if (!text) {
            return reply(
                `🎬 *KAMRAN-MD DRAMA VIDEO*\n\n` +
                `❌ *Please provide a drama name or episode!*\n\n` +
                `💡 *Example:* \`1.drama mohabbat 57\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const cleanQuery = text.replace(/epi|episode/gi, '').trim();
        const encodedQuery = encodeURIComponent(cleanQuery);
        const apiUrl = `https://api-faa.my.id/faa/ytplayvid?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Oops!* No results found for that query.");
        }

        const info = resData.result;
        const videoUrl = info.download_url;
        const title = info.searched_title || text;
        const videoPageUrl = info.searched_url || '';
        const thumbnail = info.thumbnail || info.image || '';

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the download link.");
        }

        await reply(`📥 *Downloading Video:* ${title}\nPlease wait...`);

        const videoRes = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.youtube.com/'
            },
            timeout: 60000
        });

        await conn.sendMessage(from, {
            video: Buffer.from(videoRes.data),
            mimetype: 'video/mp4',
            caption: `🎥 *${title}*\n🔗 *YouTube:* ${videoPageUrl}\n> Powered by KAMRAN-MD`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Drama Video Error:", error);
        reply(`❌ *Error:* ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});


// ==================== DRAMA AUDIO / VOICE DOWNLOADER ====================
cmd({
    pattern: "dramaaudio",
    alias: ["daudio", "dsong", "dramamp3"],
    desc: "Search and download drama audio/mp3 from YouTube",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;
    
    try {
        if (!text) {
            return reply(
                `🎵 *KAMRAN-MD DRAMA AUDIO*\n\n` +
                `❌ *Please provide a drama name or episode!*\n\n` +
                `💡 *Example:* \`.dramaaudio mohabbat 57\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const cleanQuery = text.replace(/epi|episode/gi, '').trim();
        const encodedQuery = encodeURIComponent(cleanQuery);
        const apiUrl = `https://api-faa.my.id/faa/ytplayvid?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Oops!* No results found for that query.");
        }

        const info = resData.result;
        const videoUrl = info.download_url;
        const title = info.searched_title || text;

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the audio link.");
        }

        await reply(`🎵 *Downloading Audio:* ${title}\nPlease wait...`);

        const audioRes = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.youtube.com/'
            },
            timeout: 60000
        });

        await conn.sendMessage(from, {
            audio: Buffer.from(audioRes.data),
            mimetype: 'audio/mp4',
            ptt: false,
            caption: `🎵 *${title}*\n> Powered by KAMRAN-MD`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Drama Audio Error:", error);
        reply(`❌ *Error:* ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
