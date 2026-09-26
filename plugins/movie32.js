import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "omdb",
    alias: ["movie", "movieinfo", "series"],
    desc: "Search movies, series, seasons, and episodes using OMDb API",
    category: "downloader",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = text ? text.trim() : "";

        if (!query) {
            return reply(
                `❎ Please provide a movie/series name or search query!\n\n` +
                `*Examples:* \n` +
                `• .omdb Avengers\n` +
                `• .omdz Game of Thrones | season 1\n` +
                `• .omdb Batman | page 2`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiKey = "742b2d09"; // Aap apni nayi email wali key bhi yahan use kar sakte hain
        let searchTitle = query;
        let seasonNum = "";
        let episodeNum = "";
        let pageNum = "1";

        // Advanced parsing for Season, Episode, and Page parameters
        if (query.includes("|")) {
            const parts = query.split("|").map(p => p.trim());
            searchTitle = parts[0];
            
            for (let i = 1; i < parts.length; i++) {
                const part = parts[i].toLowerCase();
                if (part.startsWith("season")) {
                    seasonNum = part.replace("season", "").trim();
                } else if (part.startsWith("episode")) {
                    episodeNum = part.replace("episode", "").trim();
                } else if (part.startsWith("page")) {
                    pageNum = part.replace("page", "").trim();
                }
            }
        }

        let apiUrl = `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(searchTitle)}&plot=full`;
        
        if (seasonNum) apiUrl += `&Season=${seasonNum}`;
        if (episodeNum) apiUrl += `&Episode=${episodeNum}`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        const data = response.data;

        if (!data || data.Response === "False") {
            // Agar direct title se na mile, toh pagination search try karte hain
            const searchListUrl = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(searchTitle)}&page=${pageNum}`;
            const listRes = await axios.get(searchListUrl, { timeout: 30000 });
            const listData = listRes.data;

            if (listData && listData.Response === "True" && listData.Search) {
                let listText = `🎬 *Search Results for "${searchTitle}" (Page ${pageNum}):*\n`;
                listText += `📊 *Total Results:* ${listData.totalResults}\n\n`;
                
                listData.Search.forEach((item, index) => {
                    listText += `${index + 1}. *${item.Title}* (${item.Year}) [${item.Type.toUpperCase()}] ID: ${item.imdbID}\n`;
                });
                
                listText += `\n✨ *Powered by KAMRAN-MD*`;
                return reply(listText);
            }

            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Kuch nahi mila! Sahi naam ya format check karein.`);
        }

        // Response formatting for Movie / Series / Episode details
        let infoText = `🎬 *Title:* ${data.Title} (${data.Year || data.Released})\n`;
        if (data.imdbRating && data.imdbRating !== "N/A") infoText += `⭐ *IMDb Rating:* ${data.imdbRating}\n`;
        if (data.Genre && data.Genre !== "N/A") infoText += `🎭 *Genre:* ${data.Genre}\n`;
        if (data.Released && data.Released !== "N/A") infoText += `📅 *Released:* ${data.Released}\n`;
        if (data.Runtime && data.Runtime !== "N/A") infoText += `⏳ *Runtime:* ${data.Runtime}\n`;
        
        if (data.totalSeasons) {
            infoText += `📺 *Total Seasons:* ${data.totalSeasons}\n`;
        }
        if (seasonNum) {
            infoText += `📺 *Season:* ${seasonNum}\n`;
        }
        if (episodeNum) {
            infoText += `🎞️ *Episode:* ${episodeNum}\n`;
        }

        if (data.Director && data.Director !== "N/A") infoText += `🎥 *Director:* ${data.Director}\n`;
        if (data.Writer && data.Writer !== "N/A") infoText += `✍️ *Writer:* ${data.Writer}\n`;
        if (data.Actors && data.Actors !== "N/A") infoText += `👥 *Actors:* ${data.Actors}\n`;
        
        if (data.Plot && data.Plot !== "N/A") {
            infoText += `\n📖 *Plot:* ${data.Plot}\n`;
        }

        infoText += `\n✨ *Powered by KAMRAN-MD*`;

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
        reply(`❌ *Error*\n\n• Failed to fetch data from OMDb. Try again later.`);
    }
});
