import axios from 'axios';
import FormData from 'form-data';
import { cmd } from '../command.js'; // اپنے بوٹ کے کمانڈ ہینڈلر کا صحیح پاتھ رکھیں

// Scraper Function Exported for ESM
export async function aplmate(url, apiKey = "") {
  try {
    const home = await axios.get("https://aplmate.com/", {
      headers: {
        "user-agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/139 Mobile Safari/537.36"
      }
    });

    const cookie = home.headers["set-cookie"]
      ?.map(v => v.split(";")[0])
      .join("; ");

    // Turnstile Solver Call
    const { data: solve } = await axios.get(
      "https://fgsi.dpdns.org/api/tools/cfclearance/turnstile-min",
      {
        params: {
          apikey: apiKey, // fgsi.dpdns.org سے لی گئی API key پاس کریں
          url: "https://aplmate.com/",
          sitekey: "0x4AAAAAACd16sFwAoNHGZqs"
        }
      }
    );

    if (!solve?.data?.token) {
      throw new Error("API Solver Turnstile token لانے میں ناکام رہا۔");
    }

    const form1 = new FormData();
    form1.append("url", url);
    form1.append("cf-turnstile-response", solve.data.token);

    const { data: action } = await axios.post(
      "https://aplmate.com/action",
      form1,
      {
        headers: {
          ...form1.getHeaders(),
          Cookie: cookie,
          Origin: "https://aplmate.com",
          Referer: "https://aplmate.com/",
          Accept: "*/*"
        }
      }
    );

    const html1 = action.html || action.data || "";
    const data = html1.match(/name="data"\s+value='([^']+)'/)?.[1];
    const base = html1.match(/name="base"\s+value="([^"]+)"/)?.[1];
    const token = html1.match(/name="token"\s+value="([^"]+)"/)?.[1];
    const title = html1.match(/title="([^"]+)"/)?.[1];
    const artist = html1.match(/<p><span>(.*?)<\/span><\/p>/)?.[1];
    const thumbnail = html1.match(/<img\s+src="([^"]+)"/)?.[1];

    if (!data || !base || !token) {
      throw new Error("Track Form کا ڈیٹا نکالنے میں ناکامی۔");
    }

    const form2 = new FormData();
    form2.append("data", data);
    form2.append("base", base);
    form2.append("token", token);

    const { data: track } = await axios.post(
      "https://aplmate.com/action/track",
      form2,
      {
        headers: {
          ...form2.getHeaders(),
          Cookie: cookie,
          Origin: "https://aplmate.com",
          Referer: "https://aplmate.com/",
          Accept: "*/*"
        }
      }
    );

    const html2 = track.data || track.html || "";
    const links = [
      ...html2.matchAll(/href="(https:\/\/[^"]+)"/g)
    ].map(v => v[1]);

    const mp3 = links.find(v => v.includes("cdndl.aplmate.com/mp3?token=")) || null;
    const cover = links.find(v => v.includes("cdndl.aplmate.com/mp3?token=") && v !== mp3) || null;

    return {
      status: true,
      title: title || "Apple Music Song",
      artist: artist || "Unknown Artist",
      thumbnail: thumbnail || null,
      mp3,
      cover
    };

  } catch (error) {
    throw new Error(error.message);
  }
}

// ==========================================
//          WHATSAPP BOT COMMAND
// ==========================================

cmd({
    pattern: "applemusic",
    alias: ["aplm", "apple", "appledl"],
    desc: "Download MP3 audio from Apple Music link",
    category: "download",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q || !q.includes('music.apple.com')) {
            await react("❌");
            return reply("⚠️ *براہ کرم صحیح Apple Music لنک فراہم کریں!*\n\n*مثال:* `.applemusic https://music.apple.com/us/song/kicau-mania/1870566304`");
        }

        await react("⏳");

        // یہاں اپنی API Key رکھیں جو fgsi.dpdns.org سے حاصل کی ہو
        const FGSI_API_KEY = "آپ_کی_ای_پی_آئی_کی"; 

        const result = await aplmate(q, FGSI_API_KEY);

        if (!result.status || !result.mp3) {
            await react("❌");
            return reply("❌ *آڈیو لنک حاصل کرنے میں ناکامی ہوئی۔*");
        }

        const captionInfo = `🎵 *Title:* ${result.title}\n👤 *Artist:* ${result.artist}`;

        // 1. Send Thumbnail image if available
        if (result.thumbnail) {
            await conn.sendMessage(m.chat, {
                image: { url: result.thumbnail },
                caption: captionInfo
            }, { quoted: mek });
        } else {
            await reply(captionInfo);
        }

        await reply("📥 *آڈیو ڈاؤنلوڈ ہو رہی ہے، براہ کرم انتظار کریں...*");

        // 2. Send Audio File
        await conn.sendMessage(m.chat, {
            audio: { url: result.mp3 },
            mimetype: 'audio/mp4',
            fileName: `${result.title}.mp3`
        }, { quoted: mek });

        await react("✅");

    } catch (err) {
        console.error("Apple Music Download Error:", err);
        await react("❌");
        await reply(`❌ *Error:* ${err.message}`);
    }
});
