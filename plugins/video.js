import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "videoz",
    alias: ["ytmp4", "ytvideo", "playvidz"],
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
                `• .video faded`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the FAA API endpoint with encoded query
        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://api-faa.my.id/faa/ytplayvid?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // Check if API returned valid data
        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find any video results for that query.");
        }

        const info = resData.result;
        const videoUrl = info.dl_link || info.video || info.url || info.mp4; 
        const title = info.title || text;
        const thumbnail = info.thumbnail || '';
        const duration = info.duration || '';
        const author = info.author || '';

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the video download link from the API response.");
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
