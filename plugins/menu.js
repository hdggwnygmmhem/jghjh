import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs';
import axios from 'axios';
import { cmd, commands } from '../command.js';
import config from '../config.js';
import { runtime } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function for small caps text
const toSmallCaps = (text) => {
    if (!text || typeof text !== 'string') return '';
    const smallCapsMap = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ',
        'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ',
        'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
    };
    return text.split('').map(char => smallCapsMap[char] || char).join('');
};

// Format category with premium sleek styles
const formatCategory = (category, cmds) => {
    // Filter out commands with empty or undefined patterns
    const validCmds = cmds.filter(cmd => cmd.pattern && cmd.pattern.trim() !== '');
    
    if (validCmds.length === 0) return ''; // Skip empty categories
    
    let title = `\n╭━━━〔 *${toSmallCaps(category.toUpperCase())}* 〕━━━┈⊷\n`;
    let body = validCmds.map(cmd => {
        const commandName = cmd.pattern || '';
        return `┃ ⚡ \`${commandName}\``;
    }).join('\n');
    let footer = `\n╰━━━━━━━━━━━━━━━━━━━┈⊷`;
    return `${title}${body}${footer}`;
};

// Function to validate image URL
const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
        return false;
    }
    
    const urlLower = url.toLowerCase();
    
    // Check image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (imageExtensions.some(ext => urlLower.endsWith(ext))) {
        return true;
    }
    
    return false;
};

cmd({
    pattern: "menu",
    alias: ["m", "help", "allmenu","fullmenu"],
    use: '.menu',
    desc: "Show all bot commands",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, userConfig }) => {
    try {
        // Show typing presence before processing
        await conn.sendPresenceUpdate('composing', from);
        
        let totalCommands = Object.keys(commands).length;
        
        // Get all unique categories and filter out undefined/null categories
        const categories = [...new Set(Object.values(commands).map(c => c.category))].filter(cat => 
            cat && cat.trim() !== '' && cat !== 'undefined'
        );
        
        // Organize commands by category and filter out empty categories
        const categorized = {};
        categories.forEach(cat => {
            const categoryCommands = Object.values(commands).filter(c => c.category === cat);
            // Only add category if it has valid commands
            const validCommands = categoryCommands.filter(cmd => cmd.pattern && cmd.pattern.trim() !== '');
            if (validCommands.length > 0) {
                categorized[cat] = validCommands;
            }
        });

        // Build menu sections - only for categories that have commands
        let menuSections = '';
        for (const [category, cmds] of Object.entries(categorized)) {
            if (cmds && cmds.length > 0) {
                const section = formatCategory(category, cmds);
                if (section !== '') {
                    menuSections += section;
                }
            }
        }

        // Get all values from userConfig with fallback to config
        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || "Bot";
        const OWNER_NAME = userConfig?.OWNER_NAME || config.OWNER_NAME || "Owner";
        const PREFIX = userConfig?.PREFIX || config.PREFIX || ".";
        const MODE = userConfig?.MODE || config.MODE || "private";
        const VERSION = userConfig?.VERSION || config.VERSION || "10.0.0";
        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";
        
        // Get BOT_IMAGE from userConfig first, then config.BOT_IMAGE, then config.BOT_MEDIA_URL
        const BOT_IMAGE = userConfig?.BOT_IMAGE || userConfig?.BOT_MEDIA_URL || config.BOT_IMAGE || config.BOT_MEDIA_URL;
        
        // Main menu text with premium UI layout
        let dec = `✨ *${toSmallCaps(BOT_NAME)} ᴍᴜʟᴛɪ-ᴅᴇᴠɪᴄᴇ* ✨

┌━━━〔 *ɪɴғᴏ ʙᴏx* 〕━━━┈⊷
┃ 👑 *${toSmallCaps('Owner')}:* ${OWNER_NAME}
┃ 📊 *${toSmallCaps('Commands')}:* ${totalCommands}
┃ ⏳ *${toSmallCaps('Runtime')}:* ${runtime(process.uptime())}
┃ 📡 *${toSmallCaps('Prefix')}:*  [  ${PREFIX}  ]
┃ ⚙️ *${toSmallCaps('Mode')}:* ${MODE}
┃ 🏷️ *${toSmallCaps('Version')}:* ${VERSION}
╰━━━━━━━━━━━━━━━━━━━┈⊷
${menuSections}

> 💡 _${DESCRIPTION || 'Powered by WhatsApp Bot'}_`;

        // Determine which image to use
        let imageToUse;
        const localImagePath = path.join(__dirname, '../lib/bot.png');
        
        // Check if BOT_IMAGE is a valid image URL
        if (isValidImageUrl(BOT_IMAGE)) {
            try {
                // Check if server is accessible (timeout after 3 seconds)
                await axios.head(BOT_IMAGE, { timeout: 3000 });
                // Server is up, use the URL image
                imageToUse = BOT_IMAGE;
            } catch (serverError) {
                // Server is down or inaccessible, use local image
                console.log('Image server down, using local image:', serverError.message);
                imageToUse = localImagePath;
            }
        } else {
            // Invalid image format, use local image
            imageToUse = localImagePath;
        }

        // Send menu image with caption
        await conn.sendMessage(from, { 
            image: { url: imageToUse },
            caption: dec, 
            contextInfo: { 
                mentionedJid: [m.sender], 
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
        console.log(e); 
        reply(`Error: ${e}`); 
    } 
});
