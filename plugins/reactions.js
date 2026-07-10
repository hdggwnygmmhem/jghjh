import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

//==============================//
//   FULL GIF REACTIONS PACK
//==============================//

// helper
const sendGif = async (conn, from, mek, url, text) => {
    await conn.sendMessage(from, {
        video: { url: url },
        gifPlayback: true,
        caption: text
    }, { quoted: mek });
};

//==============================//
// BASIC REACTIONS (ALL ADDED)
//==============================//

// .hug
cmd({
    pattern: "hug",
    react: "🤗",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await sendGif(conn, from, mek,
        "https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif",
        `🤗 *${pushname}* gives a warm hug!`
    );
});

// .kiss
cmd({
    pattern: "kiss",
    react: "😘",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await sendGif(conn, from, mek,
        "https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif",
        `😘 *${pushname}* sends a kiss!`
    );
});

// .slap
cmd({
    pattern: "slap",
    react: "😡",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await sendGif(conn, from, mek,
        "https://media.giphy.com/media/mEtSQlxqBtWWA/giphy.gif",
        `😡 *${pushname}* slapped someone!`
    );
});

// .pat
cmd({
    pattern: "pat",
    react: "🥰",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await sendGif(conn, from, mek,
        "https://media.giphy.com/media/ARSp9T7wwxNcs/giphy.gif",
        `🥰 *${pushname}* pats gently!`
    );
});

// .cuddle
cmd({
    pattern: "cuddle",
    react: "❤️",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await sendGif(conn, from, mek,
        "https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif",
        `❤️ *${pushname}* wants cuddles!`
    );
});

// .wink
cmd({
    pattern: "wink",
    react: "😉",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `😉 *${pushname}* winked!`
    }, { quoted: mek });
});

// .laugh
cmd({
    pattern: "laugh",
    react: "😂",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await sendGif(conn, from, mek,
        "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif",
        `😂 *${pushname}* is laughing hard!`
    );
});

// .wave
cmd({
    pattern: "wave",
    react: "👋",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `👋 *${pushname}* waves hello!`
    }, { quoted: mek });
});

// .highfive
cmd({
    pattern: "highfive",
    react: "🙌",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `🙌 *${pushname}* gives a high five!`
    }, { quoted: mek });
});

// .handhold
cmd({
    pattern: "handhold",
    react: "🤝",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `🤝 *${pushname}* holds hands!`
    }, { quoted: mek });
});

// .bite
cmd({
    pattern: "bite",
    react: "😋",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `😋 *${pushname}* bites playfully!`
    }, { quoted: mek });
});

// .poke
cmd({
    pattern: "poke",
    react: "👉",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `👉 *${pushname}* pokes someone!`
    }, { quoted: mek });
});

// .smile
cmd({
    pattern: "smile",
    react: "😊",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `😊 *${pushname}* smiles!`
    }, { quoted: mek });
});

// .blush
cmd({
    pattern: "blush",
    react: "☺️",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `☺️ *${pushname}* is blushing!`
    }, { quoted: mek });
});

// .sleep
cmd({
    pattern: "sleep",
    react: "😴",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `😴 *${pushname}* went to sleep!`
    }, { quoted: mek });
});

// .kick
cmd({
    pattern: "kick2",
    react: "🦵",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `🦵 *${pushname}* kicked someone!`
    }, { quoted: mek });
});

// .shoot
cmd({
    pattern: "shoot",
    react: "🔫",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `🔫 *${pushname}* fired a shot!`
    }, { quoted: mek });
});

// .dance
cmd({
    pattern: "dance",
    react: "💃",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await sendGif(conn, from, mek,
        "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
        `💃 *${pushname}* is dancing!`
    );
});

// .shrug
cmd({
    pattern: "shrug",
    react: "🤷",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `🤷 *${pushname}* shrugs!`
    }, { quoted: mek });
});

// .facepalm
cmd({
    pattern: "facepalm",
    react: "🤦",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `🤦 *${pushname}* facepalms!`
    }, { quoted: mek });
});

// .thumbsup
cmd({
    pattern: "thumbsup",
    react: "👍",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `👍 *${pushname}* gives thumbs up!`
    }, { quoted: mek });
});

// .think
cmd({
    pattern: "think",
    react: "🤔",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `🤔 *${pushname}* is thinking...`
    }, { quoted: mek });
});

// .stare
cmd({
    pattern: "stare",
    react: "👀",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `👀 *${pushname}* is staring!`
    }, { quoted: mek });
});

// .peck
cmd({
    pattern: "peck",
    react: "🐥",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `🐥 *${pushname}* gives a peck!`
    }, { quoted: mek });
});

// .yeet
cmd({
    pattern: "yeet",
    react: "😆",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `😆 *${pushname}* yeeted something!`
    }, { quoted: mek });
});

// .nod
cmd({
    pattern: "nod",
    react: "🙂",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `🙂 *${pushname}* nods!`
    }, { quoted: mek });
});

// .nom
cmd({
    pattern: "nom",
    react: "🍽️",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `🍽️ *${pushname}* is eating!`
    }, { quoted: mek });
});

// .nope
cmd({
    pattern: "nope",
    react: "❌",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `❌ *${pushname}* says nope!`
    }, { quoted: mek });
});

// .yawn
cmd({
    pattern: "yawn",
    react: "🥱",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `🥱 *${pushname}* is yawning!`
    }, { quoted: mek });
});

// .smug
cmd({
    pattern: "smug",
    react: "😏",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await conn.sendMessage(from, {
        text: `😏 *${pushname}* looks smug!`
    }, { quoted: mek });
});

// .cry
cmd({
    pattern: "cry",
    react: "😭",
    category: "reactions",
    filename: __filename
},
async (conn, mek, m, { from, pushname }) => {
    await sendGif(conn, from, mek,
        "https://media.giphy.com/media/ROF8OQvDmxytW/giphy.gif",
        `😭 *${pushname}* is crying!`
    );
});
