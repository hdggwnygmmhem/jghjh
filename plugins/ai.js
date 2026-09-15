// plugins/ai.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== AUTO CHAT TOGGLE STATES ====================
// In-memory toggle storage mapping Chat Id -> boolean
const autoChatSettings = new Map();

// ==================== AUTO CHAT LISTENER (BODY HOOK) ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isGroup }) => {
    try {
        if (!body) return;

        // 1. STRICTLY IB ONLY: Ignore groups completely
        if (isGroup) return;

        // 2. Ignore command prefixes (e.g., '.', '/', '!')
        const prefix = /^[./!#]/;
        if (prefix.test(body.trim())) return;

        // 3. Check if auto chat is enabled for this specific IB chat ID
        const isEnabled = autoChatSettings.get(from);
        if (!isEnabled) return;

        // Note: 'Message yourself' mein khud ke messages ko allow karne ke liye 
        // m.key.fromMe check yahan se hata diya hai taaki aapki chat mein auto-reply chale.

        // Process message through AI engine automatically
        await fetchAndReplyAI(conn, mek, from, body);

    } catch (error) {
        console.error("Auto-Chat Error:", error);
    }
});

// ==================== AUTO CHAT ON/OFF COMMAND ====================
cmd({
    pattern: "autochat",
    alias: ["aichat", "chatbot"],
    desc: "Turn auto AI chat on or off in IB",
    category: "ai",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, args, reply }) => {
    try {
        // Block inside groups
        if (isGroup) {
            return await reply("❌ *Auto-Chat is only allowed in IB (Inbox), not in groups!*");
        }

        const status = args[0] ? args[0].toLowerCase() : '';

        if (status === 'on' || status === 'enable') {
            autoChatSettings.set(from, true);
            return await reply("✅ *Auto AI Chat has been turned ON for this IB chat!* \nBot will now reply to normal messages automatically.");
        } else if (status === 'off' || status === 'disable') {
            autoChatSettings.set(from, false);
            return await reply("❌ *Auto AI Chat has been turned OFF for this IB chat.*");
        } else {
            const current = autoChatSettings.get(from);
            const currentState = current === true ? "ON 🟢" : "OFF 🔴";
            return await reply(`🤖 *Auto-Chat Status (IB Only):* ${currentState}\n\n*Usage:*\n• \`.autochat on\` to enable\n• \`.autochat off\` to disable`);
        }
    } catch (err) {
        console.error(err);
        await reply("❌ Failed to toggle auto chat.");
    }
});

// ==================== MANUAL AI COMMAND (.ai) ====================
cmd({
    pattern: "ai",
    alias: ["gpt", "chatgpt", "deepai", "blackbox"],
    desc: "Ask anything to AI chatbot via FAA APIs (IB Only).",
    category: "ai",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, isGroup, reply }) => {
    try {
        // Block inside groups
        if (isGroup) {
            return await reply("❌ *AI commands can only be used in IB (Inbox), not in groups!*");
        }

        if (!text?.trim()) {
            return reply(
                `❌ Please provide a prompt or question!\n\n` +
                `Example:\n` +
                `• ${usedPrefix + command} Hello, who are you?\n` +
                `• ${usedPrefix + command} write a short poem about coding`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        await fetchAndReplyAI(conn, mek, from, text.trim());

    } catch (err) {
        console.error("AI Command Error:", err);
        reply(`❌ Error: ${err.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});

// ==================== CORE AI FETCH ENGINE ====================
async function fetchAndReplyAI(conn, mek, from, queryText) {
    try {
        const encodedQuery = encodeURIComponent(queryText);
        
        // DeepAI first, Blackbox as fallback
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
            return await conn.sendMessage(from, { text: "❌ Could not get a valid response from AI." }, { quoted: mek });
        }

        await conn.sendMessage(from, { 
            text: `🤖 *KAMRAN-MD AI*\n\n${aiResult}` 
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("AI Fetch Engine Error:", error.message);
    }
}
