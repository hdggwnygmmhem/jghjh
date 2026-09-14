import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play",
    alias: ["ytplay", "song", "plays", "music", "kamran", "yta"],
    desc: "Search and download songs from YouTube via FAA API (supports auto-body trigger)",
    category: "downloader",
    react: "🎵",
    filename: __filename,
    // Add this if your bot framework supports non-prefix/body matching hooks
    body: ["auto play", "song", "music", "kamran", "ytplay", "yta"] 
}, async (conn, mek, m, { from, text, q, body }) => {
    try {
        // Automatically extract the query whether it's used via prefix (.play) or body keyword (song / kamran)
        let searchQuery = text || q;
        
        if (!searchQuery && body) {
            const triggers = ['auto play', 'song', 'music', 'kamran', 'ytplay', 'yta'];
            const lowerBody = body.toLowerCase().trim();
            
            for (const trig of triggers) {
                if (lowerBody.startsWith(trig)) {
                    searchQuery = body.slice(trig.length).trim();
                    break;
                }
            }
        }

        if (!searchQuery) {
            return reply(
                `⚠️ Please provide a song name or search query!\n\n` +
                `Example:\n` +
                `• .play Song pal\n` +
                `• song pal`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint
        const encodedQuery = encodeURIComponent(searchQuery.trim());
        const apiUrl = `https://api-faa.my.id/faa/ytplay?query=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // Check if API returned success and result object
        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find any results for that song.");
        }

        const info = resData.result;
        const audioUrl = info.mp3;
        const title = info.title || searchQuery;
        const thumbnail = info.thumbnail || '';
        const duration = info.duration_timestamp || '';
        const author = info.author || '';

        if (!audioUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the MP3 download link from the API response.");
        }

        // Prepare info caption
        let caption = `🎶 *Title:* ${title}\n`;
        if (author) caption += `👤 *Artist/Channel:* ${author}\n`;
        if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
        caption += `📁 *Status:* Downloading audio...`;

        // Send thumbnail and details first
        if (thumbnail) {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await reply(caption);
        }

        // Send the audio file using direct mp3 link
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: false
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("YTPlay Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
