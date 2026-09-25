import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "movie2",
    alias: ["ytmovie", "downloadmovie", "moviefast"],
    desc: "Search and download movies via MovieBox Pro API",
    category: "downloader",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Maaloo maqaa filmii galchaa!\n\n` +
                `Fkn:\n` +
                `• .movie2 Attack on Titan`
            );
        }

        const query = text.trim();
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiBase = "https://mbox-apis.vercel.app";

        const searchRes = await axios.get(`${apiBase}/search?q=${encodeURIComponent(query)}`, { timeout: 30000 });
        const searchData = searchRes.data;

        if (!searchData || !searchData.items || searchData.items.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Filmiin hin argamne.");
        }

        const item = searchData.items[0];
        const slug = item.slug;
        const subjectId = item.subject_id;
        const title = item.name || query;
        const poster = item.poster_url || '';

        const streamApi = `${apiBase}/api/stream/${subjectId}?detail_path=${encodeURIComponent(slug)}&se=1&ep=1`;
        const streamRes = await axios.get(streamApi, { timeout: 30000 });
        const streamData = streamRes.data;

        if (!streamData || !streamData.sources || streamData.sources.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Linkiin filmii kanaa hin jiru.");
        }

        const sources = streamData.sources;
        const bestSource = sources[sources.length - 1] || sources[0];
        const downloadUrl = bestSource.url;
        const resolution = bestSource.resolution || 'HD';
        const fileSizeMB = bestSource.size ? (bestSource.size / (1024 * 1024)).toFixed(2) : 'Unknown';

        let infoText = `🎬 *Title:* ${title}\n`;
        infoText += `✨ *Creator:* DRKAMRAN\n\n📥 *Quality:* ${resolution} (${fileSizeMB} MB)\n`;

        if (poster && poster.trim() !== "") {
            await conn.sendMessage(from, { 
                image: { url: poster }, 
                caption: infoText + `\n📁 *Status:* Filmiin ergaa jira...` 
            }, { quoted: mek });
        } else {
            await reply(infoText + `\n📁 *Status:* Filmiin ergaa jira...`);
        }

        const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '').trim();
        const fileName = `${safeTitle}_${resolution}.mp4`;

        // Kallattiidhaan linkii fayyadamuun dogoggora 426 hambisa
        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: fileName,
            caption: `🎬 *${title}* (${resolution})\n📁 Size: ${fileSizeMB} MB`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Movie Command Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
