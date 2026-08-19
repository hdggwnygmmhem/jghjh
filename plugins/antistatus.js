import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

global.antiStatusDb = global.antiStatusDb || {};
const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';

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
                if (pId === botId || pLid === botLid || pPhone === botId) isBotAdmin = true;
                if (pId === sender || pLid === sender || pPhone === sender) isSenderAdmin = true;
            }
        }
        return { isBotAdmin, isSenderAdmin };
    } catch (e) { return { isBotAdmin: false, isSenderAdmin: false }; }
}

// ==================== COMMAND ====================
cmd({
    pattern: "antistatus",
    alias: ["antistatusmention"],
    react: "🛡️",
    desc: "Protect group from Status Mention spam",
    category: "group",
    filename: fileURLToPath(import.meta.url)
}, async (conn, mek, m, { args, reply, react, isGroup, isOwner }) => {
    if (!isGroup) return reply("❌ Only for groups!");
    const { isSenderAdmin } = await checkAdminStatus(conn, m.chat, m.sender);
    if (!isSenderAdmin && !isOwner) return reply("❌ Admin Only!");

    const action = args[0]?.toLowerCase();
    if (!action) return reply("Options: on (kick), delete, warn, off");
    
    global.antiStatusDb[m.chat] = action === "on" ? "kick" : action;
    await react('✅');
    reply(`✅ Anti Status set to: ${global.antiStatusDb[m.chat]}`);
});

// ==================== FIX: BROAD LISTENER ====================
cmd({
    on: "message" // Ye sab kuch catch karega
}, async (conn, mek, m, { isGroup, isOwner }) => {
    try {
        if (!isGroup) return;

        // DEBUG LOG: Ye terminal mein dikhega
        console.log(`[DEBUG] Message Type: ${m.mtype} | Chat: ${m.chat}`);

        const mode = global.antiStatusDb[m.chat] || "off";
        if (mode === "off") return;

        // Status Mention detection check
        const isStatusMention = 
            m.mtype === 'groupStatusMentionMessage' || 
            mek.message?.groupStatusMentionMessage || 
            mek.message?.protocolMessage?.type === 0; // Kuch status mention protocol message hote hain

        if (!isStatusMention) return;

        console.log(`[ALERT] Anti-Status triggered in ${m.chat}!`);

        const sender = m.sender;
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, m.chat, sender);

        if (isSenderAdmin || isOwner) return;

        // 1. Delete
        try {
            await conn.sendMessage(m.chat, { delete: mek.key });
        } catch (e) {
            console.log("[ERROR] Deletion failed:", e.message);
        }

        // 2. Action
        if (mode === "kick" && isBotAdmin) {
            await conn.groupParticipantsUpdate(m.chat, [sender], "remove");
            await conn.sendMessage(m.chat, { text: `⚠️ Status mentions are banned. Removed @${sender.split('@')[0]}`, mentions: [sender] });
        } else if (mode === "warn") {
            await conn.sendMessage(m.chat, { text: `⚠️ Warned @${sender.split('@')[0]}`, mentions: [sender] });
        }

    } catch (err) {
        console.error("[CRITICAL ERROR]:", err);
    }
});
