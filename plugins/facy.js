import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "fancy",
    alias: ["stylish", "font", "fancytext"],
    desc: "Generate fancy/stylish fonts for text",
    category: "tools",
    react: "✨",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide some text to convert!\n\n` +
                `Example:\n` +
                `• .fancy Dr Kamran`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the Fancy Text API endpoint
        const encodedText = encodeURIComponent(text.trim());
        const apiUrl = `https://api.princetechn.com/api/tools/fancy?apikey=prince&text=${encodedText}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // Debugging log to check API structure if needed
        console.log("Fancy API Response:", JSON.stringify(resData, null, 2));

        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not generate fancy text from the API.");
        }

        // Handle result format (if result is an array of objects or strings)
        let results = resData.result;
        let formattedText = `✨ *KAMRAN-MD FANCY TEXT* ✨\n\n`;

        if (Array.isArray(results)) {
            // If API returns an array of styles/fonts
            results.forEach((item, index) => {
                const styleName = item.name || `Style ${index + 1}`;
                const stylized = item.result || item.text || item;
                formattedText += `*${styleName}:*\n${stylized}\n\n`;
            });
        } else if (typeof results === 'object') {
            // If result is an object mapping names to styles
            for (const [key, value] of Object.entries(results)) {
                formattedText += `*${key}:*\n${value}\n\n`;
            }
        } else {
            formattedText += `${results}\n\n`;
        }

        formattedText += `> Powered by KAMRAN-MD`;

        // Send the generated fancy text
        await reply(formattedText);

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("KAMRAN-MD Fancy Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
