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
        
        let imageUrl = '';

        // Agar user ne image bheji hai ya reply kiya hai
        if (/image/.test(mime)) {
            await reply("⏳ Processing image buffer...");
            let media = await quotedMsg.download();
            
            // Convert buffer to base64 data URI (Bina kisi uploader ke direct working)
            let b64 = media.toString('base64');
            imageUrl = `data:${mime};base64,${b64}`;
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
            return await reply("❌ Please provide an image URL or reply to an image with a prompt!\n\n*Usage:* \n.editfoto <image_url> | <prompt>\nOR reply to an image with: \n.editfoto <prompt>");
        }

        if (!promptText) {
            return await reply("❌ Please provide a prompt for editing!\n*Example:* .editfoto STYLISH FULL (while replying to an image)");
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
