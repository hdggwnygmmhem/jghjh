// Jawad Tech - Cartoon & Animal TikTok Commands
const { cmd } = require("../command");
const fetch = require("node-fetch");

// Define all your target search configurations here
const videoCommands = [
    // Classic Cartoons
    { pattern: "tomjerry", react: '🐱🐭', query: "Tom and Jerry cartoon tiktok", title: "Tom & Jerry" },
    { pattern: "mickeymouse", react: '🐭', query: "Mickey Mouse Disney tiktok", title: "Mickey Mouse" },
    { pattern: "donaldduck", react: '🦆', query: "Donald Duck Disney tiktok", title: "Donald Duck" },
    { pattern: "bugsbunny", react: '🐰', query: "Bugs Bunny Looney Tunes tiktok", title: "Bugs Bunny" },
    { pattern: "spongebob", react: '🧽', query: "SpongeBob SquarePants tiktok", title: "SpongeBob" },
    { pattern: "doraemon", react: '🤖', query: "Doraemon anime cartoon tiktok", title: "Doraemon" },
    { pattern: "shinchan", react: '👦', query: "Shin Chan cartoon tiktok", title: "Shin Chan" },
    { pattern: "pokemon", react: '⚡', query: "Pokemon anime tiktok", title: "Pokémon" },
    { pattern: "ben10", react: '👽', query: "Ben 10 cartoon tiktok", title: "Ben 10" },
    { pattern: "powerrangers", react: '🦸', query: "Power Rangers tiktok", title: "Power Rangers" },

    // Disney & Pixar
    { pattern: "frozen", react: '❄️', query: "Frozen Disney movie tiktok", title: "Frozen" },
    { pattern: "cars", react: '🚗', query: "Cars Pixar movie tiktok", title: "Cars" },
    { pattern: "toystory", react: '🤠', query: "Toy Story Pixar tiktok", title: "Toy Story" },
    { pattern: "findingnemo", react: '🐠', query: "Finding Nemo movie tiktok", title: "Finding Nemo" },

    // Modern & Anime
    { pattern: "adventuretime", react: '🧢', query: "Adventure Time cartoon tiktok", title: "Adventure Time" },
    { pattern: "rickandmorty", react: '👨‍🔬', query: "Rick and Morty tiktok", title: "Rick and Morty" },
    { pattern: "gravityfalls", react: '🌲', query: "Gravity Falls cartoon tiktok", title: "Gravity Falls" },
    { pattern: "stevenuniverse", react: '💎', query: "Steven Universe cartoon tiktok", title: "Steven Universe" },
    { pattern: "dragonball", react: '🐉', query: "Dragon Ball Z anime tiktok", title: "Dragon Ball" },
    { pattern: "naruto", react: '🍥', query: "Naruto anime tiktok", title: "Naruto" },
    { pattern: "onepiece", react: '🏴‍☠️', query: "One Piece anime tiktok", title: "One Piece" },
    { pattern: "demoncat", react: '👺', query: "Demon Slayer anime tiktok", title: "Demon Slayer" },

    // Indian & Fun Cartoons
    { pattern: "chhotabheem", react: '💪', query: "Chhota Bheem cartoon tiktok", title: "Chhota Bheem" },
    { pattern: "motupatlu", react: '👬', query: "Motu Patlu cartoon tiktok", title: "Motu Patlu" },
    { pattern: "cartooncompilation", react: '🎬', query: "cartoon funny compilation tiktok", title: "Cartoon Compilation" },

    // Wild & Unique Animals
    { pattern: "hyena", react: '🐾', query: "hyena laughing tiktok", title: "Hyena" },
    { pattern: "mongoose", react: '🐕', query: "mongoose animal tiktok", title: "Mongoose" },
    { pattern: "porcupine", react: '🦔', query: "porcupine animal tiktok", title: "Porcupine" },
    { pattern: "wombat", react: '🐻', query: "wombat australia tiktok", title: "Wombat" },
    { pattern: "platypus", react: '🦆', query: "platypus australia tiktok", title: "Platypus" },
    { pattern: "meerkat", react: '🐾', query: "meerkat animal tiktok", title: "Meerkat" },
    { pattern: "lemur", react: '🐒', query: "lemur madagascar tiktok", title: "Lemur" },
    { pattern: "tapir", react: '🐷', query: "tapir animal tiktok", title: "Tapir" },
    { pattern: "okapi", react: '🦒', query: "okapi forest giraffe tiktok", title: "Okapi" },

    // Marine Life & Mammals
    { pattern: "manatee", react: '🧜', query: "manatee sea cow tiktok", title: "Manatee" },
    { pattern: "otter", react: '🦦', query: "otter cute tiktok", title: "Otter" },
    { pattern: "beaver", react: '🦫', query: "beaver animal tiktok", title: "Beaver" },
    { pattern: "lobster", react: '🦞', query: "lobster sea animal tiktok", title: "Lobster" },
    { pattern: "crab", react: '🦀', query: "crab sea animal tiktok", title: "Crab" },
    { pattern: "squid", react: '🦑', query: "squid sea animal tiktok", title: "Squid" },

    // Birds & Domestic Farm Animals
    { pattern: "pelican", react: '🪿', query: "pelican bird tiktok", title: "Pelican" },
    { pattern: "vulture", react: '🦅', query: "vulture bird tiktok", title: "Vulture" },
    { pattern: "woodpecker", react: '🐦', query: "woodpecker bird tiktok", title: "Woodpecker" },
    { pattern: "peacock", react: '🦚', query: "peacock beautiful tiktok", title: "Peacock" },
    { pattern: "eagle", react: '🦅', query: "eagle bird tiktok", title: "Eagle" },
    { pattern: "hawk", react: '🦅', query: "hawk bird tiktok", title: "Hawk" },
    { pattern: "flamingo", react: '🦩', query: "flamingo bird tiktok", title: "Flamingo" },
    { pattern: "swan", react: '🦢', query: "swan beautiful tiktok", title: "Swan" },
    { pattern: "crow", react: '🐦‍⬛', query: "crow raven tiktok", title: "Crow" },
    { pattern: "buffalo", react: '🐃', query: "buffalo animal tiktok", title: "Buffalo" },
    { pattern: "yak", react: '🐃', query: "yak animal tiktok", title: "Yak" },
    { pattern: "camel", react: '🐪', query: "camel desert animal tiktok", title: "Camel" },
    { pattern: "pig", react: '🐷', query: "pig funny tiktok", title: "Pig" },
    { pattern: "donkey", react: '🫏', query: "donkey animal tiktok", title: "Donkey" },
    { pattern: "chicken", react: '🐔', query: "chicken rooster tiktok", title: "Chicken" },
    { pattern: "duck", react: '🦆', query: "duck cute tiktok", title: "Duck" },
    { pattern: "turkey", react: '🦃', query: "turkey bird tiktok", title: "Turkey" },
    { pattern: "goose", react: '🪿', query: "goose bird tiktok", title: "Goose" },

    // Insects
    { pattern: "dragonfly", react: '🦟', query: "dragonfly insect tiktok", title: "Dragonfly" },
    { pattern: "ladybug", react: '🐞', query: "ladybug insect tiktok", title: "Ladybug" },
    { pattern: "grasshopper", react: '🦗', query: "grasshopper insect tiktok", title: "Grasshopper" },

    // Remaining basic targets
    { pattern: "mouse", react: '🐭', query: "mouse cute tiktok", title: "Mouse" },
    { pattern: "rat", react: '🐀', query: "rat pet tiktok", title: "Rat" }
];

// Loop through configurations to generate commands dynamically
videoCommands.forEach(({ pattern, react, query, title }) => {
    cmd({
        pattern: pattern,
        desc: `Send random ${title} TikTok videos`,
        react: react,
        category: 'utility',
        use: `.${pattern}`,
        filename: __filename
    }, async (conn, mek, m, { reply, from }) => {
        try {
            const url = `https://delirius-apiofc.vercel.app/search/tiktoksearch?query=${encodeURIComponent(query)}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`API failed: ${response.status}`);
            
            const data = await response.json();
            if (!data?.meta?.length) return reply(`❌ No ${title} videos found.`);
            
            // Pick a random video from the meta results
            const video = data.meta[Math.floor(Math.random() * data.meta.length)];
            
            if (video?.hd) {
                await conn.sendMessage(
                    from,
                    { 
                        video: { url: video.hd },
                        caption: `- ${react} *${title} Videos*\n> *© Powered by KAMRAN-MD*`
                    },
                    { quoted: mek }
                );
            } else {
                reply("❌ Failed to retrieve video.");
            }
        } catch (error) {
            console.error(`${title} Error:`, error);
            reply(`❌ Failed to fetch ${title} video.`);
        }
    });
});
