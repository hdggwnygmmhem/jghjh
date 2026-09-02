import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "aio",
    alias: ["download", "dl", "all"],
    desc: "Download media from various platforms using AIO API",
    category: "downloader",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a media link to download!\n\n` +
                `Example:\n` +
                `• .aio https://youtu.be/...`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the AIO API endpoint
        const encodedUrl = encodeURIComponent(text.trim());
        const apiUrl = `https://api-faa.my.id/faa/aio?url=${encodedUrl}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result || !Array.isArray(resData.result) || resData.result.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not retrieve media from the provided URL.");
        }

        const info = resData.result[0]; // Accessing the first item of the result array
        const downloadUrl = info.url || info.download_url;
        const title = info.title || "Media Download";
        const thumbnail = info.thumb || '';

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to extract the download link from the API response.");
        }

        // Send info caption first
        let caption = `🎬 *Title:* ${title}\n`;
        caption += `🤖 *Bot:* KAMRAN-MD\n`;
        caption += `📁 *Status:* Downloading media buffer...`;

        if (thumbnail) {
            await conn.sendMessage(from, { image: { url: thumbnail }, caption: caption }, { quoted: mek });
        } else {
            await reply(caption);
        }

        // Download media as arraybuffer with proper headers to bypass streaming blocks
        const mediaBufferRes = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.youtube.com/'
            },
            timeout: 60000
        });

        // Send the media file
        await conn.sendMessage(from, {
            video: Buffer.from(mediaBufferRes.data),
            mimetype: 'video/mp4',
            caption: `🎥 ${title}\n> Powered by KAMRAN-MD`
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("KAMRAN-MD AIO Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
