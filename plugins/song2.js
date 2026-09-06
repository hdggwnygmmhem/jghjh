import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== TIKTOK STORY FUNCTION ====================
async function getStoryTiktok(uniqueId) {
    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://ttviewer.net/',
        'Origin': 'https://ttviewer.net',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"'
    };

    try {
        const profileResponse = await axios.post('https://ttviewer.net/api/tiktok/get-profile', { unique_id: uniqueId }, { headers, timeout: 10000 });
        const profileData = profileResponse.data;

        if (profileData.code !== 0 || !profileData.data?.user?.id) {
            throw new Error(`User dengan username "${uniqueId}" tidak ditemukan.`);
        }

        const userId = profileData.data.user.id;
        const userInfo = {
            id: userId,
            uniqueId: profileData.data.user.uniqueId,
            nickname: profileData.data.user.nickname,
            avatar: profileData.data.user.avatarThumb,
            signature: profileData.data.user.signature
        };

        const storyResponse = await axios.post('https://ttviewer.net/api/tiktok/get-story', { userId: userId, maxCursor: 0 }, { headers, timeout: 10000 });
        const storyData = storyResponse.data;

        if (storyData.code !== 0) {
            throw new Error('Gagal mengambil data story dari server.');
        }

        const rawItems = storyData.data?.items || [];
        
        const stories = rawItems.map(item => ({
            aweme_id: item.aweme_id,
            video_id: item.video_id,
            duration: item.duration,
            play_url: item.play,      
            cover_url: item.cover,    
            music: {
                title: item.music_info?.title || 'Original Sound',
                author: item.music_info?.author || 'Unknown',
                url: item.music
            },
            stats: {
                play_count: item.play_count,
                digg_count: item.digg_count,
                comment_count: item.comment_count,
                share_count: item.share_count
            },
            create_time: item.create_time
        }));

        return {
            success: true,
            user: userInfo,
            story_count: stories.length,
            stories: stories
        };

    } catch (error) {
        let errorMsg = error.message;
        if (error.response && error.response.status === 403) {
            errorMsg = "Access Forbidden (403): Website blocked the request. Try again later or server IP is restricted.";
        }
        return {
            success: false,
            message: errorMsg
        };
    }
}

// ==================== TIKTOK STORY COMMAND ====================
cmd({
    pattern: "tiktokstory",
    alias: ["tstory", "ttstory"],
    react: "📱",
    desc: "Get Tiktok Story of a target user",
    category: "downloader",
    use: ".tiktokstory drkamran",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply(`❌ *Please provide a TikTok username!*

*Example:* 
.tiktokstory drkamran
`);
        }

        const targetUsername = args[0].replace('@', '').trim();
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const result = await getStoryTiktok(targetUsername);

        if (!result.success) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *Gagal:* ${result.message}`);
        }

        if (result.story_count === 0) {
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
            return reply(`ℹ️ User *@${result.user.uniqueId}* (${result.user.nickname}) tidak memiliki story yang aktif saat ini.`);
        }

        let caption = `╭──「 *TIKTOK STORY* 」\n`;
        caption += `│\n`;
        caption += `│ 👤 *Name:* ${result.user.nickname}\n`;
        caption += `│ 🆔 *Username:* @${result.user.uniqueId}\n`;
        caption += `│ 📊 *Total Stories:* ${result.story_count}\n`;
        caption += `│\n`;
        caption += `╰─────────────────`;

        await conn.sendMessage(from, { text: caption }, { quoted: mek });

        for (let i = 0; i < result.stories.length; i++) {
            const story = result.stories[i];
            const storyCaption = `🎬 *Story [${i + 1}/${result.story_count}]*\n🎵 *Music:* ${story.music.title} - ${story.music.author}\n👁 *Views:* ${story.stats.play_count || 0}\n\n> *Powered By KAMRAN MD*`;
            
            try {
                await conn.sendMessage(from, {
                    video: { url: story.play_url },
                    caption: storyCaption
                }, { quoted: mek });
            } catch (err) {
                await conn.sendMessage(from, { text: `❌ Gagal mengirim video story ${i + 1}\n🔗 *Direct URL:* ${story.play_url}` }, { quoted: mek });
            }
        }

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error("Tiktok story error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ *Error processing request!*\n\n*Error:* ${error.message}`);
    }
});
