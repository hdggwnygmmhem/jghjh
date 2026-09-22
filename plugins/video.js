import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== YOUTUBE PLAYLIST / DRAMA LIST COMMAND ====================
cmd({
    pattern: "playlist",
    alias: ["dramalist", "ytplaylist", "pl"],
    desc: "Fetch and show YouTube playlist details via Starlight API",
    category: "downloader",
    react: "📜",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;
    
    try {
        if (!text || (!text.includes("youtube.com") && !text.includes("youtu.be"))) {
            return reply(
                `📜 *KAMRAN-MD PLAYLIST FETCHING*\n\n` +
                `❌ *Please provide a valid YouTube Playlist URL!*\n\n` +
                `💡 *Example:* \`.playlist https://youtube.com/playlist?list=PLWVo2tank-zzCWQ4dfIwZAAGqUEDY1Mxv\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const playlistUrl = text.trim();
        const apiUrl = `https://apis-starlights-team.koyeb.app/starlight/youtube-playlist?url=${encodeURIComponent(playlistUrl)}`;
        
        console.log("Calling Playlist API:", apiUrl);
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Oops!* Could not fetch the playlist details.");
        }

        const playlist = resData.result;
        const title = playlist.title || "YouTube Playlist";
        const totalVideos = playlist.videos ? playlist.videos.length : 0;

        // Construct a clean message listing the videos or playlist info
        let messageText = `📜 *PLAYLIST INFO*\n\n`;
        messageText += `📌 *Title:* ${title}\n`;
        messageText += `📊 *Total Videos:* ${totalVideos}\n\n`;
        messageText += `🔗 *Playlist URL:* ${playlistUrl}\n\n`;

        // Agar videos ki list hai toh kuch top videos ke naam dikha dein
        if (playlist.videos && playlist.videos.length > 0) {
            messageText += `📋 *Top Videos in Playlist:*\n`;
            playlist.videos.slice(0, 10).forEach((vid, index) => {
                messageText += `${index + 1}. ${vid.title || 'Video'} (${vid.duration || 'N/A'})\n`;
            });
            if (playlist.videos.length > 10) {
                messageText += `\n_...and ${playlist.videos.length - 10} more videos._\r\n`;
            }
        }

        messageText += `\n> Powered by KAMRAN-MD`;

        await conn.sendMessage(from, { text: messageText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Playlist API Error:", error);
        reply(`❌ *Error:* ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
