import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { cmd, commands } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

let gotScraping = null

async function loadGotScraping() {
  if (!gotScraping) {
    const mod = await import('got-scraping')
    gotScraping = mod.gotScraping
  }
  return gotScraping
}

const BASE_URL = 'https://id.akinator.com'

const THEMES = {
  characters: 1,
  animals: 14,
  objects: 2
}

const ANSWERS = {
  yes: 0,
  no: 1,
  idk: 2,
  probably: 3,
  'probably not': 4
}

/* ============================================================
 * SESSION MANAGEMENT
 * ========================================================== */

if (!global.akinatorSessions) {
  global.akinatorSessions = new Map()
}

const getUserId = (m) => m.sender || m.chat
const getSession = (m) => global.akinatorSessions.get(getUserId(m))
const setSession = (m, data) => global.akinatorSessions.set(getUserId(m), data)
const deleteSession = (m) => global.akinatorSessions.delete(getUserId(m))

/* ============================================================
 * COOKIE HANDLERS
 * ========================================================== */

function updateCookies(jar, headers) {
  const setCookies = headers && headers['set-cookie']
  if (!setCookies) return

  for (let c of setCookies) {
    const kv = c.split(';')[0]
    const index = kv.indexOf('=')
    if (index === -1) continue

    const key = kv.slice(0, index).trim()
    const value = kv.slice(index + 1).trim()
    jar[key] = value
  }
}

function cookieString(jar) {
  return Object.keys(jar)
    .map((key) => `${key}=${jar[key]}`)
    .join('; ')
}

/* ============================================================
 * AKINATOR CORE FUNCTIONS
 * ========================================================== */

async function startGame(theme = 'characters', childMode = false) {
  const got = await loadGotScraping()
  const sid = THEMES[theme] || THEMES.characters
  const jar = {}

  const homeRes = await got({
    url: `${BASE_URL}/`,
    throwHttpErrors: false
  })
  updateCookies(jar, homeRes.headers)

  const res = await got({
    url: `${BASE_URL}/game`,
    method: 'POST',
    form: { sid: String(sid), cm: String(childMode) },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      cookie: cookieString(jar)
    },
    throwHttpErrors: false
  })
  updateCookies(jar, res.headers)

  const $ = cheerio.load(res.body)
  const question = $('#question-label').text().trim()
  const sessionMatch = res.body.match(/name="session"[^>]*value="([^"]+)"/)
  const signatureMatch = res.body.match(/name="signature"[^>]*value="([^"]+)"/)
  const akitudeMatch = res.body.match(/akitude[^"]*"[^"]*([^/]+\.png)"/)

  const session = sessionMatch ? sessionMatch[1] : null
  const signature = signatureMatch ? signatureMatch[1] : null
  const akitude = akitudeMatch ? akitudeMatch[1] : 'defi.png'

  if (!session || !signature) {
    return { status: false, error: 'Gagal mengambil session/signature Akinator.' }
  }

  return {
    status: true,
    session,
    signature,
    question,
    step: 0,
    progression: 0,
    akitude,
    sid,
    theme,
    childMode,
    cookies: jar
  }
}

async function answerGame(game, ans) {
  const got = await loadGotScraping()
  let answerId

  if (typeof ans === 'number') {
    answerId = ans
  } else {
    const answerKey = String(ans).toLowerCase()
    answerId = typeof ANSWERS[answerKey] !== 'undefined' ? ANSWERS[answerKey] : -1
  }

  if (answerId === -1) {
    return { status: false, error: 'Jawaban tidak valid.' }
  }

  const res = await got({
    url: `${BASE_URL}/answer`,
    method: 'POST',
    form: {
      step: String(game.step),
      progression: String(game.progression),
      sid: String(game.sid),
      cm: String(game.childMode),
      answer: String(answerId),
      session: game.session,
      signature: game.signature
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      cookie: cookieString(game.cookies || {})
    },
    throwHttpErrors: false
  })

  if (res.headers) updateCookies(game.cookies || {}, res.headers)

  let data
  try {
    data = JSON.parse(res.body)
  } catch (e) {
    return { status: false, error: 'Gagal membaca response Akinator.' }
  }

  if (data.completion === 'KO') {
    return { status: false, error: 'Session Akinator sudah expired.' }
  }

  if (data.id_proposition) {
    return {
      status: true,
      won: true,
      name: data.name_proposition,
      description: data.description_proposition,
      photo: data.photo,
      pseudo: data.pseudo
    }
  }

  return {
    status: true,
    won: false,
    question: data.question,
    step: parseInt(data.step),
    progression: parseFloat(data.progression),
    akitude: data.akitude
  }
}

async function backGame(game) {
  const got = await loadGotScraping()
  const res = await got({
    url: `${BASE_URL}/cancel_answer`,
    method: 'POST',
    form: {
      step: String(game.step),
      progression: String(game.progression),
      sid: String(game.sid),
      cm: String(game.childMode),
      session: game.session,
      signature: game.signature
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      cookie: cookieString(game.cookies || {})
    },
    throwHttpErrors: false
  })

  let data
  try {
    data = JSON.parse(res.body)
  } catch (e) {
    return { status: false, error: 'Gagal membaca response Akinator.' }
  }

  return {
    status: true,
    question: data.question,
    step: parseInt(data.step),
    progression: parseFloat(data.progression),
    akitude: data.akitude
  }
}

async function excludeGame(game) {
  const got = await loadGotScraping()
  const res = await got({
    url: `${BASE_URL}/exclude`,
    method: 'POST',
    form: {
      step: String(game.step),
      progression: String(game.progression),
      sid: String(game.sid),
      cm: String(game.childMode),
      session: game.session,
      signature: game.signature,
      step_last_proposition: String(game.step)
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      cookie: cookieString(game.cookies || {})
    },
    throwHttpErrors: false,
    followRedirect: true
  })

  try {
    const data = JSON.parse(res.body)
    return {
      status: true,
      question: data.question,
      step: parseInt(data.step),
      progression: parseFloat(data.progression),
      akitude: data.akitude
    }
  } catch (e) {
    const $ = cheerio.load(res.body)
    const question = $('#question-label').text().trim()

    if (!question) {
      return { status: false, error: 'Akinator menolak exclude.' }
    }

    const newSession = res.body.match(/name="session"[^>]*value="([^"]+)"/)
    const newSignature = res.body.match(/name="signature"[^>]*value="([^"]+)"/)

    return {
      status: true,
      question,
      step: 0,
      progression: 0,
      akitude: 'defi.png',
      newSession: newSession ? newSession[1] : game.session,
      newSignature: newSignature ? newSignature[1] : game.signature
    }
  }
}

/* ============================================================
 * MESSAGE TEMPLATES
 * ========================================================== */

function questionText(game) {
  return `╭───〔 🎩 AKINATOR 〕───
│
│ ❓ ${game.question}
│
│ 1. Ya
│ 2. Tidak
│ 3. Tidak tahu
│ 4. Mungkin
│ 5. Mungkin tidak
│
│ Progress: ${game.progression}%
│ Step: ${game.step}
│
╰─────────────────────

Balas dengan:
.akinator 1
.akinator 2
.akinator 3
.akinator 4
.akinator 5

Ketik .akinator stop untuk berhenti.`
}

/* ============================================================
 * CORE AKINATOR LOGIC
 * ========================================================== */

async function executeAkinator(conn, mek, m, args, reply, usedPrefix, command) {
  const sub = args[0] ? String(args[0]).toLowerCase() : ''

  // --- STOP ---
  if (sub === 'stop' || sub === 'cancel') {
    if (!getSession(m)) return reply('❌ Kamu sedang tidak bermain Akinator.')
    deleteSession(m)
    return reply('🛑 Permainan Akinator dihentikan.')
  }

  // --- BACK ---
  if (sub === 'back' || sub === 'mundur') {
    const gameBack = getSession(m)
    if (!gameBack) return reply('❌ Belum ada permainan Akinator.')

    try {
      const resultBack = await backGame(gameBack)
      if (!resultBack.status) {
        deleteSession(m)
        return reply(`❌ ${resultBack.error}`)
      }

      Object.assign(gameBack, {
        question: resultBack.question,
        step: resultBack.step,
        progression: resultBack.progression,
        akitude: resultBack.akitude
      })
      setSession(m, gameBack)
      return reply(questionText(gameBack))
    } catch (e) {
      return reply(`❌ Error back:\n${e.message}`)
    }
  }

  // --- EXCLUDE ---
  if (sub === 'exclude') {
    const gameExclude = getSession(m)
    if (!gameExclude) return reply('❌ Belum ada permainan Akinator.')

    try {
      const resultExclude = await excludeGame(gameExclude)
      if (!resultExclude.status) {
        deleteSession(m)
        return reply(`❌ ${resultExclude.error}`)
      }

      if (resultExclude.newSession) {
        gameExclude.session = resultExclude.newSession
        gameExclude.signature = resultExclude.newSignature
      }

      Object.assign(gameExclude, {
        question: resultExclude.question,
        step: resultExclude.step,
        progression: resultExclude.progression,
        akitude: resultExclude.akitude
      })

      setSession(m, gameExclude)
      return reply(questionText(gameExclude))
    } catch (e) {
      return reply(`❌ Error exclude:\n${e.message}`)
    }
  }

  // --- ANSWER ---
  const validNumbers = ['1', '2', '3', '4', '5']
  if (validNumbers.includes(sub) || typeof ANSWERS[sub] !== 'undefined') {
    const gameAnswer = getSession(m)
    if (!gameAnswer) {
      return reply(`❌ Belum ada permainan.\n\nMulai dengan:\n${usedPrefix}${command}`)
    }

    const answerMap = {
      '1': 'yes',
      '2': 'no',
      '3': 'idk',
      '4': 'probably',
      '5': 'probably not'
    }
    const answer = answerMap[sub] || sub

    try {
      const resultAnswer = await answerGame(gameAnswer, answer)
      if (!resultAnswer.status) {
        deleteSession(m)
        return reply(`❌ ${resultAnswer.error}`)
      }

      // -- WIN --
      if (resultAnswer.won) {
        deleteSession(m)
        let text = `╭───〔 🎩 AKINATOR 〕───\n` +
                   `│\n` +
                   `│ 🎯 Aku tahu jawabannya!\n` +
                   `│\n` +
                   `│ 👤 ${resultAnswer.name || 'Tidak diketahui'}\n` +
                   `│\n` +
                   `│ 📝 ${resultAnswer.description || 'Tidak ada deskripsi'}\n` +
                   `│\n` +
                   `╰─────────────────────`

        if (resultAnswer.pseudo) text += `\n\n👨‍💻 Pseudo: ${resultAnswer.pseudo}`

        if (resultAnswer.photo) {
          try {
            return await conn.sendMessage(
              m.chat,
              { image: { url: resultAnswer.photo }, caption: text },
              { quoted: m }
            )
          } catch (e) {
            return reply(text)
          }
        }
        return reply(text)
      }

      // -- NEXT QUESTION --
      Object.assign(gameAnswer, {
        question: resultAnswer.question,
        step: resultAnswer.step,
        progression: resultAnswer.progression,
        akitude: resultAnswer.akitude
      })
      setSession(m, gameAnswer)
      return reply(questionText(gameAnswer))

    } catch (e) {
      return reply(`❌ Terjadi error saat menjawab:\n${e.message}`)
    }
  }

  // --- START ---
  if (!sub || sub === 'start' || sub === 'mulai') {
    if (getSession(m)) {
      return reply(`⚠️ Kamu masih punya permainan Akinator aktif.\n\nJawab dengan:\n${usedPrefix}${command} 1-5\n\nAtau ketik:\n${usedPrefix}${command} stop`)
    }

    const theme = args[1] ? String(args[1]).toLowerCase() : 'characters'
    if (!THEMES[theme]) {
      return reply(`❌ Tema tidak valid.\n\nTema tersedia:\n• characters\n• animals\n• objects`)
    }

    await reply('🎩 Memanggil Akinator...')

    try {
      const newGame = await startGame(theme, false)
      if (!newGame.status) return reply(`❌ ${newGame.error}`)

      setSession(m, newGame)
      return reply(questionText(newGame))
    } catch (e) {
      return reply(`❌ Gagal memulai Akinator:\n${e.message}`)
    }
  }

  // --- HELP ---
  return reply(`🎩 *AKINATOR*\n\n` +
                 `Cara bermain:\n${usedPrefix}${command}\n\n` +
                 `Jawaban:\n1. Ya\n2. Tidak\n3. Tidak tahu\n4. Mungkin\n5. Mungkin tidak\n\n` +
                 `Perintah:\n${usedPrefix}${command} back\n${usedPrefix}${command} exclude\n${usedPrefix}${command} stop`)
}

/* ============================================================
 * AUTO AKINATOR LISTENER (BODY HOOK)
 * ========================================================== */

cmd({
  on: "body"
}, async (conn, mek, m, { from, body }) => {
  try {
    if (!body) return;
    const rawText = body.trim().toLowerCase();
    const triggers = ['akinator', 'yakinator'];

    const matchedTrigger = triggers.find(t => rawText === t || rawText.startsWith(t + ' '));
    if (matchedTrigger) {
      const argsText = body.slice(matchedTrigger.length).trim();
      const args = argsText ? argsText.split(' ') : [];
      const prefix = config.PREFIX || '.';
      await executeAkinator(
        conn,
        mek,
        m,
        args,
        (text) => conn.sendMessage(from, { text }, { quoted: mek }),
        prefix,
        matchedTrigger
      );
    }
  } catch (error) {
    console.error("Auto-Body Akinator Error:", error);
  }
});

/* ============================================================
 * AKINATOR COMMAND (Prefix Version)
 * ========================================================== */

const handler = async (conn, mek, m, extra) => {
  const { args, reply, usedPrefix, command } = extra;
  await executeAkinator(conn, mek, m, args, reply, usedPrefix, command);
}

handler.help = [
  'akinator', 'akinator 1', 'akinator 2',
  'akinator 3', 'akinator 4', 'akinator 5',
  'akinator back', 'akinator exclude', 'akinator stop'
]
handler.tags = ['game']
handler.command = /^(akinator|yakinator)$/i
handler.limit = true

cmd({
  pattern: "akinator",
  alias: ["yakinator"],
  desc: "Play Akinator game",
  category: "game",
  react: "🎩",
  filename: __filename
}, handler);

export default handler
