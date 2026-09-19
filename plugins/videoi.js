// plugins/video.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import yts from 'yt-search';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "video",
    alias: ["ytmp4", "ytsong", "ytvideo"],
    desc: "Search and download YouTube videos or audio",
    category: "downloader",
    react: "🎥",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        const q = text?.trim() || '';

        if (!q) {
            return reply('*❌ Please enter a YouTube URL or title.*\n\n*Example:* `.video Faded`');
        }

        function extractYouTubeId(url) {
            const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
            const match = url.match(regex);
            return match ? match[1] : null;
        }

        function normalizeLink(input) {
            const id = extractYouTubeId(input);
            return id ? `https://www.youtube.com/watch?v=${id}` : input;
        }

        const query = normalizeLink(q);
        const searchResults = await yts(query);
        const v = searchResults.videos[0];
        
        if (!v) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply('*❌ No results found.*');
        }

        const youtubeUrl = v.url;
        const encodedUrl = encodeURIComponent(youtubeUrl);
        const videoId = extractYouTubeId(youtubeUrl) || 'N/A';

        const caption = `*🎬 ༺ KAMRAN ┃ MD ꙰༻ 𝗩ɪᴅᴇᴏ 𝗗ᴏᴡɴʟᴏᴀᴅᴇʀ 🎥*

┏━━━━━━━━━━━◆◉◉➤
┃🎵 *𝗧ɪᴛʟᴇ:* ${v.title}
┃⏱️ *𝗗ᴜʀᴀétion:* ${v.timestamp}
┃👀 *𝗩ɪᴇᴡꜱ:* ${v.views}
┃📆 *𝗥ᴇʟᴇᴀꜱᴇᴅ:* ${v.ago}
┃🔗 *𝗨ʀʟ:* https://youtu.be/${videoId}
┗━━━━━━━━━━━◆◉◉➤

> *© ༺ KAMRAN ┃ MD ꙰༻*
> *Reply with 1 for Video, 2 for Document, or 3 for Audio*`;

        const buttons = [
            {
                buttonId: 'video_video',
                buttonText: { displayText: '🎬 𝗩ɪᴅᴇᴏ' },
                type: 1
            },
            {
                buttonId: 'video_doc',
                buttonText: { displayText: '📁 𝗗ᴏᴄᴜᴍᴇ𝗻𝘁' },
                type: 1
            },
            {
                buttonId: 'video_audio',
                buttonText: { displayText: '🎵 𝗔ᴜᴅɪᴏ' },
                type: 1
            }
        ];

        const sentMsg = await conn.sendMessage(
            from,
            {
                image: { url: v.thumbnail },
                caption: caption,
                buttons: buttons,
                headerType: 4
            },
            { quoted: mek }
        );

        const handler = async (update) => {
            try {
                const updateMsg = update.messages && update.messages[0];
                if (!updateMsg) return;

                const fromId = updateMsg.key.remoteJid || updateMsg.key.participant;
                if (fromId !== from) return;

                // Handle Button Clicks (Agar bot base support karega toh chalega)
                const buttonResponse = updateMsg.message?.buttonsResponseMessage;
                if (buttonResponse) {
                    const contextId = buttonResponse.contextInfo?.stanzaId;
                    if (!contextId || contextId !== sentMsg.key.id) return;

                    const selectedId = buttonResponse.selectedButtonId;
                    await conn.sendMessage(from, { react: { text: "📥", key: updateMsg.key } });

                    await processDownload(conn, updateMsg, from, selectedId, encodedUrl, v);
                    conn.ev.off('messages.upsert', handler);
                    return;
                }

                // Handle Text Replies (1, 2, 3) - Yeh 100% working hai
                const msgText = updateMsg.message?.conversation || updateMsg.message?.extendedTextMessage?.text;
                if (!msgText) return;
                
                const contextId = updateMsg.message.extendedTextMessage?.contextInfo?.stanzaId;
                if (!contextId || contextId !== sentMsg.key.id) return;

                const selected = msgText.trim();
                await conn.sendMessage(from, { react: { text: "📥", key: updateMsg.key } });

                let optionId = "";
                if (selected === "1") optionId = "video_video";
                else if (selected === "2") optionId = "video_doc";
                else if (selected === "3") optionId = "video_audio";
                else {
                    await conn.sendMessage(from, { text: "❌ Invalid option. Please reply with 1, 2, or 3." }, { quoted: updateMsg });
                    return;
                }

                await processDownload(conn, updateMsg, from, optionId, encodedUrl, v);
                conn.ev.off('messages.upsert', handler);

            } catch (error) {
                console.error("Handler error:", error);
                await conn.sendMessage(from, { text: "❌ An error occurred. Please try again." }, { quoted: mek });
                conn.ev.off('messages.upsert', handler);
            }
        };

        conn.ev.on('messages.upsert', handler);

        setTimeout(() => {
            try {
                conn.ev.off('messages.upsert', handler);
            } catch (e) {
                console.error('Error removing listener:', e);
            }
        }, 5 * 60 * 1000);

    } catch (e) {
        console.error('Main error:', e);
        reply("*❌ Error fetching video. Please check the URL or try again later.*");
    }
});

async function processDownload(conn, m, from, selectedId, encodedUrl, v) {
    try {
        const apiKey = "54e2595579566fd44d2f5e1eeb2ff7f513bd4009cab33939ede82486dd7ad508";
        const videoApiUrl = `https://back.asitha.top/api/ytapi?url=${encodedUrl}&fo=1&qu=144&apiKey=${apiKey}`;

        if (selectedId === 'video_video' || selectedId === 'video_doc') {
            const res = await axios.get(videoApiUrl, { timeout: 30000 });
            const data = res.data;

            if (!data?.download_url) {
                return await conn.sendMessage(from, { text: "❌ Video download failed." }, { quoted: m });
            }

            const cleanTitle = v.title.replace(/[^\w\s]/gi, '');
            if (selectedId === 'video_video') {
                await conn.sendMessage(from, {
                    video: { url: data.download_url },
                    mimetype: "video/mp4",
                    caption: `*🎬 ${v.title}*`
                }, { quoted: m });
            } else {
                await conn.sendMessage(from, {
                    document: { url: data.download_url },
                    mimetype: "video/mp4",
                    fileName: `${cleanTitle}.mp4`,
                    caption: `*📁 ${v.title}*`
                }, { quoted: m });
            }
        } else if (selectedId === 'video_audio') {
            const res = await axios.get(videoApiUrl, { timeout: 30000 });
            const data = res.data;

            if (!data?.download_url) {
                return await conn.sendMessage(from, { text: "❌ Audio download failed." }, { quoted: m });
            }

            const cleanTitle = v.title.replace(/[^\w\s]/gi, '');
            await conn.sendMessage(from, {
                audio: { url: data.download_url },
                mimetype: "audio/mpeg",
                ptt: false,
                fileName: `${cleanTitle}.mp3`,
                caption: `*🎵 ${v.title}*`
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error('API Error:', err);
        await conn.sendMessage(from, { text: `❌ Download failed: ${err.message}` }, { quoted: m });
    }
}
