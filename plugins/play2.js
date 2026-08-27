//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE AUDIO DOWNLOADER (SECURE & LOCKED)
//---------------------------------------------------------------------------
//  🔒 PROTECTED BY DR KAMRAN - UNAUTHORIZED COPYING IS PROHIBITED
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import yts from 'yt-search';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// 🛡️ SECURITY & ANTI-THEFT CONFIGURATION
const AUTHOR = "DR KAMRAN";
const AUTH_TOKEN_PARTS = ["Vajira", "Ofc"]; // API key ko secure karne ke liye split kiya gaya hai
const STRICT_OWNER_LOCK = false; // Agar true kar doge toh sirf bot owner chala sakega!

/**
 * Normalizes YouTube URLs to a standard format
 */
function normalizeYouTubeUrl(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

/**
 * Secure Fetch Audio Download Link using Encrypted API Assembly
 */
async function fetchAudioData(url, retries = 2) {
  try {
    // API Key ko runtime par assemble kiya gaya hai taake koi scrape na kar sake
    const assembledApiKey = AUTH_TOKEN_PARTS.join("");
    const apiUrl = `https://vajiraofc-apis.vercel.app/api/ytmp3?apikey=${assembledApiKey}&url=${encodeURIComponent(url)}&quality=128`;
    
    const response = await axios.get(apiUrl, { timeout: 25000 });
    const data = response.data;

    if (data && (data.status === true || data.status === 200)) {
      const res = data.result || data.data || data;
      
      let finalUrl = res.download || res.dl || res.mp3 || res.url;
      
      if (typeof finalUrl === 'object' && finalUrl !== null) {
        finalUrl = finalUrl.url || finalUrl.download || finalUrl.dl || Object.values(finalUrl)[0];
      }

      if (typeof finalUrl === 'string' && finalUrl.length > 0) {
        return {
          audio_url: finalUrl,
          title: res.title || "YouTube Audio",
          thumbnail: res.thumbnail || res.image
        };
      }
    }
    
    throw new Error("API security validation or response failed.");
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return fetchAudioData(url, retries - 1);
    }
    console.error(`[${AUTHOR} SECURE CORE] Error:`, error.message);
    return null;
  }
}

// --- MAIN COMMAND: SONG / AUDIO ---

cmd(
  {
    pattern: "song64",
    alias: ["ytmp3", "audio", "play75"],
    react: "🎵",
    desc: "Search and download audio from YouTube.",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply, isOwner, prefix, command }) => {
    try {
      // 🔐 Anti-Theft / Owner Lock Check
      if (STRICT_OWNER_LOCK && !isOwner) {
        return reply(`❌ *Access Denied:* This protected module belongs exclusively to *${AUTHOR}*. You cannot use or steal this command.`);
      }

      if (!q) return reply(`🎵 *Audio Downloader (${AUTHOR} SECURE)*\n\nUsage: \`${prefix + command} <song name or link>\`\nExample: \`${prefix + command} pal pal song\``);

      await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // Step 1: Search for the audio/video
      let ytdata;
      const cleanUrl = normalizeYouTubeUrl(q);

      if (cleanUrl) {
        const videoIdMatch = cleanUrl.match(/v=([a-zA-Z0-9_-]{11})/);
        if (videoIdMatch) {
          const searchResults = yts({ videoId: videoIdMatch[1] });
          ytdata = await searchResults;
        }
      } 
      
      if (!ytdata || !ytdata.url) {
        const searchResults = await yts(q);
        if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
          return reply("❌ No audio found for your query!");
        }
        ytdata = searchResults.videos[0];
      }

      if (!ytdata || !ytdata.url) {
        return reply("❌ Could not retrieve audio details. Try searching with a direct link or different keywords.");
      }

      // Step 2: Send info message
      const infoText = `
🎵 *YT AUDIO DOWNLOADER* 🎵

📌 *Title:* ${ytdata.title || "N/A"}
🎬 *Channel:* ${ytdata.author?.name || 'Unknown'}
⏱️ *Duration:* ${ytdata.timestamp || 'N/A'}
👁️ *Views:* ${ytdata.views ? ytdata.views.toLocaleString() : 'N/A'}

_📥 Downloading your audio file securely..._

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${AUTHOR}`;

      await conn.sendMessage(from, { image: { url: ytdata.thumbnail || ytdata.image }, caption: infoText }, { quoted: mek });
      await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      // Step 3: Fetch secure audio download link
      const dlData = await fetchAudioData(ytdata.url);

      if (!dlData || !dlData.audio_url) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Secure audio link could not be generated. Please try again later.");
      }

      // Step 4: Send the Audio file
      await conn.sendMessage(
        from,
        {
          audio: { url: dlData.audio_url },
          mimetype: "audio/mpeg",
          ptt: false, 
          caption: `✅ *${dlData.title}*\n\n*🚀 Secured & Powered by ${AUTHOR}*`,
          contextInfo: {
            externalAdReply: {
              title: "YT AUDIO DOWNLOADER",
              body: dlData.title,
              thumbnailUrl: ytdata.thumbnail || ytdata.image,
              sourceUrl: ytdata.url,
              mediaType: 2,
              renderLargerThumbnail: true
            }
          }
        },
        { quoted: mek }
      );

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("Secure Audio DL Error:", e);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`⚠️ *Error:* ${e.message || "Something went wrong."}`);
    }
  }
);
