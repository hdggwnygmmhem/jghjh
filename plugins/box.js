import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getThumbnailBuffer(url) {
  if (!url) return null;
  try {
    const { data } = await axios.get(url, { responseType: "arraybuffer" });
    return await sharp(data)
      .resize(300, 300)
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.error("Error processing thumbnail:", err.message || err);
    return null;
  }
}

cmd({
    pattern: "moviebox",
    alias: ["mbox", "movieboxdl"],
    desc: "Search and download movies/series from MovieBox API",
    category: "downloader",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, args, q, reply, react, socket, sock }) => {
    const client = socket || sock || conn;

    const apiKey = "VajiraOfc";
    const searchApiUrl = `https://vajiraofc-apis.vercel.app/api/movieboxs`;
    const detailsApiUrl = `https://vajiraofc-apis.vercel.app/api/movieboxdl`;

    try {
        await react("🎬");

        if (!q) {
            return reply(
                "❌ *Opps! Title Missing* ❌\n\n" +
                "Please provide a movie or show name to search!\n" +
                "📌 *Example:* `.moviebox Inception`"
            );
        }

        await reply(`🔍 _Searching for *"${q}"* on MovieBox servers..._`);

        const response = await axios.get(searchApiUrl, {
            params: { 
                apikey: apiKey, 
                query: q,
                page: 1,
                perPage: 24
            },
            timeout: 30000
        });

        if (response.status !== 200 || !response.data) {
            await react("❌");
            return reply("🛸 *API Error:* Server responded with an invalid status.");
        }

        let results = response.data.results || response.data.data || (Array.isArray(response.data) ? response.data : []);

        if (!results || results.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found!*\nMovieBox par *"${q}"* naam ki koi movie nahi mili.`);
        }

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎬  *MOVIEBOX SEARCH*  🎬 ┃\n`;
        listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n`;
        listText += `✨ *Results Found:* ${results.length}\n\n`;
        listText += `┌─────────────────────┐\n`;

        results.forEach((v, i) => {
            const title = v.title || v.name || 'Unknown Title';
            const displayTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;
            listText += `┃ 🎥 *[${i + 1}]* _${displayTitle}_\n`;
            listText += `┃ └─ 📊 Rating: ${v.rating || v.score || 'N/A'} | ${v.type || 'Movie/Series'}\n`;
            if (i !== results.length - 1) listText += `┃─────────────────────┃\n`;
        });

        listText += `└─────────────────────┘\n\n`;
        listText += `⚡ *Reply with the item number* to download.\n\n`;
        listText += `> *© KAMRAN-MINI-BOT ッ*`;

        const firstImage = results[0].poster || results[0].imageUrl || results[0].cover || "https://placehold.co/600x400?text=No+Poster";

        const sentSearch = await client.sendMessage(from, {
            image: { url: firstImage },
            caption: listText
        }, { quoted: mek });

        const searchMsgId = sentSearch.key.id;
        let detailsTimeout;

        const detailsHandler = async (update) => {
            try {
                const msg = update.messages[0];
                if (!msg?.message || msg.key.remoteJid !== from) return;

                const ctx = msg.message.extendedTextMessage?.contextInfo || msg.message.conversation?.contextInfo;
                if (ctx?.stanzaId !== searchMsgId) return;

                const choice = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
                const num = parseInt(choice);
                if (isNaN(num) || num < 1 || num > results.length) return;
                
                const selected = results[num - 1];
                if (!selected) return;

                client.ev.off("messages.upsert", detailsHandler);
                clearTimeout(detailsTimeout);

                await react("⏳");
                await reply(`🚀 *Fetching MovieBox File...*\nProcessing download link. Please wait!`);

                const dlParams = {
                    apikey: apiKey,
                    subjectId: selected.subjectId || selected.id,
                    detailPath: selected.detailPath || selected.path
                };

                if (selected.season) dlParams.season = selected.season;
                if (selected.episode) dlParams.episode = selected.episode;

                const detailResponse = await axios.get(detailsApiUrl, {
                    params: dlParams,
                    timeout: 45000
                });

                if (detailResponse.status !== 200 || !detailResponse.data) {
                    await react("❌");
                    return reply("❌ *Error:* Failed to fetch download details from MovieBox API.");
                }

                const dlData = detailResponse.data.result || detailResponse.data.data || detailResponse.data;
                
                // Extract direct video file URL from multiple possible API structures
                let targetUrl = dlData.downloadUrl || dlData.url || dlData.link || dlData.file;
                if (!targetUrl && dlData.downloads && dlData.downloads.length > 0) {
                    targetUrl = dlData.downloads[0].url || dlData.downloads[0].link || dlData.downloads[0].downloadUrl;
                }

                if (!targetUrl) {
                    await react("❌");
                    return reply("❌ *Sorry:* Could not extract a direct file URL for this item.");
                }

                const itemTitle = selected.title || selected.name || "Movie";
                const cleanFileName = `${itemTitle.replace(/[^a-zA-Z0-9 ]/g, "_")}_MovieBox.mp4`;

                let finalCaption = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                finalCaption += `┃ 🎬 *${itemTitle}*\n`;
                finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                finalCaption += `┃ 🌟 *Type:* ${selected.type || 'Movie/Series'}\n`;
                finalCaption += `┃ 📦 *Size:* ${dlData.size || selected.size || 'N/A'}\n`;
                finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                finalCaption += `> *© KAMRAN-MINI-BOT ッ*`;

                // Stream video file directly to handle servers that reject Baileys' default user-agent
                const mediaStream = await axios.get(targetUrl, { 
                    responseType: 'stream',
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                const posterUrl = selected.poster || selected.imageUrl || selected.cover;
                const thumbBuffer = await getThumbnailBuffer(posterUrl);
                
                let documentPayload = {
                    document: { stream: mediaStream.data },
                    mimetype: "video/mp4",
                    fileName: cleanFileName,
                    caption: finalCaption
                };

                if (thumbBuffer && Buffer.isBuffer(thumbBuffer)) {
                    documentPayload.jpegThumbnail = thumbBuffer;
                }

                await client.sendMessage(from, documentPayload, { quoted: msg });
                await client.sendMessage(from, { react: { text: "✅", key: msg.key } });

            } catch (detErr) {
                console.error("MovieBox process failed:", detErr.message);
                reply(`❌ An error occurred during file delivery: ${detErr.message}`);
            }
        };

        client.ev.on("messages.upsert", detailsHandler);
        
        detailsTimeout = setTimeout(() => {
            client.ev.off("messages.upsert", detailsHandler);
        }, 300000);

    } catch (e) {
        console.error("MovieBox Downloader error:", e.message);
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
