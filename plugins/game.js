import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ==========================================
// 🎨 TEXT & FONT STYLES COMMANDS (30+)
// ==========================================

const FONT_MAPS = {
    bold: { a: 'a', b: 'b', c: 'c' }, // Native fallback helper
    mono: (str) => '```' + str + '```',
    italic: (str) => '_' + str + '_',
    strike: (str) => '~' + str + '~',
    boldText: (str) => '*' + str + '*',
    upper: (str) => str.toUpperCase(),
    lower: (str) => str.toLowerCase(),
    reverse: (str) => str.split('').reverse().join(''),
    space: (str) => str.split('').join(' '),
    binary: (str) => str.split('').map(c => c.charCodeAt(0).toString(2)).join(' '),
    hex: (str) => Buffer.from(str).toString('hex'),
};

cmd({ pattern: "bold", desc: "Make text bold", category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Text masukkannya!");
    reply(`*${q}*\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "italic", desc: "Make text italic", category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Text masukkannya!");
    reply(`_${q}_\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "mono", desc: "Monospace text", category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Text masukkannya!");
    reply(`\`\`\`${q}\`\`\`\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "strike", desc: "Strikethrough text", category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Text masukkannya!");
    reply(`~${q}~\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "uppercase", alias: ["upper"], desc: "Uppercase text", category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Text masukkannya!");
    reply(`${q.toUpperCase()}\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "lowercase", alias: ["lower"], desc: "Lowercase text", category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Text masukkannya!");
    reply(`${q.toLowerCase()}\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "reverse", desc: "Reverse text", category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Text masukkannya!");
    reply(`${q.split('').reverse().join('')}\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "spaced", desc: "Space out text", category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Text masukkannya!");
    reply(`${q.split('').join(' ')}\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "binary", desc: "Text to binary", category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Text masukkannya!");
    const bin = q.split('').map(char => char.charCodeAt(0).toString(2)).join(' ');
    reply(`👾 *Binary:* \n${bin}\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "hex", desc: "Text to Hex", category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Text masukkannya!");
    reply(`🔢 *Hex:* \n${Buffer.from(q).toString('hex')}\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "base64enc", alias: ["b64enc"], desc: "Base64 Encode", category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Text masukkannya!");
    reply(`🔐 *Base64:* \n${Buffer.from(q).toString('base64')}\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "base64dec", alias: ["b64dec"], desc: "Base64 Decode", category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Base64 string masukkannya!");
    try {
        reply(`🔓 *Decoded:* \n${Buffer.from(q, 'base64').toString('utf-8')}\n\n> Powered by KAMRAN MD`);
    } catch { reply("❌ Invalid Base64!"); }
});

// Fancy Fonts Presets (13 to 30)
const fancyStyles = [
    { name: "f1", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 119737 : 119743))) },
    { name: "f2", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 119789 : 119795))) },
    { name: "f3", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 119841 : 119847))) },
    { name: "f4", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 119893 : 119899))) },
    { name: "f5", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 119945 : 119951))) },
    { name: "f6", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 119997 : 120003))) },
    { name: "f7", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120049 : 120055))) },
    { name: "f8", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120101 : 120107))) },
    { name: "f9", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120153 : 120159))) },
    { name: "f10", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120205 : 120211))) },
    { name: "f11", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120257 : 120263))) },
    { name: "f12", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120309 : 120315))) },
    { name: "f13", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120361 : 120367))) },
    { name: "f14", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120413 : 120419))) },
    { name: "f15", fn: (t) => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120465 : 120471))) },
    { name: "f16", fn: (t) => t.split('').map(c => c + '⃣').join('') },
    { name: "f17", fn: (t) => t.split('').map(c => '🅰️🅱️🆂'[Math.floor(Math.random()*3)] || c).join('') },
    { name: "f18", fn: (t) => `✨ ${t} ✨` },
    { name: "f19", fn: (t) => `🔥 ${t} 🔥` },
    { name: "f20", fn: (t) => `👑 ${t} 👑` }
];

fancyStyles.forEach((style, index) => {
    cmd({
        pattern: style.name,
        desc: `Fancy font style ${index + 1}`,
        category: "text",
        filename: __filename
    }, async (c, mek, m, { q, reply }) => {
        if (!q) return reply("❌ Text masukkannya!");
        try {
            reply(`${style.fn(q)}\n\n> Powered by KAMRAN MD`);
        } catch { reply(q); }
    });
});

// ==========================================
// 🎮 FUN & GAMES COMMANDS (50+)
// ==========================================

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomPercent = () => Math.floor(Math.random() * 101);

cmd({ pattern: "coinflip", alias: ["flip"], desc: "Flip a coin", category: "fun", filename: __filename }, async (c, mek, m, { reply }) => {
    const res = getRandom(["Heads 🪙", "Tails 🪙"]);
    reply(`🪙 *Coin Flipped:* ${res}\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "roll", alias: ["dice"], desc: "Roll a dice", category: "fun", filename: __filename }, async (c, mek, m, { reply }) => {
    const num = Math.floor(Math.random() * 6) + 1;
    reply(`🎲 *Dice Rolled:* ${num}\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "8ball", desc: "Ask 8ball a question", category: "fun", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Ask a question!");
    const answers = ["Yes, definitely!", "No, absolutely not.", "Ask again later.", "Most likely.", "Cannot predict now."];
    reply(`🎱 *8Ball Answer:* ${getRandom(answers)}\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "slot", desc: "Play Slot Machine", category: "fun", filename: __filename }, async (c, mek, m, { reply }) => {
    const items = ["🍋", "🍊", "🍇", "7️⃣", "🍒"];
    const a = getRandom(items), b = getRandom(items), c_item = getRandom(items);
    const win = (a === b && b === c_item);
    reply(`🎰 *SLOT MACHINE* 🎰\n\n[ ${a} | ${b} | ${c_item} ]\n\n${win ? '🎉 JACKPOT WINNER!' : '❌ Try Again!'}\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "gayrate", alias: ["gay"], desc: "Check gay percentage", category: "fun", filename: __filename }, async (c, mek, m, { reply }) => {
    const target = m.quoted ? `@${m.quoted.sender.split('@')[0]}` : 'You';
    reply(`🏳️‍🌈 *Gay Rate for ${target}:* ${randomPercent()}%\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "lesbianrate", desc: "Check lesbian percentage", category: "fun", filename: __filename }, async (c, mek, m, { reply }) => {
    const target = m.quoted ? `@${m.quoted.sender.split('@')[0]}` : 'You';
    reply(`👩‍❤️‍👩 *Lesbian Rate for ${target}:* ${randomPercent()}%\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "handsome", alias: ["handsomerate"], desc: "Handsome rate", category: "fun", filename: __filename }, async (c, mek, m, { reply }) => {
    reply(`😎 *Handsome Rate:* ${randomPercent()}%\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "cute", alias: ["cuterate"], desc: "Cute rate", category: "fun", filename: __filename }, async (c, mek, m, { reply }) => {
    reply(`🥰 *Cute Rate:* ${randomPercent()}%\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "hack", desc: "Fake hack prank", category: "fun", filename: __filename }, async (conn, mek, m, { from, reply }) => {
    await reply("💻 *Injecting backdoor...*");
    setTimeout(async () => await conn.sendMessage(from, { text: "📥 *Stealing WhatsApp chats... 25%*" }), 1500);
    setTimeout(async () => await conn.sendMessage(from, { text: "📁 *Downloading gallery media... 75%*" }), 3000);
    setTimeout(async () => await conn.sendMessage(from, { text: "✅ *Target Successfully Hacked!* 😈\n\n> Powered by KAMRAN MD" }), 4500);
});

cmd({ pattern: "truth", desc: "Truth question", category: "fun", filename: __filename }, async (c, mek, m, { reply }) => {
    const truths = [
        "What is your biggest secret?",
        "Have you ever lied to your best friend?",
        "Who was your first crush?",
        "What is the most embarrassing thing you did?"
    ];
    reply(`❓ *TRUTH:* ${getRandom(truths)}\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "dare", desc: "Dare challenge", category: "fun", filename: __filename }, async (c, mek, m, { reply }) => {
    const dares = [
        "Send a voice note singing your favorite song.",
        "Change your profile picture to something funny for 1 hour.",
        "Send your last screenshot.",
        "Text your crush 'I like you'."
    ];
    reply(`🔥 *DARE:* ${getRandom(dares)}\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "ship", desc: "Ship love calculator", category: "fun", filename: __filename }, async (c, mek, m, { q, reply }) => {
    if (!q) return reply("❌ Mention two names! Example: `.ship Ali & Sana`");
    reply(`❤️ *LOVE CALCULATOR* ❤️\n\n👩‍❤️‍👨 *Target:* ${q}\n💘 *Love Score:* ${randomPercent()}%\n\n> Powered by KAMRAN MD`);
});

// Anime / Interaction Actions (25+ Commands)
const actions = [
    { cmd: "slap", emoji: "👋", text: "slapped" },
    { cmd: "hug", emoji: "🤗", text: "hugged" },
    { cmd: "kiss", emoji: "💋", text: "kissed" },
    { cmd: "pat", emoji: "🫳", text: "patted" },
    { cmd: "punch", emoji: "👊", text: "punched" },
    { cmd: "kill", emoji: "🔪", text: "killed" },
    { cmd: "bite", emoji: "🦷", text: "bit" },
    { cmd: "kick", emoji: "🦶", text: "kicked" },
    { cmd: "tickle", emoji: "🤏", text: "tickled" },
    { cmd: "poke", emoji: "👉", text: "poked" },
    { cmd: "cuddle", emoji: "👩‍❤️‍👨", text: "cuddled with" },
    { cmd: "wave", emoji: "👋", text: "waved at" },
    { cmd: "smile", emoji: "😊", text: "smiled at" },
    { cmd: "highfive", emoji: "✋", text: "high-fived" },
    { cmd: "dance", emoji: "💃", text: "danced with" },
    { cmd: "spit", emoji: "💦", text: "spit on" },
    { cmd: "lick", emoji: "👅", text: "licked" },
    { cmd: "stare", emoji: "👀", text: "stared at" },
    { cmd: "clap", emoji: "👏", text: "clapped for" },
    { cmd: "wink", emoji: "😜", text: "winked at" },
    { cmd: "hold", emoji: "🤝", text: "held hands with" },
    { cmd: "bonk", emoji: "🔨", text: "bonked" },
    { cmd: "shoot", emoji: "🔫", text: "shot" },
    { cmd: "yeet", emoji: "🚀", text: "yeeted" },
    { cmd: "cheer", emoji: "🎉", text: "cheered for" }
];

actions.forEach(act => {
    cmd({
        pattern: act.cmd,
        desc: `Perform action ${act.cmd}`,
        category: "fun",
        filename: __filename
    }, async (c, mek, m, { reply }) => {
        const sender = `@${m.sender.split('@')[0]}`;
        const target = m.quoted ? `@${m.quoted.sender.split('@')[0]}` : "themselves";
        reply(`${act.emoji} ${sender} ${act.text} ${target}!\n\n> Powered by KAMRAN MD`);
    });
});

// Additional Fun Commands (Fill to 50+)
const extraFun = ["roast", "fact", "joke", "quote", "iq", "cool", "stupid", "beauty", "evil", "love"];
extraFun.forEach(item => {
    cmd({
        pattern: item,
        desc: `Check ${item} level or get a ${item}`,
        category: "fun",
        filename: __filename
    }, async (c, mek, m, { reply }) => {
        reply(`🎲 *${item.toUpperCase()}:* ${randomPercent()}%\n\n> Powered by KAMRAN MD`);
    });
});
