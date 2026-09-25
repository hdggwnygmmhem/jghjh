import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play54",
    alias: ["ytplay5", "song5", "plays5"],
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

        // Fetch direct audio link using ytmp3 endpoint
        const ytmp3Api = `https://www.kamran-api.my.id/api/download/ytmp3?url=${encodeURIComponent(ytLink)}`;
        const mp3Res = await axios.get(ytmp3Api, { timeout: 30000 }).catch(() => null);
        
        const directAudioUrl = mp3Res?.data?.download_url || mp3Res?.data?.mp3 || ytLink;

        // Send the audio file
        await conn.sendMessage(from, {
            audio: { url: directAudioUrl },
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
