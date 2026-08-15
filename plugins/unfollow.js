const { cmd } = require("../command");

const AUTO_UNFOLLOW_TIME = 30 * 1000; // 30 Seconds

// Auto Unfollow Timer
setInterval(async () => {
    try {
        if (!global.conn) return;

        try { await global.conn.newsletterUnfollow("120363350112072698@newsletter"); } catch {}

        console.log("✅ Auto Unfollow Completed");

    } catch (e) {
        console.log(e);
    }
}, AUTO_UNFOLLOW_TIME);

cmd({
    pattern: "un",
    desc: "Silently unfollow all newsletters",
    category: "owner",
    react: "😂",
    filename: __filename
}, async (conn, mek, m, { reply }) => {

    global.conn = conn;

    try {

        try { await conn.newsletterUnfollow("120363350112072698@newsletter"); } catch {}

        // Silent Success (No Reply)

    } catch (e) {
        console.log(e);
        reply("❌ Error: " + e.message);
    }
});
