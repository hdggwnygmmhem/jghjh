import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "glossysilver",
    alias: ["silver", "glossytext"],
    desc: "Generate glossy silver text effect using ephoto360 API.",
    category: "logo",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        let text = q ? q.trim() : "";

        if (!text && m.quoted) {
            text = m.quoted.text || m.quoted.caption || "";
        }

        if (!text) {
            return await reply("❌ Please provide text for the logo!\n\n*Usage:* \n.glossysilver DR KAMRAN\n*Example:* \n.glossysilver KAMRAN");
        }

        await reply("⏳ Generating glossy silver text effect, please wait...");

        const apiUrl = `https://api.princetechn.com/api/ephoto360/glossysilver?apikey=prince&text=${encodeURIComponent(text)}`;
        
        const response = await axios.get(apiUrl, {
            timeout: 60000,
            validateStatus: status => status >= 200 && status < 500
        });

        if (response.data) {
            let resData = response.data;
            
            // Checking common JSON structures for image URLs in text-maker APIs
            let imageUrl = resData.result?.url || resData.url || resData.result || resData.image || '';

            if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
                return await conn.sendMessage(from, { 
                    image: { url: imageUrl }, 
                    caption: `✨ *Glossy Silver Effect for:* ${text}` 
                }, { quoted: mek });
            } else {
                return await reply(`📦 *API Response:*\n\`\`\`${JSON.stringify(resData, null, 2)}\`\`\``);
            }
        } else {
            return await reply("❌ API se koi response nahi mila.");
        }

    } catch (e) {
        console.log(e);
        return await reply(`❌ Error occurred: ${e.message}`);
    }
});
