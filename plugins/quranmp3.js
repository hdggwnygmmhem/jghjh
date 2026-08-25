import axios from 'axios';
import { cmd } from '../command.js'; // اپنے بوٹ کے کمانڈ ہینڈلر کا صحیح پاتھ رکھیں

const API = "https://www.mp3quran.net/api/v3";

async function mp3quranFetch(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API}${path}?${qs}` : `${API}${path}`;
  const res = await axios.get(url, {
    timeout: 20000,
    validateStatus: () => true,
    headers: {
      Accept: "application/json",
      Origin: "https://code.rifkyshre.biz.id",
      Referer: "https://code.rifkyshre.biz.id/",
    },
  });
  if (res.status !== 200) {
    throw new Error(`mp3quran HTTP ${res.status}`);
  }
  return res.data;
}

function buildAudioUrl(serverBase, surahId) {
  const padded = String(surahId).padStart(3, "0");
  const base = serverBase.endsWith("/") ? serverBase : serverBase + "/";
  return `${base}${padded}.mp3`;
}

// Core mp3quran Search Engine
export async function mp3quran(input) {
  try {
    const mode = (input?.mode ?? "reciters").toLowerCase();
    const language = typeof input?.language === "string" ? input.language : "eng";

    if (mode === "reciters") {
      const data = await mp3quranFetch("/reciters", { language });
      const list = Array.isArray(data?.reciters) ? data.reciters : [];
      return {
        Status: true,
        Code: 200,
        Input: input,
        Result: {
          message: `🎙️ ${list.length} qari tersedia (bahasa: ${language})`,
          count: list.length,
          reciters: list.map((r) => ({
            id: r.id,
            name: r.name,
            letter: r.letter,
            moshafCount: Array.isArray(r.moshaf) ? r.moshaf.length : 0,
            moshaf: (r.moshaf ?? []).map((m) => ({
              id: m.id,
              name: m.name,
              server: m.server,
              surahTotal: m.surah_total,
              surahList: m.surah_list,
            })),
          })),
        },
      };
    }

    if (mode === "suwar") {
      const data = await mp3quranFetch("/suwar", { language });
      const list = Array.isArray(data?.suwar) ? data.suwar : [];
      return {
        Status: true,
        Code: 200,
        Input: input,
        Result: {
          message: `📖 ${list.length} surah (1-114)`,
          count: list.length,
          suwar: list.map((s) => ({
            id: s.id,
            name: s.name?.trim(),
            startPage: s.start_page,
            endPage: s.end_page,
            type: s.makkia === 1 ? "Makkiyah" : "Madaniyah",
          })),
        },
      };
    }

    if (mode === "radios") {
      const data = await mp3quranFetch("/radios", { language });
      const list = Array.isArray(data?.radios) ? data.radios : [];
      return {
        Status: true,
        Code: 200,
        Input: input,
        Result: {
          message: `📻 ${list.length} radio stream live`,
          count: list.length,
          radios: list,
        },
      };
    }

    if (mode === "audio") {
      const reciterQuery = typeof input?.reciter === "string"
        ? input.reciter.trim().toLowerCase()
        : "";
      const surahId = Number(input?.surah);
      if (!reciterQuery) {
        return {
          Status: false, Code: 400, Input: input, Result: null,
          Error: "Field 'reciter' wajib (contoh: 'Sudais', 'Mishary', 'Husary').",
        };
      }
      if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
        return {
          Status: false, Code: 400, Input: input, Result: null,
          Error: "Field 'surah' harus 1-114.",
        };
      }

      const ALIASES = {
        sudais: ["alsudaes", "sudaes", "abdulrahman alsudaes"],
        mishary: ["meshary", "mishary alafasy", "alafasy", "alafasi"],
        misyari: ["meshary", "alafasy"],
        husary: ["hosary", "alhosary", "mahmoud khalil alhosary"],
        hosary: ["alhosary", "husary"],
        ghamdi: ["alghamdi", "saad alghamdi", "saad al ghamdi"],
        ghamidi: ["alghamdi"],
        shuraim: ["alshuraim", "saud alshuraim"],
        shatri: ["shatry", "abubakr ashshatri", "abu bakr al shatri"],
        ajmi: ["alajmi", "ahmed alajmi"],
        minshawi: ["minshawy", "mohamed siddiq elminshawi"],
        afasy: ["alafasy", "meshary alafasy"],
        rifai: ["alrefaei", "hani rifai"],
        muaiqly: ["maher almuaiqly", "almuaiqly"],
        muaiqli: ["almuaiqly"],
        juhany: ["aljohany", "abdullah aljohany"],
        johany: ["aljohany"],
        basfar: ["albasfar", "abdullah basfar"],
        ayyub: ["mohammad ayyoub"],
        ayyoub: ["mohammad ayyoub"],
        budair: ["albudair", "salah albudair"],
        tablawi: ["altablawi", "mohammed altablawi"],
        thubaity: ["althubaity", "ibrahim althubaity"],
      };

      const data = await mp3quranFetch("/reciters", { language });
      const all = Array.isArray(data?.reciters) ? data.reciters : [];

      let matches = all.filter((r) =>
        (r.name ?? "").toLowerCase().includes(reciterQuery),
      );

      if (matches.length === 0) {
        const expanded = [reciterQuery, ...(ALIASES[reciterQuery] ?? [])];
        for (const word of reciterQuery.split(/\s+/)) {
          if (ALIASES[word]) expanded.push(...ALIASES[word]);
        }
        for (const variant of expanded) {
          const found = all.filter((r) =>
            (r.name ?? "").toLowerCase().includes(variant),
          );
          if (found.length > 0) {
            matches = found;
            break;
          }
        }
      }

      if (matches.length === 0) {
        return {
          Status: false, Code: 404, Input: input, Result: null,
          Error: `قاری "${input.reciter}" نہیں مل سکا۔ براہ کرم نام کی ہجے درست کریں۔`,
        };
      }

      const audios = [];
      for (const reciter of matches) {
        for (const moshaf of reciter.moshaf ?? []) {
          const surahList = String(moshaf.surah_list ?? "").split(",").map((n) => Number(n.trim()));
          if (!surahList.includes(surahId)) continue;
          audios.push({
            reciterId: reciter.id,
            reciterName: reciter.name,
            moshafId: moshaf.id,
            moshafName: moshaf.name,
            surahId,
            audioUrl: buildAudioUrl(moshaf.server, surahId),
          });
        }
      }

      if (audios.length === 0) {
        return {
          Status: false, Code: 404, Input: input, Result: null,
          Error: `قاری مل گیا ہے لیکن سورۃ نمبر ${surahId} اس قاری کے پاس دستیاب نہیں ہے۔`,
        };
      }

      return {
        Status: true, Code: 200, Input: input,
        Result: {
          message: `🎵 ${audios.length} audio surah ${surahId}`,
          matchCount: matches.length,
          audioCount: audios.length,
          firstAudio: audios[0].audioUrl,
          audios,
        },
      };
    }

    return { Status: false, Code: 400, Input: input, Result: null, Error: "Unknown mode" };
  } catch (e) {
    return { Status: false, Code: e.response?.status ?? 500, Input: input, Result: null, Error: e.message ?? String(e) };
  }
}

// ==========================================
//          WHATSAPP BOT COMMAND
// ==========================================

cmd({
    pattern: "mp3quran",
    alias: ["tilawat", "quranmp3", "surahaudio"],
    desc: "Listen to Quran recitation by reciter name and surah number",
    category: "islamic",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) {
            await react("❌");
            return reply("⚠️ *براہ کرم قاری کا نام اور سورۃ نمبر فراہم کریں!*\n\n*مثال:* `.mp3quran Sudais | 1`\n*یا:* `.mp3quran Mishary | 67`");
        }

        const args = q.split("|").map(v => v.trim());
        const reciterName = args[0];
        const surahId = parseInt(args[1] || "1");

        if (!reciterName) {
            await react("❌");
            return reply("⚠️ *قاری کا نام درج کرنا ضروری ہے!*");
        }

        await react("🔍");
        await reply(`🔍 *قاری ${reciterName} کی تلاوت (سورۃ نمبر ${surahId}) تلاش کی جا رہی ہے...*`);

        const res = await mp3quran({
            mode: "audio",
            reciter: reciterName,
            surah: surahId,
            language: "eng"
        });

        if (!res.Status || !res.Result?.audios?.length) {
            await react("❌");
            return reply(`❌ *ایرر:* ${res.Error || "تلاوت حاصل نہیں ہو سکی۔"}`);
        }

        const firstAudio = res.Result.audios[0];
        const caption = `📖 *QURAN MP3 AUDIO*\n\n🎙️ *Reciter:* ${firstAudio.reciterName}\n📚 *Riwayat/Moshaf:* ${firstAudio.moshafName}\n🔢 *Surah No:* ${surahId}`;

        await react("📥");

        // Send Audio to WhatsApp
        await conn.sendMessage(m.chat, {
            audio: { url: firstAudio.audioUrl },
            mimetype: 'audio/mp4',
            fileName: `Surah_${surahId}_${firstAudio.reciterName}.mp3`,
            caption: caption
        }, { quoted: mek });

        await react("✅");

    } catch (err) {
        console.error("MP3Quran Command Error:", err);
        await react("❌");
        await reply(`❌ *Error:* ${err.message}`);
    }
});
