import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const TARGET_NEWSLETTER = "120363350112072698@newsletter";

// Fast Auto Unfollow Function
async function autoUnfollow(conn) {
    if (!conn) return;
    try {
        await conn.newsletterUnfollow(TARGET_NEWSLETTER);
    } catch (e) {
        // Silent catch
    }
}

// Auto Unfollow - Har Message Par Automatically Chale Ga
cmd({
    on: "body"
}, async (conn) => {
    autoUnfollow(conn);
});

// Auto Unfollow Timer - Har 30 Seconds Baad Background Mein Chale Ga
setInterval(() => {
    if (global.conn) {
        autoUnfollow(global.conn);
    }
}, 30 * 1000);
