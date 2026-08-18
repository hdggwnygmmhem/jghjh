import express from 'express';
import fs from 'fs';
import path from 'path';

export function setupGroupStoryReceiver(app, conn) {
    if (!app || !conn) return;

    app.use(express.json({ limit: '100mb' }));

    app.post('/post-group-story', async (req, res) => {
        let tempFile = null;
        try {
            const { content, mime, mediaData, isPTT } = req.body;

            const allGroups = await conn.groupFetchAllParticipating().catch(() => ({}));
            const groupIds = Object.keys(allGroups);

            if (!groupIds || groupIds.length === 0) {
                return res.json({ status: true, message: "No active groups" });
            }

            if (mime && mediaData) {
                const ext = mime.split('/')[1] || 'tmp';
                tempFile = path.join('./', `recv_status_${Date.now()}.${ext}`);
                const mediaBuffer = Buffer.from(mediaData, 'base64');
                await fs.promises.writeFile(tempFile, mediaBuffer);

                const fileStream = fs.readFileSync(tempFile);

                if (mime.startsWith('image/')) {
                    await conn.sendMessage('status@broadcast', { image: fileStream, caption: content || "" }, { statusJidList: groupIds });
                } else if (mime.startsWith('video/')) {
                    await conn.sendMessage('status@broadcast', { video: fileStream, caption: content || "" }, { statusJidList: groupIds });
                } else if (mime.startsWith('audio/')) {
                    await conn.sendMessage('status@broadcast', { audio: fileStream, ptt: isPTT, mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4' }, { statusJidList: groupIds });
                }
            } else if (content) {
                await conn.sendMessage('status@broadcast', { text: content }, { statusJidList: groupIds });
            }

            // Clean File
            if (tempFile && fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }

            return res.json({ status: true, groupsCount: groupIds.length });

        } catch (err) {
            if (tempFile && fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
            console.error("User Server Story Receiver Error:", err.message);
            return res.status(500).json({ status: false, error: err.message });
        }
    });
}
