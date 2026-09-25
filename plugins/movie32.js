import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "movie2",
    alias: ["ytmovie", "downloadmovie", "moviefast"],
    desc: "Search and download high-quality movies via MovieBox Pro API",
    category: "downloader",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a movie name!\n\n` +
                `Example:\n` +
                `• .movie Attack on Titan\n` +
                `• .movie Breaking Bad`
            );
        }

        const query = text.trim();

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiBase = "https://mbox-apis.vercel.app";

        // Step 1: Search movie
        const searchRes = await axios.get(`${apiBase}/search?q=${encodeURIComponent(query)}`, { timeout: 30000 });
        const searchData = searchRes.data;

        if (!searchData || !searchData.items || searchData.items.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Movie nahi mili. Kuch aur search karke dekhein.");
        }

        const movie = searchData.items[0];
        const subjectId = movie.subject_id;
        const slug = movie.slug;
        const title = movie.name || query;
        const poster = movie.poster_url || '';

        if (!subjectId || !slug) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Movie details fetch karne mein masla hua.");
        }

        // Step 2: Fetch stream sources
        const streamApi = `${apiBase}/api/stream/${subjectId}?detail_path=${encodeURIComponent(slug)}&se=1&ep=1`;
        const streamRes = await axios.get(streamApi, { timeout: 30000 });
        const streamData = streamRes.data;

        if (!streamData || !streamData.sources || streamData.sources.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Is movie ka stream link available nahi hai.");
        }

        const sources = streamData.sources;
        const bestSource = sources[sources.length - 1] || sources[0];
        const downloadUrl = bestSource.url;
        const resolution = bestSource.resolution || 'HD';
        const fileSizeMB = bestSource.size ? (bestSource.size / (1024 * 1024)).toFixed(2) : 'Unknown';

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Direct download link nahi mil saka.");
        }

        let caption = `🎬 *Movie:* ${title}\n`;
        caption += `📺 *Quality:* ${resolution}p (${fileSizeMB} MB)\n`;
        caption += `✨ *Creator:* DRKAMRAN\n`;

        if (poster && poster.trim() !== "") {
            await conn.sendMessage(from, { 
                image: { url: poster }, 
                caption: caption + `\n📁 *Status:* Downloading movie file, please wait...` 
            }, { quoted: mek });
        } else {
            await reply(caption + `\n📁 *Status:* Downloading movie file, please wait...`);
        }

        // Step 3: Download video buffer using native fetch to bypass 426 error
        const videoRes = await fetch(downloadUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
                "Referer": "https://netfilm.world/"
            }
        });

        if (!videoRes.ok) {
            throw new Error(`Failed to fetch video stream: ${videoRes.status} ${videoRes.statusText}`);
        }

        const arrayBuffer = await videoRes.arrayBuffer();
        const videoBuffer = Buffer.from(arrayBuffer);

        const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '').trim();
        const fileName = `${safeTitle || 'Movie'}_${resolution}p.mp4`;

        // Step 4: Send the buffer as Document
        await conn.sendMessage(from, {
            document: videoBuffer,
            mimetype: 'video/mp4',
            fileName: fileName,
            caption: `🎬 *${title}* (${resolution}p)\n📁 Size: ${fileSizeMB} MB`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Movie Download Error:", error);
        reply(`❌ Error: ${error.message || "Failed to download movie file."}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
