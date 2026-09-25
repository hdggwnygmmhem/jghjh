import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play3",
    alias: ["ytplay4", "song5", "plays5"],
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

        // Step 1: Call your custom API endpoint for YTPlay Search
        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://www.kamran-api.my.id/api/download/ytplay?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find any results for that song.");
        }

        const title = resData.title || text;
        const channel = resData.channel || '';
        const duration = resData.duration || '';
        const views = resData.views || '';
        const thumbnail = resData.thumbnail || '';
        const ytLink = resData.download_url || resData.url || '';

        if (!ytLink) {
             return reply("❌ YouTube video link nahi mil saka.");
        }

        // Prepare info caption
        let caption = `🎶 *Title:* ${title}\n`;
        if (channel) caption += `👤 *Channel:* ${channel}\n`;
        if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
        if (views) caption += `👁️ *Views:* ${views}\n`;
        caption += `✨ *Creator:* ${resData.creator || "DRKAMRAN"}\n`;

        // Send details / thumbnail first
        if (thumbnail && thumbnail.trim() !== "") {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption + `\n📁 *Status:* Sending audio...` 
            }, { quoted: mek });
        } else {
            await reply(caption + `\n📁 *Status:* Sending audio...`);
        }

        // Step 2: Fetch direct audio link using ytmp3 or savetube API endpoints
        let directAudioUrl = '';

        try {
            // Pehlay YTMP3 endpoint try karte hain
            const ytmp3Api = `https://www.kamran-api.my.id/api/download/ytmp3?url=${encodeURIComponent(ytLink)}`;
            const mp3Res = await axios.get(ytmp3Api, { timeout: 30000 });
            
            if (mp3Res.data && mp3Res.data.status) {
                // Check if API returns nested result
                const mp3Result = mp3Res.data.result || mp3Res.data.data || mp3Res.data;
                directAudioUrl = mp3Result.download_url || mp3Result.downloadUrl || mp3Result.mp3 || mp3Result.url || '';
            }
        } catch (e) {
            console.log("YTMP3 endpoint failed, trying backup...");
        }

        // Agar YTMP3 ne direct audio link nahi diya (ya usne phirse youtube page link return kiya)
        if (!directAudioUrl || directAudioUrl.includes("youtube.com/watch")) {
            try {
                // Backup ke taur par SaveTube endpoint try karte hain
                const saveTubeApi = `https://www.kamran-api.my.id/api/download/savetube?url=${encodeURIComponent(ytLink)}&quality=mp3`;
                const saveRes = await axios.get(saveTubeApi, { timeout: 30000 });
                
                if (saveRes.data && saveRes.data.status) {
                    const saveResult = saveRes.data.result || saveRes.data.data || saveRes.data;
                    directAudioUrl = saveResult.download_url || saveResult.downloadUrl || saveResult.mp3 || saveResult.url || '';
                }
            } catch (e) {
                console.log("SaveTube backup endpoint failed.");
            }
        }

        // Final check agar link abhi bhi nahi mila
        if (!directAudioUrl || directAudioUrl.includes("youtube.com/watch")) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Direct audio download link nahi nikal saka. API format check karein.");
        }

        // Step 3: Send the actual audio file
        await conn.sendMessage(from, {
            audio: { url: directAudioUrl },
            mimetype: 'audio/mpeg', // Changed to standard mp3 mimetype
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
