import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "status76",
    alias: ["groupstatus7", "statusgc8", "gcstatus9", "swgc0", "sall12"],
    desc: "Broadcast status/media/links to ALL joined groups and mention everyone",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator }) => {
    
    // Sirf Owner/Creator hi broadcast command chala sakta hai
    if (!isCreator) return reply("❌ This command is only for owner!");

    try {
        // Quoted (Reply kiya hua) message nikalna
        const quotedMsg = m.quoted;
        
        // Mime type check karna (Image, Video, Audio ke liye)
        const mimeType = quotedMsg ? (quotedMsg.msg || quotedMsg).mimetype || '' : '';
        
        // Caption ya link text extract karna
        const caption = text?.trim() || "";
        
        // Agar na media par reply hai na hi koi text/link likha hai
        if (!quotedMsg && !caption) {
            return reply(
                `⚠️ Reply to media/audio or provide text/link!\n\n` +
                `Examples:\n` +
                `• .status https://chat.whatsapp.com/xxx\n` +
                `• Reply to an image/video/audio with: .status Check this out!`
            );
        }

        // Loading Reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Media Buffer Download karna (Agar quoted media ho)
        let mediaBuffer = null;
        let isPTT = false;
        let msgType = '';

        if (quotedMsg) {
            mediaBuffer = await quotedMsg.download();
            if (!mediaBuffer) throw new Error("Failed to download media!");

            isPTT = quotedMsg.message?.audioMessage?.ptt || false;
            msgType = Object.keys(quotedMsg.message || {})[0];
        }

        // Bot ke tamamm joined groups ki list nikalna
        const allGroups = await conn.groupFetchAllParticipating();
        const groupIds = Object.keys(allGroups);

        if (groupIds.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Bot kisi bhi group mein joined nahi hai!");
        }

        let successCount = 0;

        // HAR GROUP MEIN AUTOMATIC BROADCAST LOOP
        for (const targetGroupId of groupIds) {
            try {
                // Group ke members ki list (Mentions ke liye)
                const groupMetadata = await conn.groupMetadata(targetGroupId);
                const participants = groupMetadata.participants || [];
                const mentionedJid = participants.map(p => p.id);

                const contextInfo = {
                    isGroupStatus: true,
                    mentionedJid: mentionedJid
                };

                let messageContent = {};

                // Media Broadcast Logic
                if (quotedMsg) {
                    if (mimeType.startsWith('image/') || msgType === 'imageMessage') {
                        messageContent = {
                            image: mediaBuffer,
                            caption: caption || "",
                            mimetype: mimeType || 'image/jpeg',
                            contextInfo: contextInfo
                        };
                    } else if (mimeType.startsWith('video/') || msgType === 'videoMessage') {
                        messageContent = {
                            video: mediaBuffer,
                            caption: caption || "",
                            mimetype: mimeType || 'video/mp4',
                            contextInfo: contextInfo
                        };
                    } else if (mimeType.startsWith('audio/') || msgType === 'audioMessage' || msgType === 'pttMessage') {
                        messageContent = {
                            audio: mediaBuffer,
                            mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4',
                            ptt: isPTT,
                            contextInfo: contextInfo
                        };
                    }
                } 
                // Simple Text / Link Broadcast Logic
                else if (caption) {
                    messageContent = {
                        text: caption,
                        contextInfo: contextInfo
                    };
                }

                // Group mein Send Karein
                await conn.sendMessage(targetGroupId, messageContent);
                successCount++;

                // Anti-Ban Delay (1.5 seconds gap)
                await new Promise(resolve => setTimeout(resolve, 1500));

            } catch (err) {
                console.error(`Failed sending to group ${targetGroupId}:`, err.message);
            }
        }

        // Broadcast Complete Reaction & Summary
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        
        return reply(
            `📢 *MASS STATUS BROADCAST COMPLETED!*\n\n` +
            `👥 *Total Groups Joined:* ${groupIds.length}\n` +
            `✅ *Successfully Sent:* ${successCount}\n` +
            `❌ *Failed:* ${groupIds.length - successCount}\n\n` +
            `> *Sent to all group members with auto-mentions!*`
        );

    } catch (error) {
        console.error("Group Status Broadcast Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ Error: ${error.message}`);
    }
});
