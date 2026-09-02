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
                `• .videoz song pal`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint
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

        // Exact keys from your console logs
        const videoUrl = info.download_url;
        const title = info.searched_title || text;
        const videoPageUrl = info.searched_url || '';

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the video download link from the API response.");
        }

        // Prepare info caption with KAMRAN-MD branding
        let caption = `🎬 *Title:* ${title}\n`;
        if (videoPageUrl) caption += `🔗 *YouTube:* ${videoPageUrl}\n`;
        caption += `🤖 *Bot:* KAMRAN-MD\n`;
        caption += `📁 *Status:* Sending video...`;

        // Send info text first
        await reply(caption);

        // Send the video file using direct download_url
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
