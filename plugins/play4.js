import axios from 'axios';
import { cmd } from '../command.js'; // اپنے فائل پاتھ (path) کے مطابق ایڈجسٹ کریں

// Fast YTMP3 Scraper Function
export async function ytmp3(ytUrl) {
    try {
        const headers = {
            'accept': 'application/json',
            'content-type': 'application/json',
            'origin': 'https://ssvid.cc',
            'referer': 'https://ssvid.cc/',
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
        };

        const initRes = await axios.post('https://hub.convert1s.com/api/download', {
            url: ytUrl,
            audio: { bitrate: '128k' },
            output: { type: 'audio', format: 'mp3' }
        }, { headers });

        const { statusUrl, title, duration } = initRes.data;

        if (!statusUrl) {
            throw new Error('Failed to fetch statusUrl from server.');
        }

        let isCompleted = false;
        let downloadData = null;

        while (!isCompleted) {
            const statusRes = await axios.get(statusUrl, { headers });
            
            if (statusRes.data.status === 'completed') {
                isCompleted = true;
                downloadData = statusRes.data;
            } else {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        return {
            title: downloadData.title || title,
            duration: downloadData.duration || duration,
            downloadUrl: downloadData.downloadUrl
        };

    } catch (error) {
        throw new Error(error.message);
    }
}

// ==========================================
//          WHATSAPP BOT COMMAND
// ==========================================

cmd({
    pattern: "ytmp3fast",
    alias: ["ytmp3v3", "fastmp3", "ssvid"],
    desc: "Fast YouTube MP3 Downloader",
    category: "download",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q || !q.includes('youtu')) {
            await react("❌");
            return reply("⚠️ *براہ کرم صحیح YouTube لنک فراہم کریں!*\n\n*مثال:* `.ytmp3fast https://youtu.be/NJMEtaDTVtA`");
        }

        await react("⏳");

        const result = await ytmp3(q);

        if (!result || !result.downloadUrl) {
            await react("❌");
            return reply("❌ *آڈیو ڈاؤں لوڈ کرنے میں ناکامی ہوئی۔*");
        }

        await reply(`🎶 *ڈاؤنلوڈ ہو رہا ہے:* ${result.title}\n⏱️ *Duration:* ${result.duration || 'N/A'}`);

        // Send Audio File to User
        await conn.sendMessage(m.chat, {
            audio: { url: result.downloadUrl },
            mimetype: 'audio/mp4',
            fileName: `${result.title}.mp3`
        }, { quoted: mek });

        await react("✅");

    } catch (err) {
        console.error("YTmp3 Fast Error:", err);
        await react("❌");
        await reply(`❌ *Error:* ${err.message}`);
    }
});
