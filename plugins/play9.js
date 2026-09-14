import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play",
    alias: ["ytplay", "song", "plays", "music", "kamran", "yta"],
    desc: "Search and download songs from YouTube via FAA API",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, q, body }) => {
    try {
        let searchQuery = text || q;
        const rawBody = body || m.body || m.text || '';
        
        if (!searchQuery && rawBody) {
            const triggers = ['auto play', 'song', 'music', 'kamran', 'ytplay', 'yta'];
            let lowerBody = rawBody.toLowerCase().trim();
            
            for (const trig of triggers) {
                if (lowerBody.startsWith(trig)) {
                    searchQuery = rawBody.slice(trig.length).trim();
                    break;
                }
            }
        }

        // Clean up accidental double keywords or leftover triggers (e.g., "song song pal" -> "pal")
        if (searchQuery) {
            let cleanQuery = searchQuery.toLowerCase().trim();
            const triggers = ['auto play', 'song', 'music', 'kamran', 'ytplay', 'yta'];
            
            let changed = true;
            while (changed) {
                changed = false;
                for (const trig of triggers) {
                    if (cleanQuery.startsWith(trig)) {
                        searchQuery = searchQuery.slice(trig.length).trim();
                        cleanQuery = searchQuery.toLowerCase().trim();
                        changed = true;
                    }
                }
            }
        }

        if (!searchQuery) {
            return reply(
                `⚠️ Please provide a song name or search query!\n\n` +
                `Example:\n` +
                `• .play pal\n` +
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

        let caption = `🎶 *Title:* ${title}\n`;
        if (author) caption += `👤 *Artist/Channel:* ${author}\n`;
        if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
        caption += `📁 *Status:* Downloading audio...`;

        if (thumbnail) {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await reply(caption);
        }

        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("YTPlay Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
