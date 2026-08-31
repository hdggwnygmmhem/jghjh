import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// جن گروپوں میں anti-media ON ہے
let antiMediaGroups = new Set();
// Warning count save karne ke liye: "groupid_userid" : 1
let antiMediaWarns = {};

cmd({
    pattern: "antimedia",
    alias: ["anti-media", "nomedia"],
    desc: "Delete media + 3 warning + Kick",
    category: "group",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, isAdmins, isBotAdmins }) => {

    if (!isGroup) return reply("❌ *Sirf Group me chalta hai*");
    if (!isAdmins) return reply("❌ *Sirf Admin*");
    if (!isBotAdmins) return reply("❌ *Mujhe Admin banao pehle*");

    try {
        if (antiMediaGroups.has(from)) {
            antiMediaGroups.delete(from);
            return reply(`✅ *Anti-Media OFF kar diya*\n\nAb media allowed hai`);
        } else {
            antiMediaGroups.add(from);
            return reply(`🚫 *Anti-Media ON ho gaya*\n\n*Rule:*
1. 1st Media = Warning 1/3
2. 2nd Media = Warning 2/3
3. 3rd Media = Direct Kick`);
        }

    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// YE EVENT HAR MESSAGE PAR CHECK KAREGA
export const handler = async (conn, m) => {
    try {
        if (!m.isGroup) return;
        if (!antiMediaGroups.has(m.chat)) return;

        const type = Object.keys(m.message || {})[0];
        const mediaTypes = ["imageMessage", "videoMessage", "audioMessage", "pttMessage", "documentMessage", "stickerMessage"];

        // Agar media nahi hai to return
        if (!mediaTypes.includes(type)) return;

        const groupId = m.chat;
        const userId = m.sender;
        const key = `${groupId}_${userId}`;

        // Warning count badhao
        antiMediaWarns[key] = (antiMediaWarns[key] || 0) + 1;
        const warns = antiMediaWarns[key];
        const maxWarns = 3;

        // Media delete karo
        await conn.sendMessage(groupId, { delete: m.key });

        if (warns === 1) {
            await conn.sendMessage(groupId, {
                text: `⚠️ *WARNING 1/3* @${userId.split('@')[0]}\n\n🚫 Group me Media bhejna mana hai!`,
                mentions: [userId]
            });
        }
        else if (warns === 2) {
            await conn.sendMessage(groupId, {
                text: `⚠️ *WARNING 2/3* @${userId.split('@')[0]}\n\n🚫 Last Warning! Agli baar Kick`,
                mentions: [userId]
            });
        }
        else if (warns >= 3) {
            await conn.sendMessage(groupId, {
                text: `👢 *KICKED* @${userId.split('@')[0]}\n\n📌 Reason: 3 Baar Media bheja`,
                mentions: [userId]
            });

            // Kick karo
            await conn.groupParticipantsUpdate(groupId, [userId], "remove");

            // Warn reset kar do
            delete antiMediaWarns[key];
        }

    } catch (e) {
        console.log("AntiMedia Error:", e);
    }
}
