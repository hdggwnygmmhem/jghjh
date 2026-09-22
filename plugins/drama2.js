import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== CORE MULTI-FORMAT LOGIC ====================
async function executeDrama(conn, mek, m, query, from, reply) {
    try {
        if (!query) {
            return reply(
                `🎬 *KAMRAN-MD DRAMA DOWNLOADER*\n\n` +
                `❌ *Please provide a drama name or episode!* \n\n` +
                `💡 *Example:* \`.drama mohabbat 57\``
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint (Clean query for better YouTube search results)
        const cleanQuery = query.replace(/epi|episode/gi, '').trim();
        const encodedQuery = encodeURIComponent(cleanQuery);
        const apiUrl = `https://api-faa.my.id/faa/ytplayvid?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Oops!* No drama or video results found for that query. Try writing a shorter name.");
        }

        const info = resData.result;
        const videoUrl = info.download_url;
        const title = info.searched_title || query;
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
        console.error("KAMRAN-MD Drama Error:", error);
        reply(`❌ *Error:* ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
}

// ==================== AUTO LISTENER (BODY HOOK) ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;
        const rawText = body.trim().toLowerCase();
        const triggers = ['drama', 'epi', 'epidrama', 'episode', 'da'];

        const matchedTrigger = triggers.find(t => rawText === t || rawText.startsWith(t + ' '));
        if (matchedTrigger) {
            const query = body.slice(matchedTrigger.length).trim();
            await executeDrama(conn, mek, m, query, from, (text) => conn.sendMessage(from, { text }, { quoted: mek }));
        }
    } catch (error) {
        console.error("Auto-Body Error:", error);
    }
});

// ==================== COMMAND (Prefix Version) ====================
cmd({
    pattern: "drama",
    alias: ["epi", "da", "episode", "dramaepi"],
    desc: "Search and select drama video, audio or document",
    category: "downloader",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;
    await executeDrama(conn, mek, m, text, from, reply);
});
