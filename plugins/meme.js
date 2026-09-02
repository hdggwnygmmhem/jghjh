import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "meme",
    alias: ["randommeme", "memes"],
    desc: "Fetch random memes using api",
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

        // Flexible data extraction
        const memeInfo = resData.result || resData.data || resData;
        const memeUrl = memeInfo.url || memeInfo.image || memeInfo.media || (typeof memeInfo === 'string' ? memeInfo : '');
        const memeTitle = memeInfo.title || "Random Meme 😂";

        if (!memeUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve a meme image link from the API.");
        }

        // Download image as arraybuffer to avoid file path errors in Baileys
        const imageResponse = await axios.get(memeUrl, { responseType: 'arraybuffer', timeout: 30000 });
        const imageBuffer = Buffer.from(imageResponse.data);

        // Send the meme image buffer with title caption
        await conn.sendMessage(from, {
            image: imageBuffer,
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
