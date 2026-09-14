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
        
        // Swapped order: DeepAI is now first, Blackbox is second as fallback
        const deepAiUrl = `https://api-faa.my.id/faa/deep-ai?text=${encodedQuery}`;
        const blackboxUrl = `https://api-faa.my.id/faa/blackbox?query=${encodedQuery}`;

        let aiResult = "";

        const extractText = (data) => {
            if (!data) return "";
            if (typeof data === 'string') return data;
            
            if (typeof data === 'object') {
                let candidate = data.result || data.response || data.message || data.text || data.data || data.content;
                
                if (typeof candidate === 'string') return candidate;
                if (typeof candidate === 'object' && candidate !== null) {
                    return candidate.result || candidate.response || candidate.message || candidate.text || JSON.stringify(candidate, null, 2);
                }
                
                if (data.data) return extractText(data.data);
                
                return JSON.stringify(data, null, 2);
            }
            return String(data);
        };

        // Try DeepAI first
        try {
            const response = await axios.get(deepAiUrl, { timeout: 30000 });
            aiResult = extractText(response.data);
        } catch (e) {
            console.log("DeepAI API failed, trying Blackbox fallback...");
        }

        // If DeepAI fails, try Blackbox fallback
        if (!aiResult || aiResult.includes("[object Object]") || aiResult.trim() === "") {
            try {
                const responseFallback = await axios.get(blackboxUrl, { timeout: 30000 });
                aiResult = extractText(responseFallback.data);
            } catch (err) {
                console.error("Blackbox fallback also failed:", err.message);
            }
        }

        if (!aiResult || aiResult.includes("[object Object]") || aiResult.trim() === "") {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not get a valid response from AI.");
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
