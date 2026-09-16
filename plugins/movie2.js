// DR KAMRAN 

import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs';
import axios from 'axios';
import yts from 'yt-search';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "song7",
    alias: ["play7", "audio7", "ytmp3"],
    desc: "Search and download YouTube songs in audio, document or PTT format",
    category: "download",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q && !args.length) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🎵 KAMRAN-MD YOUTUBE MP3 🎵   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya YouTube URL ya Song ka naam dein!*\n\n` +
                `> 📌 *Example:* \`.song Afreen Afreen\`\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        const lakiya = q || args.join(' ');
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let data;
        if (lakiya.match(/(youtube\.com|youtu\.be)/)) {
            const match = lakiya.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
            const videoId = match ? match[1] : null;

            if (!videoId) throw new Error('Invalid YouTube URL');

            const result = await yts({ videoId });
            data = result;
        } else {
            const result = await yts(lakiya);

            if (!result.videos || result.videos.length === 0) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply('❌ *Aapke query ke mutabiq koi song nahi mila!*');
            }

            data = result.videos[0];
        }

        if (!data) throw new Error('No results found');

        const videoId = data.videoId;
        const desc = `
╔════════════════════════╗
║    🎵 KAMRAN-MD SONG 🎵    
╚════════════════════════╝

✨ *Title:* _${data.title || 'N/A'}_     
⏱️ *Duration:* _${data.timestamp || 'N/A'}_
👀 *Views:* _${data.views?.toLocaleString() || 'N/A'}_
📅 *Published:* _${data.ago || 'N/A'}_
🎤 *Channel:* _${data.author?.name || 'N/A'}_

🔢 *Reply with option number* 👇

*01 🎧 ❯❯ Audio (MP3)*
*02 📁 ❯❯ Document (File)*
*03 🎤 ❯❯ Voice (PTT)*

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

        const sentMsg = await conn.sendMessage(from, {
            image: { url: data.thumbnail },
            caption: desc
        }, { quoted: mek });

        const listener = async (update) => {
            try {
                const received = update.messages[0];
                if (!received?.message) return;

                const fromId = received.key.remoteJid || received.key.participant;
                if (fromId !== from) return;

                const quotedId = received.message?.extendedTextMessage?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== sentMsg.key.id) return;

                const text = received.message?.conversation || received.message?.extendedTextMessage?.text;
                if (!text || !['1', '2', '3', '01', '02', '03'].includes(text.trim())) return;

                conn.ev.off('messages.upsert', listener);

                await conn.sendMessage(from, { react: { text: '⬇️', key: received.key } });

                // Free working API for ytmp3
                const apiUrl = `https://api-dark-shan-yt.koyeb.app/api/ytmp3?url=https://youtu.be/${videoId}`;
                const res = await axios.get(apiUrl, { timeout: 30000 });

                if (!res.data || !res.data.data?.download_url) {
                    throw new Error('API se download link retrieve nahi ho saka!');
                }

                const downloadLink = res.data.data.download_url;
                const songTitle = res.data.data.title || data.title;
                const thumbnail = res.data.data.thumbnail || data.thumbnail;

                let thumbBuffer = null;
                const choice = text.trim();

                if (choice === '2' || choice === '02') {
                    try {
                        const thumb = await axios.get(thumbnail, { responseType: 'arraybuffer', timeout: 10000 });
                        thumbBuffer = await sharp(thumb.data)
                            .resize(300, 300, {
                                fit: 'contain',
                                background: { r: 0, g: 0, b: 0, alpha: 1 }
                            })
                            .jpeg()
                            .toBuffer();
                    } catch {}
                }

                await conn.sendMessage(from, { react: { text: '⬆️', key: received.key } });

                const fileName = `${songTitle.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;

                if (choice === '1' || choice === '01') {
                    await conn.sendMessage(from, {
                        audio: { url: downloadLink },
                        mimetype: 'audio/mpeg'
                    }, { quoted: received });
                } else if (choice === '2' || choice === '02') {
                    await conn.sendMessage(from, {
                        document: { url: downloadLink },
                        mimetype: 'audio/mpeg',
                        fileName: fileName,
                        jpegThumbnail: thumbBuffer,
                        caption: `*${songTitle}*\n\n> *👑 Powered by KAMRAN MD*`
                    }, { quoted: received });
                } else if (choice === '3' || choice === '03') {
                    await conn.sendMessage(from, { react: { text: '🔄', key: received.key } });

                    try {
                        const tmpDir = os.tmpdir();
                        const inputPath = path.join(tmpDir, `${Date.now()}.mp3`);
                        const outputPath = path.join(tmpDir, `${Date.now()}.ogg`);
                        
                        const audioRes = await axios.get(downloadLink, {
                            responseType: 'arraybuffer',
                            timeout: 60000
                        });
                        fs.writeFileSync(inputPath, audioRes.data);

                        await new Promise((resolve, reject) => {
                            ffmpeg(inputPath)
                                .audioCodec('libopus')
                                .format('ogg')
                                .audioChannels(1)
                                .audioFrequency(16000)
                                .audioBitrate('32k')
                                .outputOptions(['-vbr on', '-compression_level 10'])
                                .save(outputPath)
                                .on('end', resolve)
                                .on('error', reject);
                        });

                        await conn.sendMessage(from, {
                            audio: fs.readFileSync(outputPath),
                            mimetype: 'audio/ogg; codecs=opus',
                            ptt: true
                        }, { quoted: received });

                        try {
                            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                        } catch {}

                    } catch (convErr) {
                        console.error('PTT Conversion Error:', convErr);
                        await conn.sendMessage(from, {
                            audio: { url: downloadLink },
                            mimetype: 'audio/mpeg',
                            ptt: true
                        }, { quoted: received });
                    }
                }

                await conn.sendMessage(from, { react: { text: '✅', key: received.key } });

            } catch (err) {
                console.error('Song listener error:', err);
                await conn.sendMessage(from, { text: `❌ *Download Error:* ${err.message}` }, { quoted: mek });
                await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            }
        };

        conn.ev.on('messages.upsert', listener);
        setTimeout(() => {
            conn.ev.off('messages.upsert', listener);
        }, 5 * 60 * 1000);

    } catch (e) {
        console.error('Song command error:', e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ *Song search karne me error aa gaya!*");
    }
});
