// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "moviebox",
    alias: ["mb", "movie", "msearch"],
    desc: "Search and download movies or series using MovieBox Pro API",
    category: "download",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🎬 KAMRAN-MD MOVIEBOX 🎬   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya movie ya series ka naam dein!*\n\n` +
                `> 📌 *Example:* \`.moviebox Spiderman brand new day\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const BASE_URL = 'https://api.omegatech.app/api/movie/MovieBox-pro';
        const searchUrl = `${BASE_URL}?action=search&keyword=${encodeURIComponent(q)}`;
        
        let searchRes;
        try {
            searchRes = await axios.get(searchUrl, { timeout: 60000 });
        } catch (apiErr) {
            console.error('[MOVIEBOX API ERROR] Search failed:', apiErr.message);
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *API request failed or timed out!*");
        }

        const resData = searchRes.data;
        if (!resData?.success || !resData?.data?.results?.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Koi result nahi mila!*");
        }

        const results = resData.data.results.slice(0, 5);
        const firstImage = results[0]?.cover?.url || 'https://i.imgur.com/3932mio.jpeg';
        
        const resultsList = results.map((item, i) => { 
            const title = item?.title || 'Unknown'; 
            const year = item?.releaseDate ? item.releaseDate.split('-')[0] : 'N/A';
            const rating = item?.imdbRatingValue ? `⭐ ${item.imdbRatingValue}` : '';
            return `*${i + 1} ┃ ${title}* (${year}) ${rating}`; 
        }).join('\n\n');

        const searchCaption = `
╔════════════════════════╗
║   🎬 MOVIEBOX SEARCH 🎬   
╚════════════════════════╝

${resultsList}

🔢 *Reply with a number to select download* 👇

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

        const searchMsg = await conn.sendMessage(from, { 
            image: { url: firstImage }, 
            caption: searchCaption 
        }, { quoted: mek });

        let lastMsgId = searchMsg.key.id, 
            timeout = null;

        const handler = async (msgUpdate) => {
            let received = null;
            try {
                received = msgUpdate.messages[0];
                if (!received || !received.message) return;
                
                const fromId = received.key.remoteJid || received.key.participant;
                if (fromId !== from) return;

                const quotedId = received.message?.extendedTextMessage?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== lastMsgId) return;

                // Turant cleanup kar do taaki dobara event trigger na ho
                cleanup();

                const text = received.message?.conversation || received.message?.extendedTextMessage?.text || received.message?.imageMessage?.caption;
                if (!text) return;

                const choice = parseInt(text.trim());
                if (isNaN(choice)) { 
                    await conn.sendMessage(from, { text: '❎ Please enter a valid number.' }, { quoted: received }); 
                    return; 
                }

                if (choice < 1 || choice > results.length) { 
                    await conn.sendMessage(from, { text: `❎ Select a valid number (1-${results.length})` }, { quoted: received }); 
                    return; 
                }

                await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                const selectedItem = results[choice - 1];
                const itemTitle = selectedItem?.title || 'Movie';
                const downloadUrl = selectedItem?.proxyDownload || selectedItem?.proxyStream;

                if (!downloadUrl) {
                    await conn.sendMessage(from, { text: '❎ Download link not available for this item.' }, { quoted: received });
                    return;
                }

                const rating = selectedItem?.imdbRatingValue || 'N/A';
                const genre = selectedItem?.genre || 'N/A';
                const releaseDate = selectedItem?.releaseDate || 'N/A';
                const fileName = `${itemTitle.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;

                await conn.sendMessage(from, { 
                    document: { url: downloadUrl }, 
                    mimetype: 'video/mp4', 
                    fileName: fileName, 
                    caption: `╔════════════════════════╗\n` +
                             `║   🎬 MOVIE DOWNLOAD 🎬   \n` +
                             `╚════════════════════════╝\n\n` +
                             `🎬 *Title:* ${itemTitle}\n` +
                             `⭐ *Rating:* ${rating}\n` +
                             `🎭 *Genre:* ${genre}\n` +
                             `📅 *Release:* ${releaseDate}\n\n` +
                             `> *👑 Powered by KAMRAN MD*` 
                }, { quoted: received });

                await conn.sendMessage(from, { react: { text: '✅', key: received.key } });

            } catch (err) { 
                console.error('CRITICAL MOVIEBOX HANDLER ERROR -->', err);
                if (received) {
                    await conn.sendMessage(from, { text: `❎ *System Error:* ${err.message}` }, { quoted: received });
                }
                cleanup(); 
            }
        };

        const cleanup = () => { 
            if (timeout) clearTimeout(timeout); 
            conn.ev.off('messages.upsert', handler); 
        };

        conn.ev.on('messages.upsert', handler);
        timeout = setTimeout(() => cleanup(), 5 * 60 * 1000);

    } catch (e) {
        console.error('CRITICAL COMMAND ERROR -->', e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ *Error:* ${e.message}`);
    }
});
