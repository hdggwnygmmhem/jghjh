import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "movie2",
    alias: ["ytmovie", "downloadmovie", "moviefast"],
    desc: "Search and stream/download movies via MovieBox API",
    category: "downloader",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a movie or series name!\n\n` +
                `Example:\n` +
                `• .movie Attack on Titan\n` +
                `• .movie Breaking Bad`
            );
        }

        const query = text.trim();
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiBase = "https://mbox-apis.vercel.app";

        // Step 1: Search movie
        const searchRes = await axios.get(`${apiBase}/search?q=${encodeURIComponent(query)}`, { timeout: 30000 });
        const searchData = searchRes.data;

        if (!searchData || !searchData.items || searchData.items.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Koi movie nahi mili. Doosra naam try karein.");
        }

        const item = searchData.items[0];
        const slug = item.slug;
        const subjectId = item.subject_id;
        const title = item.name || query;
        const poster = item.poster_url || '';

        if (!subjectId || !slug) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Details fetch karne mein masla hua.");
        }

        // Step 2: Fetch stream sources from your FastAPI backend
        const streamApi = `${apiBase}/api/stream/${subjectId}?detail_path=${encodeURIComponent(slug)}&se=1&ep=1`;
        const streamRes = await axios.get(streamApi, { timeout: 30000 });
        const streamData = streamRes.data;

        if (!streamData || !streamData.sources || streamData.sources.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Is content ka stream link available nahi hai.");
        }

        const sources = streamData.sources;
        let infoText = `🎬 *Title:* ${title}\n`;
        infoText += `✨ *Creator:* DRKAMRAN\n\n📥 *Available Qualities & Links:*\n`;

        sources.forEach((src, idx) => {
            const res = src.resolution || 'HD';
            const sizeMB = src.size ? (src.size / (1024 * 1024)).toFixed(2) : 'Unknown';
            infoText += `\n${idx + 1}. 📺 *${res}* (${sizeMB} MB)\n🔗 ${src.url}\n`;
        });

        // Step 3: Send Poster with Info & Direct Playable/Download Links
        if (poster && poster.trim() !== "") {
            await conn.sendMessage(from, { 
                image: { url: poster }, 
                caption: infoText + `\n💡 *Note:* Agar direct download mein error aaye toh links ko browser mein open karein.` 
            }, { quoted: mek });
        } else {
            await reply(infoText);
        }

        // Step 4: Try sending video via WhatsApp native URL streaming (Bypasses local fetch crash)
        const bestSource = sources[sources.length - 1] || sources[0];
        if (bestSource && bestSource.url) {
            try {
                await conn.sendMessage(from, {
                    video: { url: bestSource.url },
                    caption: `🎬 *${title}* (${bestSource.resolution || 'HD'})\n✨ Powered by DRKAMRAN`,
                    mimetype: 'video/mp4'
                }, { quoted: mek });
            } catch (vidErr) {
                console.log("Direct video stream send skipped due to CDN block, links are provided above.");
            }
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Movie Command Error:", error);
        reply(`❌ Error: ${error.message || "Something went wrong."}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
