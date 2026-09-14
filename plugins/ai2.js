import { fileURLToPath } from 'url';
import config from '../config.js';
import { cmd } from '../command.js';
import { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } from '../lib/functions.js';
import converter from '../lib/converter.js';

const __filename = fileURLToPath(import.meta.url);

// ==================== AUTO GROUP BODY LISTENER (No Prefix Needed) ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isGroup, isAdmins, isCreator, participants, isBotAdmins, botNumber, botNumber2 }) => {
    try {
        if (!body) return;
        if (!isGroup) return; // Only work inside groups

        // Prevent bot from replying to its own messages
        if (m.key && m.key.fromMe) return;

        const rawText = body.trim();
        const lowerBody = rawText.toLowerCase();
        const args = rawText.split(' ');
        const commandName = args[0].toLowerCase();
        const queryText = args.slice(1).join(' ');

        // 1. AUTO ANTI-LINK
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        if (urlRegex.test(body)) {
            if (!isAdmins && !isCreator) {
                try {
                    await conn.sendMessage(from, { delete: m.key });
                    await conn.sendMessage(from, { text: `⚠️ @${m.sender.split('@')[0]} Links are not allowed in this group!`, mentions: [m.sender] });
                    return;
                } catch (e) {
                    console.error("Anti-link delete error:", e);
                }
            }
        }

        // 2. MUTE / LOCK / CLOSE
        if (commandName === 'mute' || commandName === 'lock' || commandName === 'close') {
            if (!isAdmins && !isCreator) return;
            if (!isBotAdmins) return await conn.sendMessage(from, { text: "❌ I must be admin to mute the group." }, { quoted: mek });
            await conn.groupSettingUpdate(from, 'announcement');
            return await conn.sendMessage(from, { text: "*🔇 Group has been muted automatically!*" }, { quoted: mek });
        }

        // 3. UNMUTE / UNLOCK / OPEN
        if (commandName === 'unmute' || commandName === 'unlock' || commandName === 'open') {
            if (!isAdmins && !isCreator) return;
            if (!isBotAdmins) return await conn.sendMessage(from, { text: "❌ I must be admin to unmute the group." }, { quoted: mek });
            await conn.groupSettingUpdate(from, 'not_announcement');
            return await conn.sendMessage(from, { text: "*🔊 Group has been unmuted automatically!*" }, { quoted: mek });
        }

        // 4. TAGALL / TAG
        if (commandName === 'tagall' || commandName === 'tag' || commandName === 'gc_tagall') {
            if (!isAdmins && !isCreator) return;
            
            let groupInfo = await conn.groupMetadata(from).catch(() => null);
            if (!groupInfo) return;

            let groupName = groupInfo.subject || "Unknown Group";
            let totalMembers = participants ? participants.length : 0;
            if (totalMembers === 0) return;

            let customMsg = queryText || "Attention Everyone";
            let teks = `▢ Group : *${groupName}*\n▢ Members : *${totalMembers}*\n▢ Message: *${customMsg}*\n\n┌───⊷ *MENTIONS*\n`;

            for (let mem of participants) {
                if (!mem.id) continue;
                teks += `📢 @${mem.id.split('@')[0]}\n`;
            }

            teks += "└──✪ KAMRAN ┃ MD ✪──";
            return await conn.sendMessage(from, { text: teks, mentions: participants.map(a => a.id) }, { quoted: mek });
        }

        // 5. KICK / REMOVE
        if (commandName === 'kick' || commandName === 'kick1' || commandName === 'remove' || commandName === 'remove1') {
            if (!isAdmins && !isCreator) return;
            if (!isBotAdmins) return await conn.sendMessage(from, { text: "❌ I must be admin to remove someone." }, { quoted: mek });

            let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);
            if (!target) return await conn.sendMessage(from, { text: "❓ Please mention a user or reply to their message to kick!" }, { quoted: mek });

            if (target === botNumber || target === botNumber2 || target === conn.user.id.split(":")[0] + '@s.whatsapp.net') {
                return await conn.sendMessage(from, { text: "🤖 I can't kick myself or the owner!" }, { quoted: mek });
            }

            await conn.groupParticipantsUpdate(from, [target], "remove");
            return await conn.sendMessage(from, { text: `*✅ Successfully removed from group.*`, mentions: [target] });
        }

        // 6. PROMOTE
        if (commandName === 'promote' || commandName === 'p' || commandName === 'giveadmin') {
            if (!isAdmins && !isCreator) return;
            if (!isBotAdmins) return await conn.sendMessage(from, { text: "❌ I must be admin to promote someone." }, { quoted: mek });

            let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);
            if (!target) return await conn.sendMessage(from, { text: "❓ Please mention a user or reply to their message to promote!" }, { quoted: mek });

            await conn.groupParticipantsUpdate(from, [target], "promote");
            return await conn.sendMessage(from, { text: `*✅ Successfully Promoted to Admin.*`, mentions: [target] });
        }

        // 7. DEMOTE
        if (commandName === 'demote' || commandName === 'd' || commandName === 'dismiss') {
            if (!isAdmins && !isCreator) return;
            if (!isBotAdmins) return await conn.sendMessage(from, { text: "❌ I must be admin to demote someone." }, { quoted: mek });

            let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);
            if (!target) return await conn.sendMessage(from, { text: "❓ Please mention a user or reply to their message to demote!" }, { quoted: mek });

            await conn.groupParticipantsUpdate(from, [target], "demote");
            return await conn.sendMessage(from, { text: `*✅ Admin Successfully demoted to a normal member.*`, mentions: [target] });
        }

        // 8. LINK
        if (commandName === 'link' || commandName === 'gclink') {
            if (!isBotAdmins) return await conn.sendMessage(from, { text: "❌ I must be admin to get the invite link." }, { quoted: mek });
            const inviteCode = await conn.groupInviteCode(from);
            return await conn.sendMessage(from, { text: `🔗 *Group Invite Link:*\n\nhttps://chat.whatsapp.com/${inviteCode}` }, { quoted: mek });
        }

        // 9. AUTO STICKER (s / sticker)
        if ((commandName === 'sticker' || commandName === 's') && m.quoted) {
            const quotedMsg = m.quoted;
            const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
            if (mimeType.includes('image') || mimeType.includes('video')) {
                await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
                const mediaBuffer = await quotedMsg.download();
                let stickerBuffer = await converter.toSticker(mediaBuffer, { packname: config.PACKNAME || "KAMRAN-MD", author: config.AUTHOR || "KAMRAN" });
                await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });
                await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
                return;
            }
        }

    } catch (error) {
        console.error("Auto Group Body Execution Error:", error);
    }
});
