import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== PLAY COMMAND ====================
cmd({
    pattern: "play43",
    alias: ["ytplay55", "song76"],
    desc: "Search and download YouTube audio using Kamran API",
    category: "download",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("Bhai, kisi song ka naam ya query toh likhein! Example: `.play arijit singh`");
        }

        await reply("⏳ Searching for your song, please wait...");

        const apiUrl = `https://www.kamran-api.my.id/api/download/ytplay?q=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.status) {
            return reply("❌ Maafi chahta hoon, song fetch karne mein koi masla aa gaya hai.");
        }

        // API response ke mutabiq fields (jaise title, downloadUrl, waghera)
        const songInfo = data.result || data;
        const audioUrl = songInfo.downloadUrl || songInfo.url || songInfo.audio;
        const title = songInfo.title || q;

        if (!audioUrl) {
            return reply("❌ Song ka download link nahi mil saka.");
        }

        let caption = `🎵 *KAMRAN-MD YT PLAY* 🎵\n\n`;
        caption += `📌 *Title:* ${title}\n`;
        caption += `✨ *Creator:* ${data.creator || "DRKAMRAN"}\n\n`;
        caption += `_Sending audio, please wait..._`;

        // Pehle text/info send karein ya direct audio bhejiye
        await conn.sendMessage(from, { text: caption }, { quoted: mek });

        // Audio file send karne ke liye
        await conn.sendMessage(from, { 
            audio: { url: audioUrl }, 
            mimetype: 'audio/mp4', 
            ptt: false 
        }, { quoted: mek });

    } catch (error: any) {
        console.error("Play Command Error:", error.message);
        reply(`❌ Error: ${error.message || "Kuch galat ho gaya hai."}`);
    }
});
