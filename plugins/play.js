import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play",
    alias: ["song", "ytplay"],
    desc: "Play and download audio from YouTube by name.",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, args, q, reply }) => {
    try {
        // Checking if query is provided
        if (!q) return reply("❌ Masukkan judul/url setelah .play\n\n*Example:* .play tum hi ho");

        // Temporary loading message
        await reply("⏳ Searching and fetching audio, please wait...");

        // Fetching data from the API
        const apiUrl = `https://api.ikyyxd.my.id/search/ytplayv2?q=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        let data = response.data;

        // Forcefully parse to JSON if it comes as a string
        if (typeof data === 'string') data = JSON.parse(data);

        if (!data || !data.status || !data.result) {
            return reply("❌ Lagu tidak ditemukan");
        }

        const res = data.result;
        const title = res.title || "Unknown Song";
        const thumbnail = res.thumbnail;
        
        // Formatting duration (Seconds to MM:SS)
        const durationSec = res.duration || 0;
        const minutes = Math.floor(durationSec / 60);
        const seconds = (durationSec % 60).toString().padStart(2, "0");
        const durationStr = `${minutes}:${seconds}`;

        // Preparing clean caption text
        let captionText = `🎵 *YOUTUBE PLAY* 🎵\n\n`;
        captionText += `📌 *Title:* ${title}\n`;
        captionText += `⏱️ *Duration:* ${durationStr}\n\n`;
        captionText += `*Powered by DR KAMRAN*`;

        // 1. Send Thumbnail with Caption
        if (thumbnail) {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: captionText 
            }, { quoted: mek });
        } else {
            await reply(captionText);
        }

        // Extracting direct audio link
        const audioUrl = res.audio?.url || res.audio;
        if (!audioUrl) {
            return reply("❌ Audio link not found in API response.");
        }

        // 2. Send Direct Audio File
        return await conn.sendMessage(from, { 
            audio: { url: audioUrl }, 
            mimetype: 'audio/mp4', 
            ptt: false // Sends as a standard playable MP3 audio file
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        return reply("❌ Gagal memproses, coba lagi nanti");
    }
});
