import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import { lidToPhone } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);

// ==================== CONFIGURATION (BASE64 ENCODED) ====================
const SECRET_KEY = Buffer.from("a2FtcmFueG1kODA4", "base64").toString("utf-8");
const WEB_URL = Buffer.from("aHR0cHM6Ly9kcmthbXJhbi1taW5pLWJvdC52ZXJjZWwuYXBw", "base64").toString("utf-8");

// Function to get status emoji based on count
function getCountStatus(count) {
    if (count === 50) return '🔴';
    if (count >= 40) return '🟣';
    if (count >= 30) return '🟡';
    if (count >= 20) return '🟠';
    if (count >= 10) return '🔵';
    return '🟢';
}

// Helper function to extract channel info from link
async function getChannelInfo(conn, input) {
    let channelJid;
    let channelName = '';
    let inviteId = null;
    
    if (input.includes('whatsapp.com/channel/')) {
        const match = input.match(/whatsapp\.com\/channel\/([\w-]+)/);
        if (!match) return null;
        
        inviteId = match[1];
        
        try {
            const metadata = await conn.newsletterMetadata("invite", inviteId);
            channelJid = metadata.id;
            channelName = metadata.name || 'Unknown';
        } catch (e) {
            return null;
        }
    } else if (input.includes('@newsletter')) {
        channelJid = input;
        channelName = input.split('@')[0];
    } else {
        return null;
    }
    
    return { channelJid, channelName, inviteId };
}

// Validate channel post URL format
function isValidChannelPostUrl(url) {
    const pattern = /^https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[a-zA-Z0-9]+\/\d+$/;
    return pattern.test(url);
}

// Extract channel ID and post ID from URL
function extractIdsFromUrl(url) {
    const match = url.match(/\/channel\/([a-zA-Z0-9]+)\/(\d+)/);
    if (match) {
        return {
            channelId: match[1],
            postId: match[2]
        };
    }
    return null;
}

// Parse emojis
function parseEmojis(input) {
    let emojis = [];
    const parts = input.split(',').map(p => p.trim()).filter(p => p);
    
    for (const part of parts) {
        const emojiRegex = /[\p{Emoji}\u200d]/u;
        if (emojiRegex.test(part)) {
            emojis.push(part);
        }
    }
    
    return emojis;
}

// Validate emojis format
function validateEmojis(emojis) {
    if (!emojis || emojis.length === 0) {
        return {
            valid: false,
            error: '❌ *No valid emojis found!*\n*Example:* .chreact https://whatsapp.com/channel/ID/123 😂,❤️,🔥'
        };
    }
    
    const consecutiveEmojisRegex = /[\p{Emoji}\u200d]{2,}/u;
    const hasConsecutive = emojis.some(e => consecutiveEmojisRegex.test(e));
    
    if (hasConsecutive) {
        return {
            valid: false,
            error: '❌ *Invalid format! Please separate all emojis with commas*\n*Example:* .chreact link 😂,❤️,🔥,👏,😮'
        };
    }
    
    return { valid: true, emojis };
}

// ==================== PAIR COMMAND ====================
cmd({
    pattern: "pair64",
    alias: ["getpair765", "clonebot876"],
    react: "✅",
    desc: "Get pairing code for Kamran MD bot",
    category: "owner",
    use: ".pair 923195068XXX",
    filename: __filename
}, async (conn, mek, m, { from, args, q, sender, senderNumber, reply, react }) => {
    try {
        await react('⏳');
        
        let phoneNumber;
        if (args[0]) {
            phoneNumber = args[0].trim().replace(/[^0-9]/g, '');
        } else {
            if (sender.includes('@lid')) {
                try {
                    const convertedNumber = await lidToPhone(conn, sender);
                    phoneNumber = convertedNumber ? convertedNumber.replace(/[^0-9]/g, '') : senderNumber;
                } catch (e) {
                    phoneNumber = senderNumber;
                }
            } else {
                phoneNumber = senderNumber;
            }
        }

        if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
            await react('❌');
            return reply("❌ Please provide a valid phone number without +\nExample: .pair 923195068XXX");
        }

        let pairingCode = null;
        let methodUsed = "";

        // Try all servers with different endpoints
        try {
            const serversResponse = await axios.get(`${WEB_URL}/servers`, { timeout: 8000 }).catch(() => null);
            if (serversResponse && serversResponse.data && serversResponse.data.servers) {
                let servers = serversResponse.data.servers.sort(() => 0.5 - Math.random());
                
                for (const server of servers) {
                    // Try /paircode endpoint
                    try {
                        const res1 = await axios.get(`${server.url}/paircode`, { params: { number: phoneNumber }, timeout: 6000 });
                        if (res1.data && res1.data.code) {
                            pairingCode = res1.data.code;
                            methodUsed = `${server.name} (/paircode)`;
                            break;
                        }
                    } catch (e) {}

                    // Try /code endpoint
                    try {
                        const res2 = await axios.get(`${server.url}/code`, { params: { number: phoneNumber }, timeout: 6000 });
                        if (res2.data && res2.data.code) {
                            pairingCode = res2.data.code;
                            methodUsed = `${server.name} (/code)`;
                            break;
                        }
                    } catch (e) {}
                }
            }
        } catch (err) {
            console.log("Main servers failed, moving to backup...");
        }

        // Fallback to backup APIs
        if (!pairingCode) {
            const backupAPIs = [
                `https://gifted-md-pair-1.onrender.com/code?number=${phoneNumber}`,
                `https://itssgayan-pair-code.sytes.net/code?number=${phoneNumber}`,
                `https://subzero-pair.onrender.com/code?number=${phoneNumber}`
            ];

            for (const api of backupAPIs) {
                try {
                    const bkpResponse = await axios.get(api, { timeout: 12000 });
                    if (bkpResponse.data && bkpResponse.data.code) {
                        pairingCode = bkpResponse.data.code;
                        methodUsed = "Global Backup Network";
                        break;
                    }
                } catch (apiErr) {}
            }
        }

        if (!pairingCode) {
            await react('❌');
            return reply("❌ *Pairing Error:* All servers and backup lines are currently busy.");
        }
        
        await react('✅');
        await reply(`> *KAMRAN MD PAIRING CODE*\n\n*Route:* ${methodUsed}\n*Your pairing code is:* ${pairingCode}`);
        await reply(pairingCode);

    } catch (error) {
        console.error("Critical error in pair command:", error);
        await react('❌');
        await reply("❌ Technical issue prevented pairing code generation.");
    }
});

// ==================== CHREACT COMMAND ====================
cmd({
    pattern: "chreact",
    alias: ["channelreact", "react", "rp"],
    react: "🎯",
    desc: "React to WhatsApp channel post",
    category: "group",
    use: ".chreact <channel_post_url> [emojis]",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply(`❌ *Please provide a channel post URL!*

*Example:* 
.chreact https://whatsapp.com/channel/0029VbCO8mW8F2p2ZoS3k/609
`);
        }
        
        const url = args[0];
        
        if (!isValidChannelPostUrl(url)) {
            return reply(`❌ *Invalid URL!*`);
        }
        
        const ids = extractIdsFromUrl(url);
        if (!ids) {
            return reply(`❌ *Failed to extract channel/post IDs from URL!*`);
        }
        
        let emojis = [];
        let emojisString = '';
        
        if (args.length > 1) {
            const remaining = args.slice(1).join(' ');
            emojis = parseEmojis(remaining);
            emojisString = emojis.join(',');
        }
        
        if (!emojisString) {
            emojis = ['❤️', '👍', '🔥'];
            emojisString = emojis.join(',');
        }
        
        const validation = validateEmojis(emojis);
        if (!validation.valid) {
            return reply(validation.error);
        }
        
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        
        // Get servers list
        const serversResponse = await axios.get(`${WEB_URL}/servers`, { timeout: 10000 });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ *Failed to fetch server list!*");
        }
        
        const servers = serversResponse.data.servers;
        
        if (servers.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ *No servers found!*");
        }
        
        // Send reactions to all servers using the new router format
        let successCount = 0;
        for (const server of servers) {
            try {
                // Using the new router format with key parameter (directly added)
                const reactUrl = `${server.url}/react?key=${SECRET_KEY}&url=${encodeURIComponent(url)}&emojis=${encodeURIComponent(emojisString)}`;
                await axios.get(reactUrl, { timeout: 5000 });
                successCount++;
            } catch (error) {
                console.log(`Failed to send reaction via ${server.name}:`, error.message);
            }
        }
        
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        
        const resultMessage = `✅ *Reactions sent successfully!*

📊 *Details:*
🎯 *Channel:* ${ids.channelId}
📝 *Post:* ${ids.postId}
😊 *Emojis:* ${validation.emojis.join(' ')}
🌐 *Servers:* ${successCount}/${servers.length} successful

> *Powered By KAMRAN MD*`;

        await reply(resultMessage);
        
    } catch (error) {
        console.error("React post error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ *Error processing request!*\n\n*Error:* ${error.message}`);
    }
});

// ==================== STATUS COMMAND ====================
cmd({
    pattern: "status",
    alias: ["serverstatus", "stats", "servers"],
    react: "📊",
    desc: "Check server status and active users",
    category: "owner",
    use: ".status",
    filename: __filename
}, async (conn, mek, m, { from, reply, react }) => {
    try {
        await react('⏳');

        const serversResponse = await axios.get(`${WEB_URL}/servers`, { timeout: 10000 });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return reply("❌ Failed to fetch server list.");
        }

        const servers = serversResponse.data.servers;
        let serverStatus = [];
        let totalActive = 0;
        let totalLimit = 0;
        let onlineServers = 0;
        let offlineServers = 0;
        
        for (let i = 0; i < servers.length; i++) {
            const server = servers[i];
            
            try {
                const statusResponse = await axios.get(`${server.url}/active`, { timeout: 8000 });
                
                if (statusResponse.data && !statusResponse.data.error) {
                    const count = statusResponse.data.count || 0;
                    const limit = statusResponse.data.limit || 50;
                    const statusEmoji = getCountStatus(count);
                    
                    serverStatus.push({
                        server: server.id,
                        name: server.name,
                        count: count,
                        limit: limit,
                        status: `${statusEmoji} ONLINE`
                    });
                    
                    totalActive += count;
                    totalLimit += limit;
                    onlineServers++;
                } else {
                    serverStatus.push({
                        server: server.id,
                        name: server.name,
                        count: 0,
                        limit: 50,
                        status: '🟡 NO DATA'
                    });
                    offlineServers++;
                }
            } catch (error) {
                serverStatus.push({
                    server: server.id,
                    name: server.name,
                    count: 0,
                    limit: 50,
                    status: '🔴 OFFLINE'
                });
                offlineServers++;
            }
        }

        await react('✅');

        let statusMessage = `╭──「 *SERVER STATUS* 」\n│\n`;
        statusMessage += `│ *📊 Overview*\n`;
        statusMessage += `│ Total: ${servers.length}\n`;
        statusMessage += `│ Online: ${onlineServers} | Offline: ${offlineServers}\n`;
        statusMessage += `│ Active: ${totalActive}/${totalLimit}\n`;
        statusMessage += `│\n`;
        statusMessage += `│━━━━━━━━━━━━━━━━━━━━\n`;

        serverStatus.forEach((s) => {
            let statusIcon = s.status.split(' ')[0];
            let statusText = s.status.split(' ')[1];
            statusMessage += `│ ${s.name.padEnd(8)}: ${s.count.toString().padStart(2)}/${s.limit} ${statusIcon} ${statusText}\n`;
        });

        statusMessage += `╰─────────────────`;

        await reply(statusMessage);

    } catch (error) {
        console.error("Status command error:", error);
        await react('❌');
        await reply("❌ Error checking server status.");
    }
});
