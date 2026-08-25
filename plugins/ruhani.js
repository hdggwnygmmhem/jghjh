import axios from 'axios';
import * as cheerio from 'cheerio';
import { cmd } from '../command.js'; // اپنے بوٹ کے کمانڈ ہینڈلر کا صحیح پاتھ رکھیں

// Scraper Function Exported for ESM
export async function scrapePage(page = 1) {
  const url =
    page === 1
      ? "https://www.wisataruhani.com/category/blog/"
      : `https://www.wisataruhani.com/category/blog/page/${page}/`;

  const { data } = await axios.get(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });

  const $ = cheerio.load(data);
  const posts = [];

  $("article.post").each((i, el) => {
    posts.push({
      title: $(el).find("h3.entry-title a").text().trim(),
      url: $(el).find("h3.entry-title a").attr("href"),
      image:
        $(el).find("img").attr("src") ||
        $(el).find("img").attr("data-src") ||
        null
    });
  });

  return posts;
}

export async function wisataRuhani(maxPage = 1) {
  const results = [];

  for (let page = 1; page <= maxPage; page++) {
    try {
      const posts = await scrapePage(page);
      if (!posts.length) break;
      results.push(...posts);
    } catch {
      break;
    }
  }

  return {
    status: true,
    total: results.length,
    result: results
  };
}

// ==========================================
//          WHATSAPP BOT COMMAND
// ==========================================

cmd({
    pattern: "wisataruhani",
    alias: ["wisata", "ruhani", "tourblog"],
    desc: "Search and fetch articles from Wisata Ruhani blog",
    category: "search",
    filename: import.meta.url
},
async (conn, mek, m, { reply, react }) => {
    try {
        await react("🔍");

        // Fetch first page articles by default for WhatsApp bot speed
        const data = await wisataRuhani(1);

        if (!data.status || !data.result.length) {
            await react("❌");
            return reply("❌ *کوئی مضامین یا بلاگ پسٹ نہیں مل سکے۔*");
        }

        let caption = `🕌 *WISATA RUHANI BLOG POSTS*\n\n`;
        caption += `📌 *Total Articles:* ${data.total}\n\n`;

        data.result.forEach((item, index) => {
            caption += `*${index + 1}. ${item.title}*\n`;
            caption += `🔗 *Link:* ${item.url}\n\n`;
        });

        // Send first image as header if available
        const firstImage = data.result.find(v => v.image)?.image;

        if (firstImage) {
            await conn.sendMessage(m.chat, {
                image: { url: firstImage },
                caption: caption
            }, { quoted: mek });
        } else {
            await reply(caption);
        }

        await react("✅");

    } catch (err) {
        console.error("Wisata Ruhani Error:", err);
        await react("❌");
        await reply(`❌ *Error:* ${err.message}`);
    }
});
