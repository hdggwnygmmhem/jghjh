import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

let antiMediaGroups = new Set();
let antiMediaWarns = {};

cmd({
    pattern: "antimedia",
    alias: ["anti-media", "nomedia"],
    desc: "Delete media + 3 warning + Kick",
    category: "group",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, isGroupAdmins, isBotAdmins, sender }) => {

    if (!isGroup) return reply("❌ *Sirf Group me chalta hai*");
    
    // FIX: Admin check 2 tarike se
    const isAdmin = isGroupAdmins || m.key.participant === sender;
    if (!isAdmin) return reply("❌ *Sirf Admin*");
    
    if (!isBotAdmins) return reply("❌ *Mujhe Admin banao pehle*");

    try {
        if (antiMediaGroups.has(from)) {
            antiMediaGroups.delete(from);
            delete antiMediaWarns[from]; // reset warns
            return reply(`✅ *Anti-Media OFF kar diya*\n\nAb media allowed hai`);
        } else {
            antiMediaGroups.add(from);
            if(!antiMediaWarns[from]) antiMediaWarns[from] = {};
            return reply(`🚫 *Anti-Media ON ho gaya*\n\n*Rule:*\n1. 1st Media = Warning 1/3\n2. 2nd Media = Warning 2/3\n3. 3rd Media = Direct Kick`);
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

        if (!mediaTypes.includes(type)) return;

        const groupId = m.chat;
        const userId = m.key.participant; // FIX: participant lena hai
        const senderNum = userId.split('@')[0];
        const key = `${groupId}_${senderNum}`;

        // Get group metadata to check if sender is admin
        const metadata = await conn.groupMetadata(groupId);
        const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
        if(admins.includes(userId)) return; // Skip admins

        // Warning count
        if(!antiMediaWarns[groupId]) antiMediaWarns[groupId] = {};
        antiMediaWarns[groupId][senderNum] = (antiMediaWarns[groupId][senderNum] || 0) + 1;
        const warns = antiMediaWarns[groupId][senderNum];

        // Delete
        await conn.sendMessage(groupId, { delete: m.key });

        if (warns === 1) {
            await conn.sendMessage(groupId, { text: `⚠️ *WARNING 1/3* @${senderNum}\n\n🚫 Group me Media mana hai!`, mentions: [userId] });
        }
        else if (warns === 2) {
            await conn.sendMessage(groupId, { text: `⚠️ *WARNING 2/3* @${senderNum}\n\n🚫 Last Warning! Agli baar Kick`, mentions: [userId] });
        }
        else if (warns >= 3) {
            await conn.sendMessage(groupId, { text: `👢 *KICKED* @${senderNum}\n\n📌 3 Baar Media bheja`, mentions: [userId] });
            await conn.groupParticipantsUpdate(groupId, [userId], "remove");
            delete antiMediaWarns[groupId][senderNum];
        }

    } catch (e) {
        console.log("AntiMedia Error:", e);
    }
}
