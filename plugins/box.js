// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "moviedrive",
    alias: ["moviedrivebd", "drive"],
    desc: "Search and download movies or series from MovieDriveBD using Vajira API",
    category: "download",
    react: "🚀",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🚀 KAMRAN-MD MOVIEDRIVE 🚀  \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya movie ya series ka naam dein!*\n\n` +
                `> 📌 *Example:* \`.moviedrive 2026\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const API_KEY = 'za6005338@gmail.com:vajira-90771';
        const BASE_URL = 'https://vajiraofc-apis.vercel.app/api/moviedrivebd';

        const searchUrl = `${BASE_URL}/search?apikey=${encodeURIComponent(API_KEY)}&q=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchUrl, { timeout: 60000 });

        if (!searchRes.data?.success || !searchRes.data.results?.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Koi result nahi mila!*");
        }

        const results = searchRes.data.results.slice(0, 5);
        const firstImage = results[0]?.poster || results[0]?.image || 'https://i.imgur.com/3932mio.jpeg';
        
        const resultsList = results.map((item, i) => { 
            const title = item?.title || 'Unknown'; 
            return `*${i + 1} ┃ ${title}*`; 
        }).join('\n\n');

        const searchCaption = `
╔════════════════════════╗
║   🚀 MOVIEDRIVE SEARCH 🚀   
╚════════════════════════╝

${resultsList}

🔢 *Reply with a number to select* 👇

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

        const searchMsg = await conn.sendMessage(from, { 
            image: { url: firstImage }, 
            caption: searchCaption 
        }, { quoted: mek });

        let step = 'movie', 
            lastMsgId = searchMsg.key.id, 
            downloadsList = [], 
            episodesList = [],
            itemTitle = '', 
            itemUrl = '',
            itemPoster = firstImage,
            timeout = null;

        const handler = async (msgUpdate) => {
            let received = null;
            try {
                received = msgUpdate.messages[0];
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

                    const selectedItem = results[choice - 1];
                    itemTitle = selectedItem?.title || 'Movie';
                    itemUrl = selectedItem?.url;

                    if (!itemUrl) {
                        await conn.sendMessage(from, { text: '❎ Invalid item URL.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    const detailsUrl = `${BASE_URL}/details?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(itemUrl)}`;
                    console.log(`[MOVIEDRIVE DEBUG] Fetching details from: ${detailsUrl}`);

                    let detailsRes;
                    try {
                        detailsRes = await axios.get(detailsUrl, { timeout: 60000 });
                    } catch (apiErr) {
                        console.error('[MOVIEDRIVE API ERROR] Details fetch failed:', apiErr.message);
                        await conn.sendMessage(from, { text: '❎ API request failed or timed out while fetching details.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    const resData = detailsRes.data;
                    if (!resData?.success) { 
                        await conn.sendMessage(from, { text: '❎ API returned unsuccessful response for details.' }, { quoted: received }); 
                        cleanup(); 
                        return; 
                    }

                    const detailsData = resData.data || resData;
                    itemPoster = detailsData?.poster || detailsData?.imageUrl || selectedItem?.poster || firstImage;
                    
                    downloadsList = detailsData.downloads || detailsData.download || [];
                    episodesList = detailsData.episodes || [];

                    if (episodesList.length > 0) {
                        const epListText = episodesList.slice(0, 15).map((ep, i) => {
                            return `*${i + 1} ┃ ${ep?.title || `Episode ${i + 1}`}*`;
                        }).join('\n\n');

                        const epCaption = `
╔════════════════════════╗
║   📺 SELECT EPISODE 📺   
╚════════════════════════╝

🎬 *Series:* ${itemTitle}
📦 *Total Episodes:* ${episodesList.length}

🔢 *Reply with episode number* 👇

${epListText}

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

                        const epMsg = await conn.sendMessage(from, { 
                            image: { url: itemPoster }, 
                            caption: epCaption 
                        }, { quoted: received });

                        step = 'episode';
                        lastMsgId = epMsg.key.id;
                        return;
                    }

                    // Smart Download Link Resolver if downloads array is empty
                    if (!downloadsList.length) {
                        try {
                            const dlApiUrl = `${BASE_URL}/download?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(itemUrl)}`;
                            const dlRes = await axios.get(dlApiUrl, { timeout: 60000 });
                            if (dlRes.data?.success) {
                                const dData = dlRes.data.data || dlRes.data;
                                downloadsList = dData.downloads || dData.download || [];
                                if (dData.downloadUrl || dData.url || dData.file) {
                                    downloadsList.push({ quality: '1080p / 720p HD', size: 'N/A', url: dData.downloadUrl || dData.url || dData.file });
                                }
                            }
                        } catch (e) {
                            console.error('Download resolve error:', e.message);
                        }
                    }

                    if (!downloadsList.length) {
                        downloadsList = [
                            { quality: '1080p FHD', size: 'N/A', url: itemUrl },
                            { quality: '720p HD', size: 'N/A', url: itemUrl },
                            { quality: '480p SD', size: 'N/A', url: itemUrl }
                        ];
                    }

                    const qualityList = downloadsList.map((qItem, i) => { 
                        return `*${i + 1} ┃📥 ${qItem?.quality || qItem?.name || 'Quality'} • ${qItem?.size || 'N/A'}*`; 
                    }).join('\n\n');

                    const qualityCaption = `
╔════════════════════════╗
║   🚀 MOVIEDRIVE INFO 🚀   
╚════════════════════════╝

🎬 *Title:* ${itemTitle}
⭐ *Rating:* ${detailsData?.imdbRating || detailsData?.rating || 'N/A'}
📅 *Year:* ${detailsData?.releaseDate || detailsData?.year || 'N/A'}

🔢 *Reply with quality number* 👇

${qualityList}

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

                    const qualityMsg = await conn.sendMessage(from, { 
                        image: { url: itemPoster }, 
                        caption: qualityCaption 
                    }, { quoted: received });

                    step = 'quality'; 
                    lastMsgId = qualityMsg.key.id;

                } else if (step === 'episode') {
                    if (!episodesList || choice < 1 || choice > episodesList.length) { 
                        await conn.sendMessage(from, { text: `❎ Select a valid episode number (1-${episodesList.length})` }, { quoted: received }); 
                        return; 
                    }

                    const selectedEp = episodesList[choice - 1];
                    itemTitle = `${itemTitle} - ${selectedEp?.title || `Ep ${choice}`}`;
                    const epUrl = selectedEp?.url || itemUrl;

                    const detailsUrl = `${BASE_URL}/details?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(epUrl)}`;
                    let epRes;
                    try {
                        epRes = await axios.get(detailsUrl, { timeout: 60000 });
                    } catch (e) {
                        epRes = { data: { success: false } };
                    }

                    const epData = epRes.data?.data || epRes.data;
                    downloadsList = epData?.downloads || epData?.download || [];

                    if (!downloadsList.length) {
                        downloadsList = [{ quality: 'HD Episode', size: 'N/A', url: epUrl }];
                    }

                    const qualityList = downloadsList.map((qItem, i) => { 
                        return `*${i + 1} ┃📥 ${qItem?.quality || qItem?.name || 'Quality'} • ${qItem?.size || 'N/A'}*`; 
                    }).join('\n\n');

                    const qualityCaption = `
╔════════════════════════╗
║   📺 EPISODE INFO 📺    
╚════════════════════════╝

🎬 *Episode:* ${itemTitle}

🔢 *Reply with quality number* 👇

${qualityList}

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

                    const qualityMsg = await conn.sendMessage(from, { 
                        image: { url: itemPoster }, 
                        caption: qualityCaption 
                    }, { quoted: received });

                    step = 'quality'; 
                    lastMsgId = qualityMsg.key.id;

                } else if (step === 'quality') {
                    if (!downloadsList || choice < 1 || choice > downloadsList.length) { 
                        await conn.sendMessage(from, { text: `❎ Select a valid number (1-${downloadsList.length})` }, { quoted: received }); 
                        return; 
                    }

                    const selectedQuality = downloadsList[choice - 1];
                    let targetUrl = selectedQuality?.url || itemUrl;

                    await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                    // Final Direct Download Resolution via API
                    try {
                        const resolveUrl = targetUrl.startsWith('http') ? targetUrl : itemUrl;
                        const dlApiUrl = `${BASE_URL}/download?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(resolveUrl)}`;
                        console.log(`[MOVIEDRIVE DEBUG] Final resolving URL from: ${dlApiUrl}`);
                        const dlRes = await axios.get(dlApiUrl, { timeout: 60000 });
                        if (dlRes.data?.success) {
                            const dData = dlRes.data.data || dlRes.data;
                            targetUrl = dData.downloadUrl || dData.url || dData.file || dData.link || resolveUrl;
                        }
                    } catch (e) {
                        console.error('Final download resolution error:', e.message);
                    }

                    const qSize = selectedQuality?.size || 'N/A';
                    const qQuality = selectedQuality?.quality || selectedQuality?.name || 'HD';
                    const fileName = `${itemTitle.replace(/[^a-zA-Z0-9]/g, '_')} [${qQuality}] MovieDrive.mp4`;

                    await conn.sendMessage(from, { 
                        document: { url: targetUrl }, 
                        mimetype: 'video/mp4', 
                        fileName: fileName, 
                        caption: `*${itemTitle}*\n💿 *Quality:* ${qQuality}\n📦 *Size:* ${qSize}\n\n> *👑 Powered by KAMRAN MD*` 
                    }, { quoted: received });

                    await conn.sendMessage(from, { react: { text: '✅', key: received.key } });
                    cleanup();
                }

            } catch (err) { 
                console.error('CRITICAL MOVIEDRIVE HANDLER ERROR -->', err);
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
