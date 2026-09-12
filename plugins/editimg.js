import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

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
        
        let imageBuffer = null;

        // Agar user ne image bheji hai ya reply kiya hai
        if (/image/.test(mime)) {
            await reply("⏳ Downloading image for editing...");
            imageBuffer = await quotedMsg.download();
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

        if (!targetUrl && !imageBuffer) {
            return await reply("❌ Please provide an image URL or reply to an image with a prompt!\n\n*Usage:* \n.editfoto <image_url> | <prompt>\nOR reply to an image with: \n.editfoto <prompt>");
        }

        if (!promptText) {
            return await reply("❌ Please provide a prompt for editing!\n*Example:* .editfoto STYLISH FULL (while replying to an image)");
        }

        await reply("🤖 AI is processing your image edit, please wait...");

        let response;

        if (imageBuffer) {
            const FormData = (await import('form-data')).default;
            const form = new FormData();
            form.append('image', imageBuffer, { filename: 'image.jpg', contentType: mime });
            form.append('prompt', promptText);

            response = await axios.post('https://api-faa.my.id/faa/editfoto', form, {
                headers: { ...form.getHeaders() },
                responseType: 'arraybuffer',
                timeout: 60000,
                validateStatus: status => status >= 200 && status < 500
            });
        } else {
            const apiUrl = `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(targetUrl)}&prompt=${encodeURIComponent(promptText)}`;
            response = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 60000,
                validateStatus: status => status >= 200 && status < 500
            });
        }

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
