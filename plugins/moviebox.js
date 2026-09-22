// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "moviebox",
    alias: ["mb", "movie", "msearch"],
    desc: "Search and download movies using Vajira MovieBox API",
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
                `> 📌 *Example:* \`.moviebox 2026\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const API_KEY = 'drkamranislamabad@gmail.com:vajira-68623';
        const BASE_URL = 'https://vajiraofc-apis.vercel.app/api/movieboxs';
        const searchUrl = `${BASE_URL}?apikey=${encodeURIComponent(API_KEY)}&query=${encodeURIComponent(q)}&page=1&perPage=24`;
        
        let searchRes;
        try {
            searchRes = await axios.get(searchUrl, { timeout: 60000 });
        } catch (apiErr) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *API request failed or timed out!*");
        }

        const resData = searchRes.data;
        const items = resData?.data?.items || resData?.results || resData?.items || [];

        if (!resData?.success || !items.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Koi result nahi mila!*");
        }

        const results = items.slice(0, 5);
        const firstImage = results[0]?.cover || results[0]?.poster || 'https://i.imgur.com/3932mio.jpeg';
        
        const resultsList = results.map((item, i) => { 
            const title = item?.title || 'Unknown'; 
            const year = item?.year || 'N/A';
            return `*${i + 1} ┃ ${title}* (${year})`; 
        }).join('\n\n');

        const searchCaption = `
╔════════════════════════╗
║   🎬 MOVIEBOX SEARCH 🎬   
╚════════════════════════╝

${resultsList}

🔢 *Reply with a number to download as document* 👇

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

        const searchMsg = await conn.sendMessage(from, { 
            image: { url: firstImage }, 
            caption: searchCaption 
        }, { quoted: mek });

        let lastMsgId = searchMsg.key.id;
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
                if (isNaN(choice) || choice < 1 || choice > results.length) { 
                    await conn.sendMessage(from, { text: `❎ Please enter a valid number (1-${results.length}).` }, { quoted: received }); 
                    return; 
                }

                cleanup();
                await conn.sendMessage(from, { react: { text: '📥', key: received.key } });

                const selectedItem = results[choice - 1];
                const itemTitle = selectedItem?.title || 'Movie';
                const subjectId = selectedItem?.subjectid || selectedItem?.id;
                const detailPath = selectedItem?.detailPath || selectedItem?.path || '';

                console.log(`[MOVIEBOX LOG] Selected: "${itemTitle}" | ID: ${subjectId} | Path: ${detailPath}`);

                const detailUrl = `https://vajiraofc-apis.vercel.app/api/moviebox?apikey=${encodeURIComponent(API_KEY)}&id=${subjectId}&detailPath=${encodeURIComponent(detailPath)}&season=0&episode=0`;
                
                let downloadUrl = '';
                try {
                    const detailRes = await axios.get(detailUrl, { timeout: 60000 });
                    const dData = detailRes.data;
                    downloadUrl = dData?.data?.downloadUrl || dData?.downloadUrl || dData?.data?.url || dData?.url || dData?.data?.proxyDownload;
                } catch (e) {
                    console.error('[MOVIEBOX ERROR] Detail fetch failed:', e.message);
                }

                if (!downloadUrl) {
                    downloadUrl = selectedItem?.downloadUrl || selectedItem?.url || selectedItem?.proxyDownload;
                }

                if (!downloadUrl) {
                    await conn.sendMessage(from, { text: '❎ Download link could not be generated for this item.' }, { quoted: received });
                    return;
                }

                const cleanFileName = `${itemTitle.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
                const tempFilePath = path.join('/tmp', cleanFileName);

                console.log(`[MOVIEBOX LOG] Downloading from: ${downloadUrl}`);

                const response = await axios({
                    method: 'GET',
                    url: downloadUrl,
                    responseType: 'stream',
                    timeout: 600000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        'Accept': '*/*'
                    }
                });

                const writer = fs.createWriteStream(tempFilePath);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                console.log(`[MOVIEBOX LOG] Download complete. Sending document to WhatsApp...`);

                await conn.sendMessage(from, { 
                    document: { url: tempFilePath }, 
                    mimetype: 'video/mp4', 
                    fileName: cleanFileName, 
                    caption: `╔════════════════════════╗\n` +
                             `║   🎬 MOVIE DOWNLOAD 🎬   \n` +
                             `╚════════════════════════╝\n\n` +
                             `🎬 *Title:* ${itemTitle}\n\n` +
                             `> *👑 Powered by KAMRAN MD*` 
                }, { quoted: received });

                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }

                await conn.sendMessage(from, { react: { text: '✅', key: received.key } });

            } catch (err) { 
                console.error('MovieBox handler error -->', err); 
                if (received) {
                    await conn.sendMessage(from, { text: `❎ *Error:* ${err.message}` }, { quoted: received });
                }
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
        return reply(`❌ *Error:* ${e.message}`);
    }
});
