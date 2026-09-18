// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "thenkiri2",
    alias: ["nkiri2", "thenkirimovie2"],
    desc: "Search and download movies from Thenkiri using Vajira API",
    category: "download",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🚀 KAMRAN-MD THENKIRI 🚀    \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya movie ka naam dein!*\n\n` +
                `> 📌 *Example:* \`.thenkiri 2026\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const API_KEY = 'za6005338@gmail.com:vajira-90771';
        const BASE_URL = 'https://vajiraofc-apis.vercel.app/api/thenkiri';

        const searchUrl = `${BASE_URL}/search?apikey=${encodeURIComponent(API_KEY)}&q=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchUrl, { timeout: 60000 });

        if (!searchRes.data?.success || !searchRes.data.results?.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Koi result nahi mila!*");
        }

        const results = searchRes.data.results.slice(0, 5);
        
        const resultsList = results.map((item, i) => { 
            const title = item?.title || 'Unknown'; 
            return `*${i + 1} ┃ ${title}*`; 
        }).join('\n\n');

        const searchCaption = `
╔════════════════════════╗
║    🔥 THENKIRI SEARCH 🔥    
╚════════════════════════╝

${resultsList}

🔢 *Reply with a number to select* 👇

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

        // Sending as text message to completely avoid image 404 fetching errors
        const searchMsg = await conn.sendMessage(from, { text: searchCaption }, { quoted: mek });

        let lastMsgId = searchMsg.key.id, 
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

                if (choice < 1 || choice > results.length) { 
                    await conn.sendMessage(from, { text: `❎ Select a valid number (1-${results.length})` }, { quoted: received }); 
                    return; 
                }

                await conn.sendMessage(from, { react: { text: '⏳', key: received.key } });

                const selectedItem = results[choice - 1];
                const itemTitle = selectedItem?.title || 'Movie';
                const itemUrl = selectedItem?.url;

                if (!itemUrl) {
                    await conn.sendMessage(from, { text: '❎ Invalid item URL.' }, { quoted: received });
                    cleanup();
                    return;
                }

                const detailsUrl = `${BASE_URL}/details?apikey=${encodeURIComponent(API_KEY)}&url=${encodeURIComponent(itemUrl)}`;
                console.log(`[THENKIRI DEBUG] Fetching details from: ${detailsUrl}`);

                const detailsRes = await axios.get(detailsUrl, { timeout: 60000 });
                const resData = detailsRes.data;

                if (!resData?.success) { 
                    await conn.sendMessage(from, { text: '❎ API returned unsuccessful response.' }, { quoted: received }); 
                    cleanup(); 
                    return; 
                }

                const detailsData = resData.data || resData;
                const directDownloadUrl = detailsData?.directDownloadUrl || detailsData?.downloadPageLink || detailsData?.downloadUrl || detailsData?.url;

                if (!directDownloadUrl) {
                    await conn.sendMessage(from, { text: '❎ Direct download link nahi mila!' }, { quoted: received });
                    cleanup();
                    return;
                }

                const movieGenres = detailsData?.genres || 'HD';
                const movieSize = detailsData?.size || 'N/A';

                const fileName = `${itemTitle.replace(/[^a-zA-Z0-9]/g, '_')} [Thenkiri].mp4`;

                await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                await conn.sendMessage(from, { 
                    document: { url: directDownloadUrl }, 
                    mimetype: 'video/mp4', 
                    fileName: fileName, 
                    caption: `*${itemTitle}*\n🎬 *Genres:* ${movieGenres}\n📦 *Size:* ${movieSize}\n\n> *👑 Powered by KAMRAN MD*` 
                }, { quoted: received });

                await conn.sendMessage(from, { react: { text: '✅', key: received.key } });
                cleanup();

            } catch (err) { 
                console.error('CRITICAL THENKIRI HANDLER ERROR -->', err);
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
