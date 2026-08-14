import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ============================================================
// 1. DYNAMIC AZADI PROFILE CARD GENERATOR (.azadidp)
// ============================================================
cmd({
    pattern: "azadidp",
    alias: ["greenprofile", "azadicardmaker"],
    desc: "Generate a custom 14 August text profile badge",
    category: "pakistan",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { sender, reply, from }) => {
    const username = sender.split('@')[0];
    const card = `
🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢
🟢  *𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝟐𝟎𝟐𝟔*  🟢
🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢

  👤 *Name:* @${username}
  🇵🇰 *Status:* Proud Pakistani
  ⭐ *Badge:* Crescent & Star VIP
  ✨ *Message:* Dil Dil Pakistan!

🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢
> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await conn.sendMessage(from, { text: card, mentions: [sender] }, { quoted: mek });
});

// ============================================================
// 2. PARIZAAD DEEP DIALOGUES & SHAYARI (.parizaad)
// ============================================================
cmd({
    pattern: "parizaad",
    alias: ["parizaadlines"],
    desc: "Famous Parizaad Drama Dialogues",
    category: "pakistan",
    react: "🥀",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const dialogues = [
        "“Log shakal dekhte hain, hum dil dekhte hain... Shayad isi liye har dafa dhoka khate hain.” 🥀",
        "“Main toh wahan se bhi khamosh guzar gaya, jahan mera bolna bohot zaroori tha.” 🖤",
        "“Badsoorati insaan ke chehre me nahi, dekhne wale ki nazar me hoti hai.” ✨"
    ];
    const selected = dialogues[Math.floor(Math.random() * dialogues.length)];
    await reply(`🥀 *PARIZAAD DIALOGUE:*\n\n${selected}\n\n> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*`);
});

// ============================================================
// 3. LAHORI vs KARACHIITE BENCHMARK (.citybattle)
// ============================================================
cmd({
    pattern: "citybattle",
    alias: ["lahorevskarachi", "biryanivspaye"],
    desc: "Karachi vs Lahore friendly debate facts",
    category: "pakistan",
    react: "⚔️",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
⚔️ *KARACHI VS LAHORE BATTLE* 🇵🇰

🌊 *KARACHI (City of Lights):*
• World's best Biryani 🍚
• Sea View & Sea breeze 🌊
• Non-stop Hustle & Business Hub 💼

🌸 *LAHORE (City of Gardens):*
• Siri Paye & Food Street Delights 🍲
• Rich Mughal History & Monuments 🏰
• "Jinhe Lahore Ni Dekhya O Janmya Ni!" ❤️

*Verdict:* Both cities are the heartbeat of Pakistan! 🇵🇰

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 4. BIRYANI ELAICHI FINDER GAME (.elaichi)
// ============================================================
cmd({
    pattern: "elaichi",
    alias: ["biryanigame"],
    desc: "Test if you get Elaichi in your Biryani",
    category: "pakistan",
    react: "🍚",
    filename: __filename
}, async (conn, mek, m, { sender, reply, from }) => {
    const outcomes = [
        "❌ *OH NO!* Aapke pehle hi luqme me Elaichi aa gayi! Mood kharab! 😭",
        "✅ *SAFE!* Aapko aaloo aur juicy boti mili! Enjoy karein! 🍖😋",
        "⚠️ *WARNING!* Elaichi aapke chawal ke niche chhuphi hui hai, dhyan se! 🙈"
    ];
    const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    await conn.sendMessage(from, { 
        text: `🍚 *BIRYANI ELAICHI TEST* 🍚\n\n@${sender.split('@')[0]}\n${randomOutcome}\n\n> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*`, 
        mentions: [sender] 
    }, { quoted: mek });
});

// ============================================================
// 5. CPEC & GWADAR PORT FACTS (.cpec)
// ============================================================
cmd({
    pattern: "cpec",
    alias: ["gwadar", "cpecinfo"],
    desc: "CPEC & Gwadar Economic Corridor Info",
    category: "pakistan",
    react: "⚓",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
⚓ *CPEC & GWADAR PORT FACTS* 🇵🇰

• *Full Form:* China-Pakistan Economic Corridor
• *Gwadar:* Deepest warm-water seaport in the region
• *Trade Route:* Connects Kashgar (China) to Gwadar Port (Pakistan)
• *Impact:* Game changer for Asian trade & Pakistan economy! 📈

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 6. PAKISTANI PASHTO TAPPE (.pashto)
// ============================================================
cmd({
    pattern: "pashto",
    alias: ["pashtotappe"],
    desc: "Pashto Cultural Tappe & Meaning",
    category: "pakistan",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
🎵 *PASHTO CULTURAL TAPPE* 🇵🇰

*Tappe:*
"Pa Toro Stargo De Ohawal Mashro..."

*Urdu Meaning:*
"Teri kaali aankhon ke teer ne dil ko zakhmi kar diya..."

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 7. SINDHI AJRAK & CAP CULTURE (.sindhi)
// ============================================================
cmd({
    pattern: "sindhi",
    alias: ["ajrak", "sindhiculture"],
    desc: "Sindhi Culture & Ajrak History",
    category: "pakistan",
    react: "🧣",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
🧣 *SINDHI AJRAK & CULTURAL DAY* 🇵🇰

• *Ajrak:* Ancient block-printed shawl symbolising respect & hospitality.
• *Sindhi Topi:* Traditional embroidered cap with mirror work.
• *Culture Day:* Celebrated annually with Ekta & Unity dances! ✨

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 8. BALOCHI CULTURE & EMBROIDERY (.balochi)
// ============================================================
cmd({
    pattern: "balochi",
    alias: ["balochiculture", "sajji"],
    desc: "Balochi Culture & Famous Food",
    category: "pakistan",
    react: "🍖",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
🍖 *BALOCHI CULTURE & FOOD* 🇵🇰

• *Balochi Sajji:* Traditional roasted lamb/chicken dish on wooden sticks.
• *Pashk Dress:* Heavy traditional hand-embroidered Balochi dress.
• *Hospitality:* Renowned for unmatched bravery & guest honor! ❤️

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 9. HUNZA VALLEY LONGEVITY SECRETS (.hunza)
// ============================================================
cmd({
    pattern: "hunza",
    alias: ["hunzavalley"],
    desc: "Secrets of Hunza people's long life",
    category: "pakistan",
    react: "🏔️",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
🏔️ *SECRETS OF HUNZA VALLEY* 🇵🇰

• *Lifespan:* Hunza people frequently live up to 100-120 years!
• *Secret Diet:* Fresh glacial water, dried apricots, and organic walnuts.
• *Lifestyle:* Daily mountain walking and active community living.

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 10. PAKISTAN TRUCK ART HERITAGE (.truckart)
// ============================================================
cmd({
    pattern: "truckart",
    alias: ["desitruck", "phoolpatti"],
    desc: "Famous Pakistani Truck Art Poetry",
    category: "pakistan",
    react: "🚛",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const quotes = [
        "🚛 “Dekh Magar Pyar Se!” 💖",
        "🚛 “Horn De Kar Aage Niklein, Fast & Furious Not Allowed!” ⚠️",
        "🚛 “Fasla Rakhein, Warna Pyar Ho Jayega!” 😂"
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    await reply(`🚛 *PAKISTANI TRUCK ART POETRY:*\n\n${randomQuote}\n\n> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*`);
});

// ============================================================
// 11. KHANUM / BIKER PINDI BOY CHECK (.pindiboy)
// ============================================================
cmd({
    pattern: "pindiboy",
    alias: ["wheeliecheck"],
    desc: "Check Pindi Boy Percentage",
    category: "pakistan",
    react: "🏍️",
    filename: __filename
}, async (conn, mek, m, { sender, reply, from }) => {
    const score = Math.floor(Math.random() * 101);
    const text = `
🏍️ *PINDI BOY METER* 🏍️

👤 *User:* @${sender.split('@')[0]}
📊 *Pindi Boy Score:* ${score}%
✨ *Status:* ${score > 70 ? "CD-70 Single Wheelie Expert! 🏁" : "Normal Rider 🛵"}

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await conn.sendMessage(from, { text, mentions: [sender] }, { quoted: mek });
});

// ============================================================
// 12. PHUPPHO CONSPIRACY METER (.phuppho)
// ============================================================
cmd({
    pattern: "phuppho",
    alias: ["phupphorating"],
    desc: "Check Phuppho Drama Rating",
    category: "pakistan",
    react: "🐍",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const score = Math.floor(Math.random() * 101);
    await reply(`🐍 *PHUPPHO CONSPIRACY RATING:* ${score}%\n\n> *Verdict:* ${score > 50 ? "Ghar me phadda hone wala hai! 🙈" : "Aaj shanti hai! 🕊️"}\n\n> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*`);
});

// ============================================================
// 13. K-ELECTRIC / WAPDA LOADSHEEDING STATUS (.loadshedding)
// ============================================================
cmd({
    pattern: "loadshedding",
    alias: ["bijli", "lightkabayegi"],
    desc: "Desi Loadshedding predictor",
    category: "pakistan",
    react: "💡",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const statuses = [
        "⚡ Feeder Tripped! Light 2 ghante baad aaye gi. Ups pe chalayein! 🔋",
        "⚡ Light aane wali thi par Transformer blasting ho gayi! 😭",
        "✅ Kismat acchi hai, Bill bhara tha toh light chal rahi hai! 💡"
    ];
    const choice = statuses[Math.floor(Math.random() * statuses.length)];
    await reply(`💡 *LOADSHEEDING STATUS:*\n\n${choice}\n\n> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*`);
});

// ============================================================
// 14. NUSRAT FATEH ALI KHAN QAWWALI QUOTES (.qawwali)
// ============================================================
cmd({
    pattern: "qawwali",
    alias: ["nfak", "nusrat"],
    desc: "Nusrat Fateh Ali Khan Iconic Lines",
    category: "pakistan",
    react: "🎶",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const lines = [
        "🎶 “Yeh jo halka halka suroor hai, yeh teri nazar ka qusoor hai...” 🎶",
        "🎶 “Sochta hoon ke woh kitne masoom the, kya se kya ho gaye dekhte dekhte...” 🎶",
        "🎶 “Tumhein dillagi bhool jaani padegi, mohabbat ki raahon mein aakar toh dekho...” 🎶"
    ];
    const pick = lines[Math.floor(Math.random() * lines.length)];
    await reply(`🎶 *NFAK LEGENDARY LINES:*\n\n${pick}\n\n> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*`);
});

// ============================================================
// 15. PAKISTANI VINTAGE CINEMA & LOLLEYWOOD (.lollywood)
// ============================================================
cmd({
    pattern: "lollywood",
    alias: ["pakcinema"],
    desc: "Golden Era of Lollywood Cinema",
    category: "pakistan",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
🎬 *GOLDEN ERA OF LOLLYWOOD* 🇵🇰

• *Classics:* Maula Jatt (1979), Armaan (1966), Aina (1977)
• *Legends:* Sultan Rahi, Waheed Murad, Zeba, Nadeem Baig, Mustafa Qureshi
• *Modern Revival:* The Legend of Maula Jatt (Highest Grossing Movie) 💥

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 16. SHAHID AFRIDI BOOM BOOM MOMENTS (.boom)
// ============================================================
cmd({
    pattern: "boom",
    alias: ["afridi102", "boomboom"],
    desc: "Shahid Afridi World Record 37-Ball Century",
    category: "pakistan",
    react: "💥",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
💥 *BOOM BOOM SHAHID AFRIDI* 🇵🇰🏏

* Record:* 37-Ball Fastest ODI Century vs Sri Lanka (1996)
* Bat Used:* Borrowed from Waqar Younis!
* Sixes Hit:* 11 Monster Sixes! 💥

*“ Shahid Afridi comes, Shahid Afridi hits! ”*

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀RAN-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 17. SIKANDAR / DESI FRIENDS COMPATIBILITY (.dosti)
// ============================================================
cmd({
    pattern: "dosti",
    alias: ["friendshipmeter"],
    desc: "Calculate Desi Friendship Level",
    category: "pakistan",
    react: "🤝",
    filename: __filename
}, async (conn, mek, m, { sender, reply, from, quoted }) => {
    if (!quoted) return reply("❌ Please reply to a friend's message to test Dosti level!");
    const score = Math.floor(Math.random() * 101);
    const card = `
🤝 *DESI DOSTI METER* 🤝

👥 *Friend 1:* @${sender.split('@')[0]}
👥 *Friend 2:* @${quoted.sender.split('@')[0]}
📊 *Bonding Level:* ${score}%

✨ *Status:* ${score > 80 ? "Jai-Veeru Level Yaari! ☕" : "Kalti Marne Wale Dost 🙈"}

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await conn.sendMessage(from, { text: card, mentions: [sender, quoted.sender] }, { quoted: mek });
});

// ============================================================
// 18. PAKISTAN DEFENSE DAY 6TH SEPTEMBER (.defense)
// ============================================================
cmd({
    pattern: "defense",
    alias: ["6september", "paknavy"],
    desc: "6th September Defense Day Heroics",
    category: "pakistan",
    react: "🪖",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
🪖 *PAKISTAN DEFENSE DAY (6TH SEPTEMBER)* 🇵🇰

*“ Meredi Zindagi Pakistan Ke Naam ”*

• Tribute to MM Alam (Downed 5 Indian jets in under a minute!)
• Tribute to Major Raja Aziz Bhatti Shaheed (Nishan-e-Haider)
• Salute to Armed Forces standing strong for our sovereignty! 🫡

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 19. PAKISTAN RAILWAYS TRAIN ADVENTURE (.traininfo)
// ============================================================
cmd({
    pattern: "traininfo",
    alias: ["pakrailway", "greenline"],
    desc: "Famous Pakistan Express Trains",
    category: "pakistan",
    react: "🚂",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
🚂 *FAMOUS PAKISTAN EXPRESS TRAINS* 🇵🇰

1. *Green Line Express:* Islamabad ⇌ Karachi (VIP Service)
2. *Tezgam:* Rawalpindi ⇌ Karachi
3. *Karakoram Express:* Lahore ⇌ Karachi
4. *Khyber Mail:* Peshawar ⇌ Karachi (Historic Line)

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 20. GRAND AZADI REVOLUTION FINALE (.pakistan2026)
// ============================================================
cmd({
    pattern: "pakistan2026",
    alias: ["visionpakistan"],
    desc: "Vision 2026 Patriotic Salute",
    category: "pakistan",
    react: "🇵🇰",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
🇵🇰 *PAKISTAN VISION 2026 & BEYOND* 🇵🇰

🟩🟩🟩🟩⬜⬜⬜🟩🟩🟩🟩
🟩🟩🟩🌙⭐⬜⬜🟩🟩🟩🟩
🟩🟩🟩🟩⬜⬜⬜🟩🟩🟩🟩

*“ Shining Green in Science, Tech, Sports & Unity ”*

May Pakistan flourish with stability, peace, and eternal strength! Aameen! 🤲✨

> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐌𝐔𝐁𝐀𝐑𝐀𝐊 𝐁𝐘 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃* 💚
`;
    await reply(text);
});
