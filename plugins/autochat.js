import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';
import { toPTT } from '../lib/converter.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "tts",
    alias: ["texttospeech", "speak", "voice"],
    desc: "Convert text into speech audio using AI TTS API.",
    category: "ai",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        let text = q ? q.trim() : "";

        if (!text && m.quoted) {
            text = m.quoted.text || m.quoted.caption || "";
        }

        if (!text) {
            return await reply("❌ Please provide text for text-to-speech!\n\n*Usage:* \n.tts Hello! This is a test.");
        }

        await reply("⏳ Generating speech audio, please wait...");

        const apiUrl = `https://api.princetechn.com/api/ai/tts?apikey=prince&text=${encodeURIComponent(text)}&voice=en_us_female`;
        
        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            validateStatus: status => status >= 200 && status < 500
        });

        if (response.data) {
            let contentType = response.headers['content-type'] || '';
            
            if (contentType.includes('application/json')) {
                let jsonStr = Buffer.from(response.data).toString('utf-8');
                let jsonObj = JSON.parse(jsonStr);
                return await reply(`❌ API Error: ${jsonObj.message || JSON.stringify(jsonObj)}`);
            }

            let audioBuffer = Buffer.from(response.data);
            
            // Convert to PTT using the converter library
            const pttAudio = await toPTT(audioBuffer, 'mp3');

            return await conn.sendMessage(from, { 
                audio: pttAudio, 
                mimetype: 'audio/ogg; codecs=opus', 
                ptt: true 
            }, { quoted: mek });

        } else {
            return await reply("❌ TTS API se koi response nahi mila.");
        }

    } catch (e) {
        console.log(e);
        return await reply(`❌ Error occurred: ${e.message}`);
    }
});
