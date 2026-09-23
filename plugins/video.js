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
              results.push({
                title: videoRenderer.title?.runs?.map(r => r.text).join('') || 'No Title',
                url: `https://www.youtube.com/watch?v=${videoRenderer.videoId}`
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

// ==================== YMCDN SCRAPER FUNCTIONS ====================
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
    if (!videoId) throw new Error('Invalid YouTube URL: Could not extract video ID.');
    
    const lowerFormat = format.toLowerCase();
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://id.ytmp3.mobi/' }
    });
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// ==================== COMMAND: .YTS (SEARCH & SELECT) ====================
cmd({
    pattern: "yts",
    alias: ["ytsearch", "video", "playvid"],
    desc: "Search YouTube, select and download",
    category: "downloader",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;
    try {
        if (!text) {
            return reply(`❌ Please provide a search query!\nExample: \`.yts song pal\``);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        const results = await searchYoutube(text.trim());

        if (!results || results.length === 0) {
            return reply(`❌ No results found.`);
        }

        const topResults = results.slice(0, 5);
        let txt = `🔍 *YOUTUBE SEARCH RESULTS*\n\n`;
        topResults.forEach((v, i) => {
            txt += `*${i + 1}.* ${v.title}\n🔗 ${v.url}\n\n`;
        });
        txt += `📌 *Reply with a number (1-5) to download!*\n> Powered by KAMRAN-MD`;

        const sentMsg = await reply(txt);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        searchSessions.set(sentMsg.key.id, {
            results: topResults,
            from: from
        });
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== SELECTION & YMCDN DOWNLOAD HANDLER ====================
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

        const choice = parseInt(text);
        if (isNaN(choice) || choice < 1 || choice > session.results.length) return;

        const selectedVideo = session.results[choice - 1];
        searchSessions.delete(stanzaId);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        await conn.sendMessage(from, { text: `📥 Processing *${selectedVideo.title}* via YMCDN...` }, { quoted: mek });

        // Using YMCDN scraper with the selected YouTube link
        const res = await scrapeYtmp3(selectedVideo.url, 'mp4');
        const buffer = await downloadBuffer(res.downloadUrl);
        const safeTitle = cleanName(res.title || selectedVideo.title);

        await conn.sendMessage(from, {
            video: buffer,
            mimetype: 'video/mp4',
            fileName: `${safeTitle}.mp4`,
            caption: `🎥 *${res.title}*\n🔗 *YouTube:* ${selectedVideo.url}\n> Powered by KAMRAN-MD`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("Selection Download Error:", err);
        await conn.sendMessage(from, { text: `❌ Download failed: ${err.message}` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
