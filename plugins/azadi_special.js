import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ============================================================
// 1. AZADI COUNTDOWN (14 August Timer)
// ============================================================
cmd({
    pattern: "azadicountdown",
    alias: ["azaditimer", "14augustdays"],
    desc: "Calculate days left until 14th August",
    category: "azadi",
    react: "⏳",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        const today = new Date();
        let targetYear = today.getFullYear();
        let targetDate = new Date(targetYear, 7, 14); // August is month 7 (0-indexed)

        if (today > targetDate && today.getDate() !== 14) {
            targetDate.setFullYear(targetYear + 1);
        }

        const diffTime = Math.abs(targetDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (today.getDate() === 14 && today.getMonth() === 7) {
            return reply("🇵🇰 *AAJ 14 AUGUST HAI!* 🇵🇰\n\n*Jashan-e-Azadi Mubarak Ho All Pakistanis!* 💚✨\n\n> *𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*");
        }

        const msg = `
⏳ *AZADI COUNTDOWN 🇵🇰*

14 August (Jashan-e-Azadi) me abhi:
🗓️ *${diffDays} Din* baaki hain!

*“ Apni Azadi Ko Hum Hargiz Bhula Sakte Nahi ”*

> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐒𝐏𝐄𝐂𝐈𝐀𝐋*
`;
        await reply(msg);
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ============================================================
// 2. GREEN & WHITE WHATSAPP FLAG ART
// ============================================================
cmd({
    pattern: "makeflag",
    alias: ["pakflagart", "azadiart"],
    desc: "Generate Green & White ASCII WhatsApp Flag",
    category: "azadi",
    react: "🇵🇰",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const flagArt = `
⬜⬜🟢🟢🟢🟢🟢🟢🟢🟢
⬜⬜🟢🟢🟢🟢🟢🟢🟢🟢
⬜⬜🟢🟢🌙⭐🟢🟢🟢🟢
⬜⬜🟢🟢🟢🟢🟢🟢🟢🟢
⬜⬜🟢🟢🟢🟢🟢🟢🟢🟢

🇵🇰 *PAKISTAN ZINDABAD!* 🇵🇰
*Happy Independence Day!*

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(flagArt);
});

// ============================================================
// 3. PAKISTAN HISTORY QUIZ GAME
// ============================================================
cmd({
    pattern: "azadiquiz",
    alias: ["pakquiz", "historyquiz"],
    desc: "Random Pakistan History Quiz Game",
    category: "azadi",
    react: "❓",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const quizList = [
        { q: "Pakistan ka Qaumi Taranah kis ne likha?", a: "Hafeez Jalandhari" },
        { q: "Pakistan ka pehla Capital konsa shehar tha?", a: "Karachi" },
        { q: "Quaid-e-Azam ki tareekh-e-paidaish kya hai?", a: "25 December 1876" },
        { q: "Pakistan ka Qaumi Parinda (National Bird) konsa hai?", a: "Chakor" },
        { q: "K2 Pahad ki unchai kitni hai?", a: "8,611 Meters" }
    ];

    const random = quizList[Math.floor(Math.random() * quizList.length)];
    const quizMsg = `
❓ *PAKISTAN AZADI QUIZ* 🇵🇰

*Sawal:* ${random.q}

*Jawab:* _(Apne dimaag me sochein ya reply karein!)_
|| *Answer:* ${random.a} ||

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(quizMsg);
});

// ============================================================
// 4. AZADI SHAYARI / STATUS CARDS
// ============================================================
cmd({
    pattern: "azadishayari",
    alias: ["pakshayar", "14augustlines"],
    desc: "Get Patriotic Azadi Shayari",
    category: "azadi",
    react: "💚",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const lines = [
        "Watan ki mitti se ishq hai humko,\nYeh sarzameen hamari jaan hai! 🇵🇰💚",
        "Parcham-e-sitara-o-hilal rehbar hai humara,\nYeh watan hamein apni jaan se pyara hai! ✨",
        "Dil se niklegi na mar kar bhi watan ki ulfat,\nMeri mitti se bhi khushboo-e-wafa aaye gi! 🇵🇰"
    ];
    const chosen = lines[Math.floor(Math.random() * lines.length)];
    await reply(`💚 *AZADI SHAYARI* 🇵🇰\n\n${chosen}\n\n> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐌𝐔𝐁𝐀𝐑𝐀𝐊*`);
});

// ============================================================
// 5. NEW 100+ JASHAN-E-AZADI COMMANDS LIST MENU (.new100azadi)
// ============================================================
cmd({
    pattern: "new100azadi",
    alias: ["azadimenu100", "azadilist"],
    desc: "Display 100+ New Jashan-e-Azadi Commands",
    category: "azadi",
    react: "🇵🇰",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const newMenu = `
🇵🇰 *𝟏𝟎𝟎+ 𝐍𝐄𝐖 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 (𝟏𝟒 𝐀𝐔𝐆𝐔𝐒𝐓) 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒* 🇵🇰

*=== 💚 AZADI SPECIAL & COUNTDOWN (1 - 20) ===*
│❀ .azadicountdown - Days left until 14th August
│❀ .makeflag - Green & White ASCII Flag Art
│❀ .azadiquiz - Interactive Pakistan History Game
│❀ .azadishayari - Top 14 August Patriotic Poetry
│❀ .greendp - Green Flag WhatsApp Profile Maker
│❀ .azadicard - Custom Name 14 August Greeting Card
│❀ .pakmotto - Unity, Faith, Discipline status
│❀ .resolutions1940 - 23rd March History facts
│❀ .freedomheroes - List of 1947 Freedom Fighters
│❀ .azadicartoon - Animated Green Flag wishes
│❀ .greenlight - Azadi Buildings Decoration Info
│❀ .pakistanmap - Map of Pakistan geographical facts
│❀ .flagcode - Rules to respect Pakistan Flag
│❀ .azadiparade - 14 August Military Parade schedule
│❀ .airshow - PAF aerobatics team details
│❀ .azadifireworks - Major fireworks locations
│❀ .march1947 - Day-by-day 1947 Partition timeline
│❀ .quaidaddress - Quaid's 11th August Speech
│❀ .azadislogan - Popular Desi Azadi Slogans
│❀ .pakistanat80 - Vision & Future Predictions

*=== 🇵🇰 NATIONAL SYMBOLS & PRIDE (21 - 40) ===*
│❀ .nationalflower - Jasmine / Chambeli details
│❀ .nationalanimal - Markhor conservation status
│❀ .nationalbird - Chakor heritage story
│❀ .nationaljuice - Sugarcane / Ganne ka ras
│❀ .nationaltree - Deodar tree details
│❀ .nationalsport - Field Hockey history & medals
│❀ .nationalmonument - Pakistan Monument ISB guide
│❀ .babepakistan - Babe-e-Pakistan Lahore monument
│❀ .shakarparian - Islamabad Viewpoint story
│❀ .rohtasfort - Sher Shah Suri Fort history
│❀ .taxilaruins - Ancient Gandhara civilization
│❀ .mohenjodaro - Indus Valley Civilization facts
│❀ .harappa - Harappan culture details
│❀ .khyberpass - Historic trade gate info
│❀ .wagahborder - Flag Lowering Ceremony timings
│❀ .gawadarport - CPEC & Deep sea port facts
│❀ .makranhighway - Coastal Highway guide
│❀ .saifulmuluk - Lake Saiful Muluk fairy tale
│❀ .hunzavalley - Long life Secrets of Hunza
│❀ .swatbeauty - Switzerland of Pakistan

*=== 🎵 AZADI MUSIC & MILLI NAGHMAY (41 - 60) ===*
│❀ .dildilpakistan - Vital Signs Song Lyrics
│❀ .jashneazadi - Jashan-e-Azadi OST
│❀ .sohnidharti - Shahnaz Begum Heritage Song
│❀ .isparcham - Benjamin Sisters Classic
│❀ .jazbajunoon - Rock Patriotic Track
│❀ .humzinda - Classic 1980s Naghma
│❀ .yewatan - Mehdi Hassan Golden Voice
│❀ .ayerah-e-haq - Tribute to Martyrs
│❀ .tuzaama - Pashto Patriotic Naghma
│❀ .pakistansuperstar - Coke Studio Special
│❀ .haijazba - Cricket & Nation Anthem
│❀ .khayalrakhna - Alamgir & Benjamin Sisters
│❀ .mainbhipakistan - Children's National Song
│❀ .apniazadi - Classic Independence Track
│❀ .watan-e-aziz - Urdu Milli Naghma MP3
│❀ .junoonse - Coke Studio Azadi Special
│❀ .zindabadpakistan - New Era Rap Anthem
│❀ .azadisingers - Top Patriotic Artists
│❀ .naghmagenerator - Random Patriotic Track
│❀ .azadiringtone - Download Green Tones

*=== 🕌 ISLAMIC & DESI AZADI CELEBRATIONS (61 - 80) ===*
│❀ .azadidua - Special Dua for Country's Peace
│❀ .azadiwishes - Urdu & English WhatsApp Messages
│❀ .azadiquote - Famous Pakistani Thinkers Quotes
│❀ .azadiroast - Light Azadi-themed Desi Fun
│❀ .azadichaye - 14 August Special Doodh Patti
│❀ .azadibiryani - Green Rice / Azadi Food Recipes
│❀ .azadiattire - Green & White Shalwar Kameez trends
│❀ .azadibadges - Metal Badges & Flags Guide
│❀ .azadisilencer - Pindi Boys Silencer Ban Status
│❀ .azadibike - 14 August Bike Decoration memes
│❀ .azadimehendi - Green Henna Designs for Girls
│❀ .azadifacepaint - Face Painting stalls near you
│❀ .azadishoppingsale - 14 August Discount Deals
│❀ .azadiisb - Islamabad Celebration Spots
│❀ .azadikhi - Sea View Karachi Festivities
│❀ .azadilhr - Liberty Chowk Lahore Gathering
│❀ .azadipsh - Peshawar Qissa Khwani Fest
│❀ .azadiqta - Quetta Independence Rallies
│❀ .azadisdr - Muzaffarabad / AJK Celebrations
│❀ .azadigt - Gilgit Baltistan Green Pride

*=== 🏏 PAKISTAN HEROES & RECORDS (81 - 100) ===*
│❀ .1947heroes - Quaid, Liaquat, Fatima Jinnah
│❀ .1965heroes - MM Alam & Major Raja Aziz Bhatti
│❀ .1971heroes - Rashid Minhas (NH) Story
│❀ .1999heroes - Captain Karnal Sher Khan (NH)
│❀ .siachenheroes - Soldiers at World's Highest Battlefield
│❀ .edhitribute - World's Largest Volunteer Ambulance Service
│❀ .arshadnadeem - Olympic Gold Medalist Javelin Record
│❀ .saminabaig - First Pakistani Woman on Mount Everest
│❀ .namirasalim - First Pakistani in Space
│❀ .malala - Youngest Nobel Laureate
│❀ .drabdus-salam - Physics Nobel Laureate
│❀ .laraibatta - VFX Artist & Pride of Pakistan
│❀ .sharmeen - Oscar Winning Documentary Maker
│❀ .squashlegends - Jahangir Khan 555 Match Streak
│❀ .jansherkhan - 8-Time World Open Champion
│❀ .babarrecord - Fastest 19 ODI Centuries Record
│❀ .shoaibrecord - Fastest Ball in Cricket History (161.3 kph)
│❀ .pakistanrecords - Guinness World Records held by Pakistan
│❀ .greenwall - Tree Plantation Record (10 Billion Tree Tsunami)
│❀ .pakistanzindabad - Grand Finale Salute Command

> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐌𝐔𝐁𝐀𝐑𝐀𝐊 𝐁𝐘 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃* 🇵🇰
`;
    await reply(newMenu);
});
