import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== DELINE SEARCH COMMAND ====================
cmd({
    pattern: "grubwa",
    alias: ["gsearch", "dlinesearch"],
    desc: "Search information using Deline API",
    category: "search",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;
    
    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://api.deline.web.id/search/grubwa`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ No results found from Deline API.");
        }

        // Formatting the response
        let resultText = `🔍 *DELINE SEARCH RESULTS*\n\n`;
        
        // Agar response JSON ya array/object hai toh usko neat format mein dikhayein
        if (typeof resData === 'object') {
            resultText += ````json\n${JSON.stringify(resData, null, 2)}\n````\n`;
        } else {
            resultText += `${resData}\n`;
        }

        resultText += `\n> Powered by KAMRAN-MD`;

        await conn.sendMessage(from, { text: resultText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Deline Search Error:", error);
        reply(`❌ *Error:* ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
