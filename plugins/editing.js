import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

async function uguu(filePath) {
  const form = new FormData();
  form.append('files[]', fs.createReadStream(filePath));
  const { data } = await axios.post('https://uguu.se/upload', form, {
    headers: { ...form.getHeaders() }
  });
  return data.files[0].url;
}

cmd({
    pattern: "editimage",
    alias: ["nanobanana"],
    desc: "Edit image using AI prompt",
    category: "ai",
    react: "✨",
    filename: __filename,
    limit: true
},
async (conn, mek, m, { from, reply, text, usedPrefix, command }) => {
    try {
        let q = m.quoted ? m.quoted : m;

        if (q.mtype !== 'imageMessage') {
            return reply(`*Example :* reply gambar + ${usedPrefix + command} Ubah jadi tersenyum`);
        }

        if (!text) {
            return reply(`*Example :* reply gambar + ${usedPrefix + command} Ubah jadi tersenyum`);
        }

        // ⏳ React - processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await new Promise(resolve => setTimeout(resolve, 1000));

        let media = await q.download();
        let tmp = './tmp_' + Date.now() + '.jpg';
        fs.writeFileSync(tmp, media);

        let urlGambar = await uguu(tmp);
        fs.unlinkSync(tmp);

        let url = `${global.APIs.faa}/faa/nano-banana?url=${encodeURIComponent(urlGambar)}&prompt=${encodeURIComponent(text)}`;
        let res = await fetch(url);

        if (!res.ok) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply('Gagal memproses gambar dari API.');
        }

        let buffer = Buffer.from(await res.arrayBuffer());

        await conn.sendMessage(from, {
            image: buffer,
            caption: ''
        }, { quoted: mek });

        // 800ms delay before success react
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // ✅ React - success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in editimage command:", e);
        // ❌ React - error
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ Error: ${e.message}`);
    }
});
