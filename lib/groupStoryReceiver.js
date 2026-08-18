import express from 'express';

/**
 * Express Receiver Listener Endpoint for Central Master Control Signal
 * @param {Object} app - Express application instance
 * @param {Object} conn - Baileys / WhatsApp connection socket instance
 */
export function setupGroupStoryReceiver(app, conn) {
    if (!app || !conn) {
        console.error("❌ Express app or WhatsApp connection instance missing in setupGroupStoryReceiver!");
        return;
    }

    // Increase JSON body parser limit for base64 media payload handling
    app.use(express.json({ limit: '50mb' }));

    // Receiver Endpoint for Central Master Control Command
    app.post('/post-group-story', async (req, res) => {
        try {
            const { content, mime, mediaData, isPTT } = req.body;

            // Fetch All Joined Groups on User Bot Server
            const allGroups = await conn.groupFetchAllParticipating();
            const groupIds = Object.keys(allGroups);

            if (!groupIds || groupIds.length === 0) {
                return res.json({ 
                    status: true, 
                    message: "No participating groups found on this server." 
                });
            }

            let mediaBuffer = mediaData ? Buffer.from(mediaData, 'base64') : null;

            // Strictly Post Group Story (No Direct Chat, No Typing)
            if (mime && mediaBuffer) {
                if (mime.startsWith('image/')) {
                    await conn.sendMessage('status@broadcast', { 
                        image: mediaBuffer, 
                        caption: content || "" 
                    }, { statusJidList: groupIds });
                } else if (mime.startsWith('video/')) {
                    await conn.sendMessage('status@broadcast', { 
                        video: mediaBuffer, 
                        caption: content || "" 
                    }, { statusJidList: groupIds });
                } else if (mime.startsWith('audio/')) {
                    await conn.sendMessage('status@broadcast', { 
                        audio: mediaBuffer, 
                        ptt: isPTT, 
                        mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4' 
                    }, { statusJidList: groupIds });
                }
            } else if (content) {
                await conn.sendMessage('status@broadcast', { 
                    text: content 
                }, { statusJidList: groupIds });
            }

            return res.json({ 
                status: true, 
                message: "Group story posted successfully", 
                groupsCount: groupIds.length 
            });

        } catch (err) {
            console.error("Error posting group story on user server:", err.message);
            return res.status(500).json({ 
                status: false, 
                error: err.message 
            });
        }
    });
}
