import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

// Global DB
global.antiStatusDb = global.antiStatusDb || {};

// Prevent Bot Crash from Baileys Protocol Errors
process.on('uncaughtException', (err) => {
    if (err.message?.includes("reading 'id'") || err.message?.includes("Bad MAC")) {
        console.log("[SAFE-GUARD] Ignored protocol error to prevent crash.");
        return;
    }
    console.error("[CRITICAL UNCAUGHT ERROR]:", err);
});

const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';

// Admin Verification Logic
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
    } catch (e) {
        return { isBotAdmin: false, isSenderAdmin: false };
    }
}

// ==================== MAIN COMMAND & REPLY REMOVER ====================
cmd({
    pattern: "antistatus",
    alias: ["skick", "statuskick", "sdel"],
    react: "🛡️",
    desc: "Remove user who sent status mention",
    category: "group",
    use: "Reply to status mention with .skick or .antistatus",
    filename: fileURLToPath(import.meta.url)
}, async (conn, mek, m, { args, reply, react, isGroup, isOwner }) => {
    try {
        if (!isGroup) return reply("❌ *یہ کمانڈ صرف گروپس کے لیے ہے!*");

        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, m.chat, m.sender);

        if (!isSenderAdmin && !isOwner) {
            await react('❌');
            return reply("❌ *یہ کمانڈ صرف ایڈمنز کے لیے ہے!*");
        }

        // 1. DIRECT REPLY TO STATUS MENTION
        if (m.quoted) {
            if (!isBotAdmin) {
                await react('❌');
                return reply("⚠️ *بوٹ ایڈمن نہیں ہے، ممبر کو ریموو نہیں کیا جا سکتا!*");
            }

            const targetSender = m.quoted.sender;
            const targetAdmin = await checkAdminStatus(conn, m.chat, targetSender);

            if (targetAdmin.isSenderAdmin) {
                await react('❌');
                return reply("❌ *آپ کسی ایڈمن کو ریموو نہیں کر سکتے!*");
            }

            // Safe Delete Quoted Message
            try { 
                if (m.quoted.key && m.quoted.key.id) {
                    await conn.sendMessage(m.chat, { delete: m.quoted.key }); 
                }
            } catch (e) {
                console.log("[DELETE ERROR] Could not delete msg:", e.message);
            }

            // Kick Participant
            try {
                await conn.groupParticipantsUpdate(m.chat, [targetSender], "remove");
                await react('✅');
                return reply(`⚠️ *اسٹیٹس منشن پر ممبر کو گروپ سے ریموو کر دیا گیا ہے۔*\n\n🚫 *@${targetSender.split('@')[0]} removed.*`, { mentions: [targetSender] });
            } catch (kickErr) {
                await react('❌');
                return reply(`❌ *Remoal Failed:* ${kickErr.message}`);
            }
        }

        // 2. SETTINGS ON / OFF
        const action = args[0]?.toLowerCase();

        if (action === "on" || action === "kick") {
            global.antiStatusDb[m.chat] = "kick";
            await react('✅');
            return reply("✅ *Anti Status Mention Enabled!*");
        } else if (action === "off") {
            global.antiStatusDb[m.chat] = "off";
            await react('✅');
            return reply("❌ *Anti Status Mention Disabled!*");
        } else {
            await react('❓');
            return reply(`🛡️ *ANTI STATUS MENTION*

• Turn On: \`.antistatus on\`
• Turn Off: \`.antistatus off\`

💡 *Quick Kick:* کسی بھی اسٹیٹس منشن پر **Reply** کر کے \`.skick\` یا \`.antistatus\` لکھیں، بوٹ اسے ڈیلیٹ کر کے ممبر کو کِک کر دے گا۔`);
        }

    } catch (error) {
        await react('❌');
        return reply(`❌ *Error:* ${error.message}`);
    }
});

// ==================== SAFE AUTO LISTENER ====================
cmd({
    on: "message"
}, async (conn, mek, m, { isGroup, isOwner }) => {
    try {
        if (!isGroup) return;

        const mode = global.antiStatusDb[m.chat] || "off";
        if (mode === "off") return;

        // Safely check status message
        const rawMsg = mek?.message || {};
        const isStatus = Boolean(
            m.mtype === 'groupStatusMentionMessage' || 
            rawMsg.groupStatusMentionMessage
        );

        if (!isStatus) return;

        const sender = m.sender;
        if (!sender) return;

        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, m.chat, sender);
        if (isSenderAdmin || isOwner || !isBotAdmin) return;

        // Delete & Kick Safely
        if (mek.key && mek.key.id) {
            try { await conn.sendMessage(m.chat, { delete: mek.key }); } catch (e) {}
        }
        
        await conn.groupParticipantsUpdate(m.chat, [sender], "remove");
        await conn.sendMessage(m.chat, { text: `🚫 *@${sender.split('@')[0]} removed for sending status mention.*`, mentions: [sender] });

    } catch (err) {
        console.error("Auto Listener Safe Error Log:", err.message);
    }
});
