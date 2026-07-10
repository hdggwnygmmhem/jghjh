import { fileURLToPath } from 'url';
import axios from 'axios';
import sharp from 'sharp';
import { cmd } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

// 🔒 HIGH-LEVEL OBFUSCATED DATA STORAGE MATRIX (PERMANENT KEY UPDATED)
const _0xKMRMatrix = [
    "76616a6972612d56616a6972614f6666696369616c32303033", // 0: Permanent API Key ()
    "68747470733a2f2f76616a6972612d6f6666696369616c2d617069732e76657263656c2e6170702f6170692f6d6f766965626f7873", // 1: Search API
    "68747470733a2f2f76616a6972612d6f6666696369616c2d617069732e76657263656c2e6170702f6170692f6d6f766965626f78646c73", // 2: Download API
    "c2a9204b414d52414e2d4d494e492d424f5420e383bb", // 3: Credits
    "6d657373616765732e757073657274", // 4: messages.upsert
    "73656e644d657373616765", // 5: sendMessage
    "657874656e646564546578744d657373616765", // 6: extendedTextMessage
    "636f6e74657874496e666f", // 7: contextInfo
    "6172726179627566666572" // 8: arraybuffer
];

const _0xR = (idx) => Buffer.from(_0xKMRMatrix[idx], 'hex').toString('utf-8');

// 🛡️ INTEGRITY CORE GUARD
(() => {
    const verification = _0xR(3);
    if (!verification.includes("KAMRAN") || !verification.includes("MINI-BOT") || _0xKMRMatrix.length !== 9) {
        console.error("⚠️ SYSTEM SUSPENDED: Structural alteration detected.");
        process.exit(1);
    }
})();

async function getThumbnailBuffer(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
  try {
    const { data } = await axios.get(url, { responseType: _0xR(8), timeout: 10000 });
    return await sharp(data).resize(300, 300).jpeg({ quality: 80 }).toBuffer();
  } catch (err) {
    return null;
  }
}

cmd({
    pattern: "moviebox",
    alias: ["mbox", "movie"],
    category: "downloader",
    desc: "Search and download movies/series from MovieBox via API",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    const sysCredit = _0xR(3);
    if (!sysCredit.includes("KAMRAN")) return reply("🚨 Structural bypass locked.");

    const activeKey = _0xR(0);
    const apiSrc = _0xR(1);
    const apiDl = _0xR(2);
    const signFooter = `> *${sysCredit}*`;

    const react = async (emoji) => {
        try { await conn.sendMessage(from, { react: { text: emoji, key: mek.key } }); } catch (e) {}
    };

    try {
        await react("🎬");
        if (!q) return reply("❌ *Opps! Title Missing* ❌\n\nPlease provide a movie name!\n📌 *Example:* `.moviebox Interstellar`");

        await reply(`🔍 _Searching for *"${q}"* on MovieBox servers..._`);

        const response = await axios.get(apiSrc, {
            params: { apikey: activeKey, query: q, text: q },
            timeout: 30000
        });

        if (response.status !== 200 || !response.data) {
            await react("❌");
            return reply("🛸 *API Error:* Server responded with an invalid status.");
        }

        let results = null;
        if (response.data) {
            if (Array.isArray(response.data.data)) results = response.data.data;
            else if (typeof response.data.data === 'object' && response.data.data !== null) {
                for (let k in response.data.data) {
                    if (Array.isArray(response.data.data[k])) { results = response.data.data[k]; break; }
                }
            }
            if (!results) results = response.data.result || response.data.results || response.data.list || (Array.isArray(response.data) ? response.data : null);
        }

        if (results && Array.isArray(results) && results.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found!*\nMovieBox par *"${q}"* nahi mila.`);
        }

        if (!results || !Array.isArray(results)) {
            await react("❌");
            return reply(`🛸 *Parsing Error:* System format upgraded.`);
        }

        let listText = `🎬 *============= MOVIEBOX SEARCH =============* 🎬\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n`;
        listText += `✨ *Results Found:* ${results.length}\n\n`;
        listText += `───────────────────────────────\n`;

        results.forEach((v, i) => {
            listText += `🍿 *[${i + 1}]* _${v.title || v.name || 'Unknown Title'}_\n`;
            listText += `📅 *Type/Year:* \`${v.type || 'Movie'}\` | \`${v.year || 'N/A'}\`\n`;
            listText += `───────────────────────────────\n`;
        });

        listText += `\n⚡ *Reply with the item number* to view options.\n\n${signFooter}`;

        const firstImage = results[0].image || results[0].img || results[0].poster || results[0].thumbnail || results[0].thumb || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600";
        
        const sentSearch = await conn[_0xR(5)](from, { image: { url: firstImage }, caption: listText }, { quoted: mek });
        const searchMsgId = sentSearch.key.id;
        let detailsTimeout, downloadTimeout;

        // ================= INTERACTIVE STEP: DETAILS HANDLER =================
        const detailsHandler = async (update) => {
            try {
                const msg = update.messages[0];
                if (!msg?.message || msg.key.remoteJid !== from) return;

                const ctx = msg.message[_0xR(6)]?.contextInfo || msg.message.conversation?.contextInfo;
                if (ctx?.stanzaId !== searchMsgId) return;

                const choice = (msg.message.conversation || msg.message[_0xR(6)]?.text || "").trim();
                const num = parseInt(choice);
                if (isNaN(num) || num < 1 || num > results.length) return;
                
                const selected = results[num - 1];
                if (!selected) return;

                conn.ev.off(_0xR(4), detailsHandler);
                clearTimeout(detailsTimeout);
                await react("⏳");

                const detailResponse = await axios.get(apiDl, {
                    params: { apikey: activeKey, subjectId: selected.subjectId || selected.id || selected.subject_id, detailPath: selected.detailPath || selected.path || selected.detail_path, season: 0, episode: 0 },
                    timeout: 30000
                });

                if (detailResponse.status !== 200 || !detailResponse.data) {
                    await react("❌");
                    return reply("❌ *Error:* Failed to pull properties.");
                }

                const movieDetails = detailResponse.data.data || detailResponse.data.result || detailResponse.data;
                let dlLinks = [];
                if (movieDetails) {
                    if (Array.isArray(movieDetails.downloads)) dlLinks = movieDetails.downloads;
                    else if (Array.isArray(movieDetails.streams)) dlLinks = movieDetails.streams;
                    else if (Array.isArray(movieDetails.links)) dlLinks = movieDetails.links;
                }

                if (dlLinks.length === 0) {
                    await react("❌");
                    return reply("❌ *Sorry:* No download configurations mapped.");
                }

                let cap = `🎥 *${movieDetails.title || selected.title || selected.name}*\n`;
                cap += `───────────────────────────────\n\n`;
                cap += `🎭 *Type:* \`${movieDetails.type || 'Movie'}\`\n`;
                cap += `📅 *Year:* \`${movieDetails.year || 'N/A'}\`\n\n`;
                if (movieDetails.description) cap += `📝 *Description:* \n_${movieDetails.description}_\n\n`;
                
                cap += `📥 *AVAILABLE MIRRORS* 📥\n`;
                cap += `───────────────────────────────\n`;
                
                dlLinks.forEach((dl, i) => {
                    // 🛡️ SMART DEEP SIZE SCANNER & CONVERTER
                    let rawSize = dl.size || dl.fileSize || dl.filesize || dl.size_bytes || dl.downloadSize || dl.size_formatted;
                    let finalSize = 'Unknown';

                    if (rawSize) {
                        if (typeof rawSize === 'number') {
                            if (rawSize > 1073741824) finalSize = (rawSize / 1073741824).toFixed(2) + ' GB';
                            else if (rawSize > 1048576) finalSize = (rawSize / 1048576).toFixed(2) + ' MB';
                            else finalSize = (rawSize / 1024).toFixed(2) + ' KB';
                        } else if (typeof rawSize === 'string') {
                            if (/^\d+$/.test(rawSize.trim())) {
                                let parsedNum = parseInt(rawSize.trim());
                                if (parsedNum > 1073741824) finalSize = (parsedNum / 1073741824).toFixed(2) + ' GB';
                                else if (parsedNum > 1048576) finalSize = (parsedNum / 1048576).toFixed(2) + ' MB';
                                else finalSize = (parsedNum / 1024).toFixed(2) + ' KB';
                            } else {
                                finalSize = rawSize; // Agar already text format me ho (e.g. "1.2 GB")
                            }
                        }
                    }
                    
                    // Temp storage to pass parsed size forward safely
                    dl.smartParsedSize = finalSize;

                    cap += `⚡ *[${i + 1}]* Mirror ${i + 1}\n`;
                    cap += `🌟 *Quality:* \`${dl.quality || 'HD'}\` | ⚖️ *Size:* \`${finalSize}\`\n`;
                    cap += `───────────────────────────────\n`;
                });
                cap += `\n⚡ *Reply with a mirror number* to start downloading.\n\n${signFooter}`;

                const detailImg = movieDetails.image || movieDetails.img || movieDetails.poster || movieDetails.thumbnail || movieDetails.thumb || selected.image || selected.img || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600";

                const sentDetail = await conn[_0xR(5)](from, { image: { url: detailImg }, caption: cap }, { quoted: msg });
                const detailMsgId = sentDetail.key.id;

                // ================= INTERACTIVE STEP: DOWNLOAD HANDLER =================
                const downloadHandler = async (up) => {
                    try {
                        const dlMsg = up.messages[0];
                        if (!dlMsg?.message || dlMsg.key.remoteJid !== from) return;

                        const dlCtx = dlMsg.message[_0xR(6)]?.contextInfo || dlMsg.message.conversation?.contextInfo;
                        if (dlCtx?.stanzaId !== detailMsgId) return;

                        const pick = (dlMsg.message.conversation || dlMsg.message[_0xR(6)]?.text || "").trim();
                        const dlNum = parseInt(pick);
                        if (isNaN(dlNum) || dlNum < 1 || dlNum > dlLinks.length) return;

                        const selectedDl = dlLinks[dlNum - 1];
                        if (!selectedDl) return;

                        conn.ev.off(_0xR(4), downloadHandler);
                        clearTimeout(downloadTimeout);

                        await conn[_0xR(5)](from, { react: { text: "📥", key: dlMsg.key } });
                        
                        let targetFileUrl = selectedDl.direct || selectedDl.url || selectedDl.link || selectedDl.download || selectedDl.file;
                        if (!targetFileUrl && typeof selectedDl === 'object') {
                            for (let key in selectedDl) {
                                if (typeof selectedDl[key] === 'string' && (selectedDl[key].startsWith('http://') || selectedDl[key].startsWith('https://'))) {
                                    targetFileUrl = selectedDl[key]; break;
                                }
                            }
                        }

                        if (!targetFileUrl) {
                            await react("❌");
                            return reply("❌ *Error:* Direct routing failed.");
                        }

                        const cleanFileName = `${(movieDetails.title || selected.title || selected.name || "Movie").replace(/[^a-zA-Z0-9 ]/g, "_")}_${selectedDl.quality || 'HD'}.mp4`;
                        await reply(`🚀 *Processing MovieBox File...* \nUploading document. Please wait!`);

                        let finalCaption = `🎬 *${movieDetails.title || selected.title || selected.name}*\n`;
                        finalCaption += `───────────────────────────────\n`;
                        finalCaption += `🌟 *Quality:* ${selectedDl.quality || 'HD'}\n`;
                        finalCaption += `⚖️ *Size:* ${selectedDl.smartParsedSize || 'N/A'}\n`;
                        finalCaption += `───────────────────────────────\n\n${signFooter}`;
                        
                        const targetThumbUrl = movieDetails.image || movieDetails.img || movieDetails.poster || selected.image || selected.img;
                        const thumbBuffer = await getThumbnailBuffer(targetThumbUrl);
                        
                        let documentPayload = { document: { url: targetFileUrl }, mimetype: "video/mp4", fileName: cleanFileName, caption: finalCaption };
                        if (thumbBuffer && Buffer.isBuffer(thumbBuffer)) documentPayload.jpegThumbnail = thumbBuffer;

                        await conn[_0xR(5)](from, documentPayload, { quoted: dlMsg });
                        await conn[_0xR(5)](from, { react: { text: "✅", key: dlMsg.key } });

                    } catch (dlErr) {
                        conn.ev.off(_0xR(4), downloadHandler);
                    }
                };

                conn.ev.on(_0xR(4), downloadHandler);
                downloadTimeout = setTimeout(() => { conn.ev.off(_0xR(4), downloadHandler); }, 300000);

            } catch (detErr) {
                conn.ev.off(_0xR(4), detailsHandler);
            }
        };

        conn.ev.on(_0xR(4), detailsHandler);
        detailsTimeout = setTimeout(() => { conn.ev.off(_0xR(4), detailsHandler); }, 300000);

    } catch (e) {
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
