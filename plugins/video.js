import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== YOUTUBE SEARCH FUNCTION ====================
async function searchYoutube(query) {
  const url = 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false';
  const payload = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20240514.01.00',
        hl: 'en',
        gl: 'US',
      }
    },
    query: query
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20240514.01.00',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const data = response.data;
    const results = [];
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    
    if (contents && Array.isArray(contents)) {
      for (const section of contents) {
        const items = section.itemSectionRenderer?.contents || section.richGridRenderer?.contents;
        if (items && Array.isArray(items)) {
          for (const item of items) {
            const videoRenderer = item.videoRenderer || item.richItemRenderer?.content?.videoRenderer;
            if (videoRenderer && videoRenderer.videoId) {
              const videoId = videoRenderer.videoId;
              results.push({
                title: videoRenderer.title?.runs?.map(r => r.text).join('') || 'No Title',
                url: `https://www.youtube.com/watch?v=${videoId}`
              });
            }
          }
        }
      }
    }
    return results;
  } catch (error) {
    console.error('Search Error:', error.message);
    throw error;
  }
}

// ==================== ORIGINAL YMCDN SCRAPER FUNCTIONS ====================
function extractVideoId(url) {
    if (!url) return null;
    let match = null;
    
    if (url.includes('youtube.com/shorts/') || url.includes('youtu.be/')) {
        match = /\/([a-zA-Z0-9\-_]{11})/.exec(url);
    } else if (url.includes('youtube.com')) {
        match = /v=([a-zA-Z0-9\-_]{11})/.exec(url);
    } else {
        match = /[a-zA-Z0-9\-_]{11}/.exec(url);
    }
    
    return match ? match[1] : null;
}

async function scrapeYtmp3(youtubeUrl, format = 'mp4') {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
        throw new Error('Invalid YouTube URL: Could not extract video ID.');
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
        if (convertJson.error > 0) {
            throw new Error(`Convert API returned error: ${convertJson.error}`);
        }
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
    while (progress < 3 && pollCount < 60) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        pollCount++;
        const progressRes = await fetch(progressUrl, { headers });
        const progressJson = await progressRes.json();
        progress = progressJson.progress;
        if (progressJson.title) title = progressJson.title;
    }

    return { title, downloadUrl };
}

function cleanName(name = 'file') {
    return String(name).replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 150);
}

async function downloadBuffer(url) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://id.ytmp3.mobi/'
        }
    });
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

function checkFFmpeg() {
    return new Promise(resolve => {
        const ffmpeg = spawn('ffmpeg', ['-version']);
        ffmpeg.on('error', () => resolve(false));
        ffmpeg.on('close', code => resolve(code === 0));
    });
}

function compressMP4(inputBuffer) {
    return new Promise((resolve, reject) => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kamran-ytmp4-'));
        const inputPath = path.join(tempDir, 'input.mp4');
        const outputPath = path.join(tempDir, 'output.mp4');

        try {
            fs.writeFileSync(inputPath, inputBuffer);
            const args = [
                '-y', '-i', inputPath,
                '-c:v', 'libx264',
                '-vf', 'scale=w=1280:h=720:force_original_aspect_ratio=decrease:force_divisible_by=2',
                '-preset', 'veryfast', '-crf', '28',
                '-c:a', 'aac', '-b:a', '96k',
                '-pix_fmt', 'yuv420p',
                '-movflags', '+faststart',
                '-map_metadata', '-1',
                outputPath
            ];

            const ffmpeg = spawn('ffmpeg', args);
            ffmpeg.on('error', error => { cleanup(); reject(error); });

            ffmpeg.on('close', code => {
                if (code !== 0) { cleanup(); reject(new Error(`FFmpeg code ${code}`)); return; }
                try {
                    const result = fs.readFileSync(outputPath);
                    cleanup();
                    resolve(result);
                } catch (error) { cleanup(); reject(error); }
            });

            function cleanup() {
                try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
                try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
                try { fs.rmdirSync(tempDir); } catch {}
            }
        } catch (error) { cleanup(); reject(error); }
    });
}

// ==================== COMMAND: .VIDEO (AUTO SEARCH & DOWNLOAD) ====================
cmd({
    pattern: "video",
    alias: ["ytsearch", "yts", "playvid"],
    desc: "Auto search and download YouTube video",
    category: "downloader",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;

    try {
        if (!text) {
            return reply(
                `🎬 *KAMRAN-MD VIDEO DOWNLOADER*\n\n` +
                `❌ *Please provide a video name or YouTube link!*\n\n` +
                `💡 *Example:* \`.video song pal\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let videoUrl = text.trim();

        // Agar user ne query di hai (link nahi hai), toh pehla search result uthayein
        if (!videoUrl.includes("youtube.com") && !videoUrl.includes("youtu.be")) {
            await reply('_✨ Searching video on YouTube..._');
            const searchResults = await searchYoutube(videoUrl);
            
            if (!searchResults || searchResults.length === 0) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply(`❌ No video found for "${videoUrl}".`);
            }
            videoUrl = searchResults[0].url; // Top result ka link utha liya
        }

        await reply('_📥 Downloading video via YMCDN, please wait..._');

        const res = await scrapeYtmp3(videoUrl, 'mp4');
        if (res.status === 'error') throw new Error(res.message);

        const mediaBuffer = await downloadBuffer(res.downloadUrl);
        let finalBuffer = mediaBuffer;
        
        if (await checkFFmpeg()) {
            try { finalBuffer = await compressMP4(mediaBuffer); } catch {}
        }

        await conn.sendMessage(from, {
            video: finalBuffer,
            mimetype: 'video/mp4',
            fileName: `${cleanName(res.title)}.mp4`,
            caption: `🎬 *${res.title}*\n\n> Powered by KAMRAN-MD`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error('[VIDEO ERROR]', e);
        reply(`❌ Error: ${e?.message || e}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});

// ==================== COMMAND: .YTMP3 (AUTO SEARCH & AUDIO) ====================
cmd({
    pattern: "ytmp3",
    alias: ["yta", "audio", "playaudio"],
    desc: "Auto search and download YouTube audio",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;

    try {
        if (!text) {
            return reply(
                `🎵 *KAMRAN-MD AUDIO DOWNLOADER*\n\n` +
                `❌ *Please provide a song name or YouTube link!*\n\n` +
                `💡 *Example:* \`.ytmp3 song pal\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let audioUrl = text.trim();

        if (!audioUrl.includes("youtube.com") && !audioUrl.includes("youtu.be")) {
            await reply('_✨ Searching audio on YouTube..._');
            const searchResults = await searchYoutube(audioUrl);
            
            if (!searchResults || searchResults.length === 0) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply(`❌ No audio found for "${audioUrl}".`);
            }
            audioUrl = searchResults[0].url;
        }

        await reply('_🎵 Downloading audio via YMCDN, please wait..._');

        const res = await scrapeYtmp3(audioUrl, 'mp3');
        if (res.status === 'error') throw new Error(res.message);

        const mediaBuffer = await downloadBuffer(res.downloadUrl);

        await conn.sendMessage(from, {
            audio: mediaBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${cleanName(res.title)}.mp3`,
            caption: `🎵 *${res.title}*\n\n> Powered by KAMRAN-MD`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error('[AUDIO ERROR]', e);
        reply(`❌ Error: ${e?.message || e}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
