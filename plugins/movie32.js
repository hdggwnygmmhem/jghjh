import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "youtube",
    alias: ["ytmp3", "yta", "ytaudio", "song"],
    desc: "Download YouTube audio from link or search query",
    category: "downloader",
    react: "🎧",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = text ? text.trim() : "";

        if (!query) {
            return reply(
                `❎ Please provide a YouTube link or song name.\n\n` +
                `*Example:* \n` +
                `• .youtube https://youtu.be/uRxwAvIvLko\n` +
                `• .youtube On My Way`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let targetUrl = query;
        const ytRegex = /(youtube\.com|youtu\.be)/;

        // Agar user ne link nahi diya, balki song ka naam diya hai toh yt-search se link nikalein
        if (!ytRegex.test(query)) {
            const searchResults = await yts(query);
            if (!searchResults || searchResults.videos.length === 0) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply(`❌ Koi gana nahi mila. Doosra naam try karein.`);
            }
            targetUrl = searchResults.videos[0].url;
        }

        const apiEndpoint = "https://apiziaul.vercel.app/api/downloader/ytmp3";
        const { data } = await axios.get(apiEndpoint, {
            params: { url: targetUrl },
            timeout: 60000
        });

        if (!data?.status || !data?.result?.downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Failed to fetch audio. Please check the input and try again.`);
        }

        const { title, downloadUrl } = data.result;

        await conn.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: "audio/mpeg",
            fileName: `${title || "audio"}.mp3`,
            caption: `🎧 *${title || "YouTube Audio"}*\n\n✨ *Powered by KAMRAN-MD*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("YOUTUBE AUDIO ERROR:", error.response?.data || error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Download Error*\n\n• API may be down\n• Try again later.`);
    }
});
