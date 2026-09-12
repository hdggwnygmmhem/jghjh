import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

async function uploadToTelegraph(buffer, mime) {
    try {
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        
        let ext = 'jpg';
        if (mime.includes('png')) ext = 'png';
        if (mime.includes('webp')) ext = 'webp';
        if (mime.includes('jpeg')) ext = 'jpeg';

        form.append('file', buffer, { filename: `image.${ext}`, contentType: mime });

        const res = await axios.post('https://telegra.ph/upload', form, {
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (res.data && res.data[0] && res.data[0].src) {
            return 'https://telegra.ph' + res.data[0].src;
        }
        return null;
    } catch (err) {
        console.log("Upload Error:", err?.response?.data || err.message);
        return null;
    }
}

cmd({
    pattern: "editfoto",
    alias: ["editai", "aiwriter", "aiimg"],
    desc: "Edit image using AI prompt.",
    category: "ai",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        let quotedMsg = m.quoted ? m.quoted : m;
        let mime = (quotedMsg.msg || quotedMsg).mimetype || '';
        
        let imageUrl = '';

        if (/image/.test(mime)) {
            await reply("⏳ Uploading image for editing, please wait...");
            let media = await quotedMsg.download();
            
            imageUrl = await uploadToTelegraph(media, mime);
            
            if (!imageUrl) {
                return await reply("❌ Image upload failed. Please provide a direct image URL instead.\n\n*Example:* .editfoto https://i.ibb.co/... | STYLISH FULL");
            }
        }

        let textArgs = q.split("|");
        let targetUrl = textArgs[0] ? textArgs[0].trim() : "";
        let promptText = textArgs[1] ? textArgs[1].trim() : "";

        if (!promptText && targetUrl) {
            if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
                promptText = textArgs.slice(1).join("|").trim() || args.slice(1).join(" ");
            } else {
                promptText = q;
                targetUrl = "";
            }
        }

        const finalImageUrl = targetUrl || imageUrl;

        if (!finalImageUrl) {
            return await reply("❌ Please reply to an image or provide an image URL!\n\n*Usage:* \n.editfoto <image_url> | <prompt>\n*Example:* \n.editfoto https://i.ibb.co/... | STYLISH FULL");
        }

        if (!promptText) {
            return await reply("❌ Please provide a prompt for editing!\n*Example:* .editfoto https://image.com/pic.jpg | STYLISH FULL");
        }

        await reply("🤖 AI is processing your image edit, please wait...");

        const apiUrl = `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(finalImageUrl)}&prompt=${encodeURIComponent(promptText)}`;
        
        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            validateStatus: status => status >= 200 && status < 500
        });

        if (response.data) {
            let contentType = response.headers['content-type'] || '';
            if (contentType.includes('application/json')) {
                let jsonStr = Buffer.from(response.data).toString('utf-8');
                let jsonObj = JSON.parse(jsonStr);
                return await reply(`❌ API Error: ${jsonObj.message || JSON.stringify(jsonObj)}`);
            }

            return await conn.sendMessage(from, { 
                image: Buffer.from(response.data), 
                caption: `✨ *Edited with Prompt:* ${promptText}` 
            }, { quoted: mek });

        } else {
            return await reply("❌ Edit API se koi response nahi mila.");
        }

    } catch (e) {
        console.log(e);
        return await reply(`❌ Error occurred: ${e.message}`);
    }
});
