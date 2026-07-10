import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play",
    alias: ["song", "music", "s", "audio"],
    desc: "Smart YouTube music downloader",
    category: "music",
    react: "🎧",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {

    try {
        if (!args[0]) {
            return reply("❌ *Song ka naam likho*\nExample: `.play faded`");
        }

        let query = encodeURIComponent(args.join(" "));
        let api = `https://api-xemoz-official.my.id/api/donwloader/ytplay.php?q=${query}`;

        let { data } = await axios.get(api, { timeout: 15000 });

        if (!data?.status) {
            return reply("❌ *Song nahi mila, kuch aur try karo.*");
        }

        const result = data.result;
        if (!result?.download?.audio) {
            return reply("❌ *Audio download link nahi mila.*");
        }

        // Stylish Caption
        let text = `
╭━━━❮ *DR KAMRAN* ❯━━━╮
┃ 🎵 *${result.title}*
╰━━━━━━━━━━━━━━━╯

⏱ *Duration:* ${result.duration}

*⚡ Processing Audio...*
*🚀 Sending now...*
`.trim();

        // Image with Caption & Newsletter Info
        await conn.sendMessage(from, {
            image: { url: result.thumbnail },
            caption: text,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363418144382782@newsletter",
                    newsletterName: "KAMRAN-MD",
                    serverMessageId: 1
                }
            }
        }, { quoted: mek });

        // Audio without Newsletter/Forwarding
        await conn.sendMessage(from, {
            audio: { url: result.download.audio },
            mimetype: "audio/mp4",
            ptt: false
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply("❌ *Error aagaya hai, please try again.*");
    }
});
