import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play65",
    alias: ["ytplay54", "song6", "plays5"],
    desc: "Search and download songs from YouTube via Kamran API",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a song name or search query!\n\n` +
                `Example:\n` +
                `• .play Song pal`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call your custom API endpoint
        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://www.kamran-api.my.id/api/download/ytplay?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ No response received from API.");
        }

        // Debugging ke liye data print karwayenge
        console.log("API Response:", JSON.stringify(resData));

        // Sabhi possible nested structures ko check karne ke liye
        const resultObj = resData.result || resData.data || resData;
        
        const audioUrl = resultObj.mp3 || resultObj.downloadUrl || resultObj.url || resultObj.audio || resultObj.link;
        const title = resultObj.title || text;
        const thumbnail = resultObj.thumbnail || resultObj.image || '';
        const duration = resultObj.duration || resultObj.timestamp || '';
        const author = resultObj.author || resultObj.channel || '';

        if (!audioUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the MP3 download link from the API response.");
        }

        // Prepare info caption
        let caption = `🎶 *Title:* ${title}\n`;
        if (author) caption += `👤 *Artist/Channel:* ${author}\n`;
        if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
        caption += `✨ *Creator:* ${resData.creator || "DRKAMRAN"}\n`;
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
