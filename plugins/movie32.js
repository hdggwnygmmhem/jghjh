import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "movie2",
    alias: ["ytmovie", "downloadmovie", "moviefast"],
    desc: "Search, select quality and download movies/series with subtitles via MovieBox API",
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

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiBase = "https://mbox-apis.vercel.app";

        // Step 1: Search movie/series
        const searchRes = await axios.get(`${apiBase}/search?q=${encodeURIComponent(query)}`, { timeout: 30000 });
        const searchData = searchRes.data;

        if (!searchData || !searchData.items || searchData.items.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Koi result nahi mila. Doosra naam try karein.");
        }

        const item = searchData.items[0];
        const slug = item.slug;
        const subjectId = item.subject_id;
        const title = item.name || query;
        const poster = item.poster_url || '';

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
            return reply("❌ Is content ka stream link available nahi hai.");
        }

        const sources = streamData.sources;
        let infoText = `🎬 *Title:* ${title}\n`;
        infoText += `✨ *Creator:* DRKAMRAN\n\n📥 *Available Qualities:*\n`;

        sources.forEach((src, idx) => {
            const res = src.resolution || 'HD';
            const sizeMB = src.size ? (src.size / (1024 * 1024)).toFixed(2) : 'Unknown';
            infoText += `\n${idx + 1}. 📺 *${res}* ── 📂 *${sizeMB} MB*`;
        });

        if (poster && poster.trim() !== "") {
            await conn.sendMessage(from, { 
                image: { url: poster }, 
                caption: infoText + `\n\n📁 *Status:* Downloading movie file, please wait...` 
            }, { quoted: mek });
        } else {
            await reply(infoText + `\n\n📁 *Status:* Downloading movie file, please wait...`);
        }

        // Step 3: Get best source and download video buffer
        const bestSource = sources[sources.length - 1] || sources[0];
        const downloadUrl = bestSource.url;
        const resolution = bestSource.resolution || 'HD';
        const fileSizeMB = bestSource.size ? (bestSource.size / (1024 * 1024)).toFixed(2) : 'Unknown';

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Direct download link nahi mil saka.");
        }

        const videoRes = await fetch(downloadUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
                "Referer": "https://netfilm.world/"
            }
        });

        if (!videoRes.ok) {
            throw new Error(`Failed to download stream: ${videoRes.status}`);
        }

        const arrayBuffer = await videoRes.arrayBuffer();
        const videoBuffer = Buffer.from(arrayBuffer);

        const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '').trim();
        const fileName = `${safeTitle}_${resolution}.mp4`;

        // Step 4: Send movie as Document
        await conn.sendMessage(from, {
            document: videoBuffer,
            mimetype: 'video/mp4',
            fileName: fileName,
            caption: `🎬 *${title}* (${resolution})\n📁 Size: ${fileSizeMB} MB`
        }, { quoted: mek });

        // Step 5: Optional - Fetch and send Urdu/English Subtitles if needed
        try {
            const captionApi = `${apiBase}/api/stream/${subjectId}/captions?detail_path=${encodeURIComponent(slug)}&se=1&ep=1`;
            const capRes = await axios.get(captionApi, { timeout: 15000 });
            const capData = capRes.data;

            if (capData && capData.captions && capData.captions.length > 0) {
                // Urdu ya English subtitle find karein
                const sub = capData.captions.find(c => c.lan === 'ur' || c.lan === 'en') || capData.captions[0];
                if (sub && sub.url) {
                    await conn.sendMessage(from, {
                        document: { url: sub.url },
                        mimetype: 'application/x-subrip',
                        fileName: `${safeTitle}_${sub.lan}.srt`,
                        caption: `💬 *Subtitle (${sub.lanName || sub.lan})*`
                    }, { quoted: mek });
                }
            }
        } catch (subErr) {
            console.log("Subtitle fetch skipped.");
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Movie Command Error:", error);
        reply(`❌ Error: ${error.message || "Something went wrong."}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
