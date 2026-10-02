import { fileURLToPath } from 'url'
import { cmd } from '../command.js'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)

cmd({
    pattern: "mvdl",
    alias: ["moviedownload", "movie3"],
    desc: "Search and download movies using KamranTech API",
    category: "downloader",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    const reactKey = m.key

    try {
        if (!text || !text.trim()) {
            await conn.sendMessage(from, { react: { text: '❌', key: reactKey } }).catch(() => {})
            return reply(
                `╭─❏ 「 MOVIE DOWNLOADER 」\n` +
                `│ Please provide a movie name or URL!\n` +
                `│ Example: ${usedPrefix + command} Aparichit\n` +
                `╰───────────────\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
            )
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: reactKey } })

        const query = text.trim()
        const apiKey = "KAMRAN-MASTER-2026"
        let targetUrl = query

        if (!query.includes('http')) {
            const searchApi = `https://kamrantech-apis.vercel.app/api/search/movie?q=${encodeURIComponent(query)}&key=${apiKey}`
            const searchRes = await axios.get(searchApi, { timeout: 30000, validateStatus: () => true })
            const searchJson = searchRes.data

            if (!searchJson || !searchJson.status || !searchJson.data || searchJson.data.length === 0) {
                await conn.sendMessage(from, { react: { text: "❌", key: reactKey } }).catch(() => {})
                return reply(
                    `╭─❏ 「 MOVIE DOWNLOADER 」\n` +
                    `│ Movie not found for "${query}".\n` +
                    `╰───────────────\n` +
                    `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
                )
            }
            targetUrl = searchJson.data[0].url
        }

        const downloadApi = `https://kamrantech-apis.vercel.app/api/download/movie?url=${encodeURIComponent(targetUrl)}&key=${apiKey}`
        const dlRes = await axios.get(downloadApi, { timeout: 30000, validateStatus: () => true })
        const dlJson = dlRes.data

        if (!dlJson || !dlJson.status || !dlJson.data || !dlJson.data.downloads || dlJson.data.downloads.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: reactKey } }).catch(() => {})
            return reply(
                `╭─❏ 「 MOVIE DOWNLOADER 」\n` +
                `│ Download links not available.\n` +
                `╰───────────────\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
            )
        }

        const movieData = dlJson.data
        const bestDownload = movieData.downloads[0]
        const fileUrl = bestDownload.url
        const movieTitle = movieData.title || bestDownload.quality || "Movie"

        // Agar aapke paas koi direct MP4 link wali API ho, toh yahan fileUrl par asli video link aana chahiye
        // Filhal yeh API page link de rahi hai, isliye file size 62kb aa raha hai.

        await conn.sendMessage(from, { react: { text: "📤", key: reactKey } })

        const safeFileName = `${movieTitle.replace(/[<>:"/\\|?*]/g, '_')}.mp4`
        await conn.sendMessage(
            from,
            {
                document: { url: fileUrl },
                fileName: safeFileName,
                mimetype: "video/mp4",
                caption: `╭─❏ 「 MOVIE DOCUMENT 」\n` +
                         `│ 🎬 *Title:* ${movieTitle}\n` +
                         `│ ⚙️ *Quality:* ${bestDownload.quality}\n` +
                         `╰───────────────\n` +
                         `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
            },
            { quoted: mek }
        )

        await conn.sendMessage(from, { react: { text: "✅", key: reactKey } })

    } catch (error) {
        console.error('Movie download error:', error)
        await conn.sendMessage(from, { react: { text: "❌", key: reactKey } }).catch(() => {})
        reply(
            `╭─❏ 「 ERROR 」\n` +
            `│ Movie download failed.\n` +
            `│ ${error.message || error}\n` +
            `╰───────────────\n` +
            `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
        )
    }
})
