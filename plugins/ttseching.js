// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const headers = {
    'user-agent': 'Mozilla/5.0'
};

async function sendCustomMessage(client, jid, content, options = {}) {
    const isMedia = content.video || content.image;

    const customContent = {
        ...content,
        mentions: content.mentions || client.parseMention?.(content?.text || content?.caption || '') || []
    };

    if (isMedia) {
        customContent.streamingSidecar = Buffer.from('Omw4hLediba3yg==', 'base64');
        customContent.annotations = [
            {
                polygonVertices: [
                    { x: 0, y: 0 },
                    { x: 1000, y: 0 },
                    { x: 1000, y: 1000 },
                    { x: 0, y: 1000 }
                ],
                shouldSkipConfirmation: true,
                embeddedContent: {
                    embeddedMusic: {
                        musicContentMediaId: "1409620227516822",
                        songId: "244215252974958",
                        author: global.author || "DR KAMRAN",
                        title: global.namebot || "KAMRAN-MD",
                        artistAttribution: "https://whatsapp.com/channel/1203634120312190",
                        countryBlocklist: "",
                        isExplicit: false
                    }
                },
                embeddedAction: true
            }
        ];
    }

    return await client.sendMessage(jid, customContent, options);
}

cmd({
    pattern: "ttsearch2",
    alias: ["tiktoksearch2"],
    desc: "Search videos from TikTok",
    category: "search",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🎬 KAMRAN-MD TIKTOK SEARCH 🎬   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya TikTok search ke liye query dein!*\n\n` +
                `> 📌 *Example:* \`.ttsearch Makima edit\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const { data } = await axios.get('https://api.nexray.eu.cc/search/tiktok', {
            params: {
                q: q
            },
            headers
        });

        if (!data?.status || !Array.isArray(data.result) || data.result.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Video TikTok nahi mili!*");
        }

        // Filter out items that have valid video data
        const validVideos = data.result.filter(v => v?.data).slice(0, 9);

        if (validVideos.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Koi bhi valid video nahi mili!*");
        }

        // Agar sirf 1 video ho toh direct bhej dein
        if (validVideos.length === 1 || !args.join(" ").includes("|")) {
            const result = validVideos[0];
            const caption = `
╔════════════════════════╗
║   🎬 TIKTOK SEARCH RESULT   
╚════════════════════════╝

❀ *Judul:* ${result.title || 'TikTok Video'}
❀ *Uploader:* ${result.author?.nickname || 'Unknown'}

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

            await sendCustomMessage(
                conn,
                from,
                {
                    video: { url: result.data },
                    mimetype: 'video/mp4',
                    caption: caption
                },
                { quoted: mek }
            );
            return await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }

        // Multiple videos list generation
        let listText = `╔════════════════════════╗\n║   🎬 TIKTOK MULTI SEARCH   \n╚════════════════════════╝\n\n*Yahan top ${validVideos.length} videos hain. Kisi ek ko download karne ke liye reply karein:* \n\n`;

        validVideos.forEach((vid, index) => {
            listText += `*${index + 1}.* ${vid.title || 'TikTok Video'} _(${vid.author?.nickname || 'Unknown'})_\n`;
        });

        listText += `\n> 📌 *Example:* \`.ttsearch <query> | 1\` ya seedha number reply karein.\n> ⚡ *Powered by DOCTOR MD*`;

        const sentMsg = await reply(listText);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        // Store videos temporarily in context if needed, or handle selection via quoted message listener in your bot base.

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ *Kuch galat ho gaya, kripya thodi der baad koshish karein!*");
    }
});
