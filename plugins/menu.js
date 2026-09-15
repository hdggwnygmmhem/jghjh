import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { cmd, commands } from '../command.js';
import config from '../config.js';
import { runtime } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function for Stylist Badi ABC Text
const toStylistUpper = (text) => {
    if (!text || typeof text !== 'string') return '';
    const uppercaseMap = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ',
        'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ',
        'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
    };
    return text.split('').map(char => uppercaseMap[char] || char).join('');
};

// Format category with premium sleek styles & Stylist Uppercase Commands
const formatCategory = (category, cmds) => {
    const validCmds = cmds.filter(cmd => cmd.pattern && cmd.pattern.trim() !== '');
    
    if (validCmds.length === 0) return '';
    
    let title = `\n╭━━━〔 *${toStylistUpper(category.toUpperCase())}* 〕━━━┈⊷\n`;
    let body = validCmds.map(cmd => {
        const commandName = toStylistUpper(cmd.pattern || '');
        return `┃ ⚡ \`${commandName}\``;
    }).join('\n');
    let footer = `\n╰━━━━━━━━━━━━━━━━━━━┈⊷`;
    return `${title}${body}${footer}`;
};

// ==================== AUTO MENU LISTENER (BODY HOOK) ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;

        const rawText = body.trim().toLowerCase();
        const menuTriggers = ['menu', 'speed', 'm', 'help', 'allmenu', 'fullmenu'];

        if (menuTriggers.includes(rawText)) {
            await executeMenu(conn, mek, from);
        }
    } catch (error) {
        console.error("Auto-Body Menu Error:", error);
    }
});

// ==================== MENU COMMAND (Prefix Version) ====================
cmd({
    pattern: "menu",
    alias: ["m", "help", "allmenu", "fullmenu"],
    use: '.menu',
    desc: "Show all bot commands",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        await executeMenu(conn, mek, from);
    } catch (e) {
        console.error("Error in menu command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== CORE MENU SENDER LOGIC ====================
async function executeMenu(conn, mek, from) {
    try {
        const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
        const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];

        // 1. Send Reaction first
        await conn.sendMessage(from, {
            react: { text: reactionEmoji, key: mek.key }
        });

        await conn.sendPresenceUpdate('composing', from);
        
        let totalCommands = Object.keys(commands).length;
        
        const categories = [...new Set(Object.values(commands).map(c => c.category))].filter(cat => 
            cat && cat.trim() !== '' && cat !== 'undefined'
        );
        
        const categorized = {};
        categories.forEach(cat => {
            const categoryCommands = Object.values(commands).filter(c => c.category === cat);
            const validCommands = categoryCommands.filter(cmd => cmd.pattern && cmd.pattern.trim() !== '');
            if (validCommands.length > 0) {
                categorized[cat] = validCommands;
            }
        });

        let menuSections = '';
        for (const [category, cmds] of Object.entries(categorized)) {
            if (cmds && cmds.length > 0) {
                const section = formatCategory(category, cmds);
                if (section !== '') {
                    menuSections += section;
                }
            }
        }

        const BOT_NAME = config.BOT_NAME || "Bot";
        const OWNER_NAME = config.OWNER_NAME || "Owner";
        const PREFIX = config.PREFIX || ".";
        const MODE = config.MODE || "private";
        const VERSION = config.VERSION || "10.0.0";
        const DESCRIPTION = config.DESCRIPTION || "";
        
        const imageToUse = 'https://i.ibb.co/RTWD9M32/jawadmd.jpg';
        
        let dec = `✨ *${toStylistUpper(BOT_NAME)} ᴍᴜʟᴛɪ-ᴅᴇᴠɪᴄᴇ* ✨

┌━━━〔 *ɪɴғᴏ ʙᴏx* 〕━━━┈⊷
┃ 👑 *${toStylistUpper('Owner')}:* ${OWNER_NAME}
┃ 📊 *${toStylistUpper('Commands')}:* ${totalCommands}
┃ ⏳ *${toStylistUpper('Runtime')}:* ${runtime(process.uptime())}
┃ 📡 *${toStylistUpper('Prefix')}:* [  ${PREFIX}  ]
┃ ⚙️ *${toStylistUpper('Mode')}:* ${MODE}
┃ 🏷️ *${toStylistUpper('Version')}:* ${VERSION}
╰━━━━━━━━━━━━━━━━━━━┈⊷
${menuSections}

> 💡 _${DESCRIPTION || 'Powered by WhatsApp Bot'}_`;

        // 2. Send Menu Image and Caption properly linked with quoted message
        await conn.sendMessage(from, { 
            image: { url: imageToUse },
            caption: dec, 
            contextInfo: { 
                mentionedJid: [mek.sender], 
                forwardingScore: 999, 
                isForwarded: true, 
                forwardedNewsletterMessageInfo: { 
                    newsletterJid: '120363418144382782@newsletter', 
                    newsletterName: BOT_NAME, 
                    serverMessageId: 143 
                } 
            } 
        }, { quoted: mek });

    } catch (e) { 
        console.log("Menu execution error:", e); 
    }
}
