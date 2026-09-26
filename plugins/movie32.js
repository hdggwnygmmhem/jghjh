import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "movie2",
    alias: ["ytmovie", "downloadmovie", "moviefast"],
    desc: "Search and download movies/series via MovieBox Scraper API",
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
                `• .movie New`
            );
        }

        const query = text.trim();
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiBase = "https://moviebox-api-ivory.vercel.app";

        // Step 1: Search movie/series
        const searchRes = await axios.get(`${apiBase}/search?q=${encodeURIComponent(query)}&page=1&perPage=20`, { timeout: 30000 });
        const resData = searchRes.data;

        // Extract subjects safely from nested results structure
        let items = [];
        if (resData && resData.data && Array.isArray(resData.data.results)) {
            resData.data.results.forEach(section => {
                if (section.subjects && Array.isArray(section.subjects)) {
                    items.push(...section.subjects);
                }
            });
        } else if (Array.isArray(resData)) {
            items = resData;
        } else if (resData.items) {
            items = resData.items;
        }

        if (items.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Koi result nahi mila. Doosra naam try karein.");
        }

        const item = items[0];
        const subjectId = item.subjectId || item.subject_id || item.id;
        const title = item.title || item.name || query;
        const poster = item.cover?.url || item.poster_url || '';

        if (!subjectId) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Subject ID nahi mil saki.");
        }

        let infoText = `🎬 *Title:* ${title}\n`;
        infoText += `✨ *Creator:* DRKAMRAN\n\n📥 *Download Links (Direct Redirect):*\n`;

        // Using the clean /dl/ endpoint
        const resolutions = [360, 480, 720, 1080];
        resolutions.forEach((res, idx) => {
            const dlLink = `${apiBase}/dl/${subjectId}/1/1?resolution=${res}`;
            infoText += `\n${idx + 1}. 📺 *${res}p* ── [Click to Download](${dlLink})`;
        });

        // Step 2: Send Poster & Links
        if (poster && typeof poster === 'string' && poster.trim() !== "") {
            await conn.sendMessage(from, { 
                image: { url: poster }, 
                caption: infoText + `\n\n💡 *Tip:* Kisi bhi quality par click karke direct download kar sakte hain.` 
            }, { quoted: mek });
        } else {
            await reply(infoText);
        }

        // Step 3: Optional - Send direct video file using 480p redirect link
        const bestDlUrl = `${apiBase}/dl/${subjectId}/1/1?resolution=480`;
        try {
            await conn.sendMessage(from, {
                video: { url: bestDlUrl },
                caption: `🎬 *${title}* (480p)\n✨ Powered by DRKAMRAN`,
                mimetype: 'video/mp4'
            }, { quoted: mek });
        } catch (vidErr) {
            console.log("Direct video push skipped, links are provided above.");
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Movie Command Error:", error);
        reply(`❌ Error: ${error.message || "Something went wrong."}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
