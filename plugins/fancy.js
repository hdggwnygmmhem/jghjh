import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "fancy",
    alias: ["stylish", "font", "fancytext"],
    desc: "Generate fancy/stylish fonts with names and numbers",
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

        if (!resData || !resData.status || !resData.results) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not generate fancy text from the API.");
        }

        let results = resData.results;
        let formattedText = `✨ *KAMRAN-MD FANCY STYLES* ✨\n\n`;
        let count = 1;

        if (Array.isArray(results)) {
            results.forEach((item) => {
                const styleName = item.name || `Style ${count}`;
                const stylized = item.result || '';
                if (stylized) {
                    formattedText += `*${count}. ${styleName}*\n${stylized}\n\n`;
                    count++;
                }
            });
        }

        formattedText += `> Powered by KAMRAN-MD`;

        // Send the numbered and named fancy text list
        await reply(formattedText);

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("KAMRAN-MD Fancy Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
