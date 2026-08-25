import { fileURLToPath } from 'url';
import axios from 'axios';
import googleTTS from 'google-tts-api';
import { cmd, commands } from '../command.js';
// اگر config فائل کی ضرورت ہو تو نیچے والی لائن کو ان کمنٹ کر لیں
// import config from '../config.js';

cmd({
    pattern: "tts",
    desc: "Convert text to audio speech.",
    category: "download",
    react: "💀",
    filename: fileURLToPath(import.meta.url)
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        // Validation check
        if (!q || typeof q !== 'string' || !q.trim()) {
            return reply("❌ Please provide some text to convert into speech!");
        }

        // Generate Google TTS Audio URL (Hindi/Urdu Accent)
        const url = googleTTS.getAudioUrl(q.trim(), {
            lang: 'hi-IN',
            slow: false,
            host: 'https://translate.google.com',
        });

        // Send audio file back to chat
        await conn.sendMessage(from, { 
            audio: { url: url }, 
            mimetype: 'audio/mpeg', 
            ptt: false 
        }, { quoted: mek });

    } catch (error) {
        console.error("TTS Command Error:", error);
        return reply(`❌ *TTS System Fail:* ${error.message}`);
    }
});
