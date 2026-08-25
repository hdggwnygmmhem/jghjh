import axios from 'axios';
import { cmd } from '../command.js'; // اپنے بوٹ کے کمانڈ ہینڈلر کا صحیح پاتھ رکھیں

// Country List Object
export const CECAN_LIST = {
  china:      { flag: "🇨🇳", label: "China" },
  indonesia:  { flag: "🇮🇩", label: "Indonesia" },
  japan:      { flag: "🇯🇵", label: "Japan" },
  korea:      { flag: "🇰🇷", label: "Korea" },
  malaysia:   { flag: "🇲🇾", label: "Malaysia" },
  thailand:   { flag: "🇹🇭", label: "Thailand" },
  vietnam:    { flag: "🇻🇳", label: "Vietnam" },
  hijaber:    { flag: "🧕", label: "Hijaber" }
};

// Helper function to fetch and send random photos
export async function sendCecan(conn, mek, country) {
  try {
    const countryData = CECAN_LIST[country];
    if (!countryData) return false;

    const { flag, label } = countryData;
    const apiUrl = `https://api.ikyyxd.my.id/random/cecan/${country}`;

    const res = await axios.get(apiUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(res.data);

    await conn.sendMessage(mek.chat, {
      image: imageBuffer,
      caption: `${flag} *Random ${label} Image*`
    }, { quoted: mek });

    return true;
  } catch (err) {
    console.error(`Error fetching image for ${country}:`, err);
    throw err;
  }
}

// ==========================================
//          DYNAMIC COUNTRY COMMANDS
// ==========================================

Object.keys(CECAN_LIST).forEach(country => {
  cmd({
    pattern: `cecan${country}`,
    alias: [`random${country}`],
    desc: `Get random photo from ${CECAN_LIST[country].label}`,
    category: "image",
    filename: import.meta.url
  },
  async (conn, mek, m, { reply, react }) => {
    try {
      await react("📸");
      await sendCecan(conn, mek, country);
      await react("✅");
    } catch (err) {
      await react("❌");
      await reply("❌ *تصویر حاصل کرنے میں ناکامی ہوئی۔*");
    }
  });
});

// ==========================================
//           COSPLAY PHOTO COMMAND
// ==========================================

cmd({
  pattern: "cecancosplay",
  alias: ["cosplay", "cosplaygirl"],
  desc: "Get random Cosplay photo",
  category: "image",
  filename: import.meta.url
},
async (conn, mek, m, { reply, react }) => {
  try {
    await react("🌷");

    const apiUrl = "https://api.ikyyxd.my.id/cecan/cosplay";
    const response = await axios.get(apiUrl, {
      responseType: "arraybuffer",
      timeout: 60000
    });

    const imageBuffer = Buffer.from(response.data);
    const caption = `💖 *Random Cosplay Photo* 💖`;

    await conn.sendMessage(m.chat, {
      image: imageBuffer,
      caption: caption
    }, { quoted: mek });

    await react("✅");

  } catch (e) {
    console.error("Cosplay command error:", e);
    await react("❌");
    await reply("❌ *تصویر حاصل کرنے میں ناکامی ہوئی۔*");
  }
});
