import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const BaseTeks = 'https://snapvideotools.com';

const HEADERS = {
  'Content-Type': 'application/json',
  'Origin': 'https://snapvideotools.com',
  'Referer': 'https://snapvideotools.com/id/capcut-downloader',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  'Sec-Ch-Ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?1',
  'Sec-Ch-Ua-Platform': '"Android"',
  'X-Requested-With': 'XMLHttpRequest'
};

// Function to fetch CapCut Video details
async function downloadCapCut(url) {
  try {
    const response = await axios.post(`${BaseTeks}/id/api/snap`, { text: url }, { headers: HEADERS });
    return response.data;
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || null,
      message: error.response?.data || error.message
    };
  }
}

// ==================== CAPCUT DOWNLOADER COMMAND ====================
cmd({
    pattern: "capcut",
    alias: ["cc", "ccdl", "capcutdl"],
    react: "🎬",
    desc: "Download CapCut templates or videos via link",
    category: "download",
    use: ".capcut <capcut_url>",
    filename: fileURLToPath(import.meta.url)
}, async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) {
            await react('❌');
            return reply(`❌ *Please provide a CapCut link!*

*Example:* 
.capcut https://www.capcut.com/tv2/ZS42qbGY9/`);
        }

        if (!q.includes('capcut.com')) {
            await react('❌');
            return reply("❌ *Invalid URL! Please provide a valid CapCut link.*");
        }

        await react('⏳');

        const data = await downloadCapCut(q);

        if (!data || data.success === false) {
            throw new Error(data.message || "Failed to fetch video from CapCut server.");
        }

        // Extracting media URL (adjust keys according to API response structure)
        const videoUrl = data.video || data.url || data.data?.video || data.result?.url;
        const title = data.title || data.data?.title || 'CapCut Video';
        const author = data.author || data.data?.author || 'Unknown';

        if (!videoUrl) {
            throw new Error("Video download link not found in API response.");
        }

        // Send Video to WhatsApp
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `🎬 *CAPCUT VIDEO DOWNLOADED* 🎬\n\n📌 *Title:* ${title}\n👤 *Author:* ${author}\n\n> *© Powered By DR KAMRAN*`
        }, { quoted: mek });

        await react('✅');

    } catch (error) {
        console.error("CapCut Downloader Error:", error);
        await react('❌');
        await reply(`❌ *Error downloading CapCut video:* ${error.message}`);
    }
});
