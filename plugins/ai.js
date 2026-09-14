// plugins/ai.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "ai",
    alias: ["gpt", "chatgpt", "deepai", "blackbox"],
    desc: "Ask anything to AI chatbot via FAA APIs.",
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

        const encodedQuery = encodeURIComponent(text.trim());
        
        // Primary API: Blackbox endpoint
        const blackboxUrl = `https://api-faa.my.id/faa/blackbox?query=${encodedQuery}`;
        // Fallback API: DeepAI endpoint
        const deepAiUrl = `https://api-faa.my.id/faa/deep-ai?text=${encodedQuery}`;

        let aiResult = "";

        try {
            const response = await axios.get(blackboxUrl, { timeout: 30000 });
            const resData = response.data;
            
            // Support different JSON key structures returned by the API
            aiResult = resData?.result || resData?.response || resData?.message || resData?.text || (typeof resData === 'string' ? resData : '');
        } catch (e) {
            console.log("Blackbox API failed, trying DeepAI fallback...");
        }

        // If Blackbox fails or returns empty, try DeepAI endpoint
        if (!aiResult) {
            try {
                const responseFallback = await axios.get(deepAiUrl, { timeout: 30000 });
                const resDataFallback = responseFallback.data;
                
                aiResult = resDataFallback?.result || resDataFallback?.response || resDataFallback?.message || resDataFallback?.text || (typeof resDataFallback === 'string' ? resDataFallback : '');
            } catch (err) {
                console.error("DeepAI fallback also failed:", err.message);
            }
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
        console.error("AI Command Error:", err);
        reply(`❌ Error: ${err.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
