import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cmd({
    pattern: "cineflura",
    alias: ["cfl", "cinefluradl"],
    desc: "Search and download movies from Cineflura",
    category: "downloader",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react, socket, sock }) => {
    const client = socket || sock || conn;
    const apiKey = "VajiraOfc";
    const searchApiUrl = `https://vajiraofc-apis.vercel.app/api/cineflura/search`;
    const detailsApiUrl = `https://vajiraofc-apis.vercel.app/api/cineflura/details`;

    try {
        await react("🎬");

        if (!q) {
            return reply("❌ *Please enter movie name!* Example: `.cineflura Spiderman`");
        }

        const response = await axios.get(searchApiUrl, {
            params: { apikey: apiKey, q: q },
            timeout: 15000
        }).catch(err => ({ error: true, message: err.message }));

        if (response.error || !response.data || !response.data.success) {
            await react("❌");
            return reply(`🛸 *API Error:* ${response.message || 'Server error'}`);
        }

        const results = response.data.results || [];
        if (results.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found for "${q}"*`);
        }

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎬  *CINEFLURA SEARCH*  🎬 ┃\n`;
        listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n\n`;

        results.slice(0, 10).forEach((v, i) => {
            const title = v.title || 'Unknown';
            listText += `*[${i + 1}]* _${title.substring(0, 45)}_\n`;
            listText += `└─ 📊 Rating: ${v.rating || 'N/A'} | ${v.type || 'Movie'}\n\n`;
        });

        listText += `⚡ *REPLY TO THIS MESSAGE with item number (1-10)* to view details.\n\n`;
        listText += `> *© KAMRAN-MINI-BOT*`;

        const firstImage = results[0].imageUrl || "https://placehold.co/600x400?text=No+Poster";

        // Send Search List
        const searchMsg = await client.sendMessage(from, {
            image: { url: firstImage },
            caption: listText
        }, { quoted: mek });

        const searchMsgId = searchMsg.key.id;

        // STEP 1: DETAILS EVENT LISTENER
        const detailsListener = async (update) => {
            try {
                const incoming = update.messages?.[0];
                if (!incoming || !incoming.message) return;

                // Check if message is from same chat
                if (incoming.key.remoteJid !== from) return;

                // Check text input
                const text = (
                    incoming.message.conversation ||
                    incoming.message.extendedTextMessage?.text ||
                    ""
                ).trim();

                const num = parseInt(text);
                if (isNaN(num) || num < 1 || num > results.length) return;

                // Quoted Message Match Check (Ensures it's replying to search msg or active chat)
                const quotedId = incoming.message.extendedTextMessage?.contextInfo?.stanzaId;
                if (quotedId && quotedId !== searchMsgId) return;

                // Stop this listener
                client.ev.off("messages.upsert", detailsListener);

                // REACTION FOR SEARCHING/PROCESSING (TATOO IS HERE)
                await client.sendMessage(from, { react: { text: "⏳", key: incoming.key } });

                const selected = results[num - 1];

                const detailResponse = await axios.get(detailsApiUrl, {
                    params: { apikey: apiKey, url: selected.url },
                    timeout: 20000
                }).catch(() => null);

                if (!detailResponse || !detailResponse.data || !detailResponse.data.success) {
                    await client.sendMessage(from, { react: { text: "❌", key: incoming.key } });
                    return reply(`❌ *Error:* Movie details load nahi ho paayein.`);
                }

                const movieDetails = detailResponse.data.movie || {};
                const downloads = detailResponse.data.downloads || [];

                if (downloads.length === 0) {
                    await client.sendMessage(from, { react: { text: "❌", key: incoming.key } });
                    return reply("❌ Download links missing.");
                }

                let cap = `🎥 *${movieDetails.title || selected.title}*\n\n`;
                cap += `📅 *Year:* ${movieDetails.year || 'N/A'}\n`;
                cap += `🗣️ *Language:* ${movieDetails.language || 'N/A'}\n\n`;
                cap += `┌── DOWNLOAD OPTIONS ──┐\n`;

                downloads.forEach((dl, i) => {
                    cap += `┃ *[${i + 1}]* ${dl.quality || 'HD'} (${dl.size || 'N/A'})\n`;
                });
                cap += `└─────────────────────┘\n\n`;
                cap += `⚡ *REPLY TO THIS MESSAGE with quality number* to download file.`;

                const detailImg = movieDetails.posterImage || selected.imageUrl || "https://placehold.co/600x400?text=No+Poster";

                const detailMsg = await client.sendMessage(from, {
                    image: { url: detailImg },
                    caption: cap
                }, { quoted: incoming });

                const detailMsgId = detailMsg.key.id;

                // STEP 2: DOWNLOAD EVENT LISTENER
                const downloadListener = async (dlUpdate) => {
                    try {
                        const dlIncoming = dlUpdate.messages?.[0];
                        if (!dlIncoming || !dlIncoming.message) return;
                        if (dlIncoming.key.remoteJid !== from) return;

                        const dlText = (
                            dlIncoming.message.conversation ||
                            dlIncoming.message.extendedTextMessage?.text ||
                            ""
                        ).trim();

                        const dlNum = parseInt(dlText);
                        if (isNaN(dlNum) || dlNum < 1 || dlNum > downloads.length) return;

                        const dlQuotedId = dlIncoming.message.extendedTextMessage?.contextInfo?.stanzaId;
                        if (dlQuotedId && dlQuotedId !== detailMsgId) return;

                        client.ev.off("messages.upsert", downloadListener);

                        await client.sendMessage(from, { react: { text: "📥", key: dlIncoming.key } });

                        const selectedDl = downloads[dlNum - 1];
                        let targetFileUrl = selectedDl.pixelDrainUrl || selectedDl.url || selectedDl.downloadUrl;

                        if (!targetFileUrl) {
                            await client.sendMessage(from, { react: { text: "❌", key: dlIncoming.key } });
                            return reply("❌ File link invalid.");
                        }

                        const cleanFileName = `${(movieDetails.title || selected.title || "Movie").replace(/[^a-zA-Z0-9 ]/g, "_")}.mp4`;

                        await reply(`🚀 *Uploading File...*\nPlease wait!`);

                        // Send Document safely using streams (RAM clean)
                        await client.sendMessage(from, {
                            document: { url: targetFileUrl },
                            mimetype: "video/mp4",
                            fileName: cleanFileName,
                            caption: `🎬 *${movieDetails.title || selected.title}*\n📦 Quality: ${selectedDl.quality || 'HD'}`
                        }, { quoted: dlIncoming });

                        await client.sendMessage(from, { react: { text: "✅", key: dlIncoming.key } });

                    } catch (dlErr) {
                        console.error("Download Error:", dlErr);
                    }
                };

                client.ev.on("messages.upsert", downloadListener);
                setTimeout(() => client.ev.off("messages.upsert", downloadListener), 120000);

            } catch (detErr) {
                console.error("Details Error:", detErr);
            }
        };

        client.ev.on("messages.upsert", detailsListener);
        setTimeout(() => client.ev.off("messages.upsert", detailsListener), 120000);

    } catch (e) {
        console.error("Cineflura Command Error:", e);
        await react("❌");
        return reply(`❌ *Error:* ${e.message}`);
    }
});
