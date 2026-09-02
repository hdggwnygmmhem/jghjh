import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "waifu",
    alias: ["randomwaifu", "animegirl"],
    desc: "Get a random anime waifu image via FAA API",
    category: "anime",
    react: "🌸",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint
        const apiUrl = `https://api-faa.my.id/faa/waifu`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // Check response (adjusting based on general API patterns)
        // Agar API direct URL ya object bhejti hai toh uske mutabiq handle kiya hai
        const imageUrl = resData.result || resData.url || resData;

        if (!imageUrl || typeof imageUrl !== 'string') {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not retrieve a valid waifu image link from the API.");
        }

        // Send the waifu image
        await conn.sendMessage(from, { 
            image: { url: imageUrl }, 
            caption: `✨ *Random Waifu*` 
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Waifu Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
