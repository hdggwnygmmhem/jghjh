import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to decode Base64
const _d = (str) => Buffer.from(str, 'base64').toString('utf-8');

// ================= SIRF CONFIGURATION LOCKED =================
const BOT_NAME = Object.freeze(_d("SkFXQUQgTUQg44OD")); // "JAWAD MD ッ"
const API_KEY = Object.freeze(_d("VmFqaXJhT2Zj")); // "VajiraOfc"
const SEARCH_API_URL = Object.freeze(_d("aHR0cHM6Ly92YWppcmFvZmMtYXBpcy52ZXJjZWwuYXBwL2FwaS9jaW5lZmx1cmEvc2VhcmNo"));
const DETAILS_API_URL = Object.freeze(_d("aHR0cHM6Ly92YWppcmFvZmMtYXBpcy52ZXJjZWwuYXBwL2FwaS9jaW5lZmx1cmEvZGV0YWlscw=="));
const MAX_SIZE_MB = Object.freeze(1024); // 1GB Limit
// =============================================================

// Size parser to check 1GB limit
function parseSizeToMB(sizeStr) {
    if (!sizeStr || typeof sizeStr !== 'string') return 0;
    const match = sizeStr.match(/([\d.]+)\s*(MB|GB|KB)/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    if (unit === 'GB') return value * 1024;
    if (unit === 'MB') return value;
    if (unit === 'KB') return value / 1024;
    return 0;
}

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
    pattern: "cineflura",
    alias: ["cfl", "cinefluradl"],
    desc: "Search and download movies from Cineflura via API",
    category: "downloader",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, args, q, reply, react, socket, sock }) => {
    const client = socket || sock || conn;

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

        const response = await axios.get(SEARCH_API_URL, {
            params: { 
                apikey: API_KEY, 
                q: q
            },
            timeout: 30000
        });

        if (response.status !== 200 || !response.data) {
            await react("❌");
            return reply("🛸 *API Error:* Server responded with an invalid status.");
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
        listText += `> *© ${BOT_NAME}*`;

        const firstImage = results[0].imageUrl || "https://placehold.co/600x400?text=No+Poster";

        const sentSearch = await client.sendMessage(from, {
            image: { url: firstImage },
            caption: listText
        }, { quoted: mek });

        const searchMsgId = sentSearch.key.id;
        let detailsTimeout, downloadTimeout;

        // ================= INTERACTIVE STEP 1: DETAILS HANDLER =================
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

                const detailResponse = await axios.get(DETAILS_API_URL, {
                    params: { 
                        apikey: API_KEY, 
                        url: selected.url
                    },
                    timeout: 30000
                });

                if (detailResponse.status !== 200 || !detailResponse.data || !detailResponse.data.success) {
                    await react("❌");
                    return reply("❌ *Error:* Failed to pull details for this item.");
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
                    const sizeMB = parseSizeToMB(dl.size);
                    const isTooBig = sizeMB > MAX_SIZE_MB;
                    const statusTag = isTooBig ? " ⚠️ (Over 1GB)" : "";

                    cap += `┃ 🔥 *[${i + 1}]* Quality: \`${dl.quality || 'HD'}\`\n`;
                    cap += `┃ └─ 📦 Size: \`${dl.size || 'Unknown'}\`${statusTag}\n`;
                    if (i !== downloads.length - 1) cap += `┃─────────────────────┃\n`;
                });

                cap += `└─────────────────────────────┘\n\n`;
                cap += `⚡ *Reply with a download number* to start downloading.\n\n`;
                cap += `> *© ${BOT_NAME}*`;

                const detailImg = movieDetails.posterImage || selected.imageUrl || "https://placehold.co/600x400?text=No+Poster";

                const sentDetail = await client.sendMessage(from, {
                    image: { url: detailImg },
                    caption: cap
                }, { quoted: msg });

                const detailMsgId = sentDetail.key.id;

                // ================= INTERACTIVE STEP 2: DOWNLOAD HANDLER =================
                const downloadHandler = async (up) => {
                    try {
                        const dlMsg = up.messages[0];
                        if (!dlMsg?.message || dlMsg.key.remoteJid !== from) return;

                        const dlCtx = dlMsg.message.extendedTextMessage?.contextInfo || dlMsg.message.conversation?.contextInfo;
                        if (dlCtx?.stanzaId !== detailMsgId) return;

                        const pick = (dlMsg.message.conversation || dlMsg.message.extendedTextMessage?.text || "").trim();
                        const dlNum = parseInt(pick);
                        if (isNaN(dlNum) || dlNum < 1 || dlNum > downloads.length) return;

                        const selectedDl = downloads[dlNum - 1];
                        if (!selectedDl) return;

                        // Check 1GB Limit
                        const sizeMB = parseSizeToMB(selectedDl.size);
                        if (sizeMB > MAX_SIZE_MB) {
                            await react("🚫");
                            return reply(
                                `🚫 *File Exceeds 1GB Limit!*\n\n` +
                                `This file is *${selectedDl.size}*. To prevent the bot from crashing, files larger than 1GB cannot be downloaded.`
                            );
                        }

                        client.ev.off("messages.upsert", downloadHandler);
                        clearTimeout(downloadTimeout);

                        await client.sendMessage(from, { react: { text: "📥", key: dlMsg.key } });
                        
                        let targetFileUrl = selectedDl.pixelDrainUrl || selectedDl.url || selectedDl.downloadUrl;
                        
                        if (!targetFileUrl) {
                            await react("❌");
                            return reply("❌ *Error:* Direct download link could not be resolved.");
                        }

                        const cleanFileName = `${(movieDetails.title || selected.title || "Movie").replace(/[^a-zA-Z0-9 ]/g, "_")}_${selectedDl.quality || 'HD'}.mp4`;

                        await reply(`🚀 *Downloading & Processing File...*\nPlease wait, sending document soon!`);

                        // FIX: Axios ArrayBuffer for PixelDrain bypass
                        const fileRes = await axios.get(targetFileUrl, {
                            responseType: 'arraybuffer',
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                            },
                            timeout: 180000
                        });

                        const fileBuffer = Buffer.from(fileRes.data);

                        let finalCaption = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                        finalCaption += `┃ 🎬 *${movieDetails.title || selected.title}*\n`;
                        finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                        finalCaption += `┃ 🌟 *Quality:* ${selectedDl.quality || 'HD'}\n`;
                        finalCaption += `┃ 📦 *Size:* ${selectedDl.size || 'N/A'}\n`;
                        finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                        finalCaption += `> *© ${BOT_NAME}*`;

                        const thumbBuffer = await getThumbnailBuffer(movieDetails.posterImage || selected.imageUrl);
                        
                        let documentPayload = {
                            document: fileBuffer,
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
                        console.error("Cineflura download failed:", dlErr.message);
                        reply(`❌ An error occurred during file delivery: ${dlErr.message}`);
                    }
                };

                client.ev.on("messages.upsert", downloadHandler);
                
                downloadTimeout = setTimeout(() => {
                    client.ev.off("messages.upsert", downloadHandler);
                }, 300000);

            } catch (detErr) {
                console.error("Cineflura details failed:", detErr.message);
                reply(`❌ An error occurred while loading details: ${detErr.message}`);
            }
        };

        client.ev.on("messages.upsert", detailsHandler);
        
        detailsTimeout = setTimeout(() => {
            client.ev.off("messages.upsert", detailsHandler);
        }, 300000);

    } catch (e) {
        console.error("Cineflura Downloader error:", e.message);
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
