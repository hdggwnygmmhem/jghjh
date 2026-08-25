import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "ai", // Is command ko run karne ke liye `.ai` likhna hoga (e.g., .ai hello)
    desc: "Ask anything to AI chatbot.",
    category: "ai",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        // Agar user ne command ke baad koi sawal nahi pucha
        if (!q) {
            return await reply("❌ Please provide a prompt/question!\n*Example:* .ai write a short poem about coding");
        }

        // User ko waiting message dikhane ke liye
        await reply("🤖 AI is thinking, please wait...");

        // API URL jisme encodeURIComponent use kiya hai taaki spaces aur special characters url me crash na karein
        const url = `https://api.princetechn.com/api/ai/ai?apikey=prince&q=${encodeURIComponent(q)}`;
        
        const response = await axios.get(url);
        
        if (response.data) {
            let aiResult = response.data;

            // Agar API direct text ke bajaye JSON object de rahi hai, to use handle karne ke liye:
            if (typeof aiResult === 'object') {
                // Agar response me 'result' ya 'response' ya 'ai' key hai to wo nikalenge, nahi to pura object text bana denge
                aiResult = aiResult.result || aiResult.response || aiResult.ai || JSON.stringify(aiResult, null, 2);
            }

            // AI ka jawaab chat me send karna
            return await reply(`${aiResult}`);
        } else {
            return await reply("❌ AI API se koi jawab nahi mila.");
        }

    } catch (e) {
        console.log(e);
        return await reply(`❌ Error occurred: ${e.message}`);
    }
});
