import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "video",
    alias: ["ytmp4", "vid", "mp4"],
    desc: "Download videos from YouTube and other platforms using Kamran AIO API",
    category: "downloader",
    react: "🎥",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a video name or video URL!\n\n` +
                `Example:\n` +
                `• .video Song pal\n` +
                `• .video https://youtube.com/...`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call AIO endpoint for video download
        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://www.kamran-api.my.id/api/download/aio?url=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not fetch video from AIO API.");
        }

        const result = resData.result || resData.data || resData;
        const title = result.title || text;
        const downloadUrl = result.download_url || result.downloadUrl || result.mp4 || result.url || '';

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Direct video download link not found.");
        }

        // Prepare info caption
        let caption = `🎬 *Title:* ${title}\n`;
        if (result.duration) caption += `⏱️ *Duration:* ${result.duration}\n`;
        if (result.channel || result.author) caption += `👤 *Channel/Author:* ${result.channel || result.author}\n`;
        caption += `✨ *Creator:* ${resData.creator || "DRKAMRAN"}\n`;
        caption += `📁 *Status:* Sending video...`;

        // Send the video file directly
        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            caption: caption
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Video Command Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
