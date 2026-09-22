import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "drama",
    alias: ["epi", "da", "episode", "dramaepi"],
    desc: "Search and select drama video, audio or document",
    category: "downloader",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;
    
    try {
        console.log("=== DRAMA COMMAND TRIGGERED ===");
        console.log("Query text:", text);

        if (!text) {
            return reply(
                `🎬 *KAMRAN-MD DRAMA DOWNLOADER*\n\n` +
                `❌ *Please provide a drama name or episode!*\n\n` +
                `💡 *Example:* \`.drama mohabbat 57\``
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint
        const cleanQuery = text.replace(/epi|episode/gi, '').trim();
        const encodedQuery = encodeURIComponent(cleanQuery);
        const apiUrl = `https://api-faa.my.id/faa/ytplayvid?q=${encodedQuery}`;
        
        console.log("Calling API URL:", apiUrl);
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        console.log("API Response received:", resData);

        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Oops!* No results found for that query.");
        }

        const info = resData.result;
        const videoUrl = info.download_url;
        const title = info.searched_title || text;
        const videoPageUrl = info.searched_url || '';
        const thumbnail = info.thumbnail || info.image || '';

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the download link.");
        }

        // Stylish Selection Menu
        const selectCaption = 
            `╭───────────────────────╮\n` +
            `  📺 *${title}*\n` +
            `╰───────────────────────╯\n\n` +
            `📌 *Apni pasand ka format select karein:*\n\n` +
            `1️⃣ *Video (MP4)*\n` +
            `2️⃣ *Audio / Voice (MP3)*\n` +
            `3️⃣ *Short Document (File)*\n\n` +
            (videoPageUrl ? `🔗 *YouTube:* ${videoPageUrl}\n` : ``) +
            `⚡ *Powered by:* KAMRAN-MD`;

        const messageOptions = {
            text: selectCaption,
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: "📥 Select Video, Audio or Document via KAMRAN-MD",
                    thumbnailUrl: thumbnail,
                    sourceUrl: videoPageUrl || 'https://github.com',
                    mediaType: 2,
                    renderLargerThumbnail: true
                }
            }
        };

        await conn.sendMessage(from, messageOptions, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("KAMRAN-MD Drama Error Log:", error);
        reply(`❌ *Error:* ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
