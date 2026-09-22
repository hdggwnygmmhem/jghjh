import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== DRAMA DOCUMENT COMMAND (SAFE LARGE FILE) ====================
cmd({
    pattern: "drama",
    alias: ["epi", "da", "episode", "dramaepi"],
    desc: "Search and download drama as a document file",
    category: "downloader",
    react: "📁",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;
    
    try {
        if (!text) {
            return reply(
                `📁 *KAMRAN-MD DRAMA DOWNLOADER*\n\n` +
                `❌ *Please provide a drama name or episode!*\n\n` +
                `💡 *Example:* \`.drama mohabbat 57\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const cleanQuery = text.replace(/epi|episode/gi, '').trim();
        const encodedQuery = encodeURIComponent(cleanQuery);
        const apiUrl = `https://api-faa.my.id/faa/ytplayvid?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Oops!* No results found for that query.");
        }

        const info = resData.result;
        const videoUrl = info.download_url;
        const title = info.searched_title || text;
        const videoPageUrl = info.searched_url || '';
        const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '');

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the download link.");
        }

        await reply(`📁 *Downloading Large Drama File:* ${title}\nPlease wait, this may take a few seconds...`);

        // Download large file safely with maxContentLength and stream handling
        const docRes = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.youtube.com/',
                'Range': 'bytes=0-'
            },
            timeout: 120000 // 2 minutes timeout for large files
        });

        // Sending as Document File safely
        await conn.sendMessage(from, {
            document: Buffer.from(docRes.data),
            mimetype: 'video/mp4',
            fileName: `${safeTitle}.mp4`,
            caption: `📁 *${title}*\n🔗 *YouTube:* ${videoPageUrl}\n> Powered by KAMRAN-MD`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Drama Document Error:", error);
        reply(`❌ *Error:* ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
