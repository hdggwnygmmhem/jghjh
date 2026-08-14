import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ============================================================
// 1. QAUMI TARANAH (National Anthem Lyrics)
// ============================================================
cmd({
    pattern: "taranah",
    alias: ["anthem", "qaumitaranah"],
    desc: "National Anthem of Pakistan with translation",
    category: "pakistan",
    react: "📜",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const anthem = `
📜 *PAKISTAN NATIONAL ANTHEM (قومی ترانہ)* 🇵🇰

Pak sarzameen shad bad
Kishwar-e-haseen shad bad
Tu nishan-e-azm-e-aali shan
Arz-e-Pakistan!
Markaz-e-yaqeen shad bad.

Pak sarzameen ka nizam
Quwwat-e-ukhuwwat-e-awam
Qaum, mulk, saltanat
Painda tabinda bad!
Shad bad manzil-e-murad.

Parcham-e-sitara-o-hilal
Rehbar-e-taraqqi-o-kamal
Targuman-e-maazi, shan-e-hal
Jan-e-istaqbal!
Saaya-e-Khuda-e-Zuljalal.

✍️ *Writer:* Hafeez Jalandhari
🎵 *Composer:* Ahmed Ghulam Ali Chagla

> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐒𝐏𝐄𝐂𝐈𝐀𝐋*
`;
    await reply(anthem);
});

// ============================================================
// 2. RANDOM AZADI WISH GENERATOR
// ============================================================
cmd({
    pattern: "azadiwish",
    alias: ["wish14aug", "azadigreeting"],
    desc: "Generate custom 14 August wishes",
    category: "pakistan",
    react: "🎉",
    filename: __filename
}, async (conn, mek, m, { sender, reply, from }) => {
    const wishes = [
        "Aapko aur aapki family ko 14 August Jashan-e-Azadi bohot bohot Mubarak ho! 💚",
        "Parcham-e-sitara-o-hilal hamesha ooncha rahe! Happy Independence Day! 🇵🇰✨",
        "Watan se mohabbat hamari pehchan hai. 14 August Mubarak! 💚🌿",
        "Allah hamare watan Pakistan ko har aafat se mehfooz rakhe. Aameen! 🤲🇵🇰"
    ];
    const randomWish = wishes[Math.floor(Math.random() * wishes.length)];
    const card = `
🎉 *14 AUGUST SPECIAL WISH* 🎉

Dear @${sender.split('@')[0]},
${randomWish}

> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐌𝐔𝐁𝐀𝐑𝐀𝐊*
`;
    await conn.sendMessage(from, { text: card, mentions: [sender] }, { quoted: mek });
});

// ============================================================
// 3. PAKISTAN EMERGENCY HELPLINE NUMBERS
// ============================================================
cmd({
    pattern: "pakhelpline",
    alias: ["helpline", "emergencypak"],
    desc: "Important Pakistan Emergency Numbers",
    category: "pakistan",
    react: "🚨",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const helplines = `
🚨 *PAKISTAN EMERGENCY HELPLINE NUMBERS* 🇵🇰

🚑 *Edhi Ambulance:* 115
🚑 *Chhipa Ambulance:* 1020
🚑 *Rescue 1122:* 1122
🚓 *Police Emergency:* 15
🛣️ *Motorway Police:* 130
🔥 *Fire Brigade:* 16
🛡️ *Rangers Helpline:* 1101
☎️ *PTA Complaints:* 0800-55055

> *🇵🇰 𝐊𝐀𝐌RAN-𝐌𝐃*
`;
    await reply(helplines);
});

// ============================================================
// 4. DESI BURGER METER (Check how burger someone is)
// ============================================================
cmd({
    pattern: "burgermeter",
    alias: ["burgercheck", "isburger"],
    desc: "Check Burger level in percentage",
    category: "pakistan",
    react: "🍔",
    filename: __filename
}, async (conn, mek, m, { sender, reply, from }) => {
    const percentage = Math.floor(Math.random() * 101);
    let status = "";
    if (percentage > 80) status = "Full Defense/Gulberg Burger! 🥑";
    else if (percentage > 50) status = "Half Burger, Half Desi 🥪";
    else status = "Karak Doodh Patti Lover (Pure Desi) ☕";

    const msg = `
🍔 *DESI BURGER METER* 🍔

👤 *User:* @${sender.split('@')[0]}
📊 *Burger Score:* ${percentage}%
✨ *Status:* ${status}

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await conn.sendMessage(from, { text: msg, mentions: [sender] }, { quoted: mek });
});

// ============================================================
// 5. EDHI TRIBUTE COMMAND
// ============================================================
cmd({
    pattern: "edhi",
    alias: ["abdulsattaredhi"],
    desc: "Tribute to Abdul Sattar Edhi",
    category: "pakistan",
    react: "🕊️",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const edhiText = `
🕊️ *HERO OF PAKISTAN: ABDUL SATTAR EDHI* 🕊️

*“ My religion is humanitarianism, which is the basis of every religion in the world. ”*

*  *Born:* 28 February 1928
*  *Died:* 8 July 2016
*  *Legacy:* Founder of Edhi Foundation (World's largest volunteer ambulance network)

A true legend and pride of Pakistan! ❤️🇵🇰

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(edhiText);
});

// ============================================================
// 6. PAKISTAN NATIONAL SYMBOLS INFO
// ============================================================
cmd({
    pattern: "paksymbols",
    alias: ["nationalsymbols"],
    desc: "All National Symbols of Pakistan",
    category: "pakistan",
    react: "🇵🇰",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const symbols = `
🇵🇰 *NATIONAL SYMBOLS OF PAKISTAN* 🇵🇰

🐐 *National Animal:* Markhor
🦜 *National Bird:* Chakor
🌸 *National Flower:* Jasmine (Chambeli)
🌳 *National Tree:* Deodar
🏏 *National Sport:* Field Hockey
🍹 *National Juice:* Sugarcane Juice (Ganne ka Ras)
🕌 *National Mosque:* Faisal Mosque, Islamabad

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(symbols);
});

// ============================================================
// 7. ARSHAD NADEEM TRIBUTE
// ============================================================
cmd({
    pattern: "arshadnadeem",
    alias: ["javelinhero"],
    desc: "Olympic Gold Medalist Record",
    category: "pakistan",
    react: "🥇",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
🥇 *NATIONAL HERO: ARSHAD NADEEM* 🇵🇰

* Record:* Olympic Gold Medalist in Javelin Throw
* Record Throw:* 92.97 Meters (Olympic Record)
* Pride:* First individual Gold Medal for Pakistan in 40 years!

*“ Pakistan Zindabad! ”* 🇵🇰✨

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 8. ALLAMA IQBAL KHUDI POETRY
// ============================================================
cmd({
    pattern: "khudi",
    alias: ["khudipoetry"],
    desc: "Allama Iqbal's Khudi Concept Poetry",
    category: "pakistan",
    react: "📖",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const poetry = `
📖 *ALLAMA IQBAL - KHUDI* 🇵🇰

خودی کو کر بلند اتنا کہ ہر تقدیر سے پہلے
خدا بندے سے خود پوچھے بتا تیری رضا کیا ہے!

Khudi ko kar buland itna ke har taqder se pehle
Khuda bande se khud pooche bata teri reza kya hai!

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(poetry);
});

// ============================================================
// 9. NISHAN-E-HAIDER HEROES LIST
// ============================================================
cmd({
    pattern: "nhheroes",
    alias: ["nishanehaider"],
    desc: "List of Nishan-e-Haider Recipients",
    category: "pakistan",
    react: "🎖️",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const list = `
🎖️ *NISHAN-E-HAIDER RECIPIENTS (PAK ARMY HEROES)* 🇵🇰

1. Captain Sarwar Shaheed
2. Major Tufail Muhammad Shaheed
3. Major Raja Aziz Bhatti Shaheed
4. Major Muhammad Akram Shaheed
5. Pilot Officer Rashid Minhas Shaheed
6. Major Shabbir Sharif Shaheed
7. Sowar Muhammad Hussain Shaheed
8. Lance Naik Muhammad Mahfuz Shaheed
9. Captain Karnal Sher Khan Shaheed
10. Havildar Lalak Jan Shaheed
11. Naik Saif Ali Janjua (Hilal-e-Kashmir)

> *🇵🇰 SALUTE TO OUR HEROES*
`;
    await reply(list);
});

// ============================================================
// 10. PAKISTAN PROVINCES & CAPITALS
// ============================================================
cmd({
    pattern: "provinces",
    alias: ["pakprovinces"],
    desc: "Pakistan Provinces & Capitals Guide",
    category: "pakistan",
    react: "🗺️",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
🗺️ *PAKISTAN PROVINCES & CAPITALS* 🇵🇰

🏙️ *Punjab:* Lahore
🌊 *Sindh:* Karachi
🏔️ *Khyber Pakhtunkhwa (KP):* Peshawar
🌵 *Balochistan:* Quetta
🏔️ *Gilgit-Baltistan:* Gilgit
🏞️ *Azad Jammu & Kashmir:* Muzaffarabad
🏛️ *Federal Capital:* Islamabad

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 11. PUNJABI JUGAT GENERATOR
// ============================================================
cmd({
    pattern: "jugat",
    alias: ["punjabijugat"],
    desc: "Funny Punjabi Jugat",
    category: "pakistan",
    react: "😂",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const jugats = [
        "Tu itna patla hai ke jeb me haath daalo toh ungli bahar nikal aati hai! 😂",
        "Teri shakal dekh kar lagta hai jaise charging pe laga ke phone bhool gaye ho! 🔋🤣",
        "Teri aawaaz itni baarik hai ke machhar bhi sun ke bolta hai: 'Bhai tu mere se seekh le!' 🦟"
    ];
    const j = jugats[Math.floor(Math.random() * jugats.length)];
    await reply(`😂 *PUNJABI JUGAT:*\n\n${j}\n\n> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*`);
});

// ============================================================
// 12. AMMI KE TAANAY GENERATOR
// ============================================================
cmd({
    pattern: "ammitaanay",
    alias: ["taanay"],
    desc: "Random Ammi Ke Taanay",
    category: "pakistan",
    react: "👵",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const taanay = [
        "Subah se shaam tak mobile me ghuse raho, bas yahi kaam hai tumhara! 📱",
        "Padosi ke betay ko dekho, 90% number laye hain aur ek tum ho! 🤦‍♂️",
        "Sona chhod do, koi ghar ke kaam me bhi haath bata diya karo! 🧹"
    ];
    const t = taanay[Math.floor(Math.random() * taanay.length)];
    await reply(`👵 *AMMI KA TAANA:*\n\n“${t}”\n\n> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*`);
});

// ============================================================
// 13. BABAR AZAM KING STATUS
// ============================================================
cmd({
    pattern: "babarazam",
    alias: ["kingbabar"],
    desc: "Babar Azam Stats & Tribute",
    category: "pakistan",
    react: "👑",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
👑 *KING BABAR AZAM* 🇵🇰🏏

* Role:* Right-handed Masterclass Batsman
* Status:* Pride of Pakistan Cricket
* Signature:* Magnificent Cover Drive 🏏✨

*“ Form is temporary, Class is permanent! ”*

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 14. SHAHEEN AFRIDI EAGLE STATUS
// ============================================================
cmd({
    pattern: "shaheen",
    alias: ["eagleshaheen"],
    desc: "Shaheen Afridi First Over Wicket King",
    category: "pakistan",
    react: "🦅",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
🦅 *SHAHEEN SHAH AFRIDI* 🇵🇰⚡

* Role:* Left-Arm Fast Bowler
* Specialty:* 1st Over In-swinging Yorker Specialist! 🏏
* Trademark:* Spread Wings Celebration 🦅

*“ First Over = Shaheen Special Wicket! ”*

> *🇵🇰 𝐊𝐀𝐌RAN-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 15. PSL TEAMS SELECTOR
// ============================================================
cmd({
    pattern: "pslteams",
    alias: ["pslfranchise"],
    desc: "List of PSL Franchises",
    category: "pakistan",
    react: "🏏",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const psl = `
🏏 *PAKISTAN SUPER LEAGUE (PSL) TEAMS* 🇵🇰

🟩 *Lahore Qalandars* - Main Hoon Qalandar
🟦 *Karachi Kings* - Yeh Hai Karachi
🟥 *Islamabad United* - United We Win
🟨 *Peshawar Zalmi* - Yellow Storm
🟪 *Quetta Gladiators* - Kai Kai Quetta
🟩 *Multan Sultans* - Sultan-e-Multan

*Konsi team aapki favorite hai?*

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(psl);
});

// ============================================================
// 16. PAKISTAN MOUNTAINS FACTS
// ============================================================
cmd({
    pattern: "pakmountains",
    alias: ["k2facts"],
    desc: "Highest Peaks in Pakistan",
    category: "pakistan",
    react: "🏔️",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
🏔️ *TOP HIGHEST PEAKS IN PAKISTAN* 🇵🇰

1. *K2 (Savage Mountain):* 8,611m (2nd Highest in World)
2. *Nanga Parbat (Killer Mountain):* 8,126m (9th Highest)
3. *Gasherbrum I:* 8,080m (11th Highest)
4. *Broad Peak:* 8,051m (12th Highest)
5. *Gasherbrum II:* 8,035m (13th Highest)

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 17. ZUBAIDA AAPA TOTKAY
// ============================================================
cmd({
    pattern: "totkay",
    alias: ["zubaidaaapa"],
    desc: "Random Household Desi Totkay",
    category: "pakistan",
    react: "💡",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const totkay = [
        "Chaye ke daag hatane ke liye limbu (lemon) ka ras lagayein! 🍋",
        "Gala kharab ho toh garm paani me namak daal kar garare karein! 🥛",
        "Cheentiyaan (ants) door bhagane ke liye pisa hua darcheeni powder chhidkein! 🐜"
    ];
    const t = totkay[Math.floor(Math.random() * totkay.length)];
    await reply(`💡 *DESI TOTKA (Zubaida Aapa):*\n\n${t}\n\n> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*`);
});

// ============================================================
// 18. PAKISTAN NATIONAL ANIMAL MARKHOR INFO
// ============================================================
cmd({
    pattern: "markhor",
    alias: ["nationalanimal"],
    desc: "Facts about Markhor",
    category: "pakistan",
    react: "🐐",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
🐐 *NATIONAL ANIMAL: MARKHOR* 🇵🇰

* Meaning:* 'Snake Eater' in Persian
* Specialty:* Spiral-shaped corkscrew horns
* Status:* Official Symbol of Pakistan's ISI & National Pride

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 19. PAKISTAN CITIES NICKNAMES
// ============================================================
cmd({
    pattern: "citynames",
    alias: ["citynicknames"],
    desc: "Famous Nicknames of Pakistani Cities",
    category: "pakistan",
    react: "🏙️",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const text = `
🏙️ *NICKNAMES OF PAKISTANI CITIES* 🇵🇰

🌆 *Karachi:* City of Lights
🌸 *Lahore:* City of Gardens
⛰️ *Islamabad:* Beautiful Capital
🌸 *Peshawar:* City of Flowers
🥭 *Multan:* City of Saints
🏭 *Faisalabad:* Manchester of Pakistan
🔨 *Sialkot:* City of Sports Goods

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await reply(text);
});

// ============================================================
// 20. GRAND finale PAKISTAN SALUTE COMMAND
// ============================================================
cmd({
    pattern: "paksalute",
    alias: ["salutepakistan", "pakistanzindabad"],
    desc: "Grand Patriotic Salute Message",
    category: "pakistan",
    react: "🫡",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const salute = `
🫡 *SALUTE TO THE ISLAMIC REPUBLIC OF PAKISTAN* 🇵🇰

🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩
🟩🟩🟩🟩🌙⭐🟩🟩🟩🟩🟩
🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩

*“ Hum hain Is Parcham Ke Saaye Tale Ek! ”*

* PAKISTAN ZINDABAD! 🇵🇰
* PAK ARMY PAINDABAD! 🪖
* JASHAN-E-AZADI MUBARAK! 🟢✨

> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐌𝐔𝐁𝐀𝐑𝐀𝐊 𝐁𝐘 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃* 💚
`;
    await reply(salute);
});
