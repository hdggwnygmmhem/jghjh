import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "editimg",
    alias: [],
    desc: "Edit image using AI prompt",
    category: "ai",
    react: "🎨",
    filename: __filename,
    limit: true
},
async (conn, mek, m, { from, reply, text, usedPrefix, command }) => {
    try {
        // Ambil quoted atau pesan sendiri
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || q.mediaType || '';

        // Prompt edit
        let prompt = (text || '').trim();
        if (!prompt) prompt = 'Edit karakter ini jadi tersenyum';

        let imageUrl = null;

        // Jika user reply foto
        if (/image/.test(mime)) {
            // ⏳ React - processing
            await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
            await new Promise(resolve => setTimeout(resolve, 1000));

            let media = await q.download();
            if (!media) {
                await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
                return reply('Gagal mengunduh media!');
            }

            let form = new FormData();
            form.append('files[]', media, { filename: 'upload.' + mime.split('/')[1] });

            let upload = await axios.post('https://uguu.se/upload.php', form, {
                headers: form.getHeaders()
            });

            imageUrl = upload?.data?.files?.[0]?.url;
            if (!imageUrl) {
                await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
                return reply('Gagal upload ke Uguu!');
            }
        } else {
            // Cek kalau user kirim URL gambar di text
            let urlMatch = (text || '').match(/https?:\/\/\S+/);
            if (urlMatch) {
                imageUrl = urlMatch[0];
                // Hapus URL dari prompt, sisain kata-kata edit
                prompt = text.replace(imageUrl, '').trim() || prompt;
            }
        }

        if (!imageUrl) {
            return reply(
                `Kirim / reply foto yang mau diedit dengan caption:\n` +
                `${usedPrefix + command} <prompt>\n\n` +
                `Contoh:\n${usedPrefix + command} Edit karakter ini jadi tersenyum`
            );
        }

        // ⏳ React - processing if not already set
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await new Promise(resolve => setTimeout(resolve, 1000));

        await reply('Tunggu sebentar, sedang mengedit foto...');

        // Panggil API Faa edit foto
        let apiUrl = `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;
        let res = await axios.get(apiUrl, {
            responseType: 'arraybuffer' // asumsi balasan berupa gambar
        });

        if (!res.data) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply('Gagal mengedit foto!');
        }

        await conn.sendMessage(from, {
            image: res.data,
            caption: 'Selesai mengedit foto ✨'
        }, { quoted: mek });

        // 800ms delay before success react
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // ✅ React - success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in editimg command:", e);
        // ❌ React - error
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(typeof e === 'string' ? e : 'Terjadi error, coba lagi nanti.');
    }
});
