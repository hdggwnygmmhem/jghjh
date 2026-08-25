import axios from 'axios';
import { cmd } from '../command.js'; // اپنے Baileys ہینڈلر کا صحیح پاتھ رکھیں

cmd({
    pattern: "play6",
    alias: ["song6", "ytmp3play6"],
    desc: "Search and play YouTube audio",
    category: "download",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) {
            await react("❌");
            return reply("⚠️ *براہ کرم گانے کا نام یا یوٹیوب لنک فراہم کریں!*\n\n*مثال:* `.play Alan Walker Faded`");
        }

        await react("🔍");

        // API Call
        const { data } = await axios.get(`https://api.ikyyxd.my.id/search/ytplayv2?q=${encodeURIComponent(q)}`);
        
        if (!data || !data.status || !data.result) {
            await react("❌");
            return reply("❌ *گانا نہیں مل سکا۔ براہ کرم نام تبدیل کر کے دوبارہ کوشش کریں۔*");
        }

        const res = data.result;
        const minutes = Math.floor((res.duration || 0) / 60);
        const seconds = ((res.duration || 0) % 60).toString().padStart(2, "0");

        const caption = `🎵 *Title:* ${res.title}\n⏱️ *Duration:* ${minutes}:${seconds}\n🔗 *Source:* ${res.source}`;

        // 1. Send Thumbnail with Caption
        await conn.sendMessage(m.chat, {
            image: { url: res.thumbnail },
            caption: caption
        }, { quoted: mek });

        await react("📥");

        // 2. Send Audio File
        await conn.sendMessage(m.chat, {
            audio: { url: res.audio.url },
            mimetype: 'audio/mp4',
            fileName: `${res.title}.mp3`
        }, { quoted: mek });

        await react("✅");

    } catch (err) {
        console.error("Play Command Error:", err);
        await react("❌");
        await reply("❌ *پروسیسنگ کے دوران ایرر آیا، بعد میں دوبارہ کوشش کریں۔*");
    }
});
