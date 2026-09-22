import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "drama",
    alias: ["epi", "da", "episode", "dramaepi"],
    desc: "Search and download drama video, audio or document",
    category: "downloader",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;
    
    try {
        console.log("=== DRAMA COMMAND TRIGGERED ===");
        console.log("Query text:", text);

        if (!text) {
            return reply(
                `🎬 *KAMRAN-MD DRAMA DOWNLOADER*\n\n` +
                `❌ *Please provide a drama name or episode!*\n\n` +
                `💡 *Example:* \`.drama mohabbat 57\``
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint
        const cleanQuery = text.replace(/epi|episode/gi, '').trim();
        const encodedQuery = encodeURIComponent(cleanQuery);
        const apiUrl = `https://api-faa.my.id/faa/ytplayvid?q=${encodedQuery}`;
        
        console.log("Calling API URL:", apiUrl);
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Oops!* No results found for that query.");
        }

        const info = resData.result;
        const videoUrl = info.download_url;
        const title = info.searched_title || text;
        const videoPageUrl = info.searched_url || '';
        const thumbnail = info.thumbnail || info.image || '';

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the download link.");
        }

        // Stylish Selection Menu
        const selectCaption = 
            `╭───────────────────────╮\n` +
            `  📺 *${title}*\n` +
            `╰───────────────────────╯\n\n` +
            `📌 *Apni pasand ka format select karein (Reply karein 1, 2 ya 3):*\n\n` +
            `1️⃣ *Video (MP4)*\n` +
            `2️⃣ *Audio / Voice (MP3)*\n` +
            `3️⃣ *Short Document (File)*\n\n` +
            (videoPageUrl ? `🔗 *YouTube:* ${videoPageUrl}\n` : ``) +
            `⚡ *Powered by:* KAMRAN-MD`;

        const sentMsg = await conn.sendMessage(from, {
            text: selectCaption,
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: "📥 Reply with 1, 2 or 3 to download",
                    thumbnailUrl: thumbnail,
                    sourceUrl: videoPageUrl || 'https://github.com',
                    mediaType: 2,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        // ==================== WAITING FOR USER SELECTION (1, 2, or 3) ====================
        const messageId = sentMsg.key.id;
        
        const filter = (msg) => {
            return (
                msg.message &&
                msg.message.conversation &&
                ['1', '2', '3'].includes(msg.message.conversation.trim()) &&
                msg.key.remoteJid === from
            );
        };

        // Listen for user reply on this specific message
        const collector = conn.ev.on('messages.upsert', async (chatUpdate) => {
            const mekResponse = chatUpdate.messages[0];
            if (!mekResponse || !mekResponse.message) return;

            const isReplyToMenu = mekResponse.message.extendedTextMessage && 
                                  mekResponse.message.extendedTextMessage.contextInfo && 
                                  mekResponse.message.extendedTextMessage.contextInfo.stanzaId === messageId;
            
            const messageBody = (mekResponse.message.conversation || 
                                 mekResponse.message.extendedTextMessage?.text || '').trim();

            if (isReplyToMenu && ['1', '2', '3'].includes(messageBody)) {
                // Remove listener to prevent multiple triggers
                // (Baad mein event listeners cleanup ke liye standard approach)
                
                await conn.sendMessage(from, { react: { text: "⏳", key: mekResponse.key } });

                if (messageBody === '1') {
                    // Send Video
                    const videoRes = await axios.get(videoUrl, {
                        responseType: 'arraybuffer',
                        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.youtube.com/' },
                        timeout: 60000
                    });

                    await conn.sendMessage(from, {
                        video: Buffer.from(videoRes.data),
                        mimetype: 'video/mp4',
                        caption: `🎥 *${title}*\n> Powered by KAMRAN-MD`
                    }, { quoted: mekResponse });

                } else if (messageBody === '2') {
                    // Send Audio / Voice (MP3)
                    // Note: agar API audio link direct nahi deti to video buffer ko audio ki tarah bhej sakte hain ya audio format mein
                    const audioRes = await axios.get(videoUrl, {
                        responseType: 'arraybuffer',
                        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.youtube.com/' },
                        timeout: 60000
                    });

                    await conn.sendMessage(from, {
                        audio: Buffer.from(audioRes.data),
                        mimetype: 'audio/mp4',
                        ptt: false, // false matlab audio file, true kar denge toh voice note ban jayega
                        caption: `🎵 *${title}*\n> Powered by KAMRAN-MD`
                    }, { quoted: mekResponse });

                } else if (messageBody === '3') {
                    // Send Short Document File
                    const docRes = await axios.get(videoUrl, {
                        responseType: 'arraybuffer',
                        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.youtube.com/' },
                        timeout: 60000
                    });

                    await conn.sendMessage(from, {
                        document: Buffer.from(docRes.data),
                        mimetype: 'video/mp4',
                        fileName: `${title.replace(/[/\\?%*:|"<>]/g, '')}.mp4`,
                        caption: `📁 *${title} (Document)*\n> Powered by KAMRAN-MD`
                    }, { quoted: mekResponse });
                }

                await conn.sendMessage(from, { react: { text: "✅", key: mekResponse.key } });
            }
        });

    } catch (error) {
        console.error("KAMRAN-MD Drama Error Log:", error);
        reply(`❌ *Error:* ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
