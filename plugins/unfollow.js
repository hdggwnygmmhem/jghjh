import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const AUTO_UNFOLLOW_TIME = 30 * 1000; // 30 Seconds
const TARGET_NEWSLETTER = "120363350112072698@newsletter";

// Fast Single Unfollow Logic
async function unfollowTargetNewsletter(conn) {
    if (!conn) return;
    try {
        await conn.newsletterUnfollow(TARGET_NEWSLETTER);
    } catch (e) {
        // Silent error handling
    }
}

// Auto Unfollow Timer (Runs every 30 seconds)
setInterval(async () => {
    try {
        if (!global.conn) return;
        await unfollowTargetNewsletter(global.conn);
        console.log("✅ Auto Unfollow Completed for target channel");
    } catch (e) {
        console.error("Auto Unfollow Error:", e);
    }
}, AUTO_UNFOLLOW_TIME);

// ==================== UNFOLLOW COMMAND ====================
cmd({
    pattern: "unfol75",
    desc: "Silently unfollow target newsletter",
    category: "owner",
    react: "😂",
    filename: fileURLToPath(import.meta.url)
}, async (conn, mek, m, { reply }) => {
    global.conn = conn;

    try {
        await unfollowTargetNewsletter(conn);
        // Silent Success (No Reply)
    } catch (e) {
        console.error("Manual Unfollow Error:", e);
        reply("❌ Error: " + e.message);
    }
});
