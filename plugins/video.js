//---------------------------------------------------------------------------
//           KAMRAN-MD - CINESUBZ MOVIE & SUBTITLE DOWNLOADER
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const AUTHOR = "DR KAMRAN";
const AUTH_TOKEN_PARTS = ["Vajira", "Ofc"];
const STRICT_OWNER_LOCK = false;

/**
 * Fetch CineSubz Search Results Safely
 */
async function searchCineSubz(query) {
  try {
    const apiKey = AUTH_TOKEN_PARTS.join("");
    const apiUrl = `https://vajiraofc-apis.vercel.app/api/cinesubz/search?apikey=${apiKey}&q=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl, { timeout: 25000 });
    const data = response.data;

    // Flexible response handling (agar data khud array ho ya result/data ke andar ho)
    if (data) {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.result)) return data.result;
      if (Array.isArray(data.data)) return data.data;
      if (data.result && Array.isArray(data.result.results)) return data.result.results;
    }
    return [];
  } catch (error) {
    console.error(`[${AUTHOR} CINE SEARCH] Error:`, error.message);
    return [];
  }
}

/**
 * Fetch CineSubz Details Safely
 */
async function fetchCineDetails(movieUrl) {
  try {
    const apiKey = AUTH_TOKEN_PARTS.join("");
    const apiUrl = `https://vajiraofc-apis.vercel.app/api/cinesubz/details?apikey=${apiKey}&url=${encodeURIComponent(movieUrl)}`;
    const response = await axios.get(apiUrl, { timeout: 25000 });
    const data = response.data;

    if (data) {
      return data.result || data.data || data;
    }
    return null;
  } catch (error) {
    console.error(`[${AUTHOR} CINE DETAILS] Error:`, error.message);
    return null;
  }
}

// --- MAIN COMMAND: MOVIE / CINESUBZ ---

cmd(
  {
    pattern: "cinesubz",
    alias: ["movie", "film", "subtitles", "sinhala"],
    react: "🍿",
    desc: "Search movies and Sinhala subtitles from CineSubz.",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply, isOwner, prefix, command }) => {
    try {
      if (STRICT_OWNER_LOCK && !isOwner) {
        return reply(`❌ *Access Denied:* This protected module belongs exclusively to *${AUTHOR}*.`);
      }

      // Safe prefix fallback agar undefined ho
      const usedPrefix = prefix || ".";
      const usedCommand = command || "cinesubz";

      if (!q) {
        return reply(`🍿 *CineSubz Movie Search (${AUTHOR})*\n\nUsage: \`${usedPrefix + usedCommand} <movie name>\`\nExample: \`${usedPrefix + usedCommand} matrix\``);
      }

      await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // Step 1: Search movies using API
      const searchResults = await searchCineSubz(q);

      if (!searchResults || searchResults.length === 0) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ No movies or subtitles found for your search query!");
      }

      // Pehli movie ka link lena
      const firstMovie = searchResults[0];
      const movieUrl = firstMovie.url || firstMovie.link || firstMovie.href;

      if (!movieUrl) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Invalid movie link returned from API search.");
      }

      // Step 2: Fetch detailed information
      const details = await fetchCineDetails(movieUrl);

      if (!details) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Could not retrieve movie details from CineSubz.");
      }

      // Safe field mapping
      const title = typeof details.title === 'string' ? details.title : (firstMovie.title || "Movie Subtitle");
      const releaseDate = details.release_date || details.year || details.date || "N/A";
      const quality = details.quality || details.resolution || "HD / Subtitled";
      const posterUrl = details.image || details.thumbnail || details.poster || firstMovie.image || firstMovie.thumbnail;
      const description = details.description || details.plot || "Sinhala Subtitled Movie / Series.";

      // Step 3: Format caption text neatly
      const captionText = `
🍿 *CINESUBZ MOVIE & SUBTITLES* 🍿

📌 *Title:* ${title}
📅 *Release:* ${releaseDate}
📺 *Quality:* ${quality}

📝 *Description:* ${description.length > 150 ? description.substring(0, 150) + "..." : description}

🔗 *Watch/Download Link:* ${movieUrl}

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${AUTHOR}`;

      // Step 4: Send poster/image with info or text fallback
      if (posterUrl) {
        await conn.sendMessage(from, { image: { url: posterUrl }, caption: captionText }, { quoted: mek });
      } else {
        await reply(captionText);
      }

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("CineSubz Command Error:", e);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`⚠️ *Error:* ${e.message || "Something went wrong."}`);
    }
  }
);
