import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import axios from 'axios';
import yts from 'yt-search';
import ffmpeg from 'fluent-ffmpeg';

const __filename = fileURLToPath(import.meta.url);

// ==================== COMMANDS: .PLAYCH & .PLAYCH2 ====================
cmd({
    pattern: "playch",
    alias: ["playch2"],
    desc: "Play and send audio to channel as PTT",
    category: "downloader",
    react: "🎧",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;

    try {
        if (!text) {
            return reply(
`🎧 *PLAYCH GUIDE*

.playch judul|kualitas

Contoh:
.playch lily alan walker
.playch monokrom|superhigh

*Kualitas:*
• jelek = 64k
• sedang = 128k (default)
• superhigh = 256k`
            );
        }

        const react = async (emo) => {
            try {
                await conn.sendMessage(from, {
                    react: { text: emo, key: mek.key }
                });
                await new Promise(r => setTimeout(r, 800));
            } catch (err) {
                console.log("React Error:", err.message);
            }
        };

        await react('🕒');

        let [query, quality] = text.split('|');

        if (!query) {
            await react('❌');
            return reply(`❌ Format salah\n\n.playch judul|kualitas`);
        }

        quality = (quality || 'sedang').toLowerCase();

        let channelId = "120363427771724325@newsletter";

        let bitrate =
            quality === 'jelek' ? '64k' :
            quality === 'superhigh' ? '256k' : '128k';

        await react('🔎');

        const search = await yts(query);

        if (!search || !search.videos || !search.videos.length) {
            await react('❔');
            return reply('❌ Lagu tidak ditemukan');
        }

        const vid = search.videos[0];

        await react('🌐');

        const headers = {
            accept: "application/json",
            "content-type": "application/json",
            "user-agent": "Mozilla/5.0",
            referer: "https://ytmp3.gg/"
        };

        const payload = {
            url: vid.url,
            os: "android",
            output: { type: "audio", format: "mp3" },
            audio: { bitrate: "128k" }
        };

        const req = async (u) =>
            axios.post(`https://${u}.ytconvert.org/api/download`, payload, { headers });

        let apiRes;
        try {
            apiRes = await req("hub").catch(() => req("api"));
        } catch (apiErr) {
            console.error("API Request Error:", apiErr.message);
            throw new Error("API Connection Failed");
        }

        const data = apiRes.data;
        let result;

        let pollCount = 0;
        while (pollCount < 60) {
            try {
                const poll = await axios.get(data.statusUrl, { headers });

                if (poll.data.status === "completed") {
                    result = poll.data;
                    break;
                }

                if (poll.data.status === "failed") {
                    await react('❌');
                    return reply('❌ Convert gagal dari server');
                }
            } catch (pollErr) {
                console.error("Poll Error:", pollErr.message);
            }

            pollCount++;
            await new Promise(r => setTimeout(r, 1500));
        }

        if (!result || !result.downloadUrl) {
            await react('❌');
            return reply('❌ Download URL timeout ya');
        }

        await react('⬇️');

        const audioRes = await axios.get(result.downloadUrl, {
            responseType: 'arraybuffer'
        });

        const inFile = path.join(os.tmpdir(), `in_${Date.now()}.mp3`);
        const outFile = path.join(os.tmpdir(), `out_${Date.now()}.ogg`);

        fs.writeFileSync(inFile, audioRes.data);

        await react('🎧');

        await new Promise((resolve, reject) => {
            ffmpeg(inFile)
                .audioCodec('libopus')
                .audioChannels(1)
                .audioFrequency(48000)
                .audioBitrate(bitrate)
                .format('ogg')
                .on('end', resolve)
                .on('error', (err) => {
                    console.error("FFmpeg Error:", err);
                    reject(err);
                })
                .save(outFile);
        });

        const vnBuffer = fs.readFileSync(outFile);

        await react('📤');

        await conn.sendMessage(channelId, {
            audio: vnBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        });

        try {
            if (fs.existsSync(inFile)) fs.unlinkSync(inFile);
            if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
        } catch {}

        await react('✅');

        return reply(
`✅ *PLAYCH SUKSES*

🎵 Judul : ${vid.title}
👤 Artist : ${vid.author.name}
⏱ Durasi : ${vid.timestamp}
⚙️ Kualitas : ${quality} (${bitrate})

📢 Channel otomatis:
${channelId}`
        );

    } catch (e) {
        console.error("CRITICAL PLAYCH ERROR:", e); // Ab yahan exact error print hoga log mein!
        try {
            await conn.sendMessage(from, {
                react: { text: '❌', key: mek.key }
            });
        } catch {}
        return reply(`❌ Gagal playch: ${e.message || e}`);
    }
});
