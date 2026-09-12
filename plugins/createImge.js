import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const funAndFootballApis = {
    // Fun / Quotes / Wishes APIs
    "gratitude": "Gratitude Message",
    "quotes": "Random Quote",
    "goodnight": "Good Night Wish",
    "flirt": "Flirt Message",
    "fathersday": "Father's Day Wish",
    "mothersday": "Mother's Day Wish",
    "pickupline": "Pick Up Line",
    "boyfriendsday": "Boyfriend's Day Wish",
    "newyear": "New Year Wish",
    "christmas": "Christmas Wish",
    "heartbreak": "Heartbreak Quote",
    
    // Football APIs
    "livescore": "Football Live Score",
    "livescore2": "Football Live Score 2",
    "footballnews": "Football News",
    "ligue1standings": "Ligue 1 Standings",
    "uclstandings": "UCL Standings",
    "uclmatches": "UCL Matches",
    "euroscorers": "Euro Top Scorers",
    "footballstreamingall": "Football Streaming All",
    "footballstreaming": "Football Streaming"
};

const aliasesList = Object.keys(funAndFootballApis);

cmd({
    pattern: "funapi",
    alias: aliasesList,
    desc: "Fetch fun messages, quotes, and football updates using various APIs.",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        let key = command.toLowerCase();
        if (!funAndFootballApis[key]) {
            return;
        }

        let apiName = funAndFootballApis[key];
        await reply(`⏳ Fetching ${apiName}, please wait...`);

        // Mapping endpoint names to correct API paths
        let endpointPath = key;
        if (key.startsWith("football")) {
            if (key === "footballnews") endpointPath = "football/news";
            else if (key === "ligue1standings") endpointPath = "football/ligue1/standings";
            else if (key === "uclstandings") endpointPath = "football/ucl/standings";
            else if (key === "uclmatches") endpointPath = "football/ucl/matches";
            else if (key === "euroscorers") endpointPath = "football/euros/scorers";
            else if (key === "footballstreamingall") endpointPath = "football/streaming/all";
            else if (key === "footballstreaming") endpointPath = "football/streaming";
            else endpointPath = `football/${key}`;
        } else {
            endpointPath = `fun/${key}`;
        }

        const apiUrl = `https://api.princetechn.com/api/${endpointPath}?apikey=prince`;
        
        const response = await axios.get(apiUrl, {
            timeout: 60000,
            validateStatus: status => status >= 200 && status < 500
        });

        if (response.data) {
            let resData = response.data;
            
            // Extracting text/message/result dynamically based on common formats
            let outputText = resData.result?.message || resData.result?.quote || resData.result?.text || resData.result || resData.message || '';

            if (typeof outputText === 'string' && outputText.length > 0) {
                return await reply(`✨ *${apiName}*:\n\n${outputText}`);
            } else {
                return await reply(`📦 *${apiName} Response:*\n\`\`\`${JSON.stringify(resData, null, 2)}\`\`\``);
            }
        } else {
            return await reply("❌ API se koi response nahi mila.");
        }

    } catch (e) {
        console.log(e);
        return await reply(`❌ Error occurred: ${e.message}`);
    }
});
