// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "cinesubz2",
    desc: "Search and download movies or episodes from CineSubz using Vajira API",
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
                `> 📌 *Example:* \`.cinesubz Avatar\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const API_KEY = 'za6005338@gmail.com:vajira-90771';
        const BASE_URL = 'https://vajiraofc-apis.vercel.app/api/cinesubz';

        const searchUrl = `${BASE_URL}/search?apikey=${encodeURIComponent(API_KEY)}&q=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchUrl, { timeout: 60000 });

        if (!searchRes.data?.status || !searchRes.data.result?.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Koi result nahi mila!*");
        }

        const results = searchRes.data.result.slice(0, 5);
        const firstImage = results[0].image || results[0].thumbnail || 'https://i.imgur.com/3932mio.jpeg';
        
        const resultsList = results.map((item, i) => { 
            const title = item.title || 'Unknown'; 
            const type = item.type || 'Movie';
            return `*${i + 1} ┃ ${title}*\n   🎬 Type • ${type}`; 
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

        let lastMsgId = searchMsg.key.id, 
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
                if (isNaN(choice) || choice < 1 || choice > results.length) { 
                    await conn.sendMessage(from, { text: `❎ Please enter a valid number (1-${results.length}).` }, { quoted: received }); 
                    return; 
                }

                await conn.sendMessage(from, { react: { text: '⏳', key: received.key } });

                const selectedItem = results[choice - 1];
                const itemTitle = selectedItem.title || 'Media';
                const itemUrl = selectedItem.url || selectedItem.link;

                if (!itemUrl) {
                    await conn.sendMessage(from, { text: '❎ Item link not found.' }, { quoted: received });
                    cleanup();
                    return;
                }

                // Check if it's series/episode or movie based on URL or type
                const isEpisodeOrSeries = itemUrl.includes('/episodes/') || itemUrl.includes('/series/') || selectedItem.type?.toLowerCase().includes('series');

                let detailsUrl = '';
                if (isEpisodeOrSeries && itemUrl.includes('/episodes/')) {
                    detailsUrl = `${BASE_URL}/episode?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(itemUrl)}`;
                } else {
                    detailsUrl = `${BASE_URL}/details?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(itemUrl)}`;
                }

                const detailsRes = await axios.get(detailsUrl, { timeout: 60000 });

                if (!detailsRes.data?.status || !detailsRes.data.result) {
                    await conn.sendMessage(from, { text: '❎ Failed to fetch download details.' }, { quoted: received });
                    cleanup();
                    return;
                }

                const details = detailsRes.data.result;
                const downloadLinks = details.download || details.downloads || details.links || [];

                if (!downloadLinks.length) {
                    await conn.sendMessage(from, { text: '❎ No download links available for this item.' }, { quoted: received });
                    cleanup();
                    return;
                }

                // Extract direct video link
                let finalUrl = '';
                const directDl = downloadLinks.find(d => d.quality === '1080p' || d.quality === '720p' || d.name === 'direct') || downloadLinks[0];
                finalUrl = directDl.url || directDl.link;

                if (!finalUrl) {
                    await conn.sendMessage(from, { text: '❎ Direct video link extraction failed.' }, { quoted: received });
                    cleanup();
                    return;
                }

                await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                const fileName = `${itemTitle} CineSubz.mp4`;

                await conn.sendMessage(from, { 
                    document: { url: finalUrl }, 
                    mimetype: 'video/mp4', 
                    fileName: fileName, 
                    caption: `*${itemTitle}*\n\n> *👑 Powered by KAMRAN MD*` 
                }, { quoted: received });

                await conn.sendMessage(from, { react: { text: '✅', key: received.key } });
                cleanup();

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
