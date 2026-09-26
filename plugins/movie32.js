import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "omdb",
    alias: ["movieinfo", "omdbmovie", "findmovie"],
    desc: "Search movie details using OMDb API",
    category: "downloader",
    react: "⭐",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = text ? text.trim() : "";

        if (!query) {
            return reply(
                `❎ Please provide a movie or series name!\n\n` +
                `*Example:* \n` +
                `• .omdb Avengers\n` +
                `• .omdb Breaking Bad`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiKey = "b5e3d64c";
        const apiUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(query)}&apikey=${apiKey}`;

        const { data } = await axios.get(apiUrl, { timeout: 30000 });

        if (!data || data.Response === "False") {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Movie nahi mili! Sahi naam type karein.`);
        }

        let infoText = `🎬 *Title:* ${data.Title} (${data.Year})\n`;
        infoText += `⭐ *IMDb Rating:* ${data.imdbRating}\n`;
        infoText += `🎭 *Genre:* ${data.Genre}\n`;
        infoText += `📅 *Released:* ${data.Released}\n`;
        infoText += `⏳ *Runtime:* ${data.Runtime}\n`;
        infoText += `🎥 *Director:* ${data.Director}\n`;
        infoText += `👥 *Actors:* ${data.Actors}\n\n`;
        infoText += `📖 *Plot:* ${data.Plot}\n\n`;
        infoText += `✨ *Powered by KAMRAN-MD*`;

        const posterUrl = data.Poster && data.Poster !== "N/A" ? data.Poster : "";

        if (posterUrl) {
            await conn.sendMessage(from, { 
                image: { url: posterUrl }, 
                caption: infoText 
            }, { quoted: mek });
        } else {
            await reply(infoText);
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("OMDB API ERROR:", error.response?.data || error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error*\n\n• Failed to fetch movie details. Try again later.`);
    }
});
