import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd, commands } from '../command.js';
import { lidToPhone } from '../lib/functions.js';

// Base URL
const BASE_URL = 'https://kamran-mdx.vercel.app';

// ==================== PAIR COMMAND ====================
cmd({
    pattern: "pair",
    alias: ["getpair", "clonebot"],
    react: "✅",
    desc: "Get pairing code for bot",
    category: "owner",
    use: ".pair 92319689XXX",
    filename: fileURLToPath(import.meta.url)
}, async (conn, mek, m, { from, args, sender, senderNumber, reply, react }) => {
    try {
        await react('⏳');
        
        let phoneNumber;
        
        if (args[0]) {
            phoneNumber = args[0].trim().replace(/[^0-9]/g, '');
        } else {
            if (sender.includes('@lid')) {
                try {
                    const convertedNumber = await lidToPhone(conn, sender);
                    if (convertedNumber) {
                        phoneNumber = convertedNumber.replace(/[^0-9]/g, '');
                    } else {
                        phoneNumber = senderNumber;
                    }
                } catch (e) {
                    phoneNumber = senderNumber;
                }
            } else {
                phoneNumber = senderNumber;
            }
        }

        if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
            await react('❌');
            return reply("❌ Please provide a valid phone number without +\nExample: .pair 923427582XXX");
        }

        const serversResponse = await axios.get(`${BASE_URL}/servers`, { timeout: 10000 });
        
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return reply("❌ *Failed to fetch server list!*");
        }
        
        const servers = serversResponse.data.servers;
        
        if (servers.length === 0) {
            await react('❌');
            return reply("❌ *No servers available!*");
        }
        
        const randomIndex = Math.floor(Math.random() * servers.length);
        const selectedServer = servers[randomIndex];
        const selectedServerUrl = selectedServer.url;
        
        const response = await axios.get(`${selectedServerUrl}/code`, {
            params: { number: phoneNumber },
            timeout: 20000
        });

        if (!response.data || !response.data.code) {
            await react('❌');
            return reply("❌ Failed to retrieve pairing code. Please try again later.");
        }

        const pairingCode = response.data.code;
        
        await react('✅');
        
        await reply(`> *KAMRAN-MD PAIRING CODE*

*Your pairing code is:* ${pairingCode}`);

        await reply(pairingCode);

    } catch (error) {
        console.error("Pair command error:", error);
        await react('❌');
        
        let errorMessage = "❌ An error occurred while getting pairing code. Please try again later.";
        
        if (error.response) {
            errorMessage = `❌ Server error: ${error.response.status}`;
        } else if (error.request) {
            errorMessage = "❌ No response from server. Server might be offline.";
        }
        
        await reply(errorMessage);
    }
});
