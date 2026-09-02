import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "songs",
    alias: ["ytplays", "plays"],
    desc: "Search and download songs from YouTube via FAA API",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a song name or search query!\n\n` +
                `Example:\n` +
                `• .song Song pal`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint
        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://api-faa.my.id/faa/ytplay?query=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // Ensure the API returned valid data (adjust keys based on actual JSON response structure)
        if (!resData || (!resData.url && !resData.data)) {
            return reply("❌ Could not find any results for that song.");
        }

        // Extract result properties (handling common API response structures)
        const songInfo = resData.data || resData;
        const audioUrl = songInfo.url || songInfo.downloadUrl || songInfo.audio;
        const title = songInfo.title || text;
        const thumbnail = songInfo.thumbnail || songInfo.image;

        if (!audioUrl) {
            return reply("❌ Failed to retrieve the audio download link from the API.");
        }

        // Send thumbnail/details if available first, or directly send the audio buffer
        let caption = `🎶 *Title:* ${title}\n📁 *Status:* Downloaded successfully!`;
        
        if (thumbnail) {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await reply(caption);
        }

        // Send the audio file
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: false // Set to true if you want it as a voice note (PTT)
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("YTPlay Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
