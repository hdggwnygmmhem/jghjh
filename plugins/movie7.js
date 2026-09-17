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
        console.log(`[SINHALASUB DEBUG] Command triggered with query: "${q}"`);
        
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
        const firstImage = results[0]?.poster || results[0]?.image || 'https://i.imgur.com/3932mio.jpeg';
        
        const resultsList = results.map((item, i) => { 
            const title = item?.title || 'Unknown'; 
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

        console.log(`[SINHALASUB DEBUG] Search message sent successfully. Message ID: ${lastMsgId}`);

        const extractDownloads = (data) => {
            let links = [];
            if (Array.isArray(data.download)) links = data.download;
            else if (Array.isArray(data.downloads)) links = data.downloads;
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
                
                console.log(`[SINHALASUB DEBUG] Incoming reply message. Quoted ID: ${quotedId}, Expected ID: ${lastMsgId}`);

                if (!quotedId || quotedId !== lastMsgId) return;

                const text = received.message?.conversation || received.message?.extendedTextMessage?.text;
                if (!text) return;

                console.log(`[SINHALASUB DEBUG] Valid reply received: "${text}" at step: ${step}`);

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
                    itemTitle = selectedItem?.title || 'Media';
                    const itemUrl = selectedItem?.url;

                    if (!itemUrl) {
                        await conn.sendMessage(from, { text: '❎ Invalid item URL.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    const detailsUrl = `${BASE_URL}/details?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(itemUrl)}`;
                    const detailsRes = await axios.get(detailsUrl, { timeout: 60000 });

                    if (!detailsRes.data?.success || !detailsRes.data.data) { 
                        await conn.sendMessage(from, { text: '❎ Failed to fetch details from API.' }, { quoted: received }); 
                        cleanup(); 
                        return; 
                    }

                    const detailsData = detailsRes.data.data;
                    itemPoster = detailsData?.poster || selectedItem?.poster || firstImage;

                    if (detailsData?.type === 'tvshow' && Array.isArray(detailsData.episodes) && detailsData.episodes.length > 0) {
                        episodesList = detailsData.episodes;

                        const epListText = episodesList.map((ep, i) => {
                            return `*${i + 1} ┃ ${ep?.title || `Episode ${ep?.index || i + 1}`}* (${ep?.date || 'N/A'})`;
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
                        console.log(`[SINHALASUB DEBUG] Switched to episode step. New Message ID: ${lastMsgId}`);
                        return;
                    }

                    downloadsList = extractDownloads(detailsData);

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
⭐ *Rating:* ${detailsData?.meta?.rating || 'N/A'}
📅 *Year:* ${detailsData?.meta?.year || 'N/A'}

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
                    console.log(`[SINHALASUB DEBUG] Switched to quality step. New Message ID: ${lastMsgId}`);

                } else if (step === 'episode') {
                    if (!Array.isArray(episodesList) || choice < 1 || choice > episodesList.length) { 
                        await conn.sendMessage(from, { text: `❎ Select a valid episode number (1-${episodesList.length})` }, { quoted: received }); 
                        return; 
                    }

                    const selectedEp = episodesList[choice - 1];
                    itemTitle = `${itemTitle} - ${selectedEp?.title || `Ep ${selectedEp?.index || choice}`}`;
                    const epUrl = selectedEp?.url;

                    if (!epUrl) {
                        await conn.sendMessage(from, { text: '❎ Invalid episode URL.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    const epDetailsUrl = `${BASE_URL}/episode?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(epUrl)}`;
                    const epRes = await axios.get(epDetailsUrl, { timeout: 60000 });

                    if (!epRes.data?.success || !epRes.data.data) {
                        await conn.sendMessage(from, { text: '❎ Failed to fetch episode download links.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    const epData = epRes.data.data;
                    downloadsList = extractDownloads(epData);

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
> 👑 *Powered by KAMRAN MD*`.trim();

                    const qualityMsg = await conn.sendMessage(from, { 
                        image: { url: itemPoster }, 
                        caption: qualityCaption 
                    }, { quoted: received });

                    step = 'quality'; 
                    lastMsgId = qualityMsg.key.id;
                    console.log(`[SINHALASUB DEBUG] Switched from episode to quality step. New Message ID: ${lastMsgId}`);

                } else if (step === 'quality') {
                    if (!downloadsList || choice < 1 || choice > downloadsList.length) { 
                        await conn.sendMessage(from, { text: `❎ Select a valid number (1-${downloadsList.length})` }, { quoted: received }); 
                        return; 
                    }

                    const selectedQuality = downloadsList[choice - 1];
                    const finalUrl = selectedQuality?.url || selectedQuality?.link;

                    if (!finalUrl) {
                        await conn.sendMessage(from, { text: '❎ Download URL extraction failed.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                    const qSize = selectedQuality?.size || 'N/A';
                    const qQuality = selectedQuality?.quality || selectedQuality?.name || 'HD';
                    const fileName = `${itemTitle.replace(/[^a-zA-Z0-9]/g, '_')} [${qQuality}] SinhalaSub.mp4`;

                    console.log(`[SINHALASUB DEBUG] Sending document file. URL: ${finalUrl}`);

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
            console.log(`[SINHALASUB DEBUG] Cleaning up event listener.`);
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
