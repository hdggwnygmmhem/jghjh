// plugins/aio2.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "aio2",
    alias: ["tiktokdl", "allvd"],
    desc: "Download videos from TikTok and other supported links via FAA API",
    category: "downloader",
    react: "✨",
    filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a valid video link!\n\n` +
                `Example:\n` +
                `• ${usedPrefix + command} https://vt.tiktok.com/xxxx`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const api = `https://api-faa.my.id/faa/aio?url=${encodeURIComponent(text.trim())}`;
        const res = await fetch(api);
        const json = await res.json();

        if (!json || !json.status || !json.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Video download karne mein nakamy rahi ya link invalid hai.");
        }

        const data = json.result;
        const videoUrl = data.download_url;

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Video download link retrieve nahi ho saka.");
        }

        // Send video
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: data.title || '🎬 *Video downloaded successfully by KAMRAN-MD*'
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("AIO2 Downloader Error:", e);
        reply(`❌ Error: ${e.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
