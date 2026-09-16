// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "cinesubz",
    desc: "Search and download movies from CineSubz without API key",
    category: "download",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🎬 KAMRAN-MD CINESUBZ 🎬   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya movie ka naam dein!*\n\n` +
                `> 📌 *Example:* \`.cinesubz Avatar\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const BASE_URL = 'https://api-dark-shan-yt.koyeb.app/movie';

        // Free endpoints without API key requirement
        const searchUrl = `${BASE_URL}/cinesubz-search?q=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchUrl, { timeout: 60000 });

        if (!searchRes.data?.status || !searchRes.data.data?.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Koi movie nahi mili!*");
        }

        const results = searchRes.data.data.slice(0, 5);
        const firstImage = results[0].image || results[0].thumbnail || '';
        
        const resultsList = results.map((movie, i) => { 
            const title = movie.title ? movie.title.split('|')[0].trim() : (movie.name || 'Unknown'); 
            return `*${i + 1} ┃ ${title}*\n   🎬 Quality • ${movie.quality || 'N/A'}`; 
        }).join('\n\n');

        const searchCaption = `
╔════════════════════════╗
║   🎬 CINESUBZ SEARCH 🎬   
╚════════════════════════╝

${resultsList}

🔢 *Reply with a number to select movie* 👇

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

        const searchMsg = await conn.sendMessage(from, { 
            image: { url: firstImage || 'https://i.imgur.com/3932mio.jpeg' }, 
            caption: searchCaption 
        }, { quoted: mek });

        let step = 'movie',
            lastMsgId = searchMsg.key.id, 
            selectedMovie = null, 
            downloads = null, 
            selectedQuality = null, 
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

                await conn.sendMessage(from, { react: { text: '⏳', key: received.key } });

                if (step === 'movie') {
                    if (choice < 1 || choice > results.length) { 
                        await conn.sendMessage(from, { text: `❎ Select a valid number (1-${results.length})` }, { quoted: received }); 
                        return; 
                    }

                    selectedMovie = results[choice - 1];
                    movieTitle = selectedMovie.title ? selectedMovie.title.split('|')[0].trim() : 'Movie';
                    const movieLink = selectedMovie.link || selectedMovie.url;

                    const infoUrl = `${BASE_URL}/cinesubz-info?url=${encodeURIComponent(movieLink)}`;
                    const infoRes = await axios.get(infoUrl, { timeout: 60000 });

                    if (!infoRes.data?.status || !infoRes.data.data?.downloads) { 
                        await conn.sendMessage(from, { text: '❎ No download links found for this movie.' }, { quoted: received }); 
                        cleanup(); 
                        return; 
                    }

                    downloads = infoRes.data.data.downloads;
                    const info = infoRes.data.data;

                    const qualityList = downloads.map((qItem, i) => { 
                        return `*${i + 1} ┃📥 ${qItem.quality} • ${qItem.size} • ${qItem.language || 'English'}*`; 
                    }).join('\n\n');

                    const qualityCaption = `
╔════════════════════════╗
║   🎬 CINESUBZ INFO 🎬   
╚════════════════════════╝

🎬 *Title:* ${movieTitle}
⭐ *Rating:* ${info.rating || 'N/A'}
📅 *Year:* ${info.year || 'N/A'}
⏱️ *Duration:* ${info.duration || 'N/A'}

🔢 *Reply with quality number* 👇

${qualityList}

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

                    const qualityMsg = await conn.sendMessage(from, { 
                        image: { url: selectedMovie.image || firstImage }, 
                        caption: qualityCaption 
                    }, { quoted: received });

                    step = 'quality'; 
                    lastMsgId = qualityMsg.key.id;

                } else if (step === 'quality') {
                    if (!downloads || choice < 1 || choice > downloads.length) { 
                        await conn.sendMessage(from, { text: `❎ Select a valid number (1-${downloads.length})` }, { quoted: received }); 
                        return; 
                    }

                    selectedQuality = downloads[choice - 1];
                    const linkToFetch = Array.isArray(selectedQuality.link) ? selectedQuality.link[0] : selectedQuality.link;

                    const downloadUrl = `${BASE_URL}/cinesubz-download?url=${encodeURIComponent(linkToFetch)}`;
                    const downloadRes = await axios.get(downloadUrl, { timeout: 60000 });

                    if (!downloadRes.data?.status || !downloadRes.data.data?.download) { 
                        await conn.sendMessage(from, { text: '❎ Failed to retrieve the download link.' }, { quoted: received }); 
                        cleanup(); 
                        return; 
                    }

                    const downloadInfo = downloadRes.data.data.download;
                    const directItem = (Array.isArray(downloadInfo) ? downloadInfo.find(d => d.name === 'unknown' || d.url) : downloadInfo) || downloadInfo[0];
                    const finalUrl = directItem?.url || directItem;

                    if (!finalUrl) {
                        await conn.sendMessage(from, { text: '❎ Download URL extraction failed.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                    const fileName = `${movieTitle} [${selectedQuality.quality}] CineSubz.mp4`;

                    await conn.sendMessage(from, { 
                        document: { url: finalUrl }, 
                        mimetype: 'video/mp4', 
                        fileName: fileName, 
                        caption: `*${movieTitle}*\n\n> *👑 Powered by KAMRAN MD*` 
                    }, { quoted: received });

                    await conn.sendMessage(from, { react: { text: '✅', key: received.key } });
                    cleanup();
                }

            } catch (err) { 
                console.error('CineSubz handler error:', err); 
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
