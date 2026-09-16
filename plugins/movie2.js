// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "cineverse",
    desc: "Search and download movies from CineVerse with interactive steps",
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
            const title = movie.title ? movie.title.split('|')[0].trim() : (movie.name || 'Unknown'); 
            return `*${i + 1} ┃ ${title}*\n   🎬 Type • ${movie.type || 'Movie'} • ${movie.quality || 'N/A'}`; 
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

        let step = 'movie', 
            lastMsgId = searchMsg.key.id, 
            selectedMovie = null, 
            downloads = null, 
            movieLinksMap = {}, 
            movieTitle = '', 
            movieSize = '',
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
                    const movieLink = selectedMovie.url || selectedMovie.link || selectedMovie.href;

                    const downloadUrl = `${BASE_URL}/cineverse-download?url=${encodeURIComponent(movieLink)}`;
                    const downloadRes = await axios.get(downloadUrl, { timeout: 60000 });

                    if (!downloadRes.data?.status || !downloadRes.data.data) { 
                        await conn.sendMessage(from, { text: '❎ Failed to retrieve download links.' }, { quoted: received }); 
                        cleanup(); 
                        return; 
                    }

                    const dlData = downloadRes.data.data;
                    movieSize = dlData.size || 'N/A';
                    downloads = dlData.download || (Array.isArray(dlData) ? dlData : [dlData]);

                    if (!downloads || downloads.length === 0) {
                        await conn.sendMessage(from, { text: '❎ No download links found.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    movieLinksMap = {};
                    downloads.forEach((qItem, index) => {
                        movieLinksMap[index + 1] = {
                            url: qItem.url || qItem.link,
                            name: qItem.name || 'Quality'
                        };
                    });

                    const qualityList = downloads.map((qItem, i) => { 
                        const name = qItem.name || 'Quality';
                        return `*${i + 1} ┃📥 ${name.toUpperCase()} • ${movieSize}*`; 
                    }).join('\n\n');

                    const qualityCaption = `
╔════════════════════════╗
║   🎬 CINEVERSE INFO 🎬   
╚════════════════════════╝

🎬 *Title:* ${movieTitle}
📦 *Size:* ${movieSize}
⭐ *Rating:* ${selectedMovie.rating || 'N/A'}
🎞️ *Quality:* ${selectedMovie.quality || 'N/A'}

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
                    if (!movieLinksMap[choice]) { 
                        await conn.sendMessage(from, { text: `❎ Select a valid quality number!` }, { quoted: received }); 
                        return; 
                    }

                    const selectedQuality = movieLinksMap[choice];
                    global.tempFinalUrl = selectedQuality.url;
                    global.tempSourceName = selectedQuality.name;

                    if (!global.tempFinalUrl) {
                        await conn.sendMessage(from, { text: '❎ Download URL extraction failed.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    const formatCaption = `
╔════════════════════════╗
║   🎬 CINEVERSE FORMAT 🎬   
╚════════════════════════╝

🎬 *Title:* ${movieTitle}
📦 *Size:* ${movieSize}
💿 *Source:* ${global.tempSourceName.toUpperCase()}

🔢 *Reply with format number* 👇

*1 ┃ 📽️ Video Format*
*2 ┃ 📁 Document Format*

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

                    const formatMsg = await conn.sendMessage(from, { 
                        image: { url: selectedMovie.image || firstImage }, 
                        caption: formatCaption 
                    }, { quoted: received });

                    step = 'format'; 
                    lastMsgId = formatMsg.key.id;

                } else if (step === 'format') {
                    if (choice !== 1 && choice !== 2) { 
                        await conn.sendMessage(from, { text: 'Please select 1 (Video) or 2 (Document).' }, { quoted: received }); 
                        return; 
                    }

                    let finalDownloadUrl = global.tempFinalUrl;
                    if (!finalDownloadUrl) {
                        await conn.sendMessage(from, { text: '❎ Direct link missing, please search again.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    // Agar URL redirect wala hai toh real file link trace karne ke liye HEAD/GET request
                    try {
                        const headRes = await axios.head(finalDownloadUrl, { maxRedirects: 5, validateStatus: () => true });
                        if (headRes.request?.res?.responseUrl) {
                            finalDownloadUrl = headRes.request.res.responseUrl;
                        }
                    } catch (_) {}

                    await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                    const fileName = `${movieTitle} [${movieSize}] CineVerse.mp4`;

                    if (choice === 2) {
                        await conn.sendMessage(from, { 
                            document: { url: finalDownloadUrl }, 
                            mimetype: 'video/mp4', 
                            fileName: fileName, 
                            caption: `*${movieTitle}*\n📦 *Size:* ${movieSize}\n\n> *👑 Powered by KAMRAN MD*` 
                        }, { quoted: received });
                    } else {
                        await conn.sendMessage(from, { 
                            video: { url: finalDownloadUrl }, 
                            caption: `*${movieTitle}*\n📦 *Size:* ${movieSize}\n\n> *👑 Powered by KAMRAN MD*` 
                        }, { quoted: received });
                    }

                    await conn.sendMessage(from, { react: { text: '✅', key: received.key } });
                    cleanup();
                }

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
