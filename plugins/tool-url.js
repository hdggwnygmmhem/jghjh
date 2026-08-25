import axios from 'axios';
import FormData from 'form-data';
import { cmd } from '../command.js'; // اپنے بوٹ کے کمانڈ ہینڈلر کا صحیح پاتھ رکھیں

// Helper function to upload file stream/buffer to host API
export async function uploadFileToHost(fileBuffer, fileName, host = 'catbox') {
    try {
        const form = new FormData();
        form.append('file', fileBuffer, { filename: fileName });

        const { data } = await axios.post(`https://api.ikyyxd.my.id/uploads?host=${host}`, form, {
            headers: { ...form.getHeaders() }
        });

        if (data && data.status) {
            let finalUrl = '';
            if (host === 'catbox') finalUrl = data.result;
            else if (host === 'uguu') finalUrl = data.result?.files?.[0]?.url;
            else if (host === 'cdn') finalUrl = data.result?.url;

            return { status: true, url: finalUrl, host };
        } else {
            throw new Error(data?.error || 'API Respon Gagal');
        }
    } catch (err) {
        return { status: false, error: err.response?.data?.error || err.message };
    }
}

// ==========================================
//          WHATSAPP BOT COMMAND
// ==========================================

cmd({
    pattern: "tourl",
    alias: ["url", "upload", "catbox", "uguu"],
    desc: "Upload image, video or document file to URL",
    category: "tools",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        const isQuotedMedia = mek.quoted && (
            mek.quoted.type === 'imageMessage' ||
            mek.quoted.type === 'videoMessage' ||
            mek.quoted.type === 'documentMessage' ||
            (mek.quoted.msg || mek.quoted).mimetype
        );

        const isMedia = (
            mek.type === 'imageMessage' ||
            mek.type === 'videoMessage' ||
            mek.type === 'documentMessage' ||
            (mek.msg || mek).mimetype
        );

        if (!isMedia && !isQuotedMedia) {
            await react("❌");
            return reply("⚠️ *براہ کرم کسی تصویر، ویڈیو یا فائل کو ریپلائی کر کے کمانڈ چلائیں!*\n\n*مثال:* `.tourl catbox` یا `.tourl uguu` یا `.tourl cdn`");
        }

        // Determine target host (default: catbox)
        let selectedHost = (q || '').toLowerCase().trim();
        if (!['catbox', 'uguu', 'cdn'].includes(selectedHost)) {
            selectedHost = 'catbox';
        }

        await react("⏳");
        await reply(`⏳ *فائل **${selectedHost.toUpperCase()}** پر اپ لوڈ کی جا رہی ہے...*`);

        // Download Media Buffer
        const targetMsg = isQuotedMedia ? mek.quoted : mek;
        const mediaBuffer = await targetMsg.download();
        
        const mime = (targetMsg.msg || targetMsg).mimetype || 'application/octet-stream';
        const ext = mime.split('/')[1]?.split(';')[0] || 'bin';
        const fileName = `upload_${Date.now()}.${ext}`;

        // Upload to selected host
        const res = await uploadFileToHost(mediaBuffer, fileName, selectedHost);

        if (!res.status || !res.url) {
            await react("❌");
            return reply(`❌ *اپ لوڈنگ میں ناکامی ہوئی:* ${res.error}`);
        }

        const caption = `✅ *فائل کامیابی سے اپ لوڈ ہو گئی!*\n\n🌐 *Host:* ${res.host.toUpperCase()}\n🔗 *URL:* ${res.url}`;

        await reply(caption);
        await react("✅");

    } catch (err) {
        console.error("Tourl Command Error:", err);
        await react("❌");
        await reply(`❌ *Error:* ${err.message}`);
    }
});
