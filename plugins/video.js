import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "videod",
    alias: ["ytmp4", "ytvideo", "playvid", "videoz"],
    desc: "Search and download videos from YouTube via FAA API",
    category: "downloader",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a video name or search query!\n\n` +
                `Example:\n` +
                `• .video song pal`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint
        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://api-faa.my.id/faa/ytplayvid?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // Debugging ke liye console mein response print karein
        console.log("API Response Data:", JSON.stringify(resData, null, 2));

        // Check if API returned valid data
        if (!resData) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Empty response received from the API.");
        }

        const info = resData.result || resData;

        // Sabhi possible video link keys ko check karna
        const videoUrl = info.download || info.dl_link || info.mp4 || info.url || info.link || info.video;
        const title = info.title || text;
        const thumbnail = info.thumbnail || info.image || '';
        const duration = info.duration || info.timestamp || '';
        const author = info.author || info.channel || '';

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the video download link from the API response. Check console logs for details.");
        }

        // Prepare info caption with KAMRAN-MD branding
        let caption = `🎬 *Title:* ${title}\n`;
        if (author) caption += `👤 *Channel:* ${author}\n`;
        if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
        caption += `🤖 *Bot:* KAMRAN-MD\n`;
        caption += `📁 *Status:* Downloading video...`;

        // Send thumbnail and details first (if available)
        if (thumbnail) {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await reply(caption);
        }

        // Send the video file using direct video link
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption: `🎥 ${title}\n> Powered by KAMRAN-MD`
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("KAMRAN-MD Video Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
