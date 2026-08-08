import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { fakevCard } from '../lib/fakevCard.js';

const __filename = fileURLToPath(import.meta.url);

//================= LEAKVIDEO 1 =================

cmd({
    pattern: "leakvideo",
    desc: "Send random leak video",
    category: "fun",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { reply, from }) => {

    try {

        await reply("⏳ Fetching leak video...");

        const videoUrl = "https://arslan-apis-v2.vercel.app/leakvideos";

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption: "🎬 Random Leak Video\n\n> Powered by KAMRAN MD",
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: fakevCard });

    } catch (err) {

        console.log(err);
        reply("❌ Video load nahi hui.");

    }

});


//================= LEAKVIDEO 2 =================

cmd({
    pattern: "leakvideo2",
    desc: "Send random leak video 2",
    category: "fun",
    react: "🔥",
    filename: __filename
}, async (conn, mek, m, { reply, from }) => {

    try {

        await reply("⏳ Fetching leak video...");

        const videoUrl = "https://arslan-apis-v2.vercel.app/leakvideos2";

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption: "🔥 Random Leak Video 2\n\n> Powered by KAMRAN MD",
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: fakevCard });

    } catch (err) {

        console.log(err);
        reply("❌ Video load nahi hui.");

    }

});
