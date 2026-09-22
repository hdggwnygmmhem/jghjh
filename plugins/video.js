import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== PRINCE API DRAMA DOCUMENT DOWNLOADER ====================
cmd({
    pattern: "drama",
    alias: ["epi", "da", "episode", "dramaepi"],
    desc: "Search and download drama as a document file via Prince API",
    category: "downloader",
    react: "📁",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;
    
    try {
        if (!text) {
            return reply(
                `📁 *KAMRAN-MD DRAMA DOWNLOADER*\n\n` +
                `❌ *Please provide a YouTube URL or search query!*\n\n` +
                `💡 *Example:* \`.drama https://youtu.be/60ItHLz5WEA\`\n` +
                `*(Aap direct YouTube link bhi de sakte hain)*`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let ytUrl = text.trim();
        
        // Agar user ne search query di hai toh pehle search API se URL nikal sakte hain, 
        // ya agar direct YouTube link diya hai toh seedha use karenge.
        if (!ytUrl.includes("youtu.be") && !ytUrl.includes("youtube.com")) {
            // Fallback to search if query is just a name
            const cleanQuery = ytUrl.replace(/epi|episode/gi, '').trim();
            const searchApi = `https://api-faa.my.id/faa/ytplayvid?q=${encodeURIComponent(cleanQuery)}`;
            const searchRes = await axios.get(searchApi, { timeout: 30000 });
            
            if (searchRes.data && searchRes.data.status && searchRes.data.result) {
                ytUrl = searchRes.data.result.searched_url;
            }
        }

        if (!ytUrl || (!ytUrl.includes("youtu.be") && !ytUrl.includes("youtube.com"))) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Invalid YouTube URL or video not found.");
        }

        await reply(`📁 *Fetching download link via Prince API...*\nPlease wait.`);

        // Call Prince API dlmp4 endpoint
        const princeApiUrl = `https://api.princetechn.com/api/download/dlmp4?apikey=prince&url=${encodeURIComponent(ytUrl)}`;
        const apiResponse = await axios.get(princeApiUrl, { timeout: 30000 });
        const resData = apiResponse.data;

        // Check structure based on Prince API response
        const downloadUrl = resData.downloadUrl || resData.result?.download_url || resData.url || resData.download;
        const title = resData.title || resData.result?.title || "Drama_Episode";
        const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '');

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve download link from Prince API.");
        }

        await reply(`📁 *Downloading File:* ${title}\nPlease wait...`);

        // Download the file buffer safely with large limits
        const fileRes = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.youtube.com/'
            },
            timeout: 120000
        });

        // Send as Document File (.mp4)
        await conn.sendMessage(from, {
            document: Buffer.from(fileRes.data),
            mimetype: 'video/mp4',
            fileName: `${safeTitle}.mp4`,
            caption: `📁 *${title}*\n🔗 *YouTube:* ${ytUrl}\n> Powered by KAMRAN-MD`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Prince API Document Error:", error);
        reply(`❌ *Error:* ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
