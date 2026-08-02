import { fileURLToPath } from 'url';
import crypto from 'crypto';
import baileys from '@whiskeysockets/baileys';
import { cmd } from '../command.js';

/**
 * KAMRAN-MD: Universal Group Status V2 Relay
 * Fixed Audio/Voice formatting to prevent "Audio not available" error.
 */
async function relayStatus(conn, jid, content, type) {
    const messageSecret = crypto.randomBytes(32);
    let mediaObject = {};

    if (type === 'image') {
        mediaObject = { image: content.buffer, caption: content.caption };
    } else if (type === 'video') {
        mediaObject = { video: content.buffer, caption: content.caption };
    } else if (type === 'audio') {
        // Fix: Status audio must be OGG with OPUS codec to avoid errors
        mediaObject = { 
            audio: content.buffer, 
            mimetype: 'audio/ogg; codecs=opus', 
            ptt: true,
            waveform: new Uint8Array(20) // Adding dummy waveform for stability
        };
    } else {
        mediaObject = { 
            text: content.text, 
            backgroundColor: content.bgColor || '#075E54',
            font: 1
        };
    }

    const inside = await baileys.generateWAMessageContent(mediaObject, { upload: conn.waUploadToServer });
    
    const messageStructure = {
        groupStatusMessageV2: {
            message: {
                ...inside,
                messageContextInfo: { messageSecret }
            }
        }
    };

    const m = baileys.generateWAMessageFromContent(jid, messageStructure, { userJid: conn.user.id });
    await conn.relayMessage(jid, m.message, { messageId: m.key.id });
    return m;
}

// ==================== GROUP STATUS V2 COMMAND ====================
cmd({
    pattern: "gcstatus",
    alias: ["gstatus", "groupstatus"],
    react: "📤",
    desc: "Post media/text to group status safely",
    category: "tools",
    use: ".gcstatus <text> OR reply to media",
    filename: fileURLToPath(import.meta.url)
}, async (conn, mek, m, { args, q, reply, react, isAdmins, isOwner }) => {
    try {
        if (!isAdmins && !isOwner) {
            await react('❌');
            return reply("❌ *Admin Only Command!*");
        }

        const target = mek.quoted ? mek.quoted : mek;
        const mime = (target.msg || target).mimetype || '';
        const text = args.join(" ") || "";

        await react('⏳');

        // --- PHOTO ---
        if (/image/.test(mime)) {
            const buffer = await target.download();
            await relayStatus(conn, m.chat, { buffer, caption: text }, 'image');
            await react('✅');
            return reply("✅ *Photo Status Uploaded!*");
        }

        // --- VIDEO ---
        if (/video/.test(mime)) {
            const buffer = await target.download();
            await relayStatus(conn, m.chat, { buffer, caption: text }, 'video');
            await react('✅');
            return reply("✅ *Video Status Uploaded!*");
        }

        // --- AUDIO (VOICE) ---
        if (/audio/.test(mime)) {
            const buffer = await target.download();
            // We send it as audio but Baileys/WhatsApp will handle the Opus requirement
            await relayStatus(conn, m.chat, { buffer }, 'audio');
            await react('✅');
            return reply("✅ *Voice Status Uploaded!* (If it fails to play, the audio format needs OGG/OPUS conversion)");
        }

        // --- TEXT ---
        if (text) {
            await relayStatus(conn, m.chat, { text: text }, 'text');
            await react('✅');
            return reply("✅ *Text Status Uploaded!*");
        }

        await react('❓');
        return reply("❌ Reply to a photo/video/audio or type text.");

    } catch (err) {
        console.error(err);
        await react('❌');
        reply(`❌ *Status Error:* ${err.message}`);
    }
});
