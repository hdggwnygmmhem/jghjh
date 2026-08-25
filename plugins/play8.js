import fetch from 'node-fetch';
import { cmd } from '../command.js'; // اپنے کمانڈ فائل کا صحیح راستہ (Path) دیں

cmd({
    pattern: "ytmp38",
    alias: ["song8", "ytauto8"],
    desc: "Download MP3 audio from YouTube",
    category: "download",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q || !q.includes('youtu')) {
            await react("❌");
            return reply("⚠️ *براہ کرم صحیح YouTube کا لنک فراہم کریں!*\n\n*مثال:* `.ytmp3 https://youtu.be/LeYn28WT4gY`");
        }

        await react("⏳");

        const apiUrl = `https://api.ikyyxd.my.id/download/ytmp3?url=${encodeURIComponent(q)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        // چیک کریں کہ API کا جوابی ڈیٹا ٹھیک ہے یا نہیں
        if (!data || !data.result || !data.result.download) {
            await react("❌");
            return reply("❌ *آڈیو ڈاؤنلوڈ کرنے میں ناکامی ہوئی۔ لنک کی تصدیق کریں یا بعد میں کوشش کریں۔*");
        }

        const audioUrl = data.result.download;
        const title = data.result.title || "YouTube Audio";

        await reply(`🎶 *ڈاؤنلوڈ ہو رہا ہے:* ${title}`);

        // واٹس ایپ پر آڈیو فائل بھیجنا
        await conn.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            fileName: `${title}.mp3`
        }, { quoted: mek });

        await react("✅");

    } catch (err) {
        console.error("YTMP3 Error:", err);
        await react("❌");
        await reply("❌ *سرور سے رابطہ قائم کرتے وقت ایرر آیا۔*");
    }
});
