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
                channel: videoRenderer.ownerText?.runs?.map(r => r.text).join('') || 'Unknown',
                views: videoRenderer.viewCountText?.simpleText || '0 views',
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

// ==================== ADVANCED MULTI-SOURCE HD SCRAPER ====================
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

async function scrapeHDMovie(youtubeUrl) {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
        throw new Error('Invalid YouTube URL or Video ID.');
    }

    // Fallback 1: Cobalt / YMCDN High-Tier Endpoint
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Origin': 'https://id.ytmp3.mobi',
            'Referer': 'https://id.ytmp3.mobi/'
        };

        const initUrl = `https://a.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`;
        const initRes = await fetch(initUrl, { headers });
        const initJson = await initRes.json();

        let convertUrl = initJson.convertURL;
        let convertRequestUrl = `${convertUrl}&v=${videoId}&f=mp4&_=${Math.random()}`;
        let convertJson;
        
        while (true) {
            const convertRes = await fetch(convertRequestUrl, { headers });
            convertJson = await convertRes.json();
            if (convertJson.redirect > 0 && convertJson.redirectURL) {
                convertRequestUrl = `${convertJson.redirectURL}&v=${videoId}&f=mp4&_=${Math.random()}`;
                continue;
            }
            break;
        }

        const progressUrl = convertJson.progressURL;
        const downloadUrl = convertJson.downloadURL;
        let title = convertJson.title || 'Movie';

        let progress = 0;
        let pollCount = 0;
        while (progress < 3 && pollCount < 300) {
            await new Promise(resolve => setTimeout(resolve, 300));
            pollCount++;
            const progressRes = await fetch(progressUrl, { headers });
            const progressJson = await progressRes.json();
            progress = progressJson.progress;
            if (progressJson.title) title = progressJson.title;
        }

        if (downloadUrl) {
            return { title, downloadUrl };
        }
    } catch (err) {
        console.error("Primary Scraper Error, switching to backup:", err.message);
    }

    // Fallback 2: Alternative Public MP4 Stream Source
    try {
        const backupApi = `https://api-faa.my.id/faa/ytplay?query=https://www.youtube.com/watch?v=${videoId}`;
        const res = await axios.get(backupApi, { timeout: 15000 });
        if (res.data && res.data.status && res.data.result) {
            return {
                title: res.data.result.title || 'Movie',
                downloadUrl: res.data.result.mp4 || res.data.result.download || res.data.result.url
            };
        }
    } catch (err) {
        console.error("Backup Scraper Error:", err.message);
    }

    throw new Error('Could not fetch HD download link from any source.');
}

function cleanName(name = 'file') {
    return String(name)
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 150);
}

// ==================== COMMAND: .MOVIE (HD SECURE DOWNLOAD) ====================
cmd({
    pattern: "movie",
    alias: ["playmovie", "dlmovie"],
    desc: "Search and download Full HD movies safely as document",
    category: "downloader",
    react: "🍿",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;

    let tempFile = null;

    try {
        if (!text) {
            return reply(
                `🍿 *KAMRAN-MD HD MOVIE DOWNLOADER*\n\n` +
                `❌ *Please provide a movie name or YouTube link!*\n\n` +
                `💡 *Example:* \`.movie hitman action movie\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⚡", key: mek.key } });

        let movieUrl = text.trim();
        let movieInfo = null;

        if (!movieUrl.includes("youtube.com") && !movieUrl.includes("youtu.be")) {
            const searchResults = await searchYoutube(movieUrl);
            
            if (!searchResults || searchResults.length === 0) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply(`❌ No movie found for "${movieUrl}".`);
            }
            
            movieInfo = searchResults[0];
            movieUrl = movieInfo.url;

            let infoText = `╭──「 *KAMRAN-MD HD MOVIE INFO* 」\n`;
            infoText += `│ 🍿 *Title:* ${movieInfo.title}\n`;
            infoText += `│ 👤 *Channel:* ${movieInfo.channel}\n`;
            infoText += `│ ⏱ *Duration:* ${movieInfo.duration} | 👁 *Views:* ${movieInfo.views}\n`;
            infoText += `╰─────────────────────────\n\n`;
            infoText += `_⚡ Fetching Full HD movie streams securely..._`;

            await conn.sendMessage(from, {
                image: { url: movieInfo.thumbnail },
                caption: infoText
            }, { quoted: mek });
        } else {
            await reply('_⚡ Fetching Full HD movie streams, please wait..._');
        }

        const res = await scrapeHDMovie(movieUrl);
        if (!res || !res.downloadUrl) {
            throw new Error('Failed to retrieve valid movie download stream.');
        }

        const { title, downloadUrl } = res;
        const safeTitle = cleanName(title || 'Movie');

        tempFile = path.join(os.tmpdir(), `hd_movie_${Date.now()}.mp4`);
        
        const response = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://id.ytmp3.mobi/'
            }
        });

        const writer = fs.createWriteStream(tempFile);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        await conn.sendMessage(from, {
            document: { url: tempFile },
            mimetype: 'video/mp4',
            fileName: `${safeTitle}.mp4`,
            caption: `🍿 *${title}* (HD)\n\n> Powered by KAMRAN-MD`
        }, { quoted: mek });

        try {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch {}
        if (global.gc) { global.gc(); }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error('[HD MOVIE ERROR]', e);
        try {
            if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch {}
        if (global.gc) { global.gc(); }

        reply(`❌ Error: ${e?.message || e}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
