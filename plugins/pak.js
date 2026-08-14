import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ==========================================
// 1. MAIN 14 AUGUST & PAKISTAN EXCLUSIVE COMMANDS
// ==========================================

// 1. .14august
cmd({
    pattern: "14august",
    alias: ["azadi", "independenceday", "jashneazadi"],
    desc: "14 August Independence Day Celebration Wish",
    category: "pakistan",
    react: "🇵🇰",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    const wish = `
🇵🇰 *𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐌𝐔𝐁𝐀𝐑𝐀𝐊!* 🇵🇰

*“ Dil Dil Pakistan, Jan Jan Pakistan ”*

HAPPY INDEPENDENCE DAY TO ALL PAKISTANIS! 💚✨

*  *Date:* 14th August
*  *Nation:* Islamic Republic of Pakistan
*  *Special Wish for:* @${sender.split('@')[0]}

Allah hamare pyare watan Pakistan ko hamesha qaim-o-daim rakhe, amno aman aur taraqee ata farmaye. Aameen! 🤲💚

> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐌𝐔𝐁𝐀𝐑𝐀𝐊 𝐁𝐘 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃* 💚
`;
    await conn.sendMessage(from, { text: wish, mentions: [sender] }, { quoted: mek });
});

// 2. .quaidsayings
cmd({
    pattern: "quaidsayings",
    alias: ["quaidquote", "jinnahsayings"],
    desc: "Quaid-e-Azam Muhammad Ali Jinnah Quotes",
    category: "pakistan",
    react: "🇵🇰",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const quotes = [
        "“With faith, discipline and selfless devotion to duty, there is nothing that you cannot achieve.”",
        "“Think a hundred times before you take a decision, but once that decision is taken, stand by it as one man.”",
        "“Failure is a word unknown to me.”",
        "“There are two powers in the world; one is the sword and the other is the pen.”",
        "“Work, work and work and we are bound to succeed.”"
    ];
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    await reply(`🇵🇰 *Quaid-e-Azam Said:*\n\n${q}\n\n> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*`);
});

// 3. .iqbalpoetry
cmd({
    pattern: "iqbalpoetry",
    alias: ["iqbal", "muffakir"],
    desc: "Allama Iqbal National Poetry",
    category: "pakistan",
    react: "📖",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const poetry = [
        "Khudi ko kar buland itna ke har taqder se pehle\nKhuda bande se khud pooche bata teri reza kya hai! 📖",
        "Tondhi-e-baad-e-mukhalif se na ghabra aye uqaab\nYeh toh chalti hai tujhe ooncha udate ke liye! ✨",
        "Nahi hai na-umeed iqbal apni kisht-e-veeran se\nZara nam ho toh yeh mitti bohot zarkhez hai saqi! 🇵🇰"
    ];
    const p = poetry[Math.floor(Math.random() * poetry.length)];
    await reply(`📖 *Allama Iqbal Shayari:*\n\n${p}\n\n> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*`);
});

// 4. .pakflag
cmd({
    pattern: "pakflag",
    alias: ["greenflag", "flagpak"],
    desc: "Pakistani Flag Pride Status",
    category: "pakistan",
    react: "🇵🇰",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    await reply(`🇵🇰 *SAB SE PEHLE PAKISTAN!* 🇵🇰\n\n🟩 White: Minorities & Peace\n🟩 Green: Muslim Majority & Growth\n🌙 Crescent: Progress\n⭐ Star: Light and Knowledge\n\n> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*`);
});

// 5. .azadisong
cmd({
    pattern: "azadisong",
    alias: ["milli_naghma", "national_song"],
    desc: "Famous Pakistani Milli Naghmay List",
    category: "pakistan",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const naghmay = `
🎵 *TOP PAKISTANI MILLI NAGHMAY* 🎵

1. Dil Dil Pakistan - Vital Signs
2. Aye Rah-e-Haq Ke Shaheedo - Noor Jehan
3. Sohni Dharti Allah Rakhe - Shahnaz Begum
4. Is Parcham Ke Saaye Tale - Benjamin Sisters
5. Jazba Junoon - Junoon Band
6. Hum Zinda Qaum Hain - Various Artists
7. Ye Watan Tumhara Hai - Mehdi Hassan

> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐒𝐏𝐄𝐂𝐈𝐀𝐋*
`;
    await reply(naghmay);
});

// 6. .desiroast
cmd({
    pattern: "desiroast",
    alias: ["pakroast", "roastpak"],
    desc: "Pakistani Style Light Roast",
    category: "pakistan",
    react: "🔥",
    filename: __filename
}, async (conn, mek, m, { reply, quoted, sender }) => {
    const target = quoted ? quoted.sender : sender;
    const roasts = [
        "Aapka dimaag aur Loadshedding ka schedule ek jaisa hai... jab zaroorat ho tab gayab! ⚡",
        "Aap itne silent ho jaise Biryani me se Elaichi nikal aayi ho! 🍚",
        "Aapki baat sun kar lagta hai aapko Velo ki सख्त zaroorat hai! 🙈"
    ];
    const r = roasts[Math.floor(Math.random() * roasts.length)];
    await reply(`🔥 @${target.split('@')[0]} ${r}`);
});

// 7. .chaye
cmd({
    pattern: "chaye",
    alias: ["chai", "doodhpatti"],
    desc: "Pakistani Chaye Culture Quotes",
    category: "pakistan",
    react: "☕",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    await reply(`☕ *PAKISTANI CHAYE LOVERS* ☕\n\n“Ek tera khayal aur ek pyali chaye...\nBas itni si duniya hai meri!” ❤️\n\n> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*`);
});

// 8. .rishtaprofile
cmd({
    pattern: "rishtaprofile",
    alias: ["desirishta", "rishta"],
    desc: "Pakistani Rishta Aunty Profile Generator",
    category: "pakistan",
    react: "💍",
    filename: __filename
}, async (conn, mek, m, { sender, reply, from }) => {
    const card = `
💍 *DESI PAKISTANI RISHTA CARD* 💍

👤 *Candidate:* @${sender.split('@')[0]}
💼 *Job:* VIP Loadshedding Inspector
✨ *Expertise:* Biryani me se elaichi dhoondna
📍 *Demand:* Ek cup karak chaye subah sham!

> *🇵🇰 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃*
`;
    await conn.sendMessage(from, { text: card, mentions: [sender] }, { quoted: mek });
});


// ==========================================
// 2. 100 EXCLUSIVE PAKISTANI COMMANDS MENU (.100pak)
// ==========================================

cmd({
    pattern: "100pak",
    alias: ["pak100", "14augustmenu"],
    desc: "Display 100+ Exclusive Pakistani Commands",
    category: "pakistan",
    react: "🇵🇰",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const menu = `
🇵🇰 *𝟏𝟎𝟎+ 𝐄𝐗𝐂𝐋𝐔𝐒𝐈𝐕𝐄 𝐏𝐀𝐊𝐈𝐒𝐓𝐀𝐍𝐈 𝐁𝐎𝐓 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒* 🇵🇰
*(Dedicated to 14 August Independence Day & Desi Culture)*

*=== 💚 14 AUGUST & NATIONAL PRIDE (1 - 20) ===*
│❀ .14august - Jashan-e-Azadi Mubarak wish
│❀ .quaidsayings - Quaid-e-Azam Golden Words
│❀ .iqbalpoetry - Allama Iqbal Kalam
│❀ .pakflag - Green & White Flag meaning
│❀ .azadisong - Top Milli Naghmay list
│❀ .pakistanhistory - 1947 Resolution & History
│❀ .minarepakistan - Minar-e-Pakistan Info
│❀ .faisalmosque - Islamabad Faisal Mosque facts
│❀ .badshahimosque - Lahore Heritage facts
│❀ .k2peak - K2 Mountain World Record Info
│❀ .nishanehaider - Army Gallantry Heroes list
│❀ .armypride - Pak Army Salute & Status
│❀ .airforce - PAF 1965 Heroics Info
│❀ .navypride - Pak Navy Guard status
│❀ .nationalanthem - Qaumi Taranah Lyrics
│❀ .nationalhero - Abdul Sattar Edhi tribute
│❀ .drqadeer - Father of Nuclear Pakistan Info
│❀ .fatimahjinnah - Madar-e-Millat Tribute
│❀ .liaquatali - First Prime Minister Info
│❀ .pakday - 23rd March Resolution Guide

*=== 🕌 ISLAMIC PAKISTAN (21 - 35) ===*
│❀ .urduquran - Quran Ayat with Urdu Translation
│❀ .urduhadith - Daily Sahih Hadith in Urdu
│❀ .paknamaz - Pakistan Major Cities Namaz Time
│❀ .karachinamaz - Karachi Prayer Schedule
│❀ .lahorenamaz - Lahore Prayer Schedule
│❀ .islnamaz - Islamabad Prayer Schedule
│❀ .pshnamaz - Peshawar Prayer Schedule
│❀ .qtanamaz - Quetta Prayer Schedule
│❀ .masnoondua - Daily Duas in Urdu
│❀ .urdunaat - Famous MP3 Naats List
│❀ .ramzanpak - Ramzan Sehar & Iftar Guide
│❀ .eidaladha - Eid Qurbani Status & Rules
│❀ .eidulfitr - Meethi Eid Mubarak Wishes
│❀ .jummah - Jummah Mubarak Urdu Quotes
│❀ .darood - Darood Sharif Benefits in Urdu

*=== 😂 DESI HUMOR, ROAST & DRAMA (36 - 65) ===*
│❀ .desiroast - Hilarious Desi Roast
│❀ .chaye - Karak Chaye Lover Shayari
│❀ .rishtaprofile - Desi Rishta Profile
│❀ .lateefay - Funniest Urdu Lateefay
│❀ .jugat - Authentic Punjabi Jugat
│❀ .chuss - Random Puns / Chuss Jokes
│❀ .biryani - Biryani vs Pulao Battle
│❀ .loadshedding - K-Electric / WAPDA Taanay
│❀ .ammitaanay - Ammi ke Mashhoor Taanay
│❀ .abbughussa - Abbu's Anger Level Check
│❀ .phuppho - Phuppho Conspiracy Rating
│❀ .kanjoos - Group ka sab se Kanjoos member
│❀ .phuddu - Group Phuddu Tagging
│❀ .burgerkid - Burger vs Paindu Test
│❀ .pindiboy - Pindi Wheelie Boy Status
│❀ .karachiite - Karachi Biryani Lover Tag
│❀ .lahorifoodie - Lahori Siri Paye Status
│❀ .pathanjoke - Funny Pathan Stories
│❀ .sardarji - Classic Sardarji Lateefay
│❀ .totkay - Zubaida Aapa Desi Totkay
│❀ .dramastatus - Pakistani Drama OST Lyrics
│❀ .terebin - Popular Drama Status
│❀ .kabhimainkabhitum - Drama Dialogue
│❀ .parizaad - Deep Parizaad Dialogues
│❀ .bulbulay - Nabeel & Khobsurat Jokes
│❀ .meraypasstumho - Famous Dialogue Lines
│❀ .vigo - Kala Vigo Warning Status
│❀ .velo - Velo Desi Meme Generator
│❀ .police - Punjab Police / Traffic Status
│❀ .schoollife - Desi School Memory Quotes

*=== 📈 UTILITIES & LOCAL NEWS (66 - 80) ===*
│❀ .paknews - Latest News Headlines Pakistan
│❀ .dollarprice - USD to PKR Rate Today
│❀ .goldratepak - 24K Gold Price in Pakistan
│❀ .petrolprice - Petrol & Diesel Rates
│❀ .weatherkhi - Karachi Live Weather
│❀ .weatherlhr - Lahore Live Weather
│❀ .weatherisb - Islamabad Weather
│❀ .simverification - Biometric SIM Check Guide
│❀ .ptaticket - PTA Mobile Tax Calculator
│❀ .nadrainfo - CNIC Renewal & Nadra Guide
│❀ .passport - E-Passport Status Guide
│❀ .trafficchallan - Online Challan Check Guide
│❀ .bipspak - Ehsaas / BISP Program Info
│❀ .electricitybill - Online Bill Checking Guide
│❀ .pakrailway - Train Timings & Ticket Info

*=== 🏏 SPORTS & PAKISTAN CRICKET (81 - 100) ===*
│❀ .babarazam - King Babar Stats & Quotes
│❀ .shaheenafridi - Eagle Shaheen Bowling Highlights
│❀ .rizwan - M. Rizwan Fight & Pride Status
│❀ .fakharzaman - Fakhar 200 Runs Celebration
│❀ .afridi - Shahid Afridi Boom Boom Hits
│❀ .shoaibakhtar - Rawalpindi Express Records
│❀ .imran1992 - 1992 World Cup Winning Moment
│❀ .pslschedule - PSL Matches & Points Table
│❀ .lahoreqalandars - Qalandars Fan Status
│❀ .karachikings - Kings Fan Status
│❀ .peshawarzalmi - Zalmi Yellow Storm Status
│❀ .islamabadunited - United Red Hot Status
│❀ .quetta - Gladiators Purple status
│❀ .multansultans - Sultans Pride Status
│❀ .pakvsinia - Ind vs Pak Cricket Rivalry Stats
│❀ .asiacup - Pakistan Asia Cup History
│❀ .worldcup - Pak World Cup Trophies List
│❀ .gullycricket - Desi Gully Cricket Rules
│❀ .ludostar - Ludo Room Code Generator
│❀ .pubgpak - PUBG Pakistan Server Ping Check

> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐌𝐔𝐁𝐀𝐑𝐀𝐊 𝐁𝐘 𝐊𝐀𝐌𝐑𝐀𝐍-𝐌𝐃* 🇵🇰
`;
    await reply(menu);
});
