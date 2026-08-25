import fetch from 'node-fetch';
import { cmd } from '../command.js'; // اپنے فائل پاتھ کے مطابق سیٹ کریں

cmd({
    pattern: "play7",
    alias: ["playaudio7", "ytplay7"],
    desc: "Search and play YouTube audio",
    category: "download",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) {
            await react("❌");
            return reply("⚠️ *براہ کرم کوئی گانا یا سرچ کیوری لکھیں!*\n\n*مثال:* `.play Song saraiki`");
        }

        await react("⏳");

        const apiUrl = `https://api.ikyyxd.my.id/search/ytplay?q=${encodeURIComponent(q)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        // API Response Checking
        const result = data.result || data.data || data;
        const audioUrl = result.download || result.mp3 || result.url;
        const title = result.title || q;
        const thumbnail = result.thumbnail || result.thumb;

        if (!audioUrl) {
            await react("❌");
            return reply("❌ *گانا تلاش کرنے یا لنکس حاصل کرنے میں ناکامی ہوئی۔*");
        }

        // Info Message send کرنا
        if (thumbnail) {
            await conn.sendMessage(m.chat, { 
                image: { url: thumbnail }, 
                caption: `🎵 *Title:* ${title}\n\n*Downloading your audio...*` 
            }, { quoted: mek });
        } else {
            await reply(`🎵 *Downloading:* ${title}`);
        }

        // Audio File Send کرنا
        await conn.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            fileName: `${title}.mp3`
        }, { quoted: mek });

        await react("✅");

    } catch (err) {
        console.error("Play Error:", err);
        await react("❌");
        await reply("❌ *سرور سے رابطہ قائم کرنے میں ایرر آیا۔*");
    }
});
