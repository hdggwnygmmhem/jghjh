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
    desc: "Search and download movies/series from MovieBox via API",
    category: "downloader",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, args, q, reply, react, socket, sock }) => {
    const client = socket || sock || conn;

    // API CONFIGURATION (UPDATED)
    const apiKey = "drkamran7864@gmail.com:vajira-32839";
    const searchApiUrl = `https://vajiraofc-apis.vercel.app/api/movieboxs`;
    const detailsApiUrl = `https://vajiraofc-apis.vercel.app/api/movieboxdl`;
    const downloadApiUrl = `https://vajiraofc-apis.vercel.app/api/movieboxd`;

    try {
        await react("🎬");

        if (!q) {
            return reply(
                "❌ *Opps! Title Missing* ❌\n\n" +
                "Please provide a movie or series name to search!\n" +
                "📌 *Example:* `.moviebox Interstellar`"
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

        let results = null;
        if (response.data) {
            if (Array.isArray(response.data.data)) {
                results = response.data.data;
            } else if (typeof response.data.data === 'object' && response.data.data !== null) {
                for (let key in response.data.data) {
                    if (Array.isArray(response.data.data[key])) {
                        results = response.data.data[key];
                        break;
                    }
                }
            }
            if (!results) {
                results = response.data.result || response.data.results || response.data.list || (Array.isArray(response.data) ? response.data : null);
            }
        }

        if (results && Array.isArray(results) && results.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found!*\nMovieBox par *"${q}"* naam ki koi movie nahi mili.`);
        }

        if (!results || !Array.isArray(results)) {
            await react("❌");
            return reply(`🛸 *Parsing Error:* API format changed.`);
        }

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎬  *MOVIEBOX SEARCH*   🎬 ┃\n`;
        listText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n`;
        listText += `✨ *Results Found:* ${results.length}\n\n`;
        listText += `┌─────────────────────────┐\n`;

        results.forEach((v, i) => {
            listText += `│ 🍿 *[${i + 1}]* _${v.title || v.name || 'Unknown Title'}_\n`;
            listText += `│ └─ 📅 *Type/Year:* ${v.type || 'Movie'} | ${v.year || 'N/A'}\n`;
            if (i !== results.length - 1) listText += `├─────────────────────────┤\n`;
        });

        listText += `└─────────────────────────┘\n\n`;
        listText += `⚡ *Reply with the item number* to view options.\n\n`;
        listText += `> *© KAMRAN-MINI-BOT ッ*`;

        const firstImage = results[0].image || results[0].poster || results[0].thumb || "https://placehold.co/600x400?text=No+Poster";

        const sentSearch = await client.sendMessage(from, {
            image: { url: firstImage },
            caption: listText
        }, { quoted: mek });

        const searchMsgId = sentSearch.key.id;
        let detailsTimeout, downloadTimeout;

        // ================= INTERACTIVE STEP: DETAILS HANDLER =================
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

                // Auto-detect season/episode agar series hai (warna 0 and 0)
                const isTvSeries = (selected.type && selected.type.toLowerCase().includes("tv")) || (selected.type && selected.type.toLowerCase().includes("series"));
                const seasonVal = isTvSeries ? 1 : 0;
                const episodeVal = isTvSeries ? 1 : 0;

                const detailResponse = await axios.get(detailsApiUrl, {
                    params: { 
                        apikey: apiKey, 
                        subjectId: selected.subjectId || selected.id || selected.subject_id, 
                        detailPath: selected.detailPath || selected.path || selected.detail_path,
                        season: seasonVal,
                        episode: episodeVal
                    },
                    timeout: 30000
                });

                if (detailResponse.status !== 200 || !detailResponse.data) {
                    await react("❌");
                    return reply("❌ *Error:* Failed to pull details for this item.");
                }

                const movieDetails = detailResponse.data.data || detailResponse.data.result || detailResponse.data;
                
                // Advanced Link Extractor (Fail-Proof)
                let dlLinks = [];
                if (movieDetails) {
                    // 1. Agar direct arrays mil rahe hain
                    if (Array.isArray(movieDetails.downloads)) dlLinks = movieDetails.downloads;
                    else if (Array.isArray(movieDetails.streams)) dlLinks = movieDetails.streams;
                    else if (Array.isArray(movieDetails.links)) dlLinks = movieDetails.links;
                    else if (Array.isArray(movieDetails.list)) dlLinks = movieDetails.list;
                    // 2. Agar object me se find karna pade (nested loop)
                    else if (typeof movieDetails === 'object') {
                        for (let key in movieDetails) {
                            if (Array.isArray(movieDetails[key])) {
                                dlLinks = movieDetails[key];
                                break;
                            } else if (movieDetails[key] && typeof movieDetails[key] === 'object') {
                                // Ek step aur gehra check karte hain (for nested responses)
                                for (let subKey in movieDetails[key]) {
                                    if (Array.isArray(movieDetails[key][subKey])) {
                                        dlLinks = movieDetails[key][subKey];
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }

                // Fallback: Agar upar ke tariko se links nahi mile, par root response khud array ho
                if (dlLinks.length === 0 && Array.isArray(movieDetails)) {
                    dlLinks = movieDetails;
                }

                if (dlLinks.length === 0) {
                    await react("❌");
                    return reply("❌ *Sorry:* No downloadable mirrors were located for this selection.");
                }

                let cap = `╭──────────────◆\n`;
                cap += `│ 🎥 *${movieDetails.title || selected.title || selected.name}*\n`;
                cap += `╰──────────────◆\n\n`;
                cap += `🎭 *Type:* \`${movieDetails.type || selected.type || 'Movie'}\`\n`;
                cap += `📅 *Year:* ${movieDetails.year || selected.year || 'N/A'}\n\n`;
                if (movieDetails.description) {
                    cap += `📝 *Description:* \n_${movieDetails.description}_\n\n`;
                }
                
                cap += `┏───────────────────────┓\n`;
                cap += `│   💾  AVAILABLE MIRRORS   │\n`;
                cap += `┗───────────────────────┛\n`;
                
                dlLinks.forEach((dl, i) => {
                    cap += `╭─ 📥 *[${i + 1}]* Mirror ${i + 1}\n`;
                    cap += `├─ 🌟 *Quality:* \`${dl.quality || dl.resolution || 'HD'}\`\n`;
                    cap += `╰─ ⚖️ *Size:* \`${dl.size || 'Unknown'}\`\n\n`;
                });

                cap += `⚡ *Reply with a mirror number* to start downloading.\n\n`;
                cap += `> *© KAMRAN-MINI-BOT ッ*`;

                const detailImg = movieDetails.image || movieDetails.poster || selected.image || "https://placehold.co/600x400?text=No+Poster";

                const sentDetail = await client.sendMessage(from, {
                    image: { url: detailImg },
                    caption: cap
                }, { quoted: msg });

                const detailMsgId = sentDetail.key.id;

                // ================= INTERACTIVE STEP: DOWNLOAD HANDLER =================
                const downloadHandler = async (up) => {
                    try {
                        const dlMsg = up.messages[0];
                        if (!dlMsg?.message || dlMsg.key.remoteJid !== from) return;

                        const dlCtx = dlMsg.message.extendedTextMessage?.contextInfo || dlMsg.message.conversation?.contextInfo;
                        if (dlCtx?.stanzaId !== detailMsgId) return;

                        const pick = (dlMsg.message.conversation || dlMsg.message.extendedTextMessage?.text || "").trim();
                        const dlNum = parseInt(pick);
                        if (isNaN(dlNum) || dlNum < 1 || dlNum > dlLinks.length) return;

                        const selectedDl = dlLinks[dlNum - 1];
                        if (!selectedDl) return;

                        client.ev.off("messages.upsert", downloadHandler);
                        clearTimeout(downloadTimeout);

                        await client.sendMessage(from, { react: { text: "📥", key: dlMsg.key } });
                        
                        // Hit download endpoint
                        const finalDlResponse = await axios.get(downloadApiUrl, {
                            params: {
                                apikey: apiKey,
                                subjectId: selected.subjectId || selected.id || selected.subject_id,
                                detailPath: selected.detailPath || selected.path || selected.detail_path,
                                season: seasonVal,
                                episode: episodeVal
                            },
                            timeout: 30000
                        });

                        const dlData = finalDlResponse.data?.data || finalDlResponse.data?.result || finalDlResponse.data;
                        
                        // Ultra Safe Direct URL Extraction
                        let targetFileUrl = selectedDl.direct || selectedDl.url || selectedDl.link || selectedDl.download || selectedDl.file;
                        
                        if (!targetFileUrl && dlData) {
                            targetFileUrl = dlData.direct || dlData.url || dlData.link || dlData.download || dlData.file;
                        }

                        if (!targetFileUrl && typeof selectedDl === 'object') {
                            for (let key in selectedDl) {
                                if (typeof selectedDl[key] === 'string' && (selectedDl[key].startsWith('http://') || selectedDl[key].startsWith('https://'))) {
                                    targetFileUrl = selectedDl[key];
                                    break;
                                }
                            }
                        }

                        if (!targetFileUrl) {
                            await react("❌");
                            return reply("❌ *Error:* Direct download link could not be resolved.");
                        }

                        const cleanFileName = `${(movieDetails.title || selected.title || selected.name || "Movie").replace(/[^a-zA-Z0-9 ]/g, "_")}_${selectedDl.quality || 'HD'}.mp4`;

                        await reply(`🚀 *Processing MovieBox File...* \nUploading document. Please wait!`);

                        let finalCaption = `╭───────────────────◆\n`;
                        finalCaption += `│ 🎬 *${movieDetails.title || selected.title || selected.name}*\n`;
                        finalCaption += `├───────────────────◆\n`;
                        finalCaption += `│ 🌟 *Quality:* ${selectedDl.quality || 'HD'}\n`;
                        finalCaption += `│ ⚖️ *Size:* ${selectedDl.size || 'N/A'}\n`;
                        finalCaption += `╰───────────────────◆\n\n`;
                        finalCaption += `> *© KAMRAN-MINI-BOT ッ*`;

                        const thumbBuffer = await getThumbnailBuffer(movieDetails.image || movieDetails.poster || selected.image);
                        
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
                        console.error("MovieBox download failed:", dlErr.message);
                        reply(`❌ An error occurred during file delivery: ${dlErr.message}`);
                    }
                };

                client.ev.on("messages.upsert", downloadHandler);
                
                downloadTimeout = setTimeout(() => {
                    client.ev.off("messages.upsert", downloadHandler);
                }, 300000);

            } catch (detErr) {
                console.error("MovieBox details failed:", detErr.message);
                reply(`❌ An error occurred while loading details: ${detErr.message}`);
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
