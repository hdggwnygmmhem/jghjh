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
                `• .movie2 Attack on Titan\n` +
                `• .movie2 Breaking Bad`
            );
        }

        const query = text.trim();

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiBase = "https://mbox-apis.vercel.app";

        // Step 1: Search movie using the search endpoint
        const searchRes = await axios.get(`${apiBase}/search?q=${encodeURIComponent(query)}`, { timeout: 30000 });
        const searchData = searchRes.data;

        if (!searchData || !searchData.items || searchData.items.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Movie nahi mili. Kuch aur search karke dekhein.");
        }

        let downloadUrl = '';
        let selectedMovie = null;
        let bestSource = null;

        // Step 2: Loop through top results to find one with an active stream link
        const itemsToCheck = searchData.items.slice(0, 3);
        
        for (const movie of itemsToCheck) {
            const subjectId = movie.subject_id;
            const slug = movie.slug;

            if (!subjectId || !slug) continue;

            try {
                const streamApi = `${apiBase}/api/stream/${subjectId}?detail_path=${encodeURIComponent(slug)}&se=1&ep=1`;
                const streamRes = await axios.get(streamApi, { timeout: 15000 });
                const streamData = streamRes.data;

                if (streamData && streamData.sources && streamData.sources.length > 0) {
                    selectedMovie = movie;
                    bestSource = streamData.sources[streamData.sources.length - 1] || streamData.sources[0];
                    downloadUrl = bestSource.url;
                    if (downloadUrl) break;
                }
            } catch (err) {
                console.log(`Stream fetch failed for item: ${slug}`);
            }
        }

        if (!downloadUrl || !selectedMovie) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Is naam se kisi bhi movie ka active stream link nahi mil saka.");
        }

        const title = selectedMovie.name || query;
        const poster = selectedMovie.poster_url || '';
        const resolution = bestSource.resolution || 'HD';
        const fileSize = bestSource.size ? `(~${(bestSource.size / (1024 * 1024)).toFixed(2)} MB)` : '';

        let caption = `🎬 *Movie:* ${title}\n`;
        caption += `📺 *Quality:* ${resolution} ${fileSize}\n`;
        caption += `✨ *Creator:* DRKAMRAN\n`;

        if (poster && poster.trim() !== "") {
            await conn.sendMessage(from, { 
                image: { url: poster }, 
                caption: caption + `\n📁 *Status:* Downloading full movie in HD document format...` 
            }, { quoted: mek });
        } else {
            await reply(caption + `\n📁 *Status:* Downloading full movie in HD document format...`);
        }

        // Sanitize file name
        const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '').trim();
        const fileName = `${safeTitle || 'Movie'}_${resolution}.mp4`;

        // Send full movie as Document
        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: fileName,
            caption: `🎬 ${title} (${resolution})`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("MovieBox Pro Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
