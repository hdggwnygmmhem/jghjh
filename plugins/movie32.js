import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "video5",
    alias: ["ytmp4", "ytv", "ytvideo"],
    desc: "Download YouTube video from link or search query",
    category: "downloader",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = text ? text.trim() : "";

        if (!query) {
            return reply(
                `❎ Please provide a YouTube link or video name.\n\n` +
                `*Example:* \n` +
                `• .video https://youtu.be/uRxwAvIvLko\n` +
                `• .video On My Way`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let targetUrl = query;
        const ytRegex = /(youtube\.com|youtu\.be)/;

        // Agar user ne link nahi diya, balki video ka naam diya hai toh yt-search se link nikalein
        if (!ytRegex.test(query)) {
            const searchResults = await yts(query);
            if (!searchResults || searchResults.videos.length === 0) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply(`❌ Koi video nahi mili. Doosra naam try karein.`);
            }
            targetUrl = searchResults.videos[0].url;
        }

        // YouTube Video download API (Aap apni pasand ki video API yahan laga sakte hain)
        const apiEndpoint = `https://apiziaul.vercel.app/api/downloader/ytmp4?url=${encodeURIComponent(targetUrl)}`;
        const { data } = await axios.get(apiEndpoint, { timeout: 60000 });

        // API response ke structure ke mutabiq check
        const downloadUrl = data?.result?.downloadUrl || data?.downloadUrl || data?.result;
        const title = data?.result?.title || data?.title || "YouTube Video";

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Failed to fetch video. Please check the input and try again.`);
        }

        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: "video/mp4",
            fileName: `${title}.mp4`,
            caption: `🎬 *${title}*\n\n✨ *Powered by KAMRAN-MD*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("YOUTUBE VIDEO ERROR:", error.response?.data || error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Download Error*\n\n• API may be down\n• Try again later.`);
    }
});
