// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "movie3",
    desc: "Search and download movies from CineSubz with interactive steps",
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

        // Multiple API Keys (Pehli expire hone par doosri chal jayegi)
        const API_KEYS = [
            '20a658ea9d74efb2',
            '12f85decd3d58102',
            '902cbc90b2291c53',
            '9fe12e22dd6795f4',
            'bf3cef33e2e1557c'
        ];
        
        const BASE_URL = 'https://api-dark-shan-yt.koyeb.app/movie';

        // Helper function for automatic API key fallback
        const fetchWithApi = async (endpoint, params = {}) => {
            let lastError = null;
            for (const key of API_KEYS) {
                try {
                    const queryParams = new URLSearchParams({ ...params, apikey: key });
                    const url = `${BASE_URL}${endpoint}?${queryParams.toString()}`;
                    const response = await axios.get(url, { timeout: 60000 });
                    
                    if (response.data && response.data.status) {
                        return response;
                    }
                } catch (err) {
                    lastError = err;
                    // Agar request fail ho ya key expire ho, toh loop next key par chala jayega
                    continue;
                }
            }
            throw lastError || new Error("All API keys failed.");
        };

        const searchRes = await fetchWithApi('/cinesubz-search', { q });

        if (!searchRes.data?.status || !searchRes.data.data?.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Koi movie nahi mili!*");
        }

        const results = searchRes.data.data.slice(0, 5);
        const firstImage = results[0].image;
        
        const resultsList = results.map((movie, i) => { 
            const title = movie.title.split('|')[0].trim(); 
            return `*${i + 1} ┃ ${title}*\n   🎬 Movie • ${movie.quality || 'N/A'}`; 
        }).join('\n\n');

        const searchCaption = `
╔════════════════════════╗
║   🎬 CINESUBZ SEARCH 🎬   
╚════════════════════════╝

${resultsList}

🔢 *Reply with a number to select movie* 👇

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by DOCTOR MD*`.trim();

        const searchMsg = await conn.sendMessage(from, { 
            image: { url: firstImage }, 
            caption: searchCaption 
        }, { quoted: mek });

        let step = 'movie', 
            lastMsgId = searchMsg.key.id, 
            selectedMovie = null, 
            downloads = null, 
            finalUrl = null, 
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
                    movieTitle = selectedMovie.title.split('|')[0].trim();

                    const infoRes = await fetchWithApi('/cinesubz-info', { url: selectedMovie.link });

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
                        image: { url: selectedMovie.image }, 
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

                    const downloadRes = await fetchWithApi('/cinesubz-download', { url: selectedQuality.link });

                    if (!downloadRes.data?.status || !downloadRes.data.data?.download) { 
                        await conn.sendMessage(from, { text: '❎ Failed to retrieve the download link.' }, { quoted: received }); 
                        cleanup(); 
                        return; 
                    }

                    const downloadInfo = downloadRes.data.data.download;
                    const directItem = downloadInfo.find(d => d.name === 'unknown') || downloadInfo[0];
                    finalUrl = directItem.url;

                    const formatCaption = `
╔════════════════════════╗
║   🎬 CINESUBZ FORMAT 🎬   
╚════════════════════════╝

🎬 *Title:* ${movieTitle}
💿 *Quality:* ${selectedQuality.quality}
📦 *Size:* ${selectedQuality.size}

🔢 *Reply with format number* 👇

*1 ┃ 📽️ Video Format*
*2 ┃ 📁 Document Format*

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

                    const formatMsg = await conn.sendMessage(from, { 
                        image: { url: selectedMovie.image }, 
                        caption: formatCaption 
                    }, { quoted: received });

                    step = 'format'; 
                    lastMsgId = formatMsg.key.id;

                } else if (step === 'format') {
                    if (choice < 1 || choice > 2) { 
                        await conn.sendMessage(from, { text: '❎ Please select 1 (Video) or 2 (Document).' }, { quoted: received }); 
                        return; 
                    }

                    await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                    const fileName = `${movieTitle} [${selectedQuality.quality}] CineSubz.mp4`;

                    if (choice === 2) {
                        await conn.sendMessage(from, { 
                            document: { url: finalUrl }, 
                            mimetype: 'video/mp4', 
                            fileName: fileName, 
                            caption: `*${movieTitle}*\n\n> *👑 Powered by KAMRAN MD*` 
                        }, { quoted: received });
                    } else {
                        await conn.sendMessage(from, { 
                            video: { url: finalUrl }, 
                            caption: `*${movieTitle}*\n\n> *👑 Powered by KAMRAN MD*` 
                        }, { quoted: received });
                    }

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
