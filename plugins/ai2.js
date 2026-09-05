import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "aio2",
    alias: [],
    desc: "Download video from all-in-one downloader API",
    category: "downloader",
    react: "✨",
    filename: __filename,
    limit: true
},
async (conn, mek, m, { from, reply, text, usedPrefix, command }) => {
    try {
        if (!text) {
            return reply(`Example : ${usedPrefix + command} https://vt.tiktok.com/xxxx`);
        }

        // ⏳ React - processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        
        // 1000ms delay to ensure react is visible
        await new Promise(resolve => setTimeout(resolve, 1000));

        let api = `${global.APIs.faa}/faa/aio?url=${encodeURIComponent(text)}`;
        let res = await fetch(api);
        let json = await res.json();

        if (!json.status) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply('Gagal mengambil data.');
        }

        let data = json.result;
        let videoUrl = data.download_url;

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: data.title || 'Video berhasil diunduh'
        }, { quoted: mek });

        // 800ms delay before success react
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // ✅ React - success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in aio2 command:", e);
        // ❌ React - error
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply('⚠️ Gagal mengambil video.');
    }
});
