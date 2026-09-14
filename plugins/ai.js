// plugins/ai.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "ai",
    alias: ["gpt", "chatgpt", "gemini", "ask"],
    desc: "Ask anything to Gemini AI chatbot.",
    category: "ai",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    try {
        if (!text?.trim()) {
            return reply(
                `❌ Please provide a prompt or question!\n\n` +
                `Example:\n` +
                `• ${usedPrefix + command} Hello, who are you?\n` +
                `• ${usedPrefix + command} write a short poem about coding`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Official Google Gemini Public Endpoint (Free & Reliable)
        // Aap yahan apni Gemini API key bhi laga sakte hain agar zaroorat ho
        const apiKey = "AIzaSyD-FreeGeminiKeyPlaceholder"; // Free public proxy endpoint
        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        // Alternative reliable free AI endpoint agar Google key na ho:
        const fallbackUrl = `https://api.giftedtech.web.id/api/ai/gpt4?apikey=gifted&q=${encodedQuery}`;

        let aiResult = "";
        try {
            const response = await axios.post(apiUrl, {
                contents: [{ parts: [{ text: text.trim() }] }]
            }, { timeout: 30000 });
            
            aiResult = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        } catch (e) {
            // Agar primary fail ho toh fallback API use karega
            const resFallback = await axios.get(fallbackUrl, { timeout: 30000 });
            aiResult = resFallback.data?.result || resFallback.data?.response;
        }

        if (!aiResult) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ AI se koi response nahi mila. Dobara koshish karein.");
        }

        await conn.sendMessage(from, { 
            text: `🤖 *KAMRAN-MD AI*\n\n${aiResult}` 
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("AI Error:", err);
        reply(`❌ Error: ${err.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
