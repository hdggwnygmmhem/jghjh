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

        const encodedUrl = encodeURIComponent(text.trim());
        const apiUrl = `https://api-faa.my.id/faa/aio?url=${encodedUrl}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result || !Array.isArray(resData.result) || resData.result.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not retrieve media from the provided URL.");
        }

        const info = resData.result[0];
        const downloadUrl = info.url || info.download_url;
        const title = info.title || "Media Download";
        const thumbnail = info.thumb || '';

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to extract the download link from the API response.");
        }

        // Send direct downloadable link text to avoid server-side 403 streaming blocks
        let msg = `🎬 *Title:* ${title}\n\n`;
        msg += `🔗 *Download Link:* ${downloadUrl}\n\n`;
        msg += `> Powered by KAMRAN-MD`;

        if (thumbnail) {
            await conn.sendMessage(from, { image: { url: thumbnail }, caption: msg }, { quoted: mek });
        } else {
            await reply(msg);
        }

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("KAMRAN-MD AIO Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
