import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// Global memory mein Autochat ka status store karne ke liye
global.autochatStatus = global.autochatStatus || false;

// 1. AI Command (.ai <query>)
cmd({
    pattern: "ai", 
    desc: "Ask anything to AI chatbot.",
    category: "ai",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) {
            return await reply("❌ Please provide a prompt/question!\n*Example:* .ai write a short poem about coding");
        }

        await reply("🤖 AI is thinking, please wait...");

        const url = `https://api.princetechn.com/api/ai/ai?apikey=prince&q=${encodeURIComponent(q)}`;
        const response = await axios.get(url);
        
        if (response.data) {
            let aiResult = response.data;
            if (typeof aiResult === 'object') {
                aiResult = aiResult.result || aiResult.response || aiResult.ai || JSON.stringify(aiResult, null, 2);
            }
            return await reply(`${aiResult}`);
        } else {
            return await reply("❌ AI API se koi jawab nahi mila.");
        }

    } catch (e) {
        console.log(e);
        return await reply(`❌ Error occurred: ${e.message}`);
    }
});

// 2. Autochat Toggle Command (.autochat on / off)
cmd({
    pattern: "autochat",
    desc: "Enable or disable auto AI reply in personal chat",
    category: "ai",
    filename: __filename
},
async (conn, mek, m, { reply, args, isBotOwner }) => {
    try {
        // Sirf Bot Owner ke liye (Agar sab ke liye karna ho toh yeh line hata sakte hain)
        if (!isBotOwner) {
            return reply("❌ Yeh command sirf bot owner ke liye hai!");
        }

        const option = args[0] ? args[0].toLowerCase() : '';

        if (option === "on") {
            global.autochatStatus = true;
            return reply("✅ *Autochat mode successfully enable ho gaya hai.*\n\nAb koi bhi user personal chat mein bina command ke message karega toh AI khud reply karega.");
        } else if (option === "off") {
            global.autochatStatus = false;
            return reply("❌ *Autochat mode disable ho gaya hai.*");
        } else {
            return reply(`⚙️ *Autochat Settings*\n\nStatus: ${global.autochatStatus ? "🟢 Enabled" : "🔴 Disabled"}\n\n*Usage:*\n• .autochat on\n• .autochat off`);
        }

    } catch (err) {
        console.error("Autochat Toggle Error:", err);
        reply("❌ Autochat command run karne mein error aaya.");
    }
});

// 3. Autochat Background Listener (InBox Auto Reply)
cmd({
    on: "text"
},
async (conn, mek, m, { isBotOwner }) => {
    try {
        // Agar Autochat off hai toh kuch mat karo
        if (!global.autochatStatus) return;

        const remoteJid = m.key.remoteJid || mek.key.remoteJid;
        
        // Sirf Personal Chat (PM) ke liye, group mein auto reply nahi karega
        if (remoteJid.endsWith('@g.us')) return;

        // Agar message bot ka khud ka bheja hua hai ya owner ka hai toh ignore karo
        if (m.key.fromMe || isBotOwner) return;

        const messageText = m.text || mek.message?.conversation || mek.message?.extendedTextMessage?.text;
        if (!messageText) return;

        // Agar message kisi command se start ho raha hai (jaise .ai ya .menu), toh autochat trigger nahi hoga
        if (messageText.startsWith('.')) return;

        // AI API ko request bhejna
        const url = `https://api.princetechn.com/api/ai/ai?apikey=prince&q=${encodeURIComponent(messageText)}`;
        const response = await axios.get(url);

        if (response.data) {
            let aiResult = response.data;
            if (typeof aiResult === 'object') {
                aiResult = aiResult.result || aiResult.response || aiResult.ai || JSON.stringify(aiResult, null, 2);
            }
            await conn.sendMessage(remoteJid, { text: aiResult }, { quoted: mek });
        }

    } catch (e) {
        console.error("Autochat Listener Error:", e);
    }
});
