import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ==================== AUTO CHAT / AI TOGGLE STATES ====================
// In-memory toggle storage mapping Chat/GroupId -> boolean
const autoChatSettings = new Map();

// ==================== AUTO CHAT LISTENER (BODY HOOK) ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isGroup }) => {
    try {
        if (!body) return;

        // Ignore if message starts with a command prefix (e.g., '.', '/', '!')
        const prefix = /^[./!#]/;
        if (prefix.test(body.trim())) return;

        // Check if auto chat is enabled for this specific chat/group
        // Default: false for groups (unless turned on), true for IB (personal chat) or customize as needed.
        const isEnabled = autoChatSettings.get(from);
        
        // If it's a group and auto group chatting is not explicitly enabled, return
        if (isGroup && !isEnabled) return;
        
        // If it's IB (personal chat) and explicitly turned off, return (otherwise enabled by default in IB, or check explicit setting)
        if (!isGroup && isEnabled === false) return;

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
    category: "ai",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isCreator, args, reply }) => {
    try {
        // In groups, require admin or owner permissions
        if (isGroup && !isAdmins && !isCreator) {
            return await reply("🔐 Only group admins or owner can toggle auto chat in groups.");
        }

        const status = args[0] ? args[0].toLowerCase() : '';

        if (status === 'on' || status === 'enable') {
            autoChatSettings.set(from, true);
            return await reply("✅ *Auto AI Chat has been turned ON for this chat!* \nBot will now reply to normal messages automatically.");
        } else if (status === 'off' || status === 'disable') {
            autoChatSettings.set(from, false);
            return await reply("❌ *Auto AI Chat has been turned OFF for this chat.*");
        } else {
            const current = autoChatSettings.get(from);
            const currentState = current === true ? "ON 🟢" : "OFF 🔴";
            return await reply(`🤖 *Auto-Chat Status:* ${currentState}\n\n*Usage:*\n• \`.autochat on\` to enable\n• \`.autochat off\` to disable`);
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
