import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== DELINE API VIDEO DOWNLOADER ====================
cmd({
    pattern: "video",
    alias: ["ytmp4", "ytvideo", "playvid", "videoz"],
    desc: "Search and download video from YouTube via Deline API",
    category: "downloader",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;
    
    try {
        if (!text) {
            return reply(
                `🎬 *KAMRAN-MD VIDEO DOWNLOADER*\n\n` +
                `❌ *Please provide a YouTube URL or search query!*\n\n` +
                `💡 *Example:* \`.video https://youtu.be/L29MaxP9PfM\`\n` +
                `*(Aap song ka naam bhi likh sakte hain)*`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let ytUrl = text.trim();
        
        // Agar user ne direct link nahi diya, toh search query se URL fetch karenge
        if (!ytUrl.includes("youtu.be") && !ytUrl.includes("youtube.com")) {
            const searchApi = `https://api-faa.my.id/faa/ytplayvid?q=${encodeURIComponent(ytUrl)}`;
            const searchRes = await axios.get(searchApi, { timeout: 30000 });
            
            if (searchRes.data && searchRes.data.status && searchRes.data.result) {
                ytUrl = searchRes.data.result.searched_url;
            }
        }

        if (!ytUrl || (!ytUrl.includes("youtu.be") && !ytUrl.includes("youtube.com"))) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Invalid YouTube URL or video not found.");
        }

        await reply(`📥 *Fetching download link via Deline API...*\nPlease wait.`);

        // Call Deline API endpoint
        const delineApiUrl = `https://api.deline.web.id/downloader/youtube?url=${encodeURIComponent(ytUrl)}`;
        const apiResponse = await axios.get(delineApiUrl, { timeout: 30000 });
        const resData = apiResponse.data;

        // Extracting download link and metadata based on Deline API structure
        const resultData = resData.result || resData;
        const downloadUrl = resultData.download?.url || resultData.dl_link || resultData.download_url || resultData.url;
        const title = resultData.title || "YouTube Video";
        const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '');

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve download link from Deline API.");
        }

        await reply(`📥 *Downloading:* ${title}\nPlease wait...`);

        // Download file buffer safely with large size support
        const fileRes = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.youtube.com/'
            },
            timeout: 120000
        });

        // Send as Video or Document (Aap chaho toh video object use kar sakte hain)
        await conn.sendMessage(from, {
            video: Buffer.from(fileRes.data),
            mimetype: 'video/mp4',
            caption: `🎥 *${title}*\n🔗 *YouTube:* ${ytUrl}\n> Powered by KAMRAN-MD`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Deline Video Error:", error);
        reply(`❌ *Error:* ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
