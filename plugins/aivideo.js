import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const API_BASE = 'https://api-aio.omnifylabs.sbs';

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Origin': 'https://aio.omnifylabs.sbs',
  'Referer': 'https://aio.omnifylabs.sbs/',
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();
  if (clean.startsWith('http://') && !clean.includes('localhost') && !clean.includes('127.0.0.1')) {
    clean = clean.replace(/^http:\/\//i, 'https://');
  }
  return clean;
}

function sanitizeData(data) {
  if (!data) return data;
  if (typeof data === 'string') {
    return normalizeUrl(data);
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  if (typeof data === 'object') {
    const result = {};
    for (const key of Object.keys(data)) {
      result[key] = sanitizeData(data[key]);
    }
    return result;
  }
  return data;
}

async function resolveMedia(mediaUrl, options = {}) {
  const targetUrl = typeof mediaUrl === 'string' ? mediaUrl.trim() : '';
  if (!targetUrl) throw new Error('URL media tidak boleh kosong.');

  const payload = { url: targetUrl };

  if (options.password && typeof options.password === 'string') {
    payload.password = options.password.trim();
  }

  const response = await fetch(`${API_BASE}/api/v1/media/resolve`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload)
  });

  const json = await response.json().catch(() => null);

  if (!response.ok || json?.status === 'error') {
    const msg = json?.message || `HTTP error dari Omnify AIO! Status: ${response.status}`;
    throw new Error(msg);
  }

  const rawData = json?.data || {};
  const cleanedData = sanitizeData(rawData);

  return {
    status: true,
    platform: json?.platform || cleanedData?.platform || 'unknown',
    data: cleanedData
  };
}

cmd({
    pattern: "aio",
    alias: ["omnify", "dl"],
    desc: "Omnify AIO media downloader",
    category: "downloader",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;

    if (!text) {
        return reply(`Masukkan URL media yang ingin di-download!\n\nContoh: *.aio https://www.tiktok.com/...*`);
    }

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        await reply('⏳ _Sedang mengunduh media, tunggu sebentar..._');

        let options = {};
        let targetUrl = text.trim();
        
        const splitText = text.trim().split(' ');
        if (splitText.length > 1) {
            targetUrl = splitText[0];
            options.password = splitText[1];
        }

        const res = await resolveMedia(targetUrl, options);
        
        if (!res.status || !res.data) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply('❌ Gagal mengambil data media.');
        }

        const { data, platform } = res;
        
        let caption = `*O M N I F Y - ${platform.toUpperCase()}*\n\n`;
        if (data.author?.nickname) caption += `◦ *Author:* ${data.author.nickname} (@${data.author.uniqueId || ''})\n`;
        if (data.description) caption += `◦ *Desc:* ${data.description.substring(0, 50)}...\n`;
        
        if (data.stats) {
            caption += `◦ *Likes:* ${data.stats.likeCount || 0} | *Plays:* ${data.stats.playCount || 0}\n`;
        }

        if (data.type === 'video' || data.videoUrl || (data.formats && data.formats.some(f => f.type === 'video'))) {
            let targetVideo = data.hdVideoUrl || data.videoUrl;
            if (!targetVideo && data.formats) {
                let formatVideo = data.formats.find(f => f.type === 'video' && !f.hasWatermark) || data.formats.find(f => f.type === 'video');
                if (formatVideo) targetVideo = formatVideo.url;
            }

            if (targetVideo) {
                await conn.sendMessage(from, { video: { url: targetVideo }, caption: caption }, { quoted: mek });
            } else {
                await reply("❌ URL Video tidak ditemukan.");
            }
        } else if (data.type === 'image' || (data.images && data.images.length > 0)) {
            if (data.images && data.images.length > 0) {
                for (let i = 0; i < data.images.length; i++) {
                    await conn.sendMessage(from, { image: { url: data.images[i] }, caption: i === 0 ? caption : '' }, { quoted: mek });
                }
            } else if (data.url) {
                await conn.sendMessage(from, { image: { url: data.url }, caption: caption }, { quoted: mek });
            } else {
                await reply("❌ URL Gambar tidak ditemukan.");
            }
        } else if (data.type === 'audio' || data.audioUrl || (data.formats && data.formats.some(f => f.type === 'audio'))) {
            let targetAudio = data.audioUrl;
            if (!targetAudio && data.formats) {
                let formatAudio = data.formats.find(f => f.type === 'audio');
                if (formatAudio) targetAudio = formatAudio.url;
            }

            if (targetAudio) {
                if (data.cover) {
                    await conn.sendMessage(from, { image: { url: data.cover }, caption: caption }, { quoted: mek });
                } else {
                    await reply(caption); 
                }
                await conn.sendMessage(from, { audio: { url: targetAudio }, mimetype: 'audio/mpeg' }, { quoted: mek });
            } else {
                await reply("❌ URL Audio tidak ditemukan.");
            }
        } else {
            await reply(`❌ Tipe media (${data.type}) belum di-support.`);
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("Omnify Error:", err);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        await reply(`❌ *Terjadi Kesalahan:*\n${err.message}`);
    }
});
