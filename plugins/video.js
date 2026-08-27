import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);

// Helper functions for reaction API signing
const baseUrl = 'https://amba-react-pi.vercel.app';
const CONFIG_API = `${baseUrl}/api/config`;
const REACT_API = `${baseUrl}/api/react`;

async function getSecretKey() {
    try {
        const res = await axios.get(CONFIG_API, { timeout: 5000 });
        if (res.data?.secret) return res.data.secret;
        throw new Error('Secret key tidak ditemukan');
    } catch (err) {
        return 'AMBA_ULTRA_SECURE_KEY_2026_XYZ#!'; 
    }
}

function generateSignature(payloadString, timestamp, secret) {
    const message = timestamp + payloadString;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message);
    return hmac.digest('hex');
}

async function sendReactToApi(link, emojiInput = "🔥") {
    let emojis = [];
    if (typeof emojiInput === 'string') {
        emojis = emojiInput.split(',').map(e => e.trim()).filter(e => e.length > 0);
    } else if (Array.isArray(emojiInput)) {
        emojis = emojiInput;
    }

    if (emojis.length > 4) {
        emojis = emojis.slice(0, 4);
    }

    const finalEmojiStr = emojis.join(',');
    const secret = await getSecretKey();
    
    const payload = {
        mode: "1",
        link: link,
        emoji: finalEmojiStr,
        count: 1
    };

    const payloadString = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const signature = generateSignature(payloadString, timestamp, secret);

    try {
        const res = await axios.post(REACT_API, payloadString, {
            headers: {
                'Content-Type': 'application/json',
                'X-Timestamp': timestamp,
                'X-Signature': signature,
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
            },
            timeout: 60000
        });

        return { success: true, data: res.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || err.message 
        };
    }
}

cmd({
    pattern: "channelreact2",
    alias: ["chreact2", "wareact"],
    desc: "Send auto reactions to a WhatsApp channel post link",
    category: "owner",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator }) => {
    if (!isCreator) return reply("❌ This command is only for owners!");
    
    // Usage: .channelreact https://whatsapp.com/channel/.../363 😛,😭,😆
    const args = text ? text.trim().split(' ') : [];
    const channelLink = args[0] || (m.quoted ? m.quoted.text : null);
    const customEmojis = args.slice(1).join(' ') || "😛,😭,😆,🤪";
    
    if (!channelLink || !channelLink.includes('whatsapp.com/channel/')) {
        return reply(
            `⚠️ Please provide a valid WhatsApp channel post link!\n\n` +
            `Example:\n` +
            `• .channelreact https://whatsapp.com/channel/0029Vb8hiKd0gcfQDpEDdf2n/363 😛,😭,😆`
        );
    }
    
    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    
    try {
        const result = await sendReactToApi(channelLink, customEmojis);
        
        if (result.success) {
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            reply(`✅ Successfully sent reactions to the channel post!\nEmojis: ${customEmojis}`);
        } else {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            reply(`❌ Failed to send reactions: ${result.message}`);
        }
    } catch (error) {
        console.error("Channel React Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
