import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ==================== AUTO CHAT / AI TOGGLE STATES ====================
const autoChatSettings = new Map();

// ==================== AUTO CHAT LISTENER (BODY HOOK) ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isGroup }) => {
    try {
        if (!body) return;

        // 1. Prevent bot from replying to its own messages (solves the infinite loop in Message yourself)
        if (m.key && m.key.fromMe) return;

        // 2. Ignore if message starts with a command prefix
        const prefix = /^[./!#]/;
        if (prefix.test(body.trim())) return;

        // 3. Check settings: Groups default to OFF unless enabled, IB defaults to OFF unless enabled
        const isEnabled = autoChatSettings.get(from);
        if (!isEnabled) return; // Agar on nahi hai toh kuch nahi karega

        // Process query through AI
        await fetchAndReplyAI(conn, mek, from, body);

    } catch (error) {
        console.error("Auto-Chat Error:", error);
    }
});

// ==================== AUTO CHAT ON/OFF COMMAND ====================
cmd({
    pattern: "autochat",
    alias: ["aichat", "chatbot"],
    desc: "Turn auto AI chat on or off in IB or Group",
    category: "owner",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isCreator, args, reply }) => {
    try {
        if (isGroup && !isAdmins && !isCreator) {
            return await reply("🔐 Only group admins or owner can toggle auto chat in groups.");
        }

        const status = args[0] ? args[0].toLowerCase() : '';

        if (status === 'on' || status === 'enable') {
            autoChatSettings.set(from, true);
            return await reply("✅ *Auto AI Chat has been turned ON for this chat!*");
        } else if (status === 'off' || status === 'disable') {
            autoChatSettings.set(from, false);
            return await reply("❌ *Auto AI Chat has been turned OFF for this chat.*");
        } else {
            const current = autoChatSettings.get(from);
            const currentState = current === true ? "ON 🟢" : "OFF 🔴";
            return await reply(`🤖 *Auto-Chat Status:* ${currentState}\n\n*Usage:*\n• \`.autochat on\`\n• \`.autochat off\``);
        }
    } catch (err) {
        console.error(err);
        await reply("❌ Failed to toggle auto chat.");
    }
});

// ==================== MANUAL AI COMMAND (.ai) ====================
cmd({
    pattern: "ai",
    desc: "Ask anything to AI chatbot.",
    category: "ai",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return await reply("❌ Please provide a prompt/question!\n*Example:* .ai write a short poem about coding");
        }

        await conn.sendMessage(from, { react: { text: "🤖", key: mek.key } });
        await fetchAndReplyAI(conn, mek, from, q);

    } catch (e) {
        console.log(e);
        return await reply(`❌ Error occurred: ${e.message}`);
    }
});

// ==================== CORE AI FETCH FUNCTION ====================
async function fetchAndReplyAI(conn, mek, from, queryText) {
    try {
        const url = `https://api.princetechn.com/api/ai/ai?apikey=prince&q=${encodeURIComponent(queryText)}`;
        const response = await axios.get(url, { timeout: 30000 });
        
        if (response.data) {
            let aiResult = response.data;

            if (typeof aiResult === 'object') {
                aiResult = aiResult.result || aiResult.response || aiResult.ai || JSON.stringify(aiResult, null, 2);
            }

            await conn.sendMessage(from, { text: `${aiResult}` }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { text: "❌ AI API se koi jawab nahi mila." }, { quoted: mek });
        }
    } catch (error) {
        console.error("AI API Error:", error.message);
    }
}
