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

// Helper function to extract and flatten all download links dynamically
function extractDownloadLinks(data) {
  if (!data) return [];
  
  let candidates = data.downloads || data.links || data.dl_links || data.downloadLinks || data.qualities || data.servers || [];
  
  // If links are formatted as a key-value object (e.g., {"480p": [...], "720p": [...]})
  if (typeof candidates === 'object' && !Array.isArray(candidates)) {
    let flatList = [];
    for (const [key, val] of Object.entries(candidates)) {
      if (Array.isArray(val)) {
        val.forEach(item => {
          if (typeof item === 'object') {
            flatList.push({ ...item, quality: item.quality || item.title || key });
          } else if (typeof item === 'string') {
            flatList.push({ url: item, quality: key });
          }
        });
      } else if (typeof val === 'object' && val !== null) {
        flatList.push({ ...val, quality: val.quality || val.title || key });
      } else if (typeof val === 'string') {
        flatList.push({ url: val, quality: key });
      }
    }
    return flatList;
  }
  
  if (Array.isArray(candidates)) {
    let flatList = [];
    candidates.forEach(item => {
      if (typeof item === 'string') {
        flatList.push({ url: item, quality: 'HD' });
      } else if (item && typeof item === 'object') {
        // Handle nested servers inside a quality block
        if (Array.isArray(item.links || item.servers || item.urls)) {
          const subLinks = item.links || item.servers || item.urls;
          subLinks.forEach(sub => {
            flatList.push({
              url: typeof sub === 'string' ? sub : (sub.url || sub.link),
              quality: item.quality || item.title || item.name || 'HD',
              size: item.size || sub.size || 'Unknown'
            });
          });
        } else {
          flatList.push(item);
        }
      }
    });
    return flatList;
  }

  return [];
}

cmd({
    pattern: "moviedrive",
    alias: ["mdd", "moviedrivebd"],
    desc: "Search and download movies from MovieDriveBD API",
    category: "downloader",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, args, q, reply, react, socket, sock }) => {
    const client = socket || sock || conn;

    const apiKey = "VajiraOfc";
    const searchApiUrl = `https://vajiraofc-apis.vercel.app/api/moviedrivebd/search`;
    const detailsApiUrl = `https://vajiraofc-apis.vercel.app/api/moviedrivebd/details`;
    const downloadApiUrl = `https://vajiraofc-apis.vercel.app/api/moviedrivebd/download`;

    try {
        await react("🎬");

        if (!q) {
            return reply(
                "❌ *Opps! Title Missing* ❌\n\n" +
                "Please provide a movie name to search!\n" +
                "📌 *Example:* `.moviedrive 2026`"
            );
        }

        await reply(`🔍 _Searching for *"${q}"* on MovieDriveBD servers..._`);

        const response = await axios.get(searchApiUrl, {
            params: { apikey: apiKey, q: q },
            timeout: 30000
        });

        if (response.status !== 200 || !response.data) {
            await react("❌");
            return reply("🛸 *API Error:* Server responded with an invalid status.");
        }

        let results = response.data.results || response.data.result || response.data.data || (Array.isArray(response.data) ? response.data : []);

        if (!results || results.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found!*\nMovieDriveBD par *"${q}"* naam ki koi movie nahi mili.`);
        }

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎬  *MOVIEDRIVEBD SEARCH*  🎬 ┃\n`;
        listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n`;
        listText += `✨ *Results Found:* ${results.length}\n\n`;
        listText += `┌─────────────────────┐\n`;

        results.forEach((v, i) => {
            const title = v.title || v.name || 'Unknown Title';
            const displayTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;
            listText += `┃ 🎥 *[${i + 1}]* _${displayTitle}_\n`;
            listText += `┃ └─ 📊 Type: ${v.type || 'Movie'}\n`;
            if (i !== results.length - 1) listText += `┃─────────────────────┃\n`;
        });

        listText += `└─────────────────────┘\n\n`;
        listText += `⚡ *Reply with the item number* to view options.\n\n`;
        listText += `> *© KAMRAN-MINI-BOT ッ*`;

        const firstImage = results[0].img || results[0].image || results[0].poster || "https://placehold.co/600x400?text=No+Poster";

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

                const targetDetailUrl = selected.url || selected.link || selected.href;

                const detailResponse = await axios.get(detailsApiUrl, {
                    params: { apikey: apiKey, url: targetDetailUrl },
                    timeout: 30000
                });

                if (detailResponse.status !== 200 || !detailResponse.data) {
                    await react("❌");
                    return reply("❌ *Error:* Failed to load details for this item.");
                }

                const resData = detailResponse.data;
                const movieData = resData.result || resData.movie || resData.data || resData;
                
                // Extract downloads using the robust flattener
                const downloads = extractDownloadLinks(movieData).concat(extractDownloadLinks(resData));

                if (!downloads || downloads.length === 0) {
                    await react("❌");
                    return reply("❌ *Sorry:* No download mirrors located for this item.");
                }

                let cap = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                cap += `┃ 🎥 *${movieData.title || selected.title}*\n`;
                cap += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                
                if (movieData.synopsis || movieData.story || movieData.description) {
                    const storyText = movieData.synopsis || movieData.story || movieData.description;
                    const story = storyText.length > 200 ? storyText.substring(0, 200) + '...' : storyText;
                    cap += `📝 *Story:* \n_${story}_\n\n`;
                }
                
                cap += `┌───────── DOWNLOADS ─────────┐\n`;
                
                downloads.forEach((dl, i) => {
                    const qName = dl.quality || dl.title || dl.name || dl.server || 'HD Stream';
                    const qSize = dl.size || dl.fileSize || 'Unknown';
                    cap += `┃ 🔥 *[${i + 1}]* Quality: \`${qName}\`\n`;
                    cap += `┃ └─ 📦 Size: \`${qSize}\`\n`;
                    if (i !== downloads.length - 1) cap += `┃─────────────────────┃\n`;
                });

                cap += `└─────────────────────────────┘\n\n`;
                cap += `⚡ *Reply with a download number* to start downloading.\n\n`;
                cap += `> *© KAMRAN-MINI-BOT ッ*`;

                const detailImg = movieData.img || movieData.poster || movieData.image || selected.img || "https://placehold.co/600x400?text=No+Poster";

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

                        client.ev.off("messages.upsert", downloadHandler);
                        clearTimeout(downloadTimeout);

                        await client.sendMessage(from, { react: { text: "📥", key: dlMsg.key } });
                        await reply(`🚀 *Resolving MovieDriveBD Link...*\nFetching binary stream. Please wait!`);

                        const linkToResolve = selectedDl.url || selectedDl.link || selectedDl.href;

                        const finalDlRes = await axios.get(downloadApiUrl, {
                            params: { apikey: apiKey, url: linkToResolve },
                            timeout: 45000
                        });

                        const dlPayload = finalDlRes.data.result || finalDlRes.data || {};
                        const directUrl = dlPayload.url || dlPayload.downloadUrl || dlPayload.link || dlPayload.directUrl || dlPayload.file;

                        if (!directUrl) {
                            await react("❌");
                            return reply("❌ *Error:* Direct file download link could not be generated.");
                        }

                        const qualityLabel = selectedDl.quality || selectedDl.title || 'HD';
                        const cleanFileName = `${(movieData.title || selected.title || "Movie").replace(/[^a-zA-Z0-9 ]/g, "_")}_${qualityLabel.replace(/[^a-zA-Z0-9]/g, "")}.mp4`;

                        let finalCaption = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                        finalCaption += `┃ 🎬 *${movieData.title || selected.title}*\n`;
                        finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                        finalCaption += `┃ 🌟 *Quality:* ${qualityLabel}\n`;
                        finalCaption += `┃ 📦 *Size:* ${selectedDl.size || dlPayload.size || 'N/A'}\n`;
                        finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                        finalCaption += `> *© KAMRAN-MINI-BOT ッ*`;

                        const fileStream = await axios.get(directUrl, {
                            responseType: 'stream',
                            headers: { 'User-Agent': 'Mozilla/5.0' }
                        });

                        const thumbBuffer = await getThumbnailBuffer(movieData.img || selected.img);
                        
                        let documentPayload = {
                            document: { stream: fileStream.data },
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
                        console.error("MovieDriveBD download failed:", dlErr.message);
                        reply(`❌ An error occurred during file delivery: ${dlErr.message}`);
                    }
                };

                client.ev.on("messages.upsert", downloadHandler);
                
                downloadTimeout = setTimeout(() => {
                    client.ev.off("messages.upsert", downloadHandler);
                }, 300000);

            } catch (detErr) {
                console.error("MovieDriveBD details failed:", detErr.message);
                reply(`❌ An error occurred while loading details: ${detErr.message}`);
            }
        };

        client.ev.on("messages.upsert", detailsHandler);
        
        detailsTimeout = setTimeout(() => {
            client.ev.off("messages.upsert", detailsHandler);
        }, 300000);

    } catch (e) {
        console.error("MovieDriveBD Downloader error:", e.message);
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
