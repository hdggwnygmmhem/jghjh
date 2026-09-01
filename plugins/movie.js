import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base64 decode function
const b64 = (s) => Buffer.from(s, 'base64').toString('utf-8');

async function getThumbnailBuffer(url) {
  if (!url) return null;
  try {
    const { data } = await axios.get(url, { responseType: "arraybuffer" });
    return await sharp(data)
      .resize(300, 300)
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.error(b64("RXJyb3IgcHJvY2Vzc2luZyB0aHVtYm5haWw6"), err.message || err);
    return null;
  }
}

cmd({
    pattern: b64("Y2luZWZsdXJh"),
    alias: [b64("Y2Zs"), b64("Y2luZWZsdXJhZGw=")],
    desc: b64("U2VhcmNoIGFuZCBkb3dubG9hZCBtb3ZpZXM="),
    category: b64("ZG93bmxvYWRlcg=="),
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, args, q, reply, react, socket, sock }) => {
    const client = socket || sock || conn;

    // HIDDEN API CONFIG
    const apiKey = b64("VmFqaXJhT2Zj");
    const searchApiUrl = b64("aHR0cHM6Ly92YWppcmFvZmMtYXBpcy52ZXJjZWwuYXBwL2FwaS9jaW5lZmx1cmEvc2VhcmNo");
    const detailsApiUrl = b64("aHR0cHM6Ly92YWppcmFvZmMtYXBpcy52ZXJjZWwuYXBwL2FwaS9jaW5lZmx1cmEvZGV0YWlscw==");

    try {
        await react("🎬");

        if (!q) {
            return reply(
                b64("4pCcIE9wcHMhIFRpdGxlIE1pc3Npbmcg4pCcCgoKUGxlYXNlIHByb3ZpZGUgYSBtb3ZpZSBuYW1lIHRvIHNlYXJjaCEKIArigKIgRXhhbXBsZTogLmNpbmVmbHVyYSBJbnRlcnN0ZWxsYXI=")
            );
        }

        await reply(b64("8J+SiCAgU2VhcmNoaW5nIGZvciAi") + q + b64("IiBvbiBDbmVmUHJ1cGxlIHNlcnZlcnMuLi4="));

        const response = await axios.get(searchApiUrl, {
            params: { 
                apikey: apiKey, 
                q: q
            },
            timeout: 30000
        });

        if (response.status !== 200 || !response.data) {
            await react("❌");
            return reply(b64("8J+NgCAqQVBJIEVycm9yKjogU2VydmVyIHJlc3BvbmRlZCB3aXRoIGFuIGludmFsaWQgc3RhdHVzLg=="));
        }

        let results = null;
        if (response.data && response.data.success) {
            results = response.data.results || [];
        }

        if (!results || results.length === 0) {
            await react("❌");
            return reply(b64("8J+NgCAqTm8gUmVzdWx0cyBGb3VuZCEqCgpDaW5lZmx1cmEgcGFyICI") + q + b64("IiBuYW0ga2kgY29pIG1vdmllIG5haGkgbWlsaS4="));
        }

        let listText = b64("4pKQ4pCUIO+4j+KAnCBfIENJTkVGTFVQQSBTQUVSRCAgXyAi4pKQ4pCU4pCcCg==") + "\n\n";
        listText += b64("8J+UpSBRdWVyeTogYA==") + q.toUpperCase() + "`\n";
        listText += b64("4oKqIFJlc3VsdHMgRm91bmQ6IA==") + results.length + "\n\n";
        listText += b64("4pKQ4pCUIO+4j+CAnQ==") + "\n";

        results.forEach((v, i) => {
            const title = v.title || 'Unknown Title';
            const displayTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;
            listText += `┃ 🎥 *[${i + 1}]* _${displayTitle}_\n`;
            listText += `┃ └─ 📊 Rating: ${v.rating || 'N/A'} | ${v.type || 'Movie'}\n`;
            if (i !== results.length - 1) listText += `┃─────────────────────┃\n`;
        });

        listText += b64("4pKQ4pCUIO+4j+CAnQ==") + "\n\n";
        listText += b64("4pW1IFJlcGx5IHdpdGggdGhlIGl0ZW0gbnVtYmVyIHRvIHZpZXcgZG93bmxvYWQgb3B0aW9ucy4KCj4gKiDDikFNUkFOLU1JTkktQk9UICDimIs=");
        const firstImage = results[0].imageUrl || "https://placehold.co/600x400?text=No+Poster";

        const sentSearch = await client.sendMessage(from, {
            image: { url: firstImage },
            caption: listText
        }, { quoted: mek });

        const searchMsgId = sentSearch.key.id;
        let detailsTimeout, downloadTimeout;

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

                const detailResponse = await axios.get(detailsApiUrl, {
                    params: { 
                        apikey: apiKey, 
                        url: selected.url
                    },
                    timeout: 30000
                });

                if (detailResponse.status !== 200 || !detailResponse.data || !detailResponse.data.success) {
                    await react("❌");
                    return reply(b64("4pCcIEVycm9yOiBGYWlsZWQgdG8gcHVsbCBkZXRhaWxzIGZvciB0aGlzIGl0ZW0u4pCc"));
                }

                const movieDetails = detailResponse.data.movie || {};
                const downloads = detailResponse.data.downloads || [];

                if (downloads.length === 0) {
                    await react("❌");
                    return reply(b64("4pCcIFNvcnJ5OiBObyBkb3dubG9hZGFibGUgbGlua3Mgd2VyZSBsb2NhdGVkIGZvciB0aGlzIHNlbGVjdGlvbi7igJw="));
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
                cap += b64("4pW1IFJlcGx5IHdpdGggYSBkb3dubG9hZCBudW1iZXIgdG8gc3RhcnQgZG93bmxvYWRpbmcuCgo+ICog4IMgS0FNUkFOLU1JTkktQk9UICDimIs=");

                const detailImg = movieDetails.posterImage || selected.imageUrl || "https://placehold.co/600x400?text=No+Poster";

                const sentDetail = await client.sendMessage(from, {
                    image: { url: detailImg },
                    caption: cap
                }, { quoted: msg });

                const detailMsgId = sentDetail.key.id;

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
                        
                        let targetFileUrl = selectedDl.pixelDrainUrl || selectedDl.url || selectedDl.downloadUrl;
                        
                        if (!targetFileUrl) {
                            await react("❌");
                            return reply(b64("4pCcIEVycm9yOiBEaXJlY3QgZG93bmxvYWQgbGluayBjb3VsZCBub3QgYmUgcmVzb2x2ZWQu4pCc"));
                        }

                        const cleanFileName = `${(movieDetails.title || selected.title || "Movie").replace(/[^a-zA-Z0-9 ]/g, "_")}_${selectedDl.quality || 'HD'}.mp4`;

                        await reply(b64("8J+agCBQcm9jZXNzaW5nIENpbmVmTHVyYSBGaWxlLi4uIAoKVXBsb2FkaW5nIGRvY3VtZW50LiBQbGVhc2Ugd2FpdCE="));

                        let finalCaption = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
                        finalCaption += `┃ 🎬 *${movieDetails.title || selected.title}*\n`;
                        finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                        finalCaption += `┃ 🌟 *Quality:* ${selectedDl.quality || 'HD'}\n`;
                        finalCaption += `┃ 📦 *Size:* ${selectedDl.size || 'N/A'}\n`;
                        finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                        finalCaption += b64("PiAqIMCBSEFNUkFOLU1JTkktQk9UIOKYiw==");

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
                        console.error(b64("Q2luZWZsdXJhIGRvd25sb2FkIGZhaWxlZDo="), dlErr.message);
                        reply(b64("4pCcIEFuIGVycm9yIG9jY3VycmVkIGR1cmluZyBmaWxlIGRlbGl2ZXJ5OiAi") + dlErr.message + '"');
                    }
                };

                client.ev.on("messages.upsert", downloadHandler);
                
                downloadTimeout = setTimeout(() => {
                    client.ev.off("messages.upsert", downloadHandler);
                }, 300000);

            } catch (detErr) {
                console.error(b64("Q2luZWZsdXJhIGRldGFpbHMgZmFpbGVkOiA="), detErr.message);
                reply(b64("4pCcIEFuIGVycm9yIG9jY3VycmVkIHdoaWxlIGxvYWRpbmcgZGV0YWlsczog") + detErr.message);
            }
        };

        client.ev.on("messages.upsert", detailsHandler);
        
        detailsTimeout = setTimeout(() => {
            client.ev.off("messages.upsert", detailsHandler);
        }, 300000);

    } catch (e) {
        console.error(b64("Q2luZWZsdXJhIERvd25sb2FkZXIgZXJyb3I6IA=="), e.message);
        await react("❌");
        return reply(b64("4pCcIEVycm9yIFByb2Nlc3NpbmcgUmVxdWVzdDog") + e.message);
    }
});
