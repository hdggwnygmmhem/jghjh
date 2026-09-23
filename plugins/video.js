import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

const searchSessions = new Map();

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
                channel: videoRenderer.ownerText?.runs?.map(r => r.text).join('') || 'Unknown',
                duration: videoRenderer.lengthText?.simpleText || 'LIVE',
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
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

async function scrapeYtmp3(youtubeUrl, format = 'mp3') {
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

// ==================== COMMAND: .VIDEO (SEARCH & SELECT) ====================
cmd({
    pattern: "video",
    alias: ["ytsearch", "yts", "playvid"],
    desc: "Search YouTube, select and download",
    category: "downloader",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;

    try {
        if (!text) {
            return reply(
                `🎬 *KAMRAN-MD YOUTUBE SEARCH*\n\n` +
                `❌ *Please provide a search query or link!*\n\n` +
                `💡 *Example:* \`.video song pal\``
            );
        }

        if (text.includes("youtube.com") || text.includes("youtu.be")) {
            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
            await reply('_✨ Processing your video link, please wait..._');
            
            const res = await scrapeYtmp3(text.trim(), 'mp4');
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
            return;
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        const results = await searchYoutube(text.trim());

        if (!results || results.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ No results found for "${text}".`);
        }

        const topResults = results.slice(0, 5);
        let messageText = `╭──「 *KAMRAN-MD SEARCH* 」\n`;
        messageText += `│ 🔍 *Query:* ${text}\n`;
        messageText += `╰─────────────────────────\n\n`;

        topResults.forEach((video, index) => {
            messageText += `*${index + 1}.* ${video.title}\n`;
            messageText += `👤 *Channel:* ${video.channel} | ⏱ ${video.duration}\n\n`;
        });

        messageText += `📌 *Reply with a number (1-5) to select video!*`;

        const sentMsg = await conn.sendMessage(from, {
            image: { url: topResults[0].thumbnail },
            caption: messageText
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        searchSessions.set(sentMsg.key.id, {
            results: topResults,
            from: from
        });

    } catch (e) {
        console.error('[SEARCH ERROR]', e);
        reply(`❌ Error: ${e?.message || e}`);
    }
});

// ==================== AUDIO COMMAND (.YTMP3) ====================
cmd({
    pattern: "ytmp3",
    alias: ["yta", "audio", "playaudio"],
    desc: "Download YouTube audio directly",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;
    try {
        if (!text) return reply(`❌ Please provide a YouTube URL!`);
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        await reply('_✨ Processing audio, please wait..._');

        const res = await scrapeYtmp3(text.trim(), 'mp3');
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
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== INTERACTIVE REPLY HANDLER ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;
        const text = body.trim();

        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo;
        if (!quotedMsg) return;

        const stanzaId = quotedMsg.stanzaId;
        if (!searchSessions.has(stanzaId)) return;

        const session = searchSessions.get(stanzaId);
        if (session.from !== from) return;

        // Check if session has stored videoUrl directly (Step 2)
        if (session.videoUrl) {
            const targetUrl = session.videoUrl;
            const targetTitle = session.title;
            searchSessions.delete(stanzaId);

            if (!['1', '2', '3'].includes(text)) return;

            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
            await conn.sendMessage(from, { text: `📥 Downloading *${targetTitle}* via YMCDN, please wait...` }, { quoted: mek });

            if (text === '1') {
                const res = await scrapeYtmp3(targetUrl, 'mp4');
                const buffer = await downloadBuffer(res.downloadUrl);
                let finalBuf = buffer;
                if (await checkFFmpeg()) {
                    try { finalBuf = await compressMP4(buffer); } catch {}
                }
                await conn.sendMessage(from, {
                    video: finalBuf,
                    mimetype: 'video/mp4',
                    caption: `🎥 *${res.title}*\n> Powered by KAMRAN-MD`
                }, { quoted: mek });

            } else if (text === '2') {
                const res = await scrapeYtmp3(targetUrl, 'mp3');
                const buffer = await downloadBuffer(res.downloadUrl);
                await conn.sendMessage(from, {
                    audio: buffer,
                    mimetype: 'audio/mpeg',
                    caption: `🎵 *${res.title}*\n> Powered by KAMRAN-MD`
                }, { quoted: mek });

            } else if (text === '3') {
                const res = await scrapeYtmp3(targetUrl, 'mp4');
                const buffer = await downloadBuffer(res.downloadUrl);
                const safeTitle = cleanName(res.title);
                await conn.sendMessage(from, {
                    document: buffer,
                    mimetype: 'video/mp4',
                    fileName: `${safeTitle}.mp4`,
                    caption: `📁 *${res.title}*\n> Powered by KAMRAN-MD`
                }, { quoted: mek });
            }

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            return;
        }

        // Step 1: User selected video number (1-5)
        if (session.results) {
            const choice = parseInt(text);
            if (isNaN(choice) || choice < 1 || choice > session.results.length) return;

            const selectedVideo = session.results[choice - 1];
            searchSessions.delete(stanzaId);

            const formatMenu = 
                `╭───────────────────────╮\n` +
                `  🎬 *${selectedVideo.title}*\n` +
                `╰───────────────────────╯\n\n` +
                `📌 *Format select karein (Reply karein):*\n\n` +
                `1️⃣ *Video (MP4)*\n` +
                `2️⃣ *Audio (MP3)*\n` +
                `3️⃣ *Document File (MP4)*\n\n` +
                `> Powered by KAMRAN-MD`;

            const formatMsg = await conn.sendMessage(from, { text: formatMenu }, { quoted: mek });

            // Store videoUrl directly in the new session map
            searchSessions.set(formatMsg.key.id, {
                videoUrl: selectedVideo.url,
                title: selectedVideo.title,
                from: from
            });
        }

    } catch (err) {
        console.error("Interactive Selection Error:", err);
        await conn.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
