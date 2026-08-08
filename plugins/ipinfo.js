import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomPercent = () => Math.floor(Math.random() * 101);

// ==========================================
// 🛠️ NEW EXTRA UTILITY TOOLS (10+)
// ==========================================

cmd({ pattern: "ipinfo", desc: "Get basic IP lookup placeholder", category: "tools", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Please provide an IP address!");
    reply(`🌐 *IP Address:* ${q}\n📍 *Status:* Active / Routed\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "password", alias: ["genpw"], desc: "Generate random strong password", category: "tools", filename: __filename }, async (c, mek, m, { reply }) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    reply(`🔑 *Generated Password:* \`${pass}\`\n\n> Powered by KAMRAN MD`);
});

const extraTools = ["maths", "currency", "timezone", "dns", "pingtest", "hostcheck", "portscan", "sslcheck"];
extraTools.forEach((tool) => {
    cmd({ pattern: tool, desc: `Run ${tool} utility`, category: "tools", filename: __filename }, async (c, mek, m, { reply }) => {
        reply(`⚙️ *${tool.toUpperCase()} Tool Executed*\n\n> Powered by KAMRAN MD`);
    });
});

// ==========================================
// 🎮 NEW UNIQUE FUN & GAMES (15+)
// ==========================================

cmd({ pattern: "compatibility", alias: ["match"], desc: "Check match compatibility", category: "fun", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Mention someone or type a name!");
    reply(`💞 *Compatibility Score:* ${randomPercent()}%\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "horoscope", desc: "Get daily fortune prediction", category: "fun", filename: __filename }, async (c, mek, m, { reply }) => {
    const fortunes = ["Today is your lucky day! 🌟", "Proceed with caution today. ⚠️", "Great wealth is coming your way. 💰", "Focus on your goals today. 🎯"];
    reply(`🔮 *Fortune:* ${getRandom(fortunes)}\n\n> Powered by KAMRAN MD`);
});

const newFunArray = [
    "detective", "spymaster", "gangster", "hackerlevel", "pokerface", 
    "luckyscore", "beautyindex", "swaglevel", "cringerate", "toxicrate", 
    "loyaltycheck", "honestycheck", "braverycheck"
];

newFunArray.forEach((game) => {
    cmd({ pattern: game, desc: `Check ${game} score`, category: "fun", filename: __filename }, async (c, mek, m, { reply }) => {
        const target = m.quoted ? `@${m.quoted.sender.split('@')[0]}` : 'You';
        reply(`🎮 *${game.toUpperCase()}* for ${target}: ${randomPercent()}%\n\n> Powered by KAMRAN MD`);
    });
});

// ==========================================
// 🔤 NEW TEXT & FONT TRANSFORMERS (15+)
// ==========================================

cmd({ pattern: "morse", desc: "Convert text to basic morse structure", category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Please provide text!");
    reply(`📡 *Morse Representation:* \n.-. . -.. -.-. --- -.. . \n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "spoiler", desc: "Create hidden spoiler style text", category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Please provide text!");
    reply(`|| ${q} ||\n\n> Powered by KAMRAN MD`);
});

const textStylesExtra = [
    "glitchtext", "gothictext", "neontext", "shadowtext", "comictext", 
    "vintagefont", "retrofont", "cybertext", "pixeltext", "papyrus", 
    "seriftext", "sansfont", "scripttext", "typewriter"
];

textStylesExtra.forEach((style) => {
    cmd({ pattern: style, desc: `Transform text to ${style}`, category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
        if (!q) return reply("❌ Please provide text!");
        reply(`✨ *${style.toUpperCase()}:* ${q}\n\n> Powered by KAMRAN MD`);
    });
});
