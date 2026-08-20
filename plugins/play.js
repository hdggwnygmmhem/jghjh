import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optimized Thumbnail Buffer Generator with Stream Limiting
async function getThumbnailBuffer(url) {
  if (!url) return null;
  try {
    const { data } = await axios.get(url, { 
      responseType: "arraybuffer", 
      timeout: 5000,
      maxContentLength: 5 * 1024 * 1024 // Limit to 5MB max image download
    });
    const buffer = await sharp(data)
      .resize(200, 200) // Lower resolution for thumbnail to save RAM
      .jpeg({ quality: 60 })
      .toBuffer();
    return buffer;
  } catch (err) {
    return null;
  }
}

cmd({
    pattern: "cineflura",
    alias: ["cfl", "cinefluradl"],
    desc: "Search and download movies from Cineflura via API",
    category: "downloader",
    filename: __filename
},
async (conn, mek, m, { from, reply, react, q, socket, sock }) => {
    const client = socket || sock || conn;
    const apiKey = "VajiraOfc";
    const searchApiUrl = `https://vajiraofc-apis.vercel.app/api/cineflura/search`;
    const detailsApiUrl = `https://vajiraofc-apis.vercel.app/api/cineflura/details`;

    try {
        await react("🎬");

        if (!q) {
            return reply("❌ *Title Missing!* Please provide a movie name.");
        }

        const response = await axios.get(searchApiUrl, {
            params: { apikey: apiKey, q },
            timeout: 15000
        });

        const results = response.data?.success ? response.data.results : null;
        if (!results || results.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found!*`);
        }

        let listText = `🎬 *CINEFLURA SEARCH*\n\n🔎 *Query:* \`${q.toUpperCase()}\`\n\n`;
        results.slice(0, 10).forEach((v, i) => { // Limit max results to 10 to save string overhead
            const title = v.title ? (v.title.length > 40 ? v.title.substring(0, 40) + '...' : v.title) : 'Unknown';
            listText += `*${i + 1}.* ${title} | Rating: ${v.rating || 'N/A'}\n`;
        });
        listText += `\n⚡ *Reply with the number (1-${Math.min(results.length, 10)})* to get details.`;

        const firstImage = results[0].imageUrl || "https://placehold.co/600x400?text=No+Poster";
        const sentSearch = await client.sendMessage(from, { image: { url: firstImage }, caption: listText }, { quoted: mek });
        const searchMsgId = sentSearch.key.id;

        let detailsTimeout = null;
        let downloadTimeout = null;

        // --- STEP 1: DETAILS HANDLER ---
        const detailsHandler = async (update) => {
            let msg;
            try {
                msg = update.messages?.[0];
                if (!msg?.message || msg.key.remoteJid !== from) return;

                const ctx = msg.message.extendedTextMessage?.contextInfo || msg.message.conversation?.contextInfo;
                if (ctx?.stanzaId !== searchMsgId) return;

                const choice = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
                const num = parseInt(choice);
                if (isNaN(num) || num < 1 || num > Math.min(results.length, 10)) return;

                // Cleanup immediately once valid response received
                cleanupDetails();
                await react("⏳");

                const selected = results[num - 1];
                const detailResponse = await axios.get(detailsApiUrl, {
                    params: { apikey: apiKey, url: selected.url },
                    timeout: 15000
                });

                if (!detailResponse.data?.success) {
                    await react("❌");
                    return reply("❌ Failed to fetch movie details.");
                }

                const movieDetails = detailResponse.data.movie || {};
                const downloads = detailResponse.data.downloads || [];

                if (downloads.length === 0) {
                    await react("❌");
                    return reply("❌ No download links found.");
                }

                let cap = `🎥 *${movieDetails.title || selected.title}*\n\n`;
                cap += `📋 *Type:* ${movieDetails.type || 'Movie'} | 📅 *Year:* ${movieDetails.year || 'N/A'}\n\n`;
                cap += `DOWNLOAD OPTIONS:\n`;
                
                downloads.forEach((dl, i) => {
                    cap += `*${i + 1}.* Quality: ${dl.quality || 'HD'} (${dl.size || 'N/A'})\n`;
                });
                cap += `\n⚡ *Reply with quality number* to download.`;

                const detailImg = movieDetails.posterImage || selected.imageUrl || "https://placehold.co/600x400?text=No+Poster";
                const sentDetail = await client.sendMessage(from, { image: { url: detailImg }, caption: cap }, { quoted: msg });
                const detailMsgId = sentDetail.key.id;

                // --- STEP 2: DOWNLOAD HANDLER ---
                const downloadHandler = async (up) => {
                    try {
                        const dlMsg = up.messages?.[0];
                        if (!dlMsg?.message || dlMsg.key.remoteJid !== from) return;

                        const dlCtx = dlMsg.message.extendedTextMessage?.contextInfo || dlMsg.message.conversation?.contextInfo;
                        if (dlCtx?.stanzaId !== detailMsgId) return;

                        const pick = (dlMsg.message.conversation || dlMsg.message.extendedTextMessage?.text || "").trim();
                        const dlNum = parseInt(pick);
                        if (isNaN(dlNum) || dlNum < 1 || dlNum > downloads.length) return;

                        cleanupDownload();
                        await client.sendMessage(from, { react: { text: "📥", key: dlMsg.key } });

                        const selectedDl = downloads[dlNum - 1];
                        const targetFileUrl = selectedDl.pixelDrainUrl || selectedDl.url || selectedDl.downloadUrl;

                        if (!targetFileUrl) {
                            await react("❌");
                            return reply("❌ Direct download link unavailable.");
                        }

                        const cleanFileName = `${(movieDetails.title || selected.title || "Movie").replace(/[^a-zA-Z0-9]/g, "_")}_${selectedDl.quality || 'HD'}.mp4`;
                        const thumbBuffer = await getThumbnailBuffer(movieDetails.posterImage || selected.imageUrl);

                        const documentPayload = {
                            document: { url: targetFileUrl }, // Baileys stream URL direct handle karta hai, storage usage zero rehti hai
                            mimetype: "video/mp4",
                            fileName: cleanFileName,
                            caption: `🎬 *${movieDetails.title || selected.title}*\nQuality: ${selectedDl.quality || 'HD'}`
                        };

                        if (thumbBuffer) {
                            documentPayload.jpegThumbnail = thumbBuffer;
                        }

                        await client.sendMessage(from, documentPayload, { quoted: dlMsg });
                        await client.sendMessage(from, { react: { text: "✅", key: dlMsg.key } });

                    } catch (dlErr) {
                        reply(`❌ Download Error: ${dlErr.message}`);
                    } finally {
                        cleanupDownload();
                    }
                };

                const cleanupDownload = () => {
                    client.ev.off("messages.upsert", downloadHandler);
                    if (downloadTimeout) clearTimeout(downloadTimeout);
                };

                client.ev.on("messages.upsert", downloadHandler);
                downloadTimeout = setTimeout(cleanupDownload, 120000); // reduced timeout to 2 min

            } catch (detErr) {
                reply(`❌ Error loading details: ${detErr.message}`);
            } finally {
                cleanupDetails();
            }
        };

        const cleanupDetails = () => {
            client.ev.off("messages.upsert", detailsHandler);
            if (detailsTimeout) clearTimeout(detailsTimeout);
        };

        client.ev.on("messages.upsert", detailsHandler);
        detailsTimeout = setTimeout(cleanupDetails, 120000); // reduced timeout to 2 min

    } catch (e) {
        await react("❌");
        return reply(`❌ Error: ${e.message}`);
    }
});
