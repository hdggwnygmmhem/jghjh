import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== CORE VIDEO LOGIC ====================
async function executeVideo(conn, mek, m, query, from, reply) {
    try {
        if (!query) {
            return reply(
                `╭───────────────◆\n` +
                `│ ⚠️ *PLEASE PROVIDE A QUERY*\n` +
                `╰───────────────◆\n\n` +
                `✨ *Example Usage:*\n` +
                `• \`.video song pal\`\n` +
                `• \`.videoz lo-fi beats\``
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint
        const encodedQuery = encodeURIComponent(query.trim());
        const apiUrl = `https://api-faa.my.id/faa/ytplayvid?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Oops!* Could not find any video results for your query.");
        }

        const info = resData.result;
        const videoUrl = info.download_url;
        const title = info.searched_title || query;
        const videoPageUrl = info.searched_url || '';
        const thumbnail = info.thumbnail || info.image || '';
        const duration = info.duration || info.timestamp || 'Unknown';
        const views = info.views || 'N/A';

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the video download link from the API.");
        }

        // Send Stylish Preview / Info Card First (with Thumbnail if available)
        let caption = `╭───────────────◆\n`;
        caption += `│ 📥 *KAMRAN-MD DOWNLOADER*\n`;
        caption += `├───────────────◆\n`;
        caption += `│ 🎬 *Title:* ${title}\n`;
        caption += `│ ⏱️ *Duration:* ${duration}\n`;
        caption += `│ 👀 *Views:* ${views}\n`;
        if (videoPageUrl) caption += `│ 🔗 *YouTube:* ${videoPageUrl}\n`;
        caption += `├───────────────◆\n`;
        caption += `│ 🔄 *Status:* Downloading video buffer...\n`;
        caption += `╰───────────────◆`;

        if (thumbnail) {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await reply(caption);
        }

        // Download video as arraybuffer with proper headers to bypass streaming block
        const videoBufferRes = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.youtube.com/'
            },
            timeout: 60000 // 60 seconds for large files
        });

        // Send the video buffer directly with stylish styling
        const finalCaption = 
            `╭───────────────◆\n` +
            `│ 🎥 *${title}*\n` +
            `├───────────────◆\n` +
            `│ ⚡ *Powered by:* KAMRAN-MD\n` +
            `╰───────────────◆`;

        await conn.sendMessage(from, {
            video: Buffer.from(videoBufferRes.data),
            mimetype: 'video/mp4',
            caption: finalCaption
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("KAMRAN-MD Video Error:", error);
        reply(`❌ *An Error Occurred:* ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
}

// ==================== AUTO VIDEO LISTENER (BODY HOOK) ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;
        const rawText = body.trim().toLowerCase();
        const triggers = ['video', 'ytmp4', 'ytvideo', 'playvid', 'videoz'];

        const matchedTrigger = triggers.find(t => rawText === t || rawText.startsWith(t + ' '));
        if (matchedTrigger) {
            const query = body.slice(matchedTrigger.length).trim();
            await executeVideo(conn, mek, m, query, from, (text) => conn.sendMessage(from, { text }, { quoted: mek }));
        }
    } catch (error) {
        console.error("Auto-Body Video Error:", error);
    }
});

// ==================== VIDEO COMMAND (Prefix Version) ====================
cmd({
    pattern: "video",
    alias: ["ytmp4", "ytvideo", "playvid", "videoz"],
    desc: "Search and download stylish videos from YouTube via KAMRAN-MD",
    category: "downloader",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;
    await executeVideo(conn, mek, m, text, from, reply);
});
