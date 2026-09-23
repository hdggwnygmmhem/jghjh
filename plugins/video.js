import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// Global sessions to store search results for selection
const searchSessions = new Map();

// ==================== 1. YOUTUBE SEARCH FUNCTION ====================
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
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
                id: videoRenderer.videoId,
                title: videoRenderer.title?.runs?.map(r => r.text).join('') || 'No Title',
                channel: videoRenderer.ownerText?.runs?.map(r => r.text).join('') || 'Unknown Channel',
                duration: videoRenderer.lengthText?.simpleText || 'LIVE',
                url: `https://www.youtube.com/watch?v=${videoRenderer.videoId}`
              });
            }
          }
        }
      }
    }
    return results;
  } catch (error) {
    console.error('YouTube Search Error:', error.message);
    throw error;
  }
}

// ==================== 2. YMCDN SCRAPER & DOWNLOADER ====================
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
    if (!videoId) throw new Error('Invalid YouTube URL.');
    
    const lowerFormat = format.toLowerCase();
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

// ==================== COMMAND: .VIDEO / .PLAYVID (SEARCH & SELECT) ====================
cmd({
    pattern: "video",
    alias: ["playvid", "yts", "ytsearch"],
    react: "🔍",
    desc: "Search YouTube, select a result, and download",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;
    
    try {
        if (!text) {
            return reply(
                `🎬 *KAMRAN-MD YOUTUBE SEARCH & DOWNLOADER*\n\n` +
                `❌ *Please provide a search query or song name!*\n\n` +
                `💡 *Example:* \`.video song pal\``
            );
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        const results = await searchYoutube(text.trim());

        if (!results || results.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply(`❌ No results found for "${text}".`);
        }

        const topResults = results.slice(0, 5);
        let messageText = `╭──「 *KAMRAN-MD SEARCH RESULTS* 」\n`;
        messageText += `│ 🔍 *Query:* ${text}\n`;
        messageText += `╰─────────────────────────\n\n`;

        topResults.forEach((video, index) => {
            messageText += `*${index + 1}.* ${video.title}\n`;
            messageText += `👤 *Channel:* ${video.channel}\n`;
            messageText += `⏱ *Duration:* ${video.duration}\n`;
            messageText += `🔗 *Link:* ${video.url}\n\n`;
        });

        messageText += `📌 *Reply with a number (1-${topResults.length}) to select video!*`;

        const sentMsg = await conn.sendMessage(from, { text: messageText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        // Save session
        searchSessions.set(sentMsg.key.id, {
            results: topResults,
            from: from
        });

    } catch (error) {
        console.error("Search error:", error);
        reply(`❌ Error: ${error.message}`);
    }
});

// ==================== SELECTION & DOWNLOAD HANDLER ====================
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
        await conn.sendMessage(from, { text: `📥 Downloading *${selectedVideo.title}* (via YMCDN), please wait...` }, { quoted: mek });

        // Scrape and download using YMCDN
        const res = await scrapeYtmp3(selectedVideo.url, 'mp4');
        const buffer = await downloadBuffer(res.downloadUrl);
        const safeTitle = cleanName(selectedVideo.title);

        await conn.sendMessage(from, {
            video: buffer,
            mimetype: 'video/mp4',
            fileName: `${safeTitle}.mp4`,
            caption: `🎥 *${selectedVideo.title}*\n🔗 *YouTube:* ${selectedVideo.url}\n> Powered by KAMRAN-MD`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("Selection Download Error:", err);
        await conn.sendMessage(from, { text: `❌ Download failed: ${err.message}` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
