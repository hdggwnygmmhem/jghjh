import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "movie2",
    alias: ["ytmovie", "downloadmovie", "moviefast"],
    desc: "Search and get movie stream links via MovieBox Pro API",
    category: "downloader",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a movie name!\n\n` +
                `Example:\n` +
                `• .movie2 Attack on Titan`
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
            return reply("❌ Movie nahi mili.");
        }

        const item = searchData.items[0];
        const slug = item.slug;
        const subjectId = item.subject_id;
        const title = item.name || query;
        const poster = item.poster_url || '';

        // Step 2: Fetch stream sources
        const streamApi = `${apiBase}/api/stream/${subjectId}?detail_path=${encodeURIComponent(slug)}&se=1&ep=1`;
        const streamRes = await axios.get(streamApi, { timeout: 30000 });
        const streamData = streamRes.data;

        if (!streamData || !streamData.sources || streamData.sources.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Is movie ka stream link available nahi hai.");
        }

        const sources = streamData.sources;
        let infoText = `🎬 *Title:* ${title}\n`;
        infoText += `✨ *Creator:* DRKAMRAN\n\n📥 *Direct Download Links:*\n`;

        sources.forEach((src, idx) => {
            const res = src.resolution || 'HD';
            const sizeMB = src.size ? (src.size / (1024 * 1024)).toFixed(2) : 'Unknown';
            infoText += `\n${idx + 1}. 📺 *${res}* (${sizeMB} MB)\n🔗 ${src.url}\n`;
        });

        if (poster && poster.trim() !== "") {
            await conn.sendMessage(from, { 
                image: { url: poster }, 
                caption: infoText 
            }, { quoted: mek });
        } else {
            await reply(infoText);
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Movie Command Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
