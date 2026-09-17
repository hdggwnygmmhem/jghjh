// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "cinesubz3",
    desc: "Search and download movies/series from CineSubz using Vajira API",
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
                `❌ *Kripya movie ya series ka naam dein!*\n\n` +
                `> 📌 *Example:* \`.cinesubz 2026\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const API_KEY = 'za6005338@gmail.com:vajira-90771';
        const BASE_URL = 'https://vajiraofc-apis.vercel.app/api/cinesubz';

        const searchUrl = `${BASE_URL}/search?apikey=${encodeURIComponent(API_KEY)}&q=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchUrl, { timeout: 60000 });

        if (!searchRes.data?.success || !searchRes.data.results?.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Koi result nahi mila!*");
        }

        const results = searchRes.data.results.slice(0, 5);
        const firstImage = results[0].poster || results[0].image || 'https://i.imgur.com/3932mio.jpeg';
        
        const resultsList = results.map((item, i) => { 
            const title = item.title || 'Unknown'; 
            return `*${i + 1} ┃ ${title}*`; 
        }).join('\n\n');

        const searchCaption = `
╔════════════════════════╗
║   🎬 CINESUBZ SEARCH 🎬   
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
            downloads = [], 
            finalUrl = null, 
            selectedQuality = null, 
            itemTitle = '', 
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

                    selectedItem = results[choice - 1];
                    itemTitle = selectedItem.title || 'Media';
                    const itemUrl = selectedItem.url;

                    const isEpisode = itemUrl.includes('/episodes/');
                    const detailsUrl = `${BASE_URL}/${isEpisode ? 'episode' : 'details'}?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(itemUrl)}`;
                    
                    const detailsRes = await axios.get(detailsUrl, { timeout: 60000 });

                    // DEBUG LOG: Yeh line aapke Heroku logs me API response print karegi
                    console.log('API DETAILS RESPONSE -->', JSON.stringify(detailsRes.data, null, 2));

                    if (!detailsRes.data?.success || !detailsRes.data.data) { 
                        await conn.sendMessage(from, { text: '❎ API response failed or invalid.' }, { quoted: received }); 
                        cleanup(); 
                        return; 
                    }

                    const detailsData = detailsRes.data.data;
                    
                    // Fallback check for different link array keys from API response
                    downloads = detailsData.download || detailsData.downloads || detailsData.links || [];

                    if (!downloads.length) {
                        await conn.sendMessage(from, { text: '❎ No download links available in response.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    const qualityList = downloads.map((qItem, i) => { 
                        const qName = qItem.quality || qItem.name || `Quality ${i + 1}`;
                        const qSize = qItem.size || 'N/A';
                        return `*${i + 1} ┃📥 ${qName} • ${qSize}*`; 
                    }).join('\n\n');

                    const qualityCaption = `
╔════════════════════════╗
║   🎬 CINESUBZ INFO 🎬   
╚════════════════════════╝

🎬 *Title:* ${itemTitle}
⭐ *Rating:* ${detailsData.meta?.rating || selectedItem.rating || 'N/A'}
📅 *Year:* ${detailsData.meta?.year || 'N/A'}

🔢 *Reply with quality number* 👇

${qualityList}

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

                    const qualityMsg = await conn.sendMessage(from, { 
                        image: { url: detailsData.poster || selectedItem.poster || firstImage }, 
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
                    finalUrl = selectedQuality.url || selectedQuality.link;

                    if (!finalUrl) {
                        await conn.sendMessage(from, { text: '❎ Download URL extraction failed.' }, { quoted: received });
                        cleanup();
                        return;
                    }

                    const formatCaption = `
╔════════════════════════╗
║   🎬 CINESUBZ FORMAT 🎬   
╚════════════════════════╝

🎬 *Title:* ${itemTitle}
💿 *Quality:* ${selectedQuality.quality || selectedQuality.name || 'N/A'}
📦 *Size:* ${selectedQuality.size || 'N/A'}

🔢 *Reply with format number* 👇

*1 ┃ 📽️ Video Format*
*2 ┃ 📁 Document Format*

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

                    const formatMsg = await conn.sendMessage(from, { 
                        image: { url: selectedItem.poster || firstImage }, 
                        caption: formatCaption 
                    }, { quoted: received });

                    step = 'format'; 
                    lastMsgId = formatMsg.key.id;

                } else if (step === 'format') {
                    if (choice !== 1 && choice !== 2) { 
                        await conn.sendMessage(from, { text: '❎ Please select 1 (Video) or 2 (Document).' }, { quoted: received }); 
                        return; 
                    }

                    await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                    const qSize = selectedQuality.size || 'N/A';
                    const fileName = `${itemTitle} [${qSize}] CineSubz.mp4`;

                    if (choice === 2) {
                        await conn.sendMessage(from, { 
                            document: { url: finalUrl }, 
                            mimetype: 'video/mp4', 
                            fileName: fileName, 
                            caption: `*${itemTitle}*\n📦 *Size:* ${qSize}\n\n> *👑 Powered by KAMRAN MD*` 
                        }, { quoted: received });
                    } else {
                        await conn.sendMessage(from, { 
                            video: { url: finalUrl }, 
                            caption: `*${itemTitle}*\n📦 *Size:* ${qSize}\n\n> *👑 Powered by KAMRAN MD*` 
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
        console.error('CineSubz command error:', e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ *Kuch galat ho gaya, kripya thodi der baad koshish karein!*");
    }
});
