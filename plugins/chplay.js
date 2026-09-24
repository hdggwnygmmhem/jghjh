import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';

const __filename = fileURLToPath(import.meta.url);

// ==================== ADVANCED VIDEO ID EXTRACTOR ====================
function extractVideoId(url) {
    if (!url) return null;
    let match = null;
    
    const cleanUrl = String(url).trim();

    if (/^[a-zA-Z0-9\-_]{11}$/.test(cleanUrl)) {
        return cleanUrl;
    }
    
    if (cleanUrl.includes('youtu.be/')) {
        match = /youtu\.be\/([a-zA-Z0-9\-_]{11})/.exec(cleanUrl);
    } else if (cleanUrl.includes('youtube.com/shorts/')) {
        match = /shorts\/([a-zA-Z0-9\-_]{11})/.exec(cleanUrl);
    } else if (cleanUrl.includes('youtube.com')) {
        match = /v=([a-zA-Z0-9\-_]{11})/.exec(cleanUrl);
    } else {
        match = /[a-zA-Z0-9\-_]{11}/.exec(cleanUrl);
    }
    
    return match ? match[1] : null;
}

// ==================== YMCDN SCRAPER FUNCTION ====================
async function scrapeYtmp3(youtubeUrl, format = 'mp3') {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
        throw new Error(`Failed to extract Video ID from: ${youtubeUrl}`);
    }
    
    const lowerFormat = format.toLowerCase();
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Origin': 'https://id.ytmp3.mobi',
        'Referer': 'https://id.ytmp3.mobi/'
    };

    const initUrl = `https://a.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`;
    const initRes = await fetch(initUrl, { headers });
    const initJson = await initRes.json();
    
    let convertUrl = initJson.convertURL;
    let convertRequestUrl = `${convertUrl}&v=${videoId}&f=${lowerFormat}&_=${Math.random()}`;
    let convertJson;
    
    while (true) {
        const convertRes = await fetch(convertRequestUrl, { headers });
        convertJson = await convertRes.json();
        if (convertJson.redirect > 0 && convertJson.redirectURL) {
            convertRequestUrl = `${convertJson.redirectURL}&v=${videoId}&f=${lowerFormat}&_=${Math.random()}`;
            continue;
        }
        break;
    }

    const progressUrl = convertJson.progressURL;
    const downloadUrl = convertJson.downloadURL;
    let title = convertJson.title || 'YouTube';

    let progress = 0;
    let pollCount = 0;
    while (progress < 3 && pollCount < 120) {
        await new Promise(resolve => setTimeout(resolve, 500));
        pollCount++;
        const progressRes = await fetch(progressUrl, { headers });
        const progressJson = await progressRes.json();
        progress = progressJson.progress;
        if (progressJson.title) title = progressJson.title;
    }

    return { title, downloadUrl };
}

// ==================== COMMAND: .PLAYCH & .PLAYCH2 ====================
cmd({
    pattern: "playch",
    alias: ["playch2"],
    desc: "Play and send audio to newsletter channel as PTT",
    category: "downloader",
    react: "🎧",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;

    try {
        if (!text) {
            return reply(
`🎧 *PLAYCH GUIDE*

.playch link_youtube|kualitas

Contoh:
.playch https://youtu.be/KVG-2TBldL0|superhigh

*Kualitas:*
• jelek = 64k
• sedang = 128k (default)
• superhigh = 256k`
            );
        }

        const react = async (emo) => {
            try {
                await conn.sendMessage(from, {
                    react: { text: emo, key: mek.key }
                });
                await new Promise(r => setTimeout(r, 800));
            } catch (err) {}
        };

        await react('🕒');

        let [query, quality] = text.split('|');

        if (!query) {
            await react('❌');
            return reply(`❌ Format salah\n\n.playch link|kualitas`);
        }

        let targetUrl = query.trim();
        quality = (quality || 'sedang').toLowerCase();
        
        let channelId = "120363427771724325@newsletter";

        let bitrate =
            quality === 'jelek' ? '64k' :
            quality === 'superhigh' ? '256k' : '128k';

        await react('⬇️');

        const scrapeRes = await scrapeYtmp3(targetUrl, 'mp3');
        if (!scrapeRes || !scrapeRes.downloadUrl) {
            await react('❌');
            return reply('❌ Gagal convert lagu via YMCDN');
        }

        let videoTitle = scrapeRes.title || 'YouTube Audio';

        const audioRes = await axios.get(scrapeRes.downloadUrl, {
            responseType: 'arraybuffer'
        });

        const inFile = path.join(os.tmpdir(), `in_${Date.now()}.mp3`);
        const outFile = path.join(os.tmpdir(), `out_${Date.now()}.ogg`);

        fs.writeFileSync(inFile, audioRes.data);

        await react('🎧');

        await new Promise((resolve, reject) => {
            ffmpeg(inFile)
                .audioCodec('libopus')
                .audioChannels(1)
                .audioFrequency(48000)
                .audioBitrate(bitrate)
                .format('ogg')
                .on('end', resolve)
                .on('error', (err) => {
                    console.error("FFmpeg Error:", err);
                    reject(err);
                })
                .save(outFile);
        });

        const vnBuffer = fs.readFileSync(outFile);

        await react('📤');

        await conn.sendMessage(channelId, {
            audio: vnBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        });

        try {
            if (fs.existsSync(inFile)) fs.unlinkSync(inFile);
            if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
        } catch {}

        await react('✅');

        return reply(
`✅ *PLAYCH SUKSES*

🎵 Judul : ${videoTitle}
⚙️ Kualitas : ${quality} (${bitrate})

📢 Channel ID:
${channelId}`
        );

    } catch (e) {
        console.error("CRITICAL PLAYCH ERROR:", e);
        try {
            await conn.sendMessage(from, {
                react: { text: '❌', key: mek.key }
            });
        } catch {}
        return reply(`❌ Gagal playch: ${e.message || e}`);
    }
});
