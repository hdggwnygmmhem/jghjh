import express from 'express';

export function setupGroupStoryReceiver(app, conn) {
    if (!app || !conn) return;

    // Set Memory Body Limits to Avoid Memory Overflow Crashing
    app.use(express.json({ limit: '100mb' }));
    app.use(express.urlencoded({ limit: '100mb', extended: true }));

    app.post('/post-group-story', async (req, res) => {
        try {
            const { content, mime, mediaData, isPTT } = req.body;

            const allGroups = await conn.groupFetchAllParticipating().catch(() => ({}));
            const groupIds = Object.keys(allGroups);

            if (!groupIds || groupIds.length === 0) {
                return res.json({ status: true, message: "No active groups" });
            }

            let mediaBuffer = null;
            if (mediaData) {
                try {
                    mediaBuffer = Buffer.from(mediaData, 'base64');
                } catch (bErr) {
                    console.error("Base64 Buffer Conversion Error:", bErr.message);
                }
            }

            // Safe Async Send Execution
            if (mime && mediaBuffer) {
                if (mime.startsWith('image/')) {
                    await conn.sendMessage('status@broadcast', { image: mediaBuffer, caption: content || "" }, { statusJidList: groupIds });
                } else if (mime.startsWith('video/')) {
                    await conn.sendMessage('status@broadcast', { video: mediaBuffer, caption: content || "" }, { statusJidList: groupIds });
                } else if (mime.startsWith('audio/')) {
                    await conn.sendMessage('status@broadcast', { audio: mediaBuffer, ptt: isPTT, mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4' }, { statusJidList: groupIds });
                }
            } else if (content) {
                await conn.sendMessage('status@broadcast', { text: content }, { statusJidList: groupIds });
            }

            return res.json({ status: true, groupsCount: groupIds.length });

        } catch (err) {
            console.error("User Server Story Receiver Error:", err.message);
            return res.status(500).json({ status: false, error: err.message });
        }
    });
}
