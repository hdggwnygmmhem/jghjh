import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "movie2",
    alias: ["ytmovie2", "downloadmovie2", "moviefast2"],
    desc: "Download YouTube movies in High Quality as Document via AIO API",
    category: "downloader",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a YouTube Movie URL!\n\n` +
                `Example:\n` +
                `• .movie https://www.youtube.com/watch?v=...`
            );
        }

        const movieUrl = text.trim();

        // Validate basic YouTube URL
        if (!movieUrl.includes("youtube.com") && !movieUrl.includes("youtu.be")) {
            return reply("❌ Please provide a valid YouTube URL for the movie!");
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://apis-one-iota.vercel.app/api/download/aio?url=${encodeURIComponent(movieUrl)}`;
        
        const response = await axios.get(apiUrl, { timeout: 60000 });
        const resData = response.data;

        // Debugging ke liye API response ko console par print karwaya hai
        console.log("=== AIO API MOVIE RESPONSE ===", JSON.stringify(resData, null, 2));

        if (!resData || (!resData.status && !resData.data && !resData.result)) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not fetch movie data from the API.");
        }

        const data = resData.result || resData.data || resData;

        const title = data.title || "YouTube_Movie";
        const channel = data.channel || data.author || '';
        const duration = data.duration || '';
        const thumbnail = data.thumbnail || data.image || '';
        
        // Best quality link find karne ki koshish
        let downloadUrl = '';

        if (data.downloads && Array.isArray(data.downloads)) {
            // Agar array of qualities milti hai toh highest quality choose karein
            const highQuality = data.downloads.reverse().find(d => d.url || d.download_url);
            downloadUrl = highQuality ? (highQuality.url || highQuality.download_url) : '';
        }

        // Agar upar na mile toh standard fields check karein
        if (!downloadUrl) {
            downloadUrl = data.download_url || data.downloadUrl || data.url || data.video || '';
        }

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Movie download link nahi mil saka.");
        }

        let caption = `🎬 *Movie Title:* ${title}\n`;
        if (channel) caption += `👤 *Channel:* ${channel}\n`;
        if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
        caption += `✨ *Creator:* DRKAMRAN\n`;

        if (thumbnail && thumbnail.trim() !== "") {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption + `\n📁 *Status:* Downloading full movie file, please wait...` 
            }, { quoted: mek });
        } else {
            await reply(caption + `\n📁 *Status:* Downloading full movie file, please wait...`);
        }

        // Sanitize file name for document
        const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '').trim();
        const fileName = `${safeTitle || 'Movie'}.mp4`;

        // Send the movie file as a Document
        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: fileName,
            caption: `🎬 ${title}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Movie Document Download Fatal Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
