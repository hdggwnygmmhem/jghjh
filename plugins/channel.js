// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "wachannel",
    desc: "Stalk or get information about a WhatsApp channel",
    category: "stalker",
    react: "📊",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   📊 KAMRAN-MD WA CHANNEL STALK 📊   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya WhatsApp channel ka link dein!*\n\n` +
                `> 📌 *Example:* \`.wachannel https://whatsapp.com/channel/...\`\n` +
                `> ⚡ *Version:* \`10.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const url = `https://api.princetechn.com/api/stalk/wachannel?apikey=prince&url=${encodeURIComponent(q)}`;
        const response = await axios.get(url, { timeout: 60000 });
        
        if (response.data) {
            const resData = response.data.result || response.data;
            
            const channelName = resData.name || resData.channelName || "Unknown";
            const channelDesc = resData.description || resData.desc || "No description";
            const followers = resData.followers || resData.subscribers || resData.members || "Unknown";
            const verified = resData.verified ? "✅ Verified" : "❌ Not Verified";
            const channelImage = resData.image || resData.icon || "";

            const channelBox = `
╔════════════════════════╗
║   📊 WA CHANNEL INFO STALK   
╚════════════════════════╝

📌 *Name:* ${channelName}
👥 *Followers:* ${followers}
🛡️ *Status:* ${verified}
📝 *Description:* ${channelDesc}

> ⚡ *Version:* \`10.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

            if (channelImage) {
                await conn.sendMessage(from, { 
                    image: { url: channelImage }, 
                    caption: channelBox 
                }, { quoted: mek });
            } else {
                await reply(channelBox, {
                    contextInfo: { 
                        forwardingScore: 999, 
                        isForwarded: true, 
                        forwardedNewsletterMessageInfo: { 
                            newsletterJid: '120363418144382782@newsletter', 
                            newsletterName: 'DR KAMRAN', 
                            serverMessageId: 143 
                        } 
                    }
                });
            }

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *API se koi data nahi mila, link theek se check karein!*");
        }

    } catch (e) {
        console.error("WA Channel Command Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ *Error occurred:* \`\`\`${e.message}\`\`\``);
    }
});
