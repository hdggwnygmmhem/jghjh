import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "videot",
    alias: ["ytmp4t", "vidt", "mp44"],
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

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://api.nexray.eu.cc/download/aio?url=${encodedQuery}`; // Ya aapka apna kamran-api domain
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not fetch video from AIO API.");
        }

        const result = resData.result;
        const title = result.title || text;

        let downloadUrl = '';
        if (result.medias && Array.isArray(result.medias) && result.medias.length > 0) {
            const mp4Media = result.medias.find(media => media.formatId === 18 || (media.ext === 'mp4' && media.url));
            downloadUrl = mp4Media ? mp4Media.url : result.medias[0].url;
        }

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Direct video download link not found.");
        }

        let caption = `🎬 *Title:* ${title}\n`;
        if (result.duration) caption += `⏱️ *Duration:* ${result.duration}\n`;
        if (result.author) caption += `👤 *Author:* ${result.author}\n`;
        caption += `✨ *Creator:* ${resData.creator || "DRKAMRAN"}\n`;
        caption += `📁 *Status:* Sending video...`;

        // Direct URL ke zariye video file send karne ke liye proper Baileys structure
        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            caption: caption
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Video Command Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
