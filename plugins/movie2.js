// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "cineverse",
    desc: "Search and download movies from CineVerse without API key",
    category: "download",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🎬 KAMRAN-MD CINEVERSE 🎬   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya movie ka naam dein!*\n\n` +
                `> 📌 *Example:* \`.cineverse Avatar\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const BASE_URL = 'https://api-dark-shan-yt.koyeb.app/movie';

        const searchUrl = `${BASE_URL}/cineverse-search?q=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchUrl, { timeout: 60000 });

        if (!searchRes.data?.status || !searchRes.data.data?.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Koi movie nahi mili!*");
        }

        const results = searchRes.data.data.slice(0, 5);
        const firstImage = results[0].image || results[0].thumbnail || '';
        
        const resultsList = results.map((movie, i) => { 
            const title = movie.title || movie.name || 'Unknown'; 
            return `*${i + 1} ┃ ${title}*`; 
        }).join('\n\n');

        const searchCaption = `
╔════════════════════════╗
║   🎬 CINEVERSE SEARCH 🎬   
╚════════════════════════╝

${resultsList}

🔢 *Reply with a number to select movie* 👇

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

        const searchMsg = await conn.sendMessage(from, { 
            image: { url: firstImage || 'https://i.imgur.com/3932mio.jpeg' }, 
            caption: searchCaption 
        }, { quoted: mek });

        let lastMsgId = searchMsg.key.id, 
            selectedMovie = null, 
            movieTitle = '', 
            timeout = null;

        const handler = async (msgUpdate) => {
            try {
                const received = msgUpdate.messages[0];
                if (!received) return;
                
                const fromId = received.key.remoteJid || received.key.participant;
                if (fromId !== from) return;

                const quotedId = received.message?.extendedTextMessage?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== lastMsgId) return;

                const text = received.message?.conversation || received.message?.extendedTextMessage?.text;
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

                await conn.sendMessage(from, { react: { text: '⏳', key: received.key } });

                selectedMovie = results[choice - 1];
                movieTitle = selectedMovie.title || selectedMovie.name || 'Movie';
                
                // Fixed: Check all possible properties for movie link/url from search result
                const movieLink = selectedMovie.url || selectedMovie.link || selectedMovie.href;

                if (!movieLink) {
                    await conn.sendMessage(from, { text: '❎ Movie link not found in object.' }, { quoted: received });
                    cleanup();
                    return;
                }

                const downloadUrl = `${BASE_URL}/cineverse-download?url=${encodeURIComponent(movieLink)}`;
                const downloadRes = await axios.get(downloadUrl, { timeout: 60000 });

                if (!downloadRes.data?.status || !downloadRes.data.data) {
                    await conn.sendMessage(from, { text: '❎ Failed to retrieve download links.' }, { quoted: received });
                    cleanup();
                    return;
                }

                const dlData = downloadRes.data.data;
                
                // Robust extraction for download link
                let finalUrl = null;
                if (typeof dlData === 'string') {
                    finalUrl = dlData;
                } else if (Array.isArray(dlData)) {
                    finalUrl = dlData[0]?.url || dlData[0]?.link || dlData[0]?.download_url || dlData[0];
                } else {
                    finalUrl = dlData.download_url || dlData.url || dlData.link || dlData.dl_link || dlData.result;
                }

                if (!finalUrl || typeof finalUrl !== 'string') {
                    await conn.sendMessage(from, { text: '❎ Direct video link extraction failed.' }, { quoted: received });
                    cleanup();
                    return;
                }

                await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                const fileName = `${movieTitle} CineVerse.mp4`;

                await conn.sendMessage(from, { 
                    document: { url: finalUrl }, 
                    mimetype: 'video/mp4', 
                    fileName: fileName, 
                    caption: `*${movieTitle}*\n\n> *👑 Powered by KAMRAN MD*` 
                }, { quoted: received });

                await conn.sendMessage(from, { react: { text: '✅', key: received.key } });
                cleanup();

            } catch (err) { 
                console.error('CineVerse handler error:', err); 
                cleanup(); 
            }
        };

        const cleanup = () => { 
            if (timeout) clearTimeout(timeout); 
            conn.ev.off('messages.upsert', handler); 
        };

        conn.ev.on('messages.upsert', handler);
        timeout = setTimeout(() => cleanup(), 60 * 1000);

    } catch (e) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ *Kuch galat ho gaya, kripya thodi der baad koshish karein!*");
    }
});
