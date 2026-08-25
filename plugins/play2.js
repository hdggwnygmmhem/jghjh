import { fileURLToPath } from 'url';
import yts from 'yt-search';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// Cache
const cache = new Map();

/**
 * Normalize YouTube URL
 */
function normalizeYouTubeUrl(url) {
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/
    );
    return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

/**
 * Get MP3 Download Link
 */
async function fetchAudio(url, retries = 2) {
    try {
        const api = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(
            url
        )}`;

        const { data } = await axios.get(api, {
            timeout: 20000,
        });

        if (data.status && data.result) {
            return {
                title: data.result.title || "Unknown Song",
                audio: data.result.mp3,
            };
        }

        throw new Error("API Error");

    } catch (e) {

        if (retries > 0) {
            await new Promise(r => setTimeout(r, 2000));
            return fetchAudio(url, retries - 1);
        }

        return null;
    }
}

cmd(
{
    pattern: "play",
    alias: ["song", "music2", "audio", "mp3"],
    react: "🎵",
    desc: "Download YouTube Audio",
    category: "download",
    filename: __filename,
},
    async (conn, mek, m, { from, q, reply, prefix, command }) => {

try {

if (!q) {
return reply(`🎵 *Usage:* ${prefix + command} Faded`);
}

await conn.sendMessage(from, {
react: {
text: "🔍",
key: mek.key
}
});

const url = normalizeYouTubeUrl(q);

let ytdata;

if (url) {

const search = await yts(q);
ytdata = search.videos?.[0];

} else {

const search = await yts(q);

if (!search.videos.length) {
return reply("❌ Song not found!");
}

ytdata = search.videos[0];

}

const caption = `
╭───────────────🎵
│  *YOUTUBE MUSIC*
╰───────────────

🎶 *Title:* ${ytdata.title}

👤 *Channel:* ${ytdata.author?.name || "Unknown"}

⏱ *Duration:* ${ytdata.timestamp}

👁 *Views:* ${ytdata.views.toLocaleString()}

────────────────────
⬇️ Downloading Audio...

🚀 Powered by KAMRAN MD
`;

await conn.sendMessage(from,{
image:{url:ytdata.thumbnail || ytdata.image},
caption
},{quoted:mek});

await conn.sendMessage(from,{
react:{
text:"⏳",
key:mek.key
}
});

const dlData = await fetchAudio(ytdata.url);

if (!dlData || !dlData.audio){
return reply("❌ Audio link not found!");
}
    try {

const audioBuffer = await axios.get(dlData.audio,{
responseType:"arraybuffer",
timeout:60000
});

await conn.sendMessage(from,{
audio:Buffer.from(audioBuffer.data),
mimetype:"audio/mpeg",
fileName:`${dlData.title}.mp3`,
ptt:false
},{quoted:mek});

await conn.sendMessage(from,{
react:{
text:"✅",
key:mek.key
}
});

} catch(err){

console.log("AUDIO SEND ERROR:",err.message);

return reply("❌ Audio send failed!");

}

} catch(e){

console.log("PLAY ERROR:",e);

await conn.sendMessage(from,{
react:{
text:"❌",
key:mek.key
}
});

reply("⚠️ Something went wrong!");

}

});
