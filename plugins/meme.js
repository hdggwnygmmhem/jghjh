import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "meme",
    alias: ["randommeme", "memes"],
    desc: "Fetch random memes using FAA API",
    category: "fun",
    react: "😂",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the Meme API endpoint
        const apiUrl = `https://api-faa.my.id/faa/meme`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // Flexible data extraction (handles different JSON response structures)
        const memeInfo = resData.result || resData.data || resData;
        const memeUrl = memeInfo.url || memeInfo.image || memeInfo.media || (typeof memeInfo === 'string' ? memeInfo : '');
        const memeTitle = memeInfo.title || "Random Meme 😂";

        if (!memeUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve a meme image link from the API.");
        }

        // Send the meme image with title caption
        await conn.sendMessage(from, {
            image: { url: memeUrl },
            caption: `😂 *${memeTitle}*`
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Meme API Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
