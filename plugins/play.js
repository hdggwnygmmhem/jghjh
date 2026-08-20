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
        listText += `⚡ *Reply with the item number* (1-${results.length}) to view details.\n\n`;
        listText += `> *© KAMRAN-MINI-BOT ッ*`;

        const firstImage = results[0].imageUrl || "https://placehold.co/600x400?text=No+Poster";

        const sentMsg = await client.sendMessage(from, {
            image: { url: firstImage },
            caption: listText
        }, { quoted: mek });

        const searchMsgId = sentMsg?.key?.id;

        // Function to extract text cleanly from any message format
        const extractText = (msg) => {
            if (!msg?.message) return "";
            return (
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                msg.message.imageMessage?.caption ||
                ""
            ).trim();
        };

        // STEP 1: DETAILS LISTENER
        const onDetailsReply = async (update) => {
            try {
                const incoming = update.messages?.[0];
                if (!incoming || !incoming.message) return;

                // Match Chat JID
                if (incoming.key.remoteJid !== from) return;

                const text = extractText(incoming);
                const num = parseInt(text);

                // Ignore non-numbers or out-of-range numbers
                if (isNaN(num) || num < 1 || num > results.length) return;

                // Turn off listener after getting valid input
                client.ev.off("messages.upsert", onDetailsReply);

                const selected = results[num - 1];
                if (!selected) return;

                await client.sendMessage(from, { react: { text: "⏳", key: incoming.key } });

                const detailResponse = await axios.get(detailsApiUrl, {
                    params: { apikey: apiKey, url: selected.url },
                    timeout: 30000
                }).catch(err => ({ error: true, message: err.message }));

                if (detailResponse.error || detailResponse.status !== 200 || !detailResponse.data || !detailResponse.data.success) {
                    await client.sendMessage(from, { react: { text: "❌", key: incoming.key } });
                    return reply(`❌ *Error:* Failed to pull details.`);
                }

                const movieDetails = detailResponse.data.movie || {};
                const downloads = detailResponse.data.downloads || [];

                if (downloads.length === 0) {
                    await client.sendMessage(from, { react: { text: "❌", key: incoming.key } });
                    return reply("❌ *Sorry:* No downloadable links found for this movie.");
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
                cap += `⚡ *Reply with download number* (1-${downloads.length}) to receive file.\n\n`;
                cap += `> *© KAMRAN-MINI-BOT ッ*`;

                const detailImg = movieDetails.posterImage || selected.imageUrl || "https://placehold.co/600x400?text=No+Poster";

                await client.sendMessage(from, {
                    image: { url: detailImg },
                    caption: cap
                }, { quoted: incoming });

                // STEP 2: DOWNLOAD LISTENER
                const onDownloadReply = async (dlUpdate) => {
                    try {
                        const dlMsg = dlUpdate.messages?.[0];
                        if (!dlMsg || !dlMsg.message) return;

                        if (dlMsg.key.remoteJid !== from) return;

                        const dlText = extractText(dlMsg);
                        const dlNum = parseInt(dlText);

                        if (isNaN(dlNum) || dlNum < 1 || dlNum > downloads.length) return;

                        client.ev.off("messages.upsert", onDownloadReply);

                        const selectedDl = downloads[dlNum - 1];
                        if (!selectedDl) return;

                        await client.sendMessage(from, { react: { text: "📥", key: dlMsg.key } });

                        let targetFileUrl = selectedDl.pixelDrainUrl || selectedDl.url || selectedDl.downloadUrl;

                        if (!targetFileUrl) {
                            await client.sendMessage(from, { react: { text: "❌", key: dlMsg.key } });
                            return reply("❌ *Error:* Direct download link could not be resolved.");
                        }

                        const cleanFileName = `${(movieDetails.title || selected.title || "Movie").replace(/[^a-zA-Z0-9 ]/g, "_")}_${selectedDl.quality || 'HD'}.mp4`;

                        await reply(`🚀 *Processing File...* \nSending video/document shortly!`);

                        let finalCaption = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                        finalCaption += `┃ 🎬 *${movieDetails.title || selected.title}*\n`;
                        finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┓\n\n`;
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
                        console.error("Download handling error:", dlErr);
                    }
                };

                client.ev.on("messages.upsert", onDownloadReply);
                setTimeout(() => client.ev.off("messages.upsert", onDownloadReply), 180000);

            } catch (detErr) {
                console.error("Details handling error:", detErr);
            }
        };

        client.ev.on("messages.upsert", onDetailsReply);
        setTimeout(() => client.ev.off("messages.upsert", onDetailsReply), 180000);

    } catch (e) {
        console.error("Cineflura command error:", e);
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
