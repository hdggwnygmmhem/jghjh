import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "movie2",
    alias: ["ytmovie", "downloadmovie", "moviefast"],
    desc: "Search and select movie quality via MovieBox Pro API",
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

        // Step 2: Fetch stream sources (Single safe request to avoid 429 error)
        const streamApi = `${apiBase}/api/stream/${subjectId}?detail_path=${encodeURIComponent(slug)}&se=1&ep=1`;
        const streamRes = await axios.get(streamApi, { timeout: 30000 });
        const streamData = streamRes.data;

        if (!streamData || !streamData.sources || streamData.sources.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Is movie ka stream link available nahi hai.");
        }

        // Saari available qualities aur unke sizes prepare karein
        let qualityListText = `🎬 *Movie:* ${title}\n✨ *Creator:* DRKAMRAN\n\n📥 *Available Qualities & Sizes:*\n`;
        const sources = streamData.sources;

        sources.forEach((src, index) => {
            const res = src.resolution || 'HD';
            const sizeMB = src.size ? (src.size / (1024 * 1024)).toFixed(2) : 'Unknown';
            qualityListText += `\n${index + 1}. 📺 *${res}p* ── 📂 *${sizeMB} MB*`;
        });

        qualityListText += `\n\n_Sending the best available HD quality file automatically..._`;

        if (poster && poster.trim() !== "") {
            await conn.sendMessage(from, { 
                image: { url: poster }, 
                caption: qualityListText 
            }, { quoted: mek });
        } else {
            await reply(qualityListText);
        }

        // By default sabse acchi quality (ya highest resolution) send karein taaki user ko foran movie mil jaye
        const bestSource = sources[sources.length - 1] || sources[0];
        const downloadUrl = bestSource.url;
        const resolution = bestSource.resolution || 'HD';

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Direct download link nahi mil saka.");
        }

        const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '').trim();
        const fileName = `${safeTitle || 'Movie'}_${resolution}p.mp4`;

        // Send full movie as Document
        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: fileName,
            caption: `🎬 *${title}* (${resolution}p)\n📁 Enjoy your movie!`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("MovieBox Pro Error:", error);
        reply(`❌ Error: ${error.message || "Too many requests or API timeout."}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
