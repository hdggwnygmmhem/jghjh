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
        
        console.log(`[MOVIEBOX LOG] Searching API: ${searchUrl}`);
        let searchRes;
        try {
            searchRes = await axios.get(searchUrl, { timeout: 60000 });
        } catch (apiErr) {
            console.error('[MOVIEBOX ERROR] Search API failed:', apiErr.message);
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *API request failed or timed out!*");
        }

        const resData = searchRes.data;
        if (!resData?.success || !resData?.data?.results?.length) {
            console.log('[MOVIEBOX LOG] No results found from API.');
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

🔢 *Reply with a number to select movie* 👇

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

                    console.log(`[MOVIEBOX LOG] Selected Movie: "${itemTitle}" | URL: ${finalUrl}`);

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
                    console.log(`[MOVIEBOX LOG] Step updated to 'format'. New Message ID: ${lastMsgId}`);

                } else if (currentStep === 'format') {
                    if (choice !== 1 && choice !== 2) { 
                        await conn.sendMessage(from, { text: '❎ Please select 1 (Video) or 2 (Document).' }, { quoted: received }); 
                        return; 
                    }

                    console.log(`[MOVIEBOX LOG] Format chosen: ${choice === 2 ? 'Document' : 'Video'}`);
                    await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                    const cleanFileName = `${itemTitle.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;

                    if (choice === 2) {
                        await conn.sendMessage(from, { 
                            document: { url: finalUrl }, 
                            mimetype: 'video/mp4', 
                            fileName: cleanFileName, 
                            caption: `*${itemTitle}*\n\n> *👑 Powered by KAMRAN MD*` 
                        }, { quoted: received });
                    } else {
                        await conn.sendMessage(from, { 
                            video: { url: finalUrl }, 
                            caption: `*${itemTitle}*\n\n> *👑 Powered by KAMRAN MD*` 
                        }, { quoted: received });
                    }

                    await conn.sendMessage(from, { react: { text: '✅', key: received.key } });
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
        timeout = setTimeout(() => cleanup(), 5 * 60 * 1000);

    } catch (e) {
        console.error('MovieBox command error -->', e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ *Kuch galat ho gaya, kripya thodi der baad koshish karein!*");
    }
});
