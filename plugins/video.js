import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "videod",
    alias: ["ytmp4", "ytvideo", "playvid", "videoz"],
    desc: "Search and download videos from YouTube via DR",
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

        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find any video results for that query.");
        }

        const info = resData.result;
        const videoUrl = info.download_url;
        const title = info.searched_title || text;
        const videoPageUrl = info.searched_url || '';

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the video download link from the API response.");
        }

        // Send caption info first
        let caption = `🎬 *Title:* ${title}\n`;
        if (videoPageUrl) caption += `🔗 *YouTube:* ${videoPageUrl}\n`;
        caption += `🤖 *Bot:* KAMRAN-MD\n`;
        caption += `📁 *Status:* Downloading video buffer...`;
        await reply(caption);

        // Download video as arraybuffer with proper headers to bypass streaming block
        const videoBufferRes = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.youtube.com/'
            },
            timeout: 60000 // 60 seconds for large files
        });

        // Send the video buffer directly
        await conn.sendMessage(from, {
            video: Buffer.from(videoBufferRes.data),
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
