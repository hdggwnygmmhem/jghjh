import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "video3",
    alias: ["ytmp44", "vid4", "mp44"],
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
        const apiUrl = `https://www.kamran-api.my.id/api/download/aio?url=${encodedQuery}`;
        
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
            // Choti quality (jaise 360p formatId 18) select karein taake size kam ho aur Vercel par fail na ho
            const mp4Media = result.medias.find(media => media.formatId === 18 || (media.ext === 'mp4' && media.url));
            downloadUrl = mp4Media ? mp4Media.url : result.medias[0].url;
        }

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Direct video download link not found.");
        }

        let caption = `🎬 *Title:* ${title}\n`;
        if (result.duration) caption += `⏱️ *Duration:* ${result.duration}\n`;
        if (result.author) caption += `👤 *Channel/Author:* ${result.author}\n`;
        caption += `✨ *Creator:* ${resData.creator || "DRKAMRAN"}\n`;
        caption += `📁 *Status:* Downloading and sending video...`;

        await reply(caption);

        // Video ko buffer ki shakal mein download karein
        const videoBufferRes = await axios.get(downloadUrl, { 
            responseType: 'arraybuffer',
            timeout: 60000 
        });

        const videoBuffer = Buffer.from(videoBufferRes.data);

        // Send the video buffer directly
        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            caption: "Here is your video!"
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Video Command Error:", error);
        reply(`❌ Error: ${error.message || "File size too large or network timeout."}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
