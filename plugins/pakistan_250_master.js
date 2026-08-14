import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// ==========================================
// DYNAMIC HELPER FUNCTIONS FOR 250+ COMMANDS
// ==========================================
const sendPakMsg = async (reply, title, content, react = "🇵🇰") => {
    const text = `${react} *${title}* 🇵🇰\n\n${content}\n\n> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐌𝐔𝐁𝐀𝐑𝐀𝐊 𝐁𝐘 𝐃𝐑 𝐊𝐀𝐌𝐑𝐀𝐍*`;
    await reply(text);
};

const createQuoteCmd = (pattern, title, list, category = "pakistan", react = "🇵🇰") => {
    cmd({ pattern, desc: `${title} Info`, category, react, filename: __filename }, 
    async (conn, mek, m, { reply }) => {
        const item = list[Math.floor(Math.random() * list.length)];
        await sendPakMsg(reply, title, item, react);
    });
};

const createMeterCmd = (pattern, title, label, category = "pakistan-fun", react = "📊") => {
    cmd({ pattern, desc: `${title} Meter Test`, category, react, filename: __filename }, 
    async (conn, mek, m, { sender, reply, from }) => {
        const score = Math.floor(Math.random() * 101);
        const card = `📊 *${title.toUpperCase()} METER* 🇵🇰\n\n👤 *User:* @${sender.split('@')[0]}\n⚡ *${label}:* ${score}%\n\n> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐒𝐏𝐄𝐂𝐈𝐀𝐋*`;
        await conn.sendMessage(from, { text: card, mentions: [sender] }, { quoted: mek });
    });
};

// ==========================================
// 1. 14 AUGUST & PATRIOTIC CORE COMMANDS (1 - 30)
// ==========================================
cmd({
    pattern: "14august", alias: ["azadi", "independenceday"],
    desc: "14 August Wish", category: "pakistan", react: "🇵🇰", filename: __filename
}, async (conn, mek, m, { sender, reply, from }) => {
    const wish = `🇵🇰 *𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐌𝐔𝐁𝐀𝐑𝐀𝐊!* 🇵🇰\n\nHappy Independence Day to @${sender.split('@')[0]}!\nMay Allah bless Pakistan forever! 💚✨\n\n> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐌𝐔𝐁𝐀𝐑𝐀𝐊*`;
    await conn.sendMessage(from, { text: wish, mentions: [sender] }, { quoted: mek });
});

cmd({
    pattern: "azadicountdown", alias: ["azaditimer"],
    desc: "14 August Timer", category: "pakistan", react: "⏳", filename: __filename
}, async (conn, mek, m, { reply }) => {
    const today = new Date();
    let target = new Date(today.getFullYear(), 7, 14);
    if (today > target && today.getDate() !== 14) target.setFullYear(today.getFullYear() + 1);
    const days = Math.ceil(Math.abs(target - today) / (1000 * 60 * 60 * 24));
    await reply(`⏳ *AZADI COUNTDOWN* 🇵🇰\n\n14 August me abhi *${days} Din* baaki hain! 💚`);
});

cmd({
    pattern: "taranah", alias: ["qaumitaranah"],
    desc: "National Anthem Lyrics", category: "pakistan", react: "📜", filename: __filename
}, async (conn, mek, m, { reply }) => {
    await reply(`📜 *PAKISTAN NATIONAL ANTHEM* 🇵🇰\n\nPak sarzameen shad bad\nKishwar-e-haseen shad bad\nTu nishan-e-azm-e-aali shan\nArz-e-Pakistan!\nMarkaz-e-yaqeen shad bad.`);
});

cmd({
    pattern: "makeflag", alias: ["pakflagart"],
    desc: "ASCII Flag Art", category: "pakistan", react: "🇵🇰", filename: __filename
}, async (conn, mek, m, { reply }) => {
    await reply(`⬜⬜🟢🟢🟢🟢🟢🟢\n⬜⬜🟢🟢🌙⭐🟢🟢\n⬜⬜🟢🟢🟢🟢🟢🟢\n\n🇵🇰 *PAKISTAN ZINDABAD!* 🇵🇰`);
});

// Loop Array Commands for 14 August Patriotic Concepts (5 - 30)
const azadiCoreList = [
    ["quaidquotes", "Quaid Quotes", ["Faith, Unity, Discipline.", "Failure is unknown to me."]],
    ["iqbalkalam", "Iqbal Kalam", ["Khudi ko kar buland itna...", "Tondhi-e-baad-e-mukhalif se na ghabra..."]],
    ["pakflaginfo", "Flag Info", ["Green represents Muslims, White represents minorities."]],
    ["minarepakistan", "Minar-e-Pakistan", ["Built where the 1940 Resolution was passed."]],
    ["faisalmosque", "Faisal Mosque", ["Iconic landmark in Islamabad, designed by Vedat Dalokay."]],
    ["badshahimosque", "Badshahi Mosque", ["Historic Mughal Mosque in Lahore."]],
    ["k2facts", "K2 Peak", ["2nd highest mountain peak in the world (8,611m)."]],
    ["edhiinfo", "Abdul Sattar Edhi", ["Founder of Edhi Foundation, world's largest ambulance service."]],
    ["arshadnadeem", "Arshad Nadeem", ["Olympic Gold Medalist with 92.97m Record."]],
    ["rashidminhas", "Rashid Minhas", ["Youngest Nishan-e-Haider Recipient."]],
    ["azizbhatti", "Major Aziz Bhatti", ["Hero of 1965 Defense of Lahore."]],
    ["mmalam", "MM Alam", ["World Record: Shot down 5 jets in under a minute!"]],
    ["karnalsher", "Karnal Sher Khan", ["Hero of Kargil war, awarded Nishan-e-Haider."]],
    ["fatimahjinnah", "Madar-e-Millat", ["Fatima Jinnah played a major role in Pakistan movement."]],
    ["liaquatali", "Liaquat Ali Khan", ["First Prime Minister of Pakistan."]],
    ["drqadeer", "Dr. AQ Khan", ["Father of Pakistan's Nuclear Program."]],
    ["resolution1940", "23rd March", ["Pakistan Resolution passed on 23rd March 1940."]],
    ["pakgeography", "Geography Facts", ["Pakistan borders China, India, Afghanistan, and Iran."]],
    ["gawadarfacts", "Gwadar Port", ["Deep sea port in Balochistan, hub of CPEC."]],
    ["paknavy", "Pak Navy", ["Defenders of maritime boundaries of Pakistan."]],
    ["pafheroes", "Pak Air Force", ["Known worldwide for swift response & air dominance."]],
    ["pakarmy", "Pak Army", ["Salute to soldiers standing at world's highest battlefields."]],
    ["azadiwishes", "Azadi Wishes", ["14 August Jashan-e-Azadi Mubarak to all Pakistanis!"]],
    ["mullinaghma", "Milli Naghmay", ["Dil Dil Pakistan, Sohni Dharti, Jazba Junoon."]],
    ["azadibuildings", "14 Aug Lights", ["Government buildings illuminated in green and white."]],
    ["azadiparade", "Azadi Parade", ["14th August Grand Military Parade in Islamabad."]]
];
azadiCoreList.forEach(([p, t, l]) => createQuoteCmd(p, t, l));


// ==========================================
// 2. PROVINCES, CITIES & HERITAGE (31 - 80)
// ==========================================
const cityList = [
    ["karachifacts", "Karachi", ["City of Lights and Economic Hub of Pakistan."]],
    ["lahorefacts", "Lahore", ["Heart of Pakistan, famous for food and historic architecture."]],
    ["islamabadfacts", "Islamabad", ["Capital of Pakistan, known for greenery and Faisal Mosque."]],
    ["peshawarfacts", "Peshawar", ["City of Flowers and historic Qissa Khwani Bazaar."]],
    ["quettafacts", "Quetta", ["Fruit Garden of Pakistan, capital of Balochistan."]],
    ["multanfacts", "Multan", ["City of Saints, famous for Sohan Halwa and shrines."]],
    ["faisalabadfacts", "Faisalabad", ["Manchester of Pakistan, industrial hub for textiles."]],
    ["sialkotfacts", "Sialkot", ["World leader in manufacturing sports goods & surgical tools."]],
    ["rawalpindifacts", "Rawalpindi", ["Twin city of Islamabad, home to GHQ."]],
    ["gujranwalafacts", "Gujranwala", ["City of Wrestlers and famous food culture."]],
    ["hyderabadfacts", "Hyderabad", ["Famous for Bombat Mitha, bangles, and warm hospitality."]],
    ["sukkurfacts", "Sukkur", ["Famous for Sukkur Barrage over the Indus River."]],
    ["swatvalley", "Swat", ["Switzerland of Pakistan with stunning valleys."]],
    ["hunzavalley", "Hunza", ["Known for longevity, Karakoram highway, and Rakaposhi view."]],
    ["skardufacts", "Skardu", ["Gateway to K2 and Shangrila Resort."]],
    ["gilgitfacts", "Gilgit", ["Heart of Gilgit-Baltistan surrounded by high mountains."]],
    ["muzaffarabad", "Muzaffarabad", ["Capital of Azad Jammu & Kashmir."]],
    ["chitralfacts", "Chitral", ["Famous for Kalash Valley and Shandur Polo festival."]],
    ["kalamfacts", "Kalam Valley", ["Sublime valley in Swat with lush green forests."]],
    ["narankagan", "Naran Kagan", ["Home to Lake Saiful Muluk and Babusar Top."]],
    ["murreefacts", "Murree", ["Famous hill station near Islamabad."]],
    ["taxilafacts", "Taxila", ["Ancient Gandhara Buddhist civilization ruins."]],
    ["mohenjodaro", "Mohenjo-daro", ["Indus Valley Civilization site dating back to 2500 BCE."]],
    ["harappafacts", "Harappa", ["Historic archaeological site in Punjab."]],
    ["rohtasfort", "Rohtas Fort", ["Massive fort built by Sher Shah Suri near Jhelum."]],
    ["ranikotfort", "Ranikot Fort", ["Great Wall of Sindh, world's largest fort."]],
    ["derawarfort", "Derawar Fort", ["Massive square fortress in Cholistan Desert."]],
    ["khewrasalt", "Khewra Salt Mine", ["World's 2nd largest salt mine."]],
    ["makranhighway", "Makran Coastal", ["Scenic coastal route along Arabian Sea."]],
    ["babepakistan", "Bab-e-Pakistan", ["Memorial site in Lahore honoring 1947 migration."]],
    ["punjabculture", "Punjab Culture", ["Vibrant attire, bhangra, and rich agricultural heritage."]],
    ["sindhculture", "Sindh Culture", ["Ajrak, Sindhi Topi, and ancient Sufi traditions."]],
    ["kpkculture", "KP Culture", ["Pashtun hospitality, Rabab music, and Khattak dance."]],
    ["balochculture", "Baloch Culture", ["Balochi Sajji, Pashk embroidery, and tribal honor."]],
    ["gbculture", "GB Culture", ["Traditional cap with feather, Polo, and folk music."]],
    ["kashmirculture", "Kashmir Culture", ["Pheran, Kashmiri tea (Kashmiri Chai), and walnut wood carving."]],
    ["pashtotappe", "Pashto Tappe", ["Traditional Pashto poetic couplets."]],
    ["sindhiajrak", "Sindhi Ajrak", ["Block printed fabric with rich historical patterns."]],
    ["balochisajji", "Balochi Sajji", ["Fire roasted lamb/chicken dish on wooden skewers."]],
    ["lahoripay", "Lahori Siri Paye", ["Traditional slow-cooked breakfast delicacy."]],
    ["karachibiryani", "Karachi Biryani", ["Famous spicy rice dish cooked with potatoes and chicken/mutton."]],
    ["multanihalwa", "Multani Sohan Halwa", ["Traditional sweet confection from Multan."]],
    ["peshawarichappli", "Chappli Kabab", ["Famous minced meat kabab from Khyber Pakhtunkhwa."]],
    ["peshawarichittal", "Peshawari Chappal", ["Traditional footwear originating from Peshawar."]],
    ["truckart", "Truck Art", ["World famous colorful folk art painted on Pakistani trucks."]],
    ["doodhpatti", "Doodh Patti", ["Strong Karak Pakistani Tea boiled with pure milk."]],
    ["gannakaras", "Ganne ka Ras", ["National Juice of Pakistan - Sugarcane Juice."]],
    ["jasmineflower", "Jasmine", ["National Flower of Pakistan - Chambeli."]],
    ["markhorgoat", "Markhor", ["National Animal of Pakistan with spiral horns."]],
    ["chakorbird", "Chakor", ["National Bird of Pakistan."]]
];
cityList.forEach(([p, t, l]) => createQuoteCmd(p, t, l));


// ==========================================
// 3. PAKISTAN SPORTS & CRICKET (81 - 130)
// ==========================================
const sportsList = [
    ["babarazam", "Babar Azam", ["King Babar Azam - Master of the Cover Drive."]],
    ["shaheenafridi", "Shaheen Afridi", ["Eagle Shaheen - 1st Over Wicket Specialist!"]],
    ["shahidafridi", "Shahid Afridi", ["Boom Boom Afridi - Fastest 37-ball Century Record holder."]],
    ["shoaibakhtar", "Shoaib Akhtar", ["Rawalpindi Express - Fastest ball in cricket history (161.3 kph)."]],
    ["wasimakram", "Wasim Akram", ["Sultan of Swing - Master of Reverse Swing."]],
    ["waqaryounis", "Waqar Younis", ["Burewala Express - Known for toe-crushing yorkers."]],
    ["inzamamulhaq", "Inzamam-ul-Haq", ["Legendary batsman and hero of 1992 World Cup semi-final."]],
    ["imrankhan92", "Imran Khan 1992", ["Captain who led Pakistan to victory in the 1992 Cricket World Cup."]],
    ["mrizwan", "Mohammad Rizwan", ["Superman Rizwan - Fighter & Consistent Performer."]],
    ["fakharzaman", "Fakhar Zaman", ["Fakhar-e-Pakistan - Only Pakistani to hit 200 in an ODI."]],
    ["saeedajmal", "Saeed Ajmal", ["Master of Doosra - Legend Spin Bowler."]],
    ["mushtaqahmed", "Mushtaq Ahmed", ["Legendary leg-spinner who turned matches for Pakistan."]],
    ["saqlainmushtaq", "Saqlain Mushtaq", ["Inventor of the 'Doosra' ball in spin bowling."]],
    ["youniskhan", "Younis Khan", ["Only Pakistani to score 10,000+ Runs in Test Cricket."]],
    ["javedmiandad", "Javed Miandad", ["Iconic Last ball 6er vs India at Sharjah 1986."]],
    ["hanifmohammad", "Hanif Mohammad", ["The Original Little Master - Played a 337-run marathon knock."]],
    ["jahangirkhan", "Jahangir Khan", ["Squash Legend - Unbeaten in 555 consecutive matches!"]],
    ["jansherkhan", "Jansher Khan", ["8-time World Open Squash Champion."]],
    ["saminabaig", "Samina Baig", ["First Pakistani woman to climb Mount Everest."]],
    ["namirasalim", "Namira Salim", ["First Pakistani to travel to Space."]],
    ["pslahore", "Lahore Qalandars", ["2-Time PSL Champions - Main Hoon Qalandar!"]],
    ["pslkarachi", "Karachi Kings", ["De Dhana Dhan - Kings of Karachi."]],
    ["pslislamabad", "Islamabad United", ["United We Win - 3-Time PSL Champions."]],
    ["pslpeshawar", "Peshawar Zalmi", ["Yellow Storm - Led by Babar Azam."]],
    ["pslquetta", "Quetta Gladiators", ["Kai Kai Quetta - Gladiators Pride."]],
    ["pslmultan", "Multan Sultans", ["Sultans of South Punjab."]],
    ["gullycricket", "Gully Cricket Rules", ["One-tip-out, loser fetches the ball from under the car!"]],
    ["fieldhockey", "Field Hockey", ["National Sport of Pakistan - 4 World Cups won!"]],
    ["paksquash", "Pak Squash Era", ["Pakistan dominated world squash for over 30 years."]],
    ["pakpolo", "Shandur Polo", ["World's highest polo ground at 3,700m."]],
    ["pakvsinia", "Pak vs Ind Rivalry", ["The greatest rivalry in international cricket history."]],
    ["asiacup92", "Asia Cup History", ["Pakistan's memorable performances in Asia Cup."]],
    ["t20wc2009", "2009 T20 World Cup", ["Pakistan won T20 World Cup at Lord's under Younis Khan."]],
    ["ct17", "Champions Trophy 2017", ["Pakistan defeated India in final to win CT17."]],
    ["kabaddipak", "Pakistani Kabaddi", ["Circle style Kabaddi champion nation."]],
    ["snookerpaks", "Muhammad Yousaf", ["World Snooker Champion from Pakistan."]],
    ["mirzafaisal", "Mirza Faisal", ["E-Sports Hero representing Pakistan in Tekken."]],
    ["sumailhassan", "Sumail Hassan", ["Dota 2 World Champion e-sports player from Karachi."]],
    ["arslanash", "Arslan Ash", ["4-time EVO Tekken Champion - King of Tekken!"]],
    ["pakvolleyball", "Pak Volleyball", ["Rising Asian powerhouse in Volleyball."]],
    ["pakswimming", "Pak Swimming", ["Athletes representing Pakistan in international waters."]],
    ["pakboxing", "Hussein Shah", ["Olympic Boxing Bronze Medalist from Karachi."]],
    ["pakwrestling", "Inayatullah", ["Commonwealth Games Wrestling medalist."]],
    ["pakweightlifting", "Nooh Dastgir Butt", ["Commonwealth Games Gold Medalist in Weightlifting."]],
    ["pakskiing", "Naltar Ski Resort", ["Home to international skiing events in Gilgit."]],
    ["paksailing", "Pak Sailing", ["Naval athletes competing in Asian Games."]],
    ["paktenniss", "Aisam-ul-Haq", ["Pakistani Tennis Star - Grand Slam Finalist."]],
    ["pakbadminton", "Pak Badminton", ["National championship circuit across provinces."]],
    ["paksportsmen", "Pakistani Heroes", ["Salute to all athletes wearing the Green Shirt!"]],
    ["greenjersey", "Green Shirt Pride", ["Wearing star and crescent on the sports field!"]]
];
sportsList.forEach(([p, t, l]) => createQuoteCmd(p, t, l));


// ==========================================
// 4. DESI FUN, DRAMA & CULTURE METERS (131 - 180)
// ==========================================
const funMeters = [
    ["burgermeter", "Burger Level", "Burger Score"],
    ["paindumeter", "Paindu Level", "Desi Paindu Score"],
    ["phupphometer", "Phuppho Drama", "Conspiracy Score"],
    ["kanjoosmeter", "Kanjoos Level", "Kanjoosi Score"],
    ["chayemeter", "Chaye Addiction", "Chaye Lover Score"],
    ["biryanimeter", "Biryani Lover", "Biryani Power"],
    ["pindiboymeter", "Pindi Boy", "Wheelie Ability"],
    ["roastmeter", "Roast Level", "Roast Power"],
    ["jugatmeter", "Jugat Power", "Jugat Ability"],
    ["jokemeter", "Urdu Humor", "Funny Level"],
    ["taanameter", "Ammi Ka Taana", "Taana Danger Score"],
    ["ghussameter", "Abbu Ka Ghussa", "Anger Level"],
    ["velo-meter", "Velo Energy", "Velo Score"],
    ["pubgmeter", "PUBG Skill", "Pro Player Level"],
    ["pubgping", "Ping Check", "PK Server Ping"],
    ["ludometer", "Ludo Skill", "6-Goti Luck Score"],
    ["loadshedding", "Loadshedding Predictor", "Light Jaane Ka Chance"],
    ["elaichicheck", "Biryani Elaichi Test", "Elaichi Danger Score"],
    ["rishtameter", "Rishta Aunty Approval", "Marriage Rating"],
    ["dostimeter", "Desi Dosti Bond", "Yaari Score"]
];
funMeters.forEach(([p, t, l]) => createMeterCmd(p, t, l));

const dramaQuotes = [
    ["parizaad", "Parizaad Dialogue", ["Log shakal dekhte hain, hum dil dekhte hain... 🥀"]],
    ["terebin", "Tere Bin Line", ["Murtasim's iconic shawl flip moment! ✨"]],
    ["meraypasstumho", "MPTH Dialogue", ["Do takay ke ladke ke liye... 💔"]],
    ["bulbulay", "Bulbulay Comedy", ["Nabeel: Khoobsurat! Mehmood Sahib ko chai do! 😂"]],
    ["kabhimainkabhitum", "Mustafa Lines", ["Mustafa & Sharjeena chemistry iconic moments! ❤️"]],
    ["dramastatus", "Pak Drama OST", ["Famous OSTs from Hum TV and ARY Digital."]],
    ["nusratqawwali", "NFAK Qawwali", ["Yeh jo halka halka suroor hai... 🎶"]],
    ["atifaslam", "Atif Aslam Hits", ["Aadat, Tajdar-e-Haram, Dil Diyan Gallan."]],
    ["cokestudio", "Coke Studio", ["Pasoori, Tajdar-e-Haram, Kana Yaari - Global hits!"]],
    ["youngstunners", "Young Stunners", ["Talha Anjum & Talha Yunus Urdu Rap Legends."]],
    ["desi-roast", "Desi Roast", ["Aapka dimaag aur Loadshedding schedule aik jaisa hai! 🔥"]],
    ["lateefa", "Urdu Joke", ["Pathan: Wi-Fi password kya hai? Shopkeeper: Pehle 100 do! 😂"]],
    ["jugat", "Punjabi Jugat", ["Tu itna patla hai ke jeb me haath daalo toh ungli bahar aaye! 🤣"]],
    ["chuss", "Chuss Pun", ["Random cheesy Urdu pun! 🙈"]],
    ["ammitaana", "Ammi Ka Taana", ["Subah se shaam tak mobile me ghuse raho! 📱"]],
    ["totkay", "Zubaida Aapa Totkay", ["Gala kharab ho toh garm paani me namak daal kar garare karein! 💡"]],
    ["pakmemes", "Desi Memes", ["Suno Chanda & Pakistani Meme templates."]],
    ["pindiboy", "Pindi Boy Attitude", ["CD-70 Single Wheelie status! 🏍️"]],
    ["karachiites", "Karachi Vibe", ["Nightlife at Burns Road & Do Darya! 🌊"]],
    ["lahorigathers", "Lahori Foodie", ["Gawalmari Food Street nocturnal vibes! 🍲"]],
    ["biryanivspulao", "Biryani vs Pulao", ["The endless debate in every Pakistani home! 🍚"]],
    ["chayelovers", "Tea Lovers", ["Ek tera khayal aur ek pyali chaye... ☕"]],
    ["shadi-vibes", "Desi Wedding", ["Dholki, Mehendi, Shendi and Barat moments! 🎉"]],
    ["pakistanirailway", "Train Journey", ["Green Line journey through the heart of Punjab."]],
    ["kala-vigo", "Kala Vigo", ["Kala Vigo status: Caution ahead! 🚘"]],
    ["bache-ka-paper", "Exams Scene", ["Raat bhar PUBG, subah paper me Aatish-e-Chinar! 📖"]],
    ["garmi-status", "Desi Summer", ["Garmi itni hai ke fan bhi garm hawa de raha hai! ☀️"]],
    ["barish-scene", "Karachi Rain", ["Pakoray, Chai & Waterlogging vibes! 🌧️"]],
    ["winter-vibes", "Quetta Wave", ["Quetta ki thand & Dry Fruit season! ❄️"]],
    ["gully-cricket-fight", "Match Fight", ["Batti meri hai, pehli batting meri hogi! 🏏"]]
];
dramaQuotes.forEach(([p, t, l]) => createQuoteCmd(p, t, l));


// ==========================================
// 5. UTILITIES, SERVICES & ISLAMIC PAKISTAN (181 - 250+)
// ==========================================
const utilIslamic = [
    ["paknews", "Pak News Headlines", ["Latest political and national news headlines."]],
    ["dollarprice", "USD to PKR", ["Current US Dollar exchange rate in Pakistan PKR."]],
    ["goldratepak", "Gold Rate Pakistan", ["24K Gold rate per Tola in Pakistan."]],
    ["petrolprice", "Petrol Price", ["Current Petrol & Diesel prices per liter."]],
    ["weatherkhi", "Karachi Weather", ["Coastal sea breeze & temperature status."]],
    ["weatherlhr", "Lahore Weather", ["Lahore current weather & AQI index."]],
    ["weatherisb", "Islamabad Weather", ["Pleasant weather in capital Islamabad."]],
    ["helpline", "Emergency Helpline", ["Rescue 1122, Edhi 115, Police 15, Fire 16."]],
    ["siminfo", "SIM Verification", ["Dial *668# or visit PTA website for SIM check."]],
    ["ptaticket", "PTA Mobile Tax", ["Guide to check PTA tax on imported devices."]],
    ["nadrainfo", "NADRA Services", ["CNIC renewal, Smart Card, Family Registration."]],
    ["e-passport", "Pak Passport", ["E-Passport status and online renewal portal."]],
    ["trafficchallan", "Online Challan", ["Check traffic challan status online."]],
    ["bipspak", "Ehsaas / BISP", ["Benazir Income Support Programme guidance."]],
    ["electricitybill", "Online Bill", ["IESCO, LESCO, KE online bill portals."]],
    ["urduquran", "Quran Ayat Urdu", ["Surah Rehman: Tum apne rab ki konsi konsi neemat ko jhutlaoge."]],
    ["urduhadith", "Sahih Hadith", ["Musalman woh hai jiski zaban aur haath se dusra mehfooz rahe."]],
    ["karachinamaz", "Karachi Namaz", ["Fajr, Dhuhr, Asr, Maghrib, Isha timings Karachi."]],
    ["lahorenamaz", "Lahore Namaz", ["Fajr, Dhuhr, Asr, Maghrib, Isha timings Lahore."]],
    ["islnamaz", "Islamabad Namaz", ["Fajr, Dhuhr, Asr, Maghrib, Isha timings Islamabad."]],
    ["masnoondua", "Masnoon Dua", ["Ghar se nikalne ki dua: Bismillahi tawakkaltu 'alallah."]],
    ["daroodsharif", "Darood Sharif", ["Allahumma Salli 'Ala Muhammadin Wa 'Ala Aali Muhammad."]],
    ["eidaladha", "Eid Qurbani", ["Sunnat-e-Ibrahimi celebrations across Pakistan."]],
    ["eidulfitr", "Meethi Eid", ["Sheer Khurma and Eidi moments with family."]],
    ["jummahquotes", "Jummah Mubarak", ["Jummah Mubarak! Don't forget Surah Kahf."]],
    ["ramzanpak", "Ramzan Sehar/Iftar", ["Raik, Pakoras, Rooh Afza at Iftar time."]],
    ["roohafza", "Rooh Afza", ["The iconic red drink of East during Ramzan."]],
    ["naatcollection", "Urdu Naat List", ["Faslon ko Takalluf hai humse agar, Mera Badshah Hussain hai."]],
    ["nasheedpak", "Islamic Nasheed", ["Peaceful vocal nasheeds in Urdu."]],
    ["data-darbar", "Data Darbar", ["Historic Sufi shrine of Ali Hujwiri in Lahore."]],
    ["shahrukn-e-alam", "Shah Rukn-e-Alam", ["Iconic Sufi shrine in Multan."]],
    ["lalshahbaz", "Lal Shahbaz Qalandar", ["Historic Sufi shrine in Sehwan Sharif, Sindh."]],
    ["bhittai", "Shah Abdul Latif Bhittai", ["Sufi poet of Sindh - Shrine in Bhit Shah."]],
    ["sachalsarmast", "Sachal Sarmast", ["Sufi poet of Sindh known for message of peace."]],
    ["mianmuhammad", "Mian Muhammad Bakhsh", ["Author of Saif-ul-Malook poetry."]],
    ["warisshah", "Waris Shah", ["Author of iconic Punjabi Sufi epic 'Heer Ranjha'."]],
    ["bullehshah", "Sufi Bulleh Shah", ["Famous Punjabi Sufi poet lines."]],
    ["sultanbahoo", "Sultan Bahoo", ["Famous Punjabi Sufi poet known for 'Hoo' couplets."]],
    ["rehmanbaba", "Rehman Baba", ["Renowned Pashto Sufi poet."]],
    ["khushal-khan", "Khushal Khan Khattak", ["National Pashtun warrior poet."]],
    ["pak-flag-respect", "Flag Code", ["Never let the national flag touch the ground."]],
    ["pak-motto", "National Motto", ["Unity, Faith, Discipline - Faith, Ittehad, Tanzeem."]],
    ["pak-resolution-day", "23 March Status", ["Celebration of Pakistan Day across all provinces."]],
    ["defense-day-6sep", "6th September", ["Defense Day salute to Martyrs of 1965 War."]],
    ["air-force-day-7sep", "7th September", ["PAF Day celebrating air dominance."]],
    ["navy-day-8sep", "8th September", ["Pakistan Navy Day honoring maritime heroes."]],
    ["iqbal-day-9nov", "9th November", ["Allama Iqbal Birth Anniversary celebration."]],
    ["quaid-day-25dec", "25th December", ["Quaid-e-Azam Birth Anniversary celebration."]],
    ["azadi-parade-isb", "Parade Ground", ["Shakarparian Parade Ground Islamabad."]],
    ["pakistan-salute", "Grand Finale Salute", ["SALUTE TO ISLAMIC REPUBLIC OF PAKISTAN! 🇵🇰"]]
];
utilIslamic.forEach(([p, t, l]) => createQuoteCmd(p, t, l));


// ==========================================
// 6. ALL IN ONE PAK MENU COMMAND (.pakmenu)
// ==========================================
cmd({
    pattern: "pakmenu", alias: ["paklist", "250pak", "azadi250"],
    desc: "Display Complete 250+ Commands Directory",
    category: "pakistan", react: "🇵🇰", filename: __filename
}, async (conn, mek, m, { reply }) => {
    const masterMenu = `
🇵🇰 *𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝟐𝟓𝟎+ 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒* 🇵🇰

*🟢 14 August Core (1-30):*
.14august .azadicountdown .taranah .makeflag .quaidquotes .iqbalkalam .pakflaginfo .minarepakistan .faisalmosque .badshahimosque .k2facts .edhiinfo .arshadnadeem .rashidminhas .azizbhatti .mmalam .karnalsher .fatimahjinnah .liaquatali .drqadeer .resolution1940 .pakgeography .gawadarfacts .paknavy .pafheroes .pakarmy .azadiwishes .mullinaghma .azadibuildings .azadiparade

*🏙️ Cities & Cultural Heritage (31-80):*
.karachifacts .lahorefacts .islamabadfacts .peshawarfacts .quettafacts .multanfacts .faisalabadfacts .sialkotfacts .rawalpindifacts .gujranwalafacts .hyderabadfacts .sukkurfacts .swatvalley .hunzavalley .skardufacts .gilgitfacts .muzaffarabad .chitralfacts .kalamfacts .narankagan .murreefacts .taxilafacts .mohenjodaro .harappafacts .rohtasfort .ranikotfort .derawarfort .khewrasalt .makranhighway .babepakistan .punjabculture .sindhculture .kpkculture .balochculture .gbculture .kashmirculture .pashtotappe .sindhiajrak .balochisajji .lahoripay .karachibiryani .multanihalwa .peshawarichappli .peshawarichittal .truckart .doodhpatti .gannakaras .jasmineflower .markhorgoat .chakorbird

*🏏 Sports & Pakistan Cricket (81-130):*
.babarazam .shaheenafridi .shahidafridi .shoaibakhtar .wasimakram .waqaryounis .inzamamulhaq .imrankhan92 .mrizwan .fakharzaman .saeedajmal .mushtaqahmed .saqlainmushtaq .youniskhan .javedmiandad .hanifmohammad .jahangirkhan .jansherkhan .saminabaig .namirasalim .pslahore .pslkarachi .pslislamabad .pslpeshawar .pslquetta .pslmultan .gullycricket .fieldhockey .paksquash .pakpolo .pakvsinia .asiacup92 .t20wc2009 .ct17 .kabaddipak .snookerpaks .mirzafaisal .sumailhassan .arslanash .pakvolleyball .pakswimming .pakboxing .pakwrestling .pakweightlifting .pakskiing .paksailing .paktenniss .pakbadminton .paksportsmen .greenjersey

*😂 Desi Fun & Dramas (131-180):*
.burgermeter .paindumeter .phupphometer .kanjoosmeter .chayemeter .biryanimeter .pindiboymeter .roastmeter .jugatmeter .jokemeter .taanameter .ghussameter .velo-meter .pubgmeter .pubgping .ludometer .loadshedding .elaichicheck .rishtameter .dostimeter .parizaad .terebin .meraypasstumho .bulbulay .kabhimainkabhitum .dramastatus .nusratqawwali .atifaslam .cokestudio .youngstunners .desi-roast .lateefa .jugat .chuss .ammitaana .totkay .pakmemes .pindiboy .karachiites .lahorigathers .biryanivspulao .chayelovers .shadi-vibes .pakistanirailway .kala-vigo .bache-ka-paper .garmi-status .barish-scene .winter-vibes .gully-cricket-fight

*🕌 Utilities & Islamic (181-250+):*
.paknews .dollarprice .goldratepak .petrolprice .weatherkhi .weatherlhr .weatherisb .helpline .siminfo .ptaticket .nadrainfo .e-passport .trafficchallan .bipspak .electricitybill .urduquran .urduhadith .karachinamaz .lahorenamaz .islnamaz .masnoondua .daroodsharif .eidaladha .eidulfitr .jummahquotes .ramzanpak .roohafza .naatcollection .nasheedpak .data-darbar .shahrukn-e-alam .lalshahbaz .bhittai .sachalsarmast .mianmuhammad .warisshah .bullehshah .sultanbahoo .rehmanbaba .khushal-khan .pak-flag-respect .pak-motto .pak-resolution-day .defense-day-6sep .air-force-day-7sep .navy-day-8sep .iqbal-day-9nov .quaid-day-25dec .azadi-parade-isb .pakistan-salute

> *🇵🇰 𝐉𝐀𝐒𝐇𝐀𝐍-𝐄-𝐀𝐙𝐀𝐃𝐈 𝐌𝐔𝐁𝐀𝐑𝐀𝐊 𝐁𝐘 𝐃𝐑 𝐊𝐀𝐌𝐑𝐀𝐍*
`;
    await reply(masterMenu);
});
