import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// 1. Standard Prefix Command
cmd({
    pattern: "play",
    alias: ["ytplay", "song", "plays", "music", "kamran", "yta"],
    desc: "Search and download songs from YouTube via FAA API",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text) {
        return reply(
            `⚠️ Please provide a song name or search query!\n\n` +
            `Example:\n` +
            `• .play pal\n` +
            `• song pal`
        );
    }
    await processDownload(conn, mek, m, from, text, reply);
});

// 2. Auto-Body Listener (Triggers automatically without prefix when text starts with keywords)
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, reply }) => {
    try {
        if (!body) return;
        
        const rawText = body.trim();
        const lowerBody = rawText.toLowerCase();
        const triggers = ['auto play', 'song', 'music', 'kamran', 'ytplay', 'yta'];
        
        let matchedTrigger = null;
        for (const trig of triggers) {
            if (lowerBody === trig || lowerBody.startsWith(trig + ' ')) {
                matchedTrigger = trig;
                break;
            }
        }

        if (!matchedTrigger) return;

        // Extract everything after the trigger word
        let searchQuery = rawText.slice(matchedTrigger.length).trim();

        // Clean up accidental duplicate words (e.g., "song song pal" -> "pal")
        let cleanQuery = searchQuery.toLowerCase().trim();
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

        if (!searchQuery) return;

        await processDownload(conn, mek, m, from, searchQuery, reply);
    } catch (error) {
        console.error("Auto-Body Error:", error);
    }
});

// Core Downloader Engine
async function processDownload(conn, mek, m, from, searchQuery, reply) {
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

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
        console.error("YTPlay Download Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
}
