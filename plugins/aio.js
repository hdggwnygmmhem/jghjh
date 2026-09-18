// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "sinhalasub",
    alias: ["sinhalasub3", "sinhalasub2"],
    desc: "Search and download movies or series from SinhalaSub using Vajira API",
    category: "download",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🎬 KAMRAN-MD SINHALASUB 🎬   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya movie ya series ka naam dein!*\n\n` +
                `> 📌 *Example:* \`.sinhalasub 2026\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const API_KEY = 'za6005338@gmail.com:vajira-90771';
        const BASE_URL = 'https://vajiraofc-apis.vercel.app/api/sinhalasub';

        const searchUrl = `${BASE_URL}/search?apikey=${encodeURIComponent(API_KEY)}&q=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchUrl, { timeout: 60000 });

        if (!searchRes.data?.success || !searchRes.data.results?.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Koi result nahi mila!*");
        }

        const results = searchRes.data.results.slice(0, 5);
        const firstImage = results[0]?.poster || results[0]?.imageUrl || results[0]?.image || 'https://i.imgur.com/3932mio.jpeg';
        
        // Clean title function to remove unwanted Sinhala characters if needed
        const cleanTitle = (rawTitle) => {
            if (!rawTitle) return 'Unknown';
            // Sirf English letters, numbers aur basic punctuation rakhne ke liye
            return rawTitle.split('|')[0].trim();
        };

        const resultsList = results.map((item, i) => { 
            const title = cleanTitle(item?.title); 
            return `*${i + 1} ┃ ${title}*`; 
        }).join('\n\n');

        const searchCaption = `
╔════════════════════════╗
║   🎬 SINHALASUB SEARCH 🎬   
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
            selectedItem = null, 
            episodesList = [],
            downloadsList = [], 
            itemTitle = '', 
            itemPoster = firstImage,
            timeout = null;

        const extractDownloads = (data) => {
            let links = [];
            if (!data) return links;
            if (Array.isArray(data.downloads)) links = data.downloads;
            else if (Array.isArray(data.download)) links = data.download;
            else if (data.downloadUrls && typeof data.downloadUrls === 'object') {
                links = Object.entries(data.downloadUrls).map(([qual, link]) => ({
                    quality: qual,
                    url: link,
                    size: 'N/A'
                }));
            }
            return links;
        };

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

                    selectedItem = results[choice - 1];
                    itemTitle = cleanTitle(selectedItem?.title);
                    const itemUrl = selectedItem?.url;

                    if (!itemUrl) {
                        await conn.sendMessage(from, { text: '❎ Invalid item URL.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    const detailsUrl = `${BASE_URL}/details?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(itemUrl)}`;
                    let detailsRes;
                    try {
                        detailsRes = await axios.get(detailsUrl, { timeout: 60000 });
                    } catch (apiErr) {
                        console.error('[SINHALASUB API ERROR] Details fetch failed:', apiErr.message);
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

                    itemPoster = resData?.metadata?.imageUrl || resData?.poster || selectedItem?.poster || firstImage;

                    if ((resData?.type?.toLowerCase() === 'tvshow' || resData?.type?.toLowerCase() === 'series') && Array.isArray(resData.episodes) && resData.episodes.length > 0) {
                        episodesList = resData.episodes;

                        const epListText = episodesList.map((ep, i) => {
                            return `*${i + 1} ┃ ${cleanTitle(ep?.title) || `Episode ${ep?.index || i + 1}`}*`;
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

                    downloadsList = extractDownloads(resData);

                    if (!downloadsList.length) {
                        await conn.sendMessage(from, { text: '❎ No download links available for this movie.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    const qualityList = downloadsList.map((qItem, i) => { 
                        return `*${i + 1} ┃📥 ${qItem?.quality || qItem?.name || 'Quality'} • ${qItem?.size || 'N/A'}*`; 
                    }).join('\n\n');

                    const qualityCaption = `
╔════════════════════════╗
║   🎬 SINHALASUB INFO 🎬  
╚════════════════════════╝

🎬 *Title:* ${itemTitle}
⭐ *Rating:* ${resData?.metadata?.imdbRating || resData?.meta?.rating || 'N/A'}
📅 *Year:* ${resData?.metadata?.year || 'N/A'}

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
                    if (!Array.isArray(episodesList) || choice < 1 || choice > episodesList.length) { 
                        await conn.sendMessage(from, { text: `❎ Select a valid episode number (1-${episodesList.length})` }, { quoted: received }); 
                        return; 
                    }

                    const selectedEp = episodesList[choice - 1];
                    itemTitle = `${itemTitle} - ${cleanTitle(selectedEp?.title) || `Ep ${selectedEp?.index || choice}`}`;
                    const epUrl = selectedEp?.url;

                    if (!epUrl) {
                        await conn.sendMessage(from, { text: '❎ Invalid episode URL.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    const epDetailsUrl = `${BASE_URL}/episode?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(epUrl)}`;
                    let epRes;
                    try {
                        epRes = await axios.get(epDetailsUrl, { timeout: 60000 });
                    } catch (apiErr) {
                        console.error('[SINHALASUB API ERROR] Episode fetch failed:', apiErr.message);
                        await conn.sendMessage(from, { text: '❎ API request failed while fetching episode.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    if (!epRes.data?.success) {
                        await conn.sendMessage(from, { text: '❎ Failed to fetch episode download links.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    downloadsList = extractDownloads(epRes.data);

                    if (!downloadsList.length) {
                        await conn.sendMessage(from, { text: '❎ No download links found for this episode.' }, { quoted: received });
                        cleanup();
                        return;
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
> 👑 *Powered by KAMRAN MD*`.trigger ? '' : ''.trim(); // formatting fixed

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
                    const finalUrl = selectedQuality?.url || selectedQuality?.link;

                    if (!finalUrl) {
                        await conn.sendMessage(from, { text: `❎ Download URL extraction failed.` }, { quoted: received });
                        cleanup();
                        return;
                    }

                    await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                    const qSize = selectedQuality?.size || 'N/A';
                    const qQuality = selectedQuality?.quality || selectedQuality?.name || 'HD';
                    const fileName = `${itemTitle.replace(/[^a-zA-Z0-9]/g, '_')} [${qQuality}] SinhalaSub.mp4`;

                    await conn.sendMessage(from, { 
                        document: { url: finalUrl }, 
                        mimetype: 'video/mp4', 
                        fileName: fileName, 
                        caption: `*${itemTitle}*\n💿 *Quality:* ${qQuality}\n📦 *Size:* ${qSize}\n\n> *👑 Powered by KAMRAN MD*` 
                    }, { quoted: received });

                    await conn.sendMessage(from, { react: { text: '✅', key: received.key } });
                    cleanup();
                }

            } catch (err) { 
                console.error('CRITICAL SINHALASUB HANDLER ERROR -->', err);
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
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } text: `❌ *Error:* ${e.message}` });
    }
});
