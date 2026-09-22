// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// Fast Agent for high speed downloading
const fastAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 50,
    timeout: 60000
});

cmd({
    pattern: "moviebox",
    alias: ["mb", "movie", "msearch"],
    desc: "Search and fast download movies using MovieBox Pro API",
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
            searchRes = await axios.get(searchUrl, { timeout: 60000, httpsAgent: fastAgent });
        } catch (apiErr) {
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

🔢 *Reply with a number for fast download* 👇

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

        const searchMsg = await conn.sendMessage(from, { 
            image: { url: firstImage }, 
            caption: searchCaption 
        }, { quoted: mek });

        let currentStep = 'movie'; 
        let lastMsgId = searchMsg.key.id;
        let selectedItem = null;
        let finalUrl = null;
        let itemTitle = '';
        let timeout = null;

        const handler = async (msgUpdate) => {
            try {
                const received = msgUpdate.messages[0];
                if (!received || !received.message) return;
                
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

                if (currentStep === 'movie') {
                    if (choice < 1 || choice > results.length) { 
                        await conn.sendMessage(from, { text: `❎ Select a valid number (1-${results.length})` }, { quoted: received }); 
                        return; 
                    }

                    selectedItem = results[choice - 1];
                    itemTitle = selectedItem?.title || 'Movie';
                    finalUrl = selectedItem?.proxyDownload || selectedItem?.proxyStream;

                    if (!finalUrl) {
                        await conn.sendMessage(from, { text: '❎ Download link not available for this item.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    const formatCaption = `
╔════════════════════════╗
║   🎬 MOVIEBOX FORMAT 🎬   
╚════════════════════════╝

🎬 *Title:* ${itemTitle}
⭐ *Rating:* ${selectedItem?.imdbRatingValue || 'N/A'}
📅 *Release:* ${selectedItem?.releaseDate || 'N/A'}

🔢 *Reply with format number* 👇

*1 ┃ 📽️ Video Format*
*2 ┃ 📁 Document Format*

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

                    const formatMsg = await conn.sendMessage(from, { 
                        image: { url: selectedItem?.cover?.url || firstImage }, 
                        caption: formatCaption 
                    }, { quoted: received });

                    currentStep = 'format'; 
                    lastMsgId = formatMsg.key.id;

                } else if (currentStep === 'format') {
                    if (choice !== 1 && choice !== 2) { 
                        await conn.sendMessage(from, { text: '❎ Please select 1 (Video) or 2 (Document).' }, { quoted: received }); 
                        return; 
                    }

                    await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                    const cleanFileName = `${itemTitle.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
                    const tempFilePath = path.join('/tmp', cleanFileName);

                    console.log(`[MOVIEBOX FAST DOWNLOAD] Starting fast download for: ${itemTitle}`);

                    try {
                        const response = await axios({
                            method: 'GET',
                            url: finalUrl,
                            responseType: 'stream',
                            httpsAgent: fastAgent,
                            timeout: 600000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                'Accept': '*/*'
                            }
                        });

                        const writer = fs.createWriteStream(tempFilePath);
                        response.data.pipe(writer);

                        await new Promise((resolve, reject) => {
                            writer.on('finish', resolve);
                            writer.on('error', reject);
                        });

                        console.log(`[MOVIEBOX FAST DOWNLOAD] Download finished successfully. Sending to WhatsApp...`);

                        if (choice === 2) {
                            await conn.sendMessage(from, { 
                                document: { url: tempFilePath }, 
                                mimetype: 'video/mp4', 
                                fileName: cleanFileName, 
                                caption: `*${itemTitle}* \n\n> *👑 Powered by KAMRAN MD*` 
                            }, { quoted: received });
                        } else {
                            await conn.sendMessage(from, { 
                                video: { url: tempFilePath }, 
                                caption: `*${itemTitle}* \n\n> *👑 Powered by KAMRAN MD*` 
                            }, { quoted: received });
                        }

                        if (fs.existsSync(tempFilePath)) {
                            fs.unlinkSync(tempFilePath);
                        }

                        await conn.sendMessage(from, { react: { text: '✅', key: received.key } });

                    } catch (dlErr) {
                        console.error('[MOVIEBOX FAST DOWNLOAD ERROR] -->', dlErr.message);
                        if (fs.existsSync(tempFilePath)) {
                            fs.unlinkSync(tempFilePath);
                        }
                        await conn.sendMessage(from, { text: `❎ *Download Error:* ${dlErr.message}` }, { quoted: received });
                    }

                    cleanup();
                }

            } catch (err) { 
                console.error('MovieBox handler error -->', err); 
                cleanup(); 
            }
        };

        const cleanup = () => { 
            if (timeout) clearTimeout(timeout); 
            conn.ev.off('messages.upsert', handler); 
        };

        conn.ev.on('messages.upsert', handler);
        timeout = setTimeout(() => cleanup(), 10 * 60 * 1000);

    } catch (e) {
        console.error('MovieBox command error -->', e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ *Kuch galat ho gaya, kripya thodi der baad koshish karein!*");
    }
});
