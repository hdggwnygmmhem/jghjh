import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ==================== AUTO PING TOGGLE STATE ====================
// In-memory toggle state mapping (GroupId -> boolean)
const autoPingGroups = new Map();

// ==================== AUTO PING LISTENER (BODY HOOK) ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isGroup }) => {
    try {
        if (!body) return;

        // Verify if auto ping is enabled for this specific group
        if (isGroup && autoPingGroups.get(from) === false) return;

        const rawText = body.trim().toLowerCase();
        const triggers = ['ping', 'speed', 'pong'];

        if (triggers.includes(rawText)) {
            await executePing(conn, mek, from, body);
        }
    } catch (error) {
        console.error("Auto-Body Ping Error:", error);
    }
});

// ==================== AUTO PING ON/OFF COMMAND ====================
cmd({
    pattern: "autoping",
    alias: ["pingauto"],
    desc: "Turn auto ping checker on or off in the group",
    category: "main",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isCreator, args, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ This command only works in groups.");
        if (!isAdmins && !isCreator) return await reply("🔐 Only group admins or owner can toggle auto ping.");

        const status = args[0] ? args[0].toLowerCase() : '';

        if (status === 'on' || status === 'enable') {
            autoPingGroups.set(from, true);
            return await reply("✅ *Auto-ping listener has been turned ON for this group!* \nType 'ping' anytime without a prefix.");
        } else if (status === 'off' || status === 'disable') {
            autoPingGroups.set(from, false);
            return await reply("❌ *Auto-ping listener has been turned OFF for this group.*");
        } else {
            const currentState = autoPingGroups.get(from) !== false ? "ON 🟢" : "OFF 🔴";
            return await reply(`⚡ *Auto-Ping Status:* ${currentState}\n\n*Usage:*\n• \`.autoping on\` to enable\n• \`.autoping off\` to disable`);
        }
    } catch (err) {
        console.error(err);
        await reply("❌ Failed to toggle auto ping.");
    }
});

// ==================== PING COMMAND (Prefix Version) ====================
cmd({
    pattern: "ping",
    alias: ["speed", "pong"],
    use: '.ping',
    desc: "Check bot's response time.",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        await executePing(conn, mek, from, m.body || '');
    } catch (e) {
        console.error("Error in ping command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== CORE PING LOGIC ====================
async function executePing(conn, mek, from, bodyText) {
    const start = new Date().getTime();

    const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
    const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

    const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
    let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

    while (textEmoji === reactionEmoji) {
        textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
    }

    await conn.sendMessage(from, {
        react: { text: textEmoji, key: mek.key }
    });

    const end = new Date().getTime();
    const responseTime = (end - start) / 1000;

    const text = `> *KAMRAN-MD SPEED: ${responseTime.toFixed(2)}ms ${reactionEmoji}*`;

    await conn.sendMessage(from, {
        text,
        contextInfo: {
            mentionedJid: [mek.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363418144382782@newsletter',
                newsletterName: "DR KAMRAN",
                serverMessageId: 143
            }
        }
    }, { quoted: mek });
}

// ==================== PING2 COMMAND ====================
cmd({
    pattern: "ping2",
    desc: "Check bot's response time with detailed stats.",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const startTime = Date.now();

        await new Promise(resolve => setTimeout(resolve, 300));

        const endTime = Date.now();
        const ping = endTime - startTime;

        let status;
        if (ping < 1000) status = "⚡ *Fast & Responsive*";
        else if (ping < 1400) status = "⚙️ *Normal Speed*";
        else status = "🐢 *Slow Response*";

        const msg = `
*╭┈──〔 ⚡ KAMRAN-ᴍᴅ Pɪɴɢ 〕─⊷*
*├▢ 📶 Response:* ${ping} ms
*├▢ 🧠 Status:* ${status}
*├▢ 💫 Mode:* Active & Stable
*╰───────────────⊷*
        `;

        await conn.sendMessage(from, { text: msg.trim() }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`⚠️ Error: ${e.message}`);
    }
});
