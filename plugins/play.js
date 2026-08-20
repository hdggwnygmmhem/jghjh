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
        const { data } = await axios.get(url, { 
            responseType: "arraybuffer", 
            timeout: 5000,
            maxContentLength: 5 * 1024 * 1024 
        });
        return await sharp(data)
            .resize(200, 200)
            .jpeg({ quality: 60 })
            .toBuffer();
    } catch {
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
            return reply("❌ *Title Missing!*\nExample: `.cineflura Interstellar`");
        }

        const response = await axios.get(searchApiUrl, {
            params: { apikey: apiKey, q: q },
            timeout: 15000
        });

        const results = response.data?.success ? response.data.results : null;
        if (!results || results.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found for:* "${q}"`);
        }

        let listText = `🎬 *CINEFLURA SEARCH*\n\n🔎 *Query:* \`${q.toUpperCase()}\`\n\n`;
        const limitResults = results.slice(0, 10);
        
        limitResults.forEach((v, i) => {
            const title = v.title ? (v.title.length > 40 ? v.title.substring(0, 40) + '...' : v.title) : 'Unknown';
            listText += `*${i + 1}.* ${title}\n📊 Rating: ${v.rating || 'N/A'}\n\n`;
        });
        listText += `⚡ *Reply with the number (1-${limitResults.length})* to get details.`;

        const firstImage = limitResults[0].imageUrl || "https://placehold.co/600x400?text=No+Poster";
        const sentSearch = await client.sendMessage(from, { image: { url: firstImage }, caption: listText }, { quoted: mek });

        let detailsTimeout = null;
        let downloadTimeout = null;

        const cleanupDetails = () => {
            client.ev.off("messages.upsert", detailsHandler);
            if (detailsTimeout) clearTimeout(detailsTimeout);
        };

        // --- STEP 1: DETAILS HANDLER ---
        const detailsHandler = async (update) => {
            try {
                const msg = update.messages?.[0];
                if (!msg?.message) return;

                // Match chat JID
                const msgJid = msg.key.remoteJid;
                if (msgJid !== from) return;

                // Extract user text choice (Works for both reply and direct text)
                const textMsg = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
                const choice = textMsg.trim();
                const num = parseInt(choice);

                // Reject if not a valid number in range
                if (isNaN(num) || num < 1 || num > limitResults.length) return;

                cleanupDetails();
                await react("⏳");

                const selected = limitResults[num - 1];
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
                    return reply("❌ No download links available.");
                }

                let cap = `🎥 *${movieDetails.title || selected.title}*\n\n`;
                cap += `📋 *Type:* ${movieDetails.type || 'Movie'} | 📅 *Year:* ${movieDetails.year || 'N/A'}\n`;
                cap += `🗣️ *Language:* ${movieDetails.language || 'N/A'}\n\n`;
                cap += `*AVAILABLE DOWNLOADS:*\n`;
                
                downloads.forEach((dl, i) => {
                    cap += `*${i + 1}.* Quality: \`${dl.quality || 'HD'}\` | Size: \`${dl.size || 'N/A'}\`\n`;
                });
                cap += `\n⚡ *Reply with the download number (1-${downloads.length})* to start.`;

                const detailImg = movieDetails.posterImage || selected.imageUrl || "https://placehold.co/600x400?text=No+Poster";
                await client.sendMessage(from, { image: { url: detailImg }, caption: cap }, { quoted: msg });

                const cleanupDownload = () => {
                    client.ev.off("messages.upsert", downloadHandler);
                    if (downloadTimeout) clearTimeout(downloadTimeout);
                };

                // --- STEP 2: DOWNLOAD HANDLER ---
                const downloadHandler = async (up) => {
                    try {
                        const dlMsg = up.messages?.[0];
                        if (!dlMsg?.message) return;
                        if (dlMsg.key.remoteJid !== from) return;

                        const dlText = dlMsg.message.conversation || dlMsg.message.extendedTextMessage?.text || "";
                        const pick = dlText.trim();
                        const dlNum = parseInt(pick);

                        if (isNaN(dlNum) || dlNum < 1 || dlNum > downloads.length) return;

                        cleanupDownload();
                        await client.sendMessage(from, { react: { text: "📥", key: dlMsg.key } });

                        const selectedDl = downloads[dlNum - 1];
                        const targetFileUrl = selectedDl.pixelDrainUrl || selectedDl.url || selectedDl.downloadUrl;

                        if (!targetFileUrl) {
                            await react("❌");
                            return reply("❌ Direct download link could not be resolved.");
                        }

                        const cleanFileName = `${(movieDetails.title || selected.title || "Movie").replace(/[^a-zA-Z0-9]/g, "_")}_${selectedDl.quality || 'HD'}.mp4`;
                        const thumbBuffer = await getThumbnailBuffer(movieDetails.posterImage || selected.imageUrl);

                        const documentPayload = {
                            document: { url: targetFileUrl },
                            mimetype: "video/mp4",
                            fileName: cleanFileName,
                            caption: `🎬 *${movieDetails.title || selected.title}*\n🌟 Quality: ${selectedDl.quality || 'HD'}\n📦 Size: ${selectedDl.size || 'N/A'}`
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

                client.ev.on("messages.upsert", downloadHandler);
                downloadTimeout = setTimeout(cleanupDownload, 180000);

            } catch (detErr) {
                reply(`❌ Error: ${detErr.message}`);
            } finally {
                cleanupDetails();
            }
        };

        client.ev.on("messages.upsert", detailsHandler);
        detailsTimeout = setTimeout(cleanupDetails, 180000);

    } catch (e) {
        await react("❌");
        return reply(`❌ Error: ${e.message}`);
    }
});
