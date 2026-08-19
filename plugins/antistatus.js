import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

// Global Database Object
global.antiStatusDb = global.antiStatusDb || {};

// Helper: Clean IDs for JID and LID
const cleanId = (id) => id ? id.split('@')[0].split(':')[0] : '';

// Admin Checker Logic
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
        console.error("Admin Check Error:", e);
        return { isBotAdmin: false, isSenderAdmin: false };
    }
}

// ==================== ANTISTATUS MAIN COMMAND ====================
cmd({
    pattern: "antistatus",
    alias: ["antistatusmention"],
    react: "🛡️",
    desc: "Anti Status Mention Settings and Manual Trigger",
    category: "group",
    use: ".antistatus <on/off/skick/sdel>",
    filename: fileURLToPath(import.meta.url)
}, async (conn, mek, m, { args, reply, react, isGroup, isOwner }) => {
    try {
        if (!isGroup) {
            await react('❌');
            return reply("❌ *یہ کمانڈ صرف گروپس کے لیے ہے!*");
        }

        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, m.chat, m.sender);

        if (!isSenderAdmin && !isOwner) {
            await react('❌');
            return reply("❌ *یہ کمانڈ صرف گروپ ایڈمنز کے لیے ہے!*");
        }

        const action = args[0]?.toLowerCase();

        // 1. If Admin Relies to a Status Mention directly with .antistatus
        if (m.quoted) {
            if (!isBotAdmin) {
                await react('❌');
                return reply("⚠️ *بوٹ ایڈمن نہیں ہے، عمل مکمل نہیں ہو سکتا!*");
            }

            const targetSender = m.quoted.sender;
            const targetAdminCheck = await checkAdminStatus(conn, m.chat, targetSender);

            if (targetAdminCheck.isSenderAdmin) {
                await react('❌');
                return reply("❌ *آپ کسی ایڈمن کو کِک یا ریموو نہیں کر سکتے!*");
            }

            // Delete Message
            try { await conn.sendMessage(m.chat, { delete: m.quoted.key }); } catch (e) {}

            // Kick Participant
            await conn.groupParticipantsUpdate(m.chat, [targetSender], "remove");
            await react('✅');

            return reply(`⚠️ *اسٹیٹس منشن پر ایکشن لے لیا گیا ہے۔*\n\n🚫 *@${targetSender.split('@')[0]} has been removed.*`, { mentions: [targetSender] });
        }

        // 2. Settings Menu
        if (!action) {
            await react('❓');
            const currentMode = global.antiStatusDb[m.chat] || "OFF";
            return reply(`🛡️ *ANTI-STATUS MENTION SYSTEM*

*Current Status:* \`${currentMode.toUpperCase()}\`

📌 *استعمال کرنے کے طریقے:*

1️⃣ *Direct Reply Method (100% Guaranteed):*
   کسی بھی اسٹیٹس منشن پر ریپلائی کر کے لکھیں:
   • \`.skick\` - ڈیلیٹ + کِک ممبر
   • \`.sdel\` - صرف ڈیلیٹ کریں
   • \`.swarn\` - وارننگ دیں

2️⃣ *Mode Toggle:*
   • \`.antistatus on\` - اینٹی اسٹیٹس سسٹم آن کریں
   • \`.antistatus off\` - سسٹم آف کریں

> *© Powered By DR KAMRAN*`);
        }

        if (action === "on" || action === "enable") {
            global.antiStatusDb[m.chat] = "ON";
            await react('✅');
            return reply("✅ *Anti Status Mention HAS BEEN ENABLED!*\n\n> ایڈمنز اب کسی بھی اسٹیٹس منشن پر `.skick` یا `.sdel` سے ریپلائی کر کے اسے فوراً ہٹا سکتے ہیں۔");
        } 
        else if (action === "off" || action === "disable") {
            global.antiStatusDb[m.chat] = "OFF";
            await react('✅');
            return reply("❌ *Anti Status Mention HAS BEEN DISABLED!*");
        } 
        else {
            await react('❌');
            return reply("❌ *غلط کمانڈ! استعمال کریں:* `.antistatus on` یا `.antistatus off`");
        }

    } catch (error) {
        console.error("AntiStatus Command Error:", error);
        await react('❌');
        return reply(`❌ *Error:* ${error.message}`);
    }
});
