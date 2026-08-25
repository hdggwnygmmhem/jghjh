import axios from 'axios';
import { cmd } from '../command.js'; // اپنے بوٹ کے کمانڈ ہینڈلر کا صحیح پاتھ رکھیں

cmd({
    pattern: "play4",
    alias: ["ytplay4", "ytmp34", "song4"],
    desc: "Search and play YouTube audio",
    category: "download",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) {
            await react("❌");
            return reply("⚠️ *براہ کرم گانے کا نام یا یوٹیوب لنک فراہم کریں!*\n\n*مثال:* `.play tamu undangan`\n*یا:* `.play https://youtu.be/xxxx`");
        }

        await react("🔍");
        await reply("🔍 *گانا تلاش اور پروسیس کیا جا رہا ہے...*");

        const res = await axios.get("https://api.ikyyxd.my.id/search/ytplay", {
            params: { query: q }
        });

        if (!res.data || !res.data.status || !res.data.result) {
            await react("❌");
            return reply("❌ *گانا نہیں مل سکا۔ براہ کرم نام تبدیل کر کے دوبارہ کوشش کریں۔*");
        }

        const result = res.data.result;
        const title = result.title;
        const channel = result.author;
        const duration = result.duration;
        const views = result.views?.toLocaleString() || "Unknown";
        const image = result.thumbnail;
        const link = result.source;
        const audioUrl = result.download?.url;
        const quality = result.download?.quality || "128kbps";

        if (!audioUrl) {
            await react("❌");
            return reply("❌ *ڈاؤنلوڈ لنک حاصل نہیں ہو سکا۔*");
        }

        const caption = `🎧 *YouTube Player*\n\n📌 *Title:* ${title}\n👤 *Channel:* ${channel}\n⏱ *Duration:* ${duration}\n👁 *Views:* ${views}\n🎵 *Quality:* ${quality}\n\n🔗 *Source:* ${link}`;

        // Send Thumbnail with Details
        await conn.sendMessage(m.chat, {
            image: { url: image },
            caption: caption
        }, { quoted: mek });

        await react("📥");

        // Download Audio Buffer
        const audioBuffer = await axios.get(audioUrl, {
            responseType: "arraybuffer",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

        const buffer = Buffer.from(audioBuffer.data);

        // Check file size (WhatsApp safe limit: ~50MB)
        if (buffer.length > 50 * 1024 * 1024) {
            await react("⚠️");
            return reply("⚠️ *آڈیو فائل کا سائز بہت بڑا ہے، براہ کرم کوئی اور گانا چنیں۔*");
        }

        // Send Audio File to WhatsApp Chat
        await conn.sendMessage(m.chat, {
            audio: buffer,
            mimetype: 'audio/mp4',
            fileName: `${title}.mp3`
        }, { quoted: mek });

        await react("✅");

    } catch (err) {
        console.error("Play Command Error:", err.response?.data || err.message);
        await react("❌");
        await reply("❌ *گانا پروسیس کرنے کے دوران ایرر آیا، بعد میں دوبارہ کوشش کریں۔*");
    }
});
