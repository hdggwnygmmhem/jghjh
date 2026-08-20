import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global Session Map (Memory Safe)
if (!global.cinefluraSessions) {
    global.cinefluraSessions = new Map();
}

// Memory Cleanup Interval (Every 10 mins delete dead sessions)
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of global.cinefluraSessions.entries()) {
        if (now - value.timestamp > 300000) { // 5 mins timeout
            global.cinefluraSessions.delete(key);
        }
    }
}, 600000);

cmd({
    pattern: "cineflura",
    alias: ["cfl", "cinefluradl"],
    desc: "Search and download movies from Cineflura",
    category: "downloader",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react, socket, sock }) => {
    const client = socket || sock || conn;
    const apiKey = "VajiraOfc";
    const searchApiUrl = `https://vajiraofc-apis.vercel.app/api/cineflura/search`;

    try {
        await react("🎬");

        if (!q) {
            return reply(
                "❌ *Title Missing!*\n\n" +
                "📌 *Example:* `.cineflura Interstellar`"
            );
        }

        const response = await axios.get(searchApiUrl, {
            params: { apikey: apiKey, q: q },
            timeout: 15000
        }).catch(err => ({ error: true, message: err.message }));

        if (response.error || !response.data || !response.data.success) {
            await react("❌");
            return reply(`🛸 *API Error:* ${response.message || 'Invalid server response'}`);
        }

        const results = response.data.results || [];
        if (results.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found for "${q}"*`);
        }

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎬  *CINEFLURA SEARCH*  🎬 ┃\n`;
        listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n\n`;

        results.slice(0, 10).forEach((v, i) => { // Limit to 10 to save memory
            const title = v.title || 'Unknown';
            listText += `*[${i + 1}]* _${title.substring(0, 45)}_\n`;
            listText += `└─ 📊 Rating: ${v.rating || 'N/A'} | ${v.type || 'Movie'}\n\n`;
        });

        listText += `⚡ *Reply with item number* to select.\n\n`;
        listText += `> *© KAMRAN-MINI-BOT*`;

        const firstImage = results[0].imageUrl || "https://placehold.co/600x400?text=No+Poster";

        await client.sendMessage(from, {
            image: { url: firstImage },
            caption: listText
        }, { quoted: mek });

        // Save state in global map
        global.cinefluraSessions.set(from, {
            step: 'DETAILS',
            results: results,
            timestamp: Date.now()
        });

    } catch (e) {
        console.error("Cineflura command error:", e);
        await react("❌");
        return reply(`❌ *Error:* ${e.message}`);
    }
});

// Text Event Handler for Selection Replies
cmd({
    on: "text"
},
async (conn, mek, m, { from, body, reply, react, socket, sock }) => {
    const client = socket || sock || conn;
    const session = global.cinefluraSessions.get(from);
    if (!session) return;

    const text = (body || "").trim();
    const num = parseInt(text);

    const apiKey = "VajiraOfc";
    const detailsApiUrl = `https://vajiraofc-apis.vercel.app/api/cineflura/details`;

    // Step 1: Process Details Selection
    if (session.step === 'DETAILS') {
        if (isNaN(num) || num < 1 || num > session.results.length) return;

        const selected = session.results[num - 1];
        if (!selected) return;

        await react("⏳");

        const detailResponse = await axios.get(detailsApiUrl, {
            params: { apikey: apiKey, url: selected.url },
            timeout: 20000
        }).catch(() => null);

        if (!detailResponse || !detailResponse.data || !detailResponse.data.success) {
            await react("❌");
            return reply(`❌ *Error:* Failed to pull movie details.`);
        }

        const movieDetails = detailResponse.data.movie || {};
        const downloads = detailResponse.data.downloads || [];

        if (downloads.length === 0) {
            await react("❌");
            return reply("❌ No downloads found.");
        }

        let cap = `🎥 *${movieDetails.title || selected.title}*\n\n`;
        cap += `📅 *Year:* ${movieDetails.year || 'N/A'}\n`;
        cap += `🗣️ *Language:* ${movieDetails.language || 'N/A'}\n\n`;
        cap += `┌── DOWNLOAD OPTIONS ──┐\n`;

        downloads.forEach((dl, i) => {
            cap += `┃ *[${i + 1}]* ${dl.quality || 'HD'} (${dl.size || 'N/A'})\n`;
        });
        cap += `└─────────────────────┘\n\n`;
        cap += `⚡ *Reply with quality number* to download.`;

        const detailImg = movieDetails.posterImage || selected.imageUrl || "https://placehold.co/600x400?text=No+Poster";

        await client.sendMessage(from, {
            image: { url: detailImg },
            caption: cap
        }, { quoted: mek });

        global.cinefluraSessions.set(from, {
            step: 'DOWNLOAD',
            movieDetails: movieDetails,
            selected: selected,
            downloads: downloads,
            timestamp: Date.now()
        });
        return;
    }

    // Step 2: Process Download Selection
    if (session.step === 'DOWNLOAD') {
        if (isNaN(num) || num < 1 || num > session.downloads.length) return;

        const selectedDl = session.downloads[num - 1];
        global.cinefluraSessions.delete(from); // Immediate memory cleanup

        await react("📥");

        let targetFileUrl = selectedDl.pixelDrainUrl || selectedDl.url || selectedDl.downloadUrl;
        if (!targetFileUrl) {
            await react("❌");
            return reply("❌ Download URL missing.");
        }

        const cleanFileName = `${(session.movieDetails.title || session.selected.title || "Movie").replace(/[^a-zA-Z0-9 ]/g, "_")}.mp4`;

        await reply(`🚀 *Uploading Document...*\nFile send hone tak wait karein!`);

        // Direct Stream Upload (No sharp buffer to prevent memory crash)
        await client.sendMessage(from, {
            document: { url: targetFileUrl },
            mimetype: "video/mp4",
            fileName: cleanFileName,
            caption: `🎬 *${session.movieDetails.title || session.selected.title}*\n📦 Quality: ${selectedDl.quality || 'HD'}`
        }, { quoted: mek });

        await react("✅");
    }
});
