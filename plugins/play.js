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
    const { data } = await axios.get(url, { responseType: "arraybuffer", timeout: 5000 });
    return await sharp(data)
      .resize(300, 300)
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.error("Thumbnail error:", err.message);
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
async (conn, mek, m, { from, quoted, body, args, q, reply, react, socket, sock }) => {
    const client = socket || sock || conn;

    // API CONFIGURATION
    const apiKey = "VajiraOfc";
    const searchApiUrl = `https://vajiraofc-apis.vercel.app/api/cineflura/search`;
    const detailsApiUrl = `https://vajiraofc-apis.vercel.app/api/cineflura/details`;

    try {
        await react("🎬");

        if (!q) {
            return reply(
                "❌ *Opps! Title Missing* ❌\n\n" +
                "Please provide a movie name to search!\n" +
                "📌 *Example:* `.cineflura Interstellar`"
            );
        }

        await reply(`🔍 _Searching for *"${q}"* on Cineflura servers..._`);

        const response = await axios.get(searchApiUrl, {
            params: { apikey: apiKey, q: q },
            timeout: 30000
        }).catch(err => ({ error: true, message: err.message }));

        if (response.error || response.status !== 200 || !response.data) {
            await react("❌");
            return reply(`🛸 *API Error:* ${response.message || 'Server responded with an invalid status.'}`);
        }

        let results = null;
        if (response.data && response.data.success) {
            results = response.data.results || [];
        }

        if (!results || results.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found!*\nCineflura par *"${q}"* naam ki koi movie nahi mili.`);
        }

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎬  *CINEFLURA SEARCH*  🎬 ┃\n`;
        listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n`;
        listText += `✨ *Results Found:* ${results.length}\n\n`;
        listText += `┌─────────────────────┐\n`;

        results.forEach((v, i) => {
            const title = v.title || 'Unknown Title';
            const displayTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;
            listText += `┃ 🎥 *[${i + 1}]* _${displayTitle}_\n`;
            listText += `┃ └─ 📊 Rating: ${v.rating || 'N/A'} | ${v.type || 'Movie'}\n`;
            if (i !== results.length - 1) listText += `┃─────────────────────┃\n`;
        });

        listText += `└─────────────────────┘\n\n`;
        listText += `⚡ *Reply with the item number* to view download options.\n\n`;
        listText += `> *© KAMRAN-MINI-BOT ッ*`;

        const firstImage = results[0].imageUrl || "https://placehold.co/600x400?text=No+Poster";

        const sentSearch = await client.sendMessage(from, {
            image: { url: firstImage },
            caption: listText
        }, { quoted: mek });

        let detailsTimeout, downloadTimeout;

        const cleanupDetails = () => {
            if (client?.ev) client.ev.off("messages.upsert", detailsHandler);
            if (detailsTimeout) clearTimeout(detailsTimeout);
        };

        // ================= INTERACTIVE STEP: DETAILS HANDLER =================
        const detailsHandler = async (update) => {
            try {
                const msg = update.messages?.[0];
                if (!msg || !msg.message) return;

                // Match remote JID
                const msgChat = msg.key.remoteJid;
                if (msgChat !== from) return;

                // Extract text from any message type (text, extendedText, image, etc.)
                const choice = (
                    msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    msg.message.imageMessage?.caption ||
                    ""
                ).trim();

                const num = parseInt(choice);
                if (isNaN(num) || num < 1 || num > results.length) return;

                // Stop listening once valid number is processed
                cleanupDetails();

                const selected = results[num - 1];
                if (!selected) return;

                await react("⏳");

                const detailResponse = await axios.get(detailsApiUrl, {
                    params: { apikey: apiKey, url: selected.url },
                    timeout: 30000
                }).catch(err => ({ error: true, message: err.message }));

                if (detailResponse.error || detailResponse.status !== 200 || !detailResponse.data || !detailResponse.data.success) {
                    await react("❌");
                    return reply(`❌ *Error:* Failed to pull details (${detailResponse.message || 'API Error'}).`);
                }

                const movieDetails = detailResponse.data.movie || {};
                const downloads = detailResponse.data.downloads || [];

                if (downloads.length === 0) {
                    await react("❌");
                    return reply("❌ *Sorry:* No downloadable links were located for this selection.");
                }

                let cap = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                cap += `┃ 🎥 *${movieDetails.title || selected.title}*\n`;
                cap += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                cap += `📋 *Type:* \`${movieDetails.type || 'Movie'}\`\n`;
                cap += `📅 *Year:* ${movieDetails.year || 'N/A'}\n`;
                cap += `🌍 *Country:* ${movieDetails.country || 'N/A'}\n`;
                cap += `🗣️ *Language:* ${movieDetails.language || 'N/A'}\n`;
                cap += `🎭 *Genre:* ${movieDetails.genre || 'N/A'}\n`;
                cap += `🎬 *Director:* ${movieDetails.director || 'N/A'}\n\n`;
                
                if (movieDetails.story) {
                    const story = movieDetails.story.length > 200 ? movieDetails.story.substring(0, 200) + '...' : movieDetails.story;
                    cap += `📝 *Story:* \n_${story}_\n\n`;
                }
                
                cap += `┌───────── DOWNLOADS ─────────┐\n`;
                
                downloads.forEach((dl, i) => {
                    cap += `┃ 🔥 *[${i + 1}]* Quality: \`${dl.quality || 'HD'}\`\n`;
                    cap += `┃ └─ 📦 Size: \`${dl.size || 'Unknown'}\`\n`;
                    if (i !== downloads.length - 1) cap += `┃─────────────────────┃\n`;
                });

                cap += `└─────────────────────────────┘\n\n`;
                cap += `⚡ *Reply with a download number* to start downloading.\n\n`;
                cap += `> *© KAMRAN-MINI-BOT ッ*`;

                const detailImg = movieDetails.posterImage || selected.imageUrl || "https://placehold.co/600x400?text=No+Poster";

                const sentDetail = await client.sendMessage(from, {
                    image: { url: detailImg },
                    caption: cap
                }, { quoted: msg });

                const cleanupDownload = () => {
                    if (client?.ev) client.ev.off("messages.upsert", downloadHandler);
                    if (downloadTimeout) clearTimeout(downloadTimeout);
                };

                // ================= INTERACTIVE STEP: DOWNLOAD HANDLER =================
                const downloadHandler = async (up) => {
                    try {
                        const dlMsg = up.messages?.[0];
                        if (!dlMsg || !dlMsg.message) return;

                        const dlChat = dlMsg.key.remoteJid;
                        if (dlChat !== from) return;

                        const pick = (
                            dlMsg.message.conversation ||
                            dlMsg.message.extendedTextMessage?.text ||
                            dlMsg.message.imageMessage?.caption ||
                            ""
                        ).trim();

                        const dlNum = parseInt(pick);
                        if (isNaN(dlNum) || dlNum < 1 || dlNum > downloads.length) return;

                        const selectedDl = downloads[dlNum - 1];
                        if (!selectedDl) return;

                        cleanupDownload();

                        await client.sendMessage(from, { react: { text: "📥", key: dlMsg.key } });
                        
                        let targetFileUrl = selectedDl.pixelDrainUrl || selectedDl.url || selectedDl.downloadUrl;
                        
                        if (!targetFileUrl) {
                            await react("❌");
                            return reply("❌ *Error:* Direct download link could not be resolved.");
                        }

                        const cleanFileName = `${(movieDetails.title || selected.title || "Movie").replace(/[^a-zA-Z0-9 ]/g, "_")}_${selectedDl.quality || 'HD'}.mp4`;

                        await reply(`🚀 *Processing Cineflura File...* \nUploading document. Please wait!`);

                        let finalCaption = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                        finalCaption += `┃ 🎬 *${movieDetails.title || selected.title}*\n`;
                        finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                        finalCaption += `┃ 🌟 *Quality:* ${selectedDl.quality || 'HD'}\n`;
                        finalCaption += `┃ 📦 *Size:* ${selectedDl.size || 'N/A'}\n`;
                        finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                        finalCaption += `> *© KAMRAN-MINI-BOT ッ*`;

                        const thumbBuffer = await getThumbnailBuffer(movieDetails.posterImage || selected.imageUrl);
                        
                        let documentPayload = {
                            document: { url: targetFileUrl },
                            mimetype: "video/mp4",
                            fileName: cleanFileName,
                            caption: finalCaption
                        };

                        if (thumbBuffer && Buffer.isBuffer(thumbBuffer)) {
                            documentPayload.jpegThumbnail = thumbBuffer;
                        }

                        await client.sendMessage(from, documentPayload, { quoted: dlMsg });
                        await client.sendMessage(from, { react: { text: "✅", key: dlMsg.key } });

                    } catch (dlErr) {
                        console.error("Cineflura download error:", dlErr);
                        reply(`❌ An error occurred during file delivery: ${dlErr.message}`);
                    } finally {
                        cleanupDownload();
                    }
                };

                client.ev.on("messages.upsert", downloadHandler);
                downloadTimeout = setTimeout(cleanupDownload, 180000);

            } catch (detErr) {
                console.error("Cineflura details error:", detErr);
                reply(`❌ An error occurred while loading details: ${detErr.message}`);
            } finally {
                cleanupDetails();
            }
        };

        client.ev.on("messages.upsert", detailsHandler);
        detailsTimeout = setTimeout(cleanupDetails, 180000);

    } catch (e) {
        console.error("Cineflura command error:", e);
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
