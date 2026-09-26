import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

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

        // Agar user ne link nahi diya, balki naam likha hai toh search API use karenge
        if (!ytRegex.test(query)) {
            try {
                // Aap koi bhi search API ya yts plugin use kar sakte hain, yahan fallback search URL banaya gaya hai
                const searchRes = await axios.get(`https://apiziaul.vercel.app/api/search?q=${encodeURIComponent(query)}`, { timeout: 30000 });
                // Agar search API video URL ya id deti hai toh usko targetUrl bana lein
                if (searchRes.data && searchRes.data.url) {
                    targetUrl = searchRes.data.url;
                } else if (searchRes.data && searchRes.data.result && searchRes.data.result[0]?.url) {
                    targetUrl = searchRes.data.result[0].url;
                } else {
                    // Agar direct search endpoint kaam na kare toh yts module ya fallback method
                    return reply(`❌ Song search nahi ho saka. Barah-e-karam YouTube ka direct link dein.`);
                }
            } catch (searchErr) {
                return reply(`❌ Song search fail ho gaya. Barah-e-karam link use karein.`);
            }
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
            caption: `🎧 *${title || "YouTube Audio"}*\n\n✨ *Powered by DRKAMRAN*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("YOUTUBE AUDIO ERROR:", error.response?.data || error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Download Error*\n\n• API may be down\n• Try again later.`);
    }
});
