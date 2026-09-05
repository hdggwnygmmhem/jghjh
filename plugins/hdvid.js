import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import FormData from 'form-data';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "hdvideo",
    alias: ["unblurvideo", "vhd"],
    desc: "Enhance video quality to HD/2K",
    category: "tools",
    react: "🎥",
    filename: __filename,
    limit: true
},
async (conn, mek, m, { from, reply, usedPrefix, command }) => {
    try {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        if (!/video/.test(mime)) {
            return reply(`Balas video dengan perintah *${usedPrefix + command}*`);
        }

        // ⏳ React - processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        
        // 1000ms delay to ensure react is visible
        await new Promise(resolve => setTimeout(resolve, 1000));

        await reply('Sedang memproses video, mohon tunggu sebentar (bisa memakan waktu beberapa menit)...');

        let videoBuffer = await q.download();
        let UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
        let SERIAL = crypto.createHash('md5').update(UA + Date.now()).digest('hex');

        const headers = (extra = {}) => Object.assign({
            'accept': '*/*',
            'product-serial': SERIAL,
            'user-agent': UA,
            'Referer': 'https://unblurimage.ai/'
        }, extra);

        // 1. Register File
        let fileName = crypto.randomBytes(3).toString('hex') + '_video.mp4';
        let formReg = new FormData();
        formReg.append('video_file_name', fileName);
        
        let reg = await axios.post('https://api.unblurimage.ai/api/upscaler/v1/ai-video-enhancer/upload-video', formReg, {
            headers: Object.assign(headers(), formReg.getHeaders())
        });

        let { url: ossUrl, object_name: objectName } = reg.data.result;

        // 2. Upload to OSS
        await axios.put(ossUrl, videoBuffer, {
            headers: { 'Content-Type': 'video/mp4', 'User-Agent': UA }
        });

        // 3. Create Job
        let formJob = new FormData();
        formJob.append('original_video_file', `https://cdn.unblurimage.ai/${objectName}`);
        formJob.append('resolution', '');
        formJob.append('is_preview', 'false');

        let create = await axios.post('https://api.unblurimage.ai/api/upscaler/v2/ai-video-enhancer/create-job', formJob, {
            headers: Object.assign(headers(), formJob.getHeaders())
        });

        let jobId = create.data.result.job_id;
        if (!jobId) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply('Gagal membuat tugas pemrosesan.');
        }

        // 4. Polling Job
        let outputUrl = null;
        for (let i = 0; i < 60; i++) { // Max 5 menit
            await new Promise(resolve => setTimeout(resolve, 5000));
            let check = await axios.get(`https://api.unblurimage.ai/api/upscaler/v2/ai-video-enhancer/get-job/${jobId}`, {
                headers: headers()
            });
            if (check.data.result?.output_url) {
                outputUrl = check.data.result.output_url;
                break;
            }
        }

        if (!outputUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply('Proses timeout atau gagal.');
        }

        await conn.sendMessage(from, { 
            video: { url: outputUrl }, 
            caption: '✅ Video Berhasil di-Enhance (2K)' 
        }, { quoted: mek });

        // 800ms delay before success react
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // ✅ React - success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in hdvideo command:", e);
        // ❌ React - error
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ Terjadi kesalahan saat memproses video: ${e.message}`);
    }
});
          
