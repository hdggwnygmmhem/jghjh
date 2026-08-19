import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

// Database object to store group settings (You can link your MongoDB/JSON DB here)
global.antiStatusDb = global.antiStatusDb || {};

// ==================== ANTI STATUS MENTION COMMAND ====================
cmd({
    pattern: "antistatus",
    alias: ["antistatusmention", "antigm"],
    react: "🛡️",
    desc: "Protect group from Status Mention spam",
    category: "group",
    use: ".antistatus <on/off/kick/delete/warn>",
    filename: fileURLToPath(import.meta.url)
}, async (conn, mek, m, { args, q, reply, react, isGroup, isAdmins, isOwner }) => {
    try {
        if (!isGroup) {
            await react('❌');
            return reply("❌ *یہ کمانڈ صرف گروپس کے لیے ہے!*");
        }

        if (!isAdmins && !isOwner) {
            await react('❌');
            return reply("❌ *Admin Only Command!*");
        }

        const action = args[0]?.toLowerCase();

        if (!action) {
            await react('❓');
            const currentStatus = global.antiStatusDb[m.chat] || "off";
            return reply(`🛡️ *ANTI STATUS MENTION SETTINGS*

*Current Status:* \`${currentStatus.toUpperCase()}\`

*Commands:*
• \`.antistatus on\` / \`kick\` - Auto kick member
• \`.antistatus delete\` - Delete the message only
• \`.antistatus warn\` - Delete message & warn user
• \`.antistatus off\` - Turn off Anti Status Mention

> *© Powered By DR KAMRAN*`);
        }

        if (action === "on" || action === "kick") {
            global.antiStatusDb[m.chat] = "kick";
            await react('✅');
            return reply("✅ *Anti Status Mention HAS BEEN ENABLED! (Mode: Kick)*");
        } 
        else if (action === "delete") {
            global.antiStatusDb[m.chat] = "delete";
            await react('✅');
            return reply("✅ *Anti Status Mention HAS BEEN ENABLED! (Mode: Delete Only)*");
        } 
        else if (action === "warn") {
            global.antiStatusDb[m.chat] = "warn";
            await react('✅');
            return reply("✅ *Anti Status Mention HAS BEEN ENABLED! (Mode: Warn & Delete)*");
        } 
        else if (action === "off" || action === "disable") {
            global.antiStatusDb[m.chat] = "off";
            await react('✅');
            return reply("❌ *Anti Status Mention HAS BEEN DISABLED!*");
        } 
        else {
            await react('❌');
            return reply("❌ *Invalid mode! Use: on, off, delete, or warn*");
        }

    } catch (error) {
        console.error("AntiStatus Error:", error);
        await react('❌');
        await reply(`❌ *Error:* ${error.message}`);
    }
});

// ==================== AUTO DETECTION LISTENER ====================
cmd({
    on: "body"
}, async (conn, mek, m, { isGroup, isAdmins, isOwner, isBotAdmins }) => {
    try {
        if (!isGroup || !m.chat) return;

        const mode = global.antiStatusDb[m.chat] || "off";
        if (mode === "off") return;

        // Check if message is a Group Status Mention
        const isStatusMention = 
            m.mtype === 'groupStatusMentionMessage' || 
            Boolean(m.message?.groupStatusMentionMessage) ||
            Boolean(m.messageContextInfo?.groupStatusMentionMessage);

        if (!isStatusMention) return;

        // Admins & Owners are immune to Anti-Status
        if (isAdmins || isOwner) return;

        const sender = m.sender;

        // 1. Delete Message
        try {
            await conn.sendMessage(m.chat, { delete: mek.key });
        } catch (e) {
            console.error("Failed to delete status mention message:", e);
        }

        // 2. Action based on set Mode
        if (mode === "kick") {
            if (!isBotAdmins) {
                return conn.sendMessage(m.chat, { text: "⚠️ *Bot is not admin! Cannot remove member.*" }, { quoted: mek });
            }

            // Remove member from group
            await conn.groupParticipantsUpdate(m.chat, [sender], "remove");

            await conn.sendMessage(m.chat, {
                text: `⚠️ *Status mentions are not allowed in this group.*\n• *@${sender.split('@')[0]} has been removed.*`,
                mentions: [sender]
            });
        } 
        else if (mode === "warn") {
            await conn.sendMessage(m.chat, {
                text: `⚠️ *@${sender.split('@')[0]} Warning! Status mentions are strictly prohibited in this group.*`,
                mentions: [sender]
            });
        }
        else if (mode === "delete") {
            await conn.sendMessage(m.chat, {
                text: `⚠️ *Status mention deleted.*`
            });
        }

    } catch (err) {
        console.error("AntiStatus Detector Error:", err);
    }
});
