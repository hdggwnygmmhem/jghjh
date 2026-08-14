import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "14-play",
    alias: ["song", "ytplaypakistan", "pakplay", "azadisong"],
    desc: "Play and download 14 August patriotic songs only.",
    category: "pakistan",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, args, q, reply }) => {
    try {
        // Query check
        if (!q) return reply("🇵🇰 *14 AUGUST AZADI SPECIAL PLAYER* 🇵🇰\n\n❌ Kripya kisi gaane ya naghme ka naam likhein!\n\n*Example:* `.play dil dil pakistan` ya `.play milli naghma`");

        // 🇵🇰 FORCED 14 AUGUST SEARCH: Har query ke sath 14 August Pakistani Milli Naghma automatic lag jayega
        const azadiQuery = `${q} 14 august pakistan milli naghma patriotic song`;

        // Azadi Loading message
        await reply("🇵🇰 🟢 *Jashan-e-Azadi Special:* 14 August Naghma search kiya ja raha hai, barae meharbani intazar karein... ✨");

        // Fetching data from API using forced 14 August search
        const apiUrl = `https://api.ikyyxd.my.id/search/ytplayv2?q=${encodeURIComponent(azadiQuery)}`;
        const response = await axios.get(apiUrl);
        let data = response.data;

        if (typeof data === 'string') data = JSON.parse(data);

        if (!data || !data.status || !data.result) {
            return reply("❌ 14 August ka gaana nahi mil saka! Kripya dobara koshish karein.");
        }

        const res = data.result;
        const title = res.title || "14 August Patriotic Song";
        const thumbnail = res.thumbnail;
        
        // Duration formatting
        const durationSec = res.duration || 0;
        const minutes = Math.floor(durationSec / 60);
        const seconds = (durationSec % 60).toString().padStart(2, "0");
        const durationStr = `${minutes}:${seconds}`;

        // 🇵🇰 Pure 14 August Patriotic Caption
        let captionText = `🇵🇰 *𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝟏𝟒 𝐀𝐔𝐆𝐔𝐒𝐓 𝐒𝐏𝐄𝐂𝐈𝐀𝐋* 🇵🇰\n\n`;
        captionText += `🎵 *Song Title:* ${title}\n`;
        captionText += `⏱️ *Duration:* ${durationStr}\n`;
        captionText += `🟢 *Theme:* 14 August Independence Special\n\n`;
        captionText += `*“ Dil Dil Pakistan, Jan Jan Pakistan ”* 💚✨\n\n`;
        captionText += `> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐌𝐔𝐁𝐀𝐑𝐀𝐊 𝐁𝐘 𝐃𝐑 𝐊𝐀𝐌𝐑𝐀𝐍*`;

        // 1. Send Thumbnail with Azadi Theme Caption
        if (thumbnail) {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: captionText 
            }, { quoted: mek });
        } else {
            await reply(captionText);
        }

        // Extracting audio link
        const audioUrl = res.audio?.url || res.audio;
        if (!audioUrl) {
            return reply("❌ Audio link nahi mil saka.");
        }

        // 2. Send Direct Audio
        return await conn.sendMessage(from, { 
            audio: { url: audioUrl }, 
            mimetype: 'audio/mp4', 
            ptt: false
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        return reply("❌ Error: Audio process nahi ho saka, dobara koshish karein.");
    }
});
