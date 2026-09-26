import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "youtube",
    alias: ["ytmp35", "yta", "ytaudio"],
    desc: "Download YouTube audio from link",
    category: "downloader",
    react: "🎧",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        const url = text ? text.trim() : "";

        if (!url) {
            return reply(
                `❎ Please provide a YouTube link.\n\n` +
                `*Example:* .youtube https://youtu.be/uRxwAvIvLko`
            );
        }

        const ytRegex = /(youtube\.com|youtu\.be)/;
        if (!ytRegex.test(url)) {
            return reply(`⚠️ Invalid YouTube link. Please provide a valid YouTube URL.`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiEndpoint = "https://apiziaul.vercel.app/api/downloader/ytmp3";
        const { data } = await axios.get(apiEndpoint, {
            params: { url },
            timeout: 60000
        });

        if (!data?.status || !data?.result?.downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Failed to fetch audio. Please check the link and try again.`);
        }

        const { title, downloadUrl } = data.result;

        await conn.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: "audio/mpeg",
            fileName: `${title || "audio"}.mp3`,
            caption: `🎧 *${title || "YouTube Audio"}*\n\n✨ *Powered by DRKAMRAN*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("YOUTUBE AUDIO ERROR:", error.response?.data || error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Download Error*\n\n• API may be down\n• Try again later.\n• Check the link is correct.`);
    }
});
