import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

// Global database for group settings
global.antiStatusDb = global.antiStatusDb || {};

// Helper: Clean IDs to handle LID & Phone Numbers
const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';

// Admin Checker (Handles both normal JID & LID)
async function checkAdminStatus(conn, chatId, senderId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];

        const botId = cleanId(conn.user?.id || '');
        const botLid = cleanId(conn.user?.lid || '');
        const sender = cleanId(senderId);

        let isBotAdmin = false;
        let isSenderAdmin = false;

        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
                const pId = cleanId(p.id);
                const pLid = cleanId(p.lid);
                const pPhone = p.phoneNumber ? cleanId(p.phoneNumber) : '';

                if (pId === botId || pLid === botLid || pPhone === botId) {
                    isBotAdmin = true;
                }
                if (pId === sender || pLid === sender || pPhone === sender) {
                    isSenderAdmin = true;
                }
            }
        }

        return { isBotAdmin, isSenderAdmin };
    } catch (e) {
        console.error("[ANTI-STATUS-LOG] Admin Check Error:", e);
        return { isBotAdmin: false, isSenderAdmin: false };
    }
}

// ==================== ANTI STATUS MENTION COMMAND ====================
cmd({
    pattern: "antistatus",
    alias: ["antistatusmention", "antigm"],
    react: "🛡️",
    desc: "Protect group from Status Mention spam",
    category: "group",
    use: ".antistatus <on/off/kick/delete/warn>",
    filename: fileURLToPath(import.meta.url)
}, async (conn, mek, m, { args, reply, react, isGroup, isOwner }) => {
    try {
        if (!isGroup) {
            await react('❌');
            return reply("❌ *یہ کمانڈ صرف گروپس کے لیے ہے!*");
        }

        const { isSenderAdmin } = await checkAdminStatus(conn, m.chat, m.sender);

        if (!isSenderAdmin && !isOwner) {
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
            return reply("✅ *Anti Status Mention ENABLED! (Mode: Kick)*");
        } 
        else if (action === "delete") {
            global.antiStatusDb[m.chat] = "delete";
            await react('✅');
            return reply("✅ *Anti Status Mention ENABLED! (Mode: Delete Only)*");
        } 
        else if (action === "warn") {
            global.antiStatusDb[m.chat] = "warn";
            await react('✅');
            return reply("✅ *Anti Status Mention ENABLED! (Mode: Warn & Delete)*");
        } 
        else if (action === "off" || action === "disable") {
            global.antiStatusDb[m.chat] = "off";
            await react('✅');
            return reply("❌ *Anti Status Mention DISABLED!*");
        } 
        else {
            await react('❌');
            return reply("❌ *Invalid mode! Use: on, off, delete, or warn*");
        }

    } catch (error) {
        console.error("[ANTI-STATUS-LOG] Error setting command:", error);
        await react('❌');
        await reply(`❌ *Error:* ${error.message}`);
    }
});

// ==================== AUTO DETECTION LISTENER ====================
cmd({
    on: "body"
}, async (conn, mek, m, { isGroup, isOwner }) => {
    try {
        if (!isGroup || !m.chat) return;

        const mode = global.antiStatusDb[m.chat] || "off";
        if (mode === "off") return;

        // Deep Status Mention Detection
        const rawMsg = mek.message || {};
        const isStatusMention = Boolean(
            m.mtype === 'groupStatusMentionMessage' ||
            rawMsg.groupStatusMentionMessage ||
            rawMsg.messageContextInfo?.groupStatusMentionMessage ||
            m.msg?.contextInfo?.groupStatusMentionMessage ||
            JSON.stringify(rawMsg).includes('groupStatusMentionMessage')
        );

        if (!isStatusMention) return;

        console.log(`[ANTI-STATUS-LOG] 🎯 Status Mention Detected in group: ${m.chat}`);

        const sender = m.sender || mek.key.participant || m.key.participant;

        // Admin verification
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, m.chat, sender);

        // Admins and Owners are immune
        if (isSenderAdmin || isOwner) {
            console.log(`[ANTI-STATUS-LOG] ℹ️ Sender is Admin/Owner (${sender}). Skipping action.`);
            return;
        }

        // 1. DELETE ACTION
        const deleteKey = {
            remoteJid: m.chat,
            fromMe: false,
            id: mek.key.id,
            participant: sender
        };

        if (isBotAdmin) {
            try {
                await conn.sendMessage(m.chat, { delete: deleteKey });
                console.log(`[ANTI-STATUS-LOG] ✅ Message deleted successfully.`);
            } catch (e) {
                console.error("[ANTI-STATUS-LOG] ❌ Failed to DELETE status mention using custom key:", e.message);
                try {
                    await conn.sendMessage(m.chat, { delete: mek.key });
                } catch (err) {
                    console.error("[ANTI-STATUS-LOG] ❌ Failed to DELETE status mention using mek.key:", err.message);
                }
            }
        } else {
            console.error("[ANTI-STATUS-LOG] ⚠️ Cannot DELETE message: Bot is not Admin in this group.");
        }

        // 2. KICK / WARN / DELETE MODES
        if (mode === "kick" || mode === "on") {
            if (!isBotAdmin) {
                console.error("[ANTI-STATUS-LOG] ⚠️ Cannot KICK member: Bot is not Admin in this group.");
                return conn.sendMessage(m.chat, { 
                    text: "⚠️ *Anti-Status Mention Triggered!* لیکن میں اسے کِک نہیں کر سکتا کیونکہ بوٹ ایڈمن نہیں ہے۔" 
                }, { quoted: mek });
            }

            try {
                await conn.groupParticipantsUpdate(m.chat, [sender], "remove");
                console.log(`[ANTI-STATUS-LOG] ✅ Member (${sender}) KICKED successfully.`);

                await conn.sendMessage(m.chat, {
                    text: `⚠️ *Status mentions are strictly prohibited in this group.*\n\n🚫 *@${sender.split('@')[0]} was removed.*`,
                    mentions: [sender]
                });
            } catch (e) {
                console.error("[ANTI-STATUS-LOG] ❌ Failed to KICK user:", e.message);
                await conn.sendMessage(m.chat, { 
                    text: `❌ *Error removing user:* ${e.message}` 
                }, { quoted: mek });
            }
        } 
        else if (mode === "warn") {
            await conn.sendMessage(m.chat, {
                text: `⚠️ *@${sender.split('@')[0]} Warning! Status mentions are strictly prohibited in this group.*`,
                mentions: [sender]
            });
        }

    } catch (err) {
        console.error("[ANTI-STATUS-FATAL-ERROR]:", err);
    }
});
