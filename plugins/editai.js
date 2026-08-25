import axios from 'axios';
import FormData from 'form-data';
import { cmd } from '../command.js'; // اپنے کمانڈ ہینڈلر کا صحیح پاتھ (path) لکھیں

const IkyyProxy = 'https://api.ikyyxd.my.id/v2l/proxy-free/ikyy-xsample';

const CONFIG = {
    baseUrl: 'https://api-v2.imgupscaler.ai',
    referer: 'https://magiceraser.org/',
    origin: 'https://magiceraser.org',
    userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
};

let PROXY_LIST = [];
let currentProxyIndex = 0;

// Fetch proxies dynamically
async function fetchProxies() {
    try {
        const res = await axios.get(IkyyProxy, { timeout: 10000 });
        
        if (!Array.isArray(res.data) || res.data.length === 0) {
            throw new Error('Proxy API returned empty or invalid data');
        }

        PROXY_LIST = res.data.map(p => {
            const parts = p.split(':');
            if (parts.length !== 4) return null;
            
            const [host, port, username, password] = parts;
            return {
                protocol: 'http',
                host,
                port: parseInt(port),
                auth: { username, password }
            };
        }).filter(Boolean);
    } catch (err) {
        console.error(`Failed to fetch proxies: ${err.message}`);
    }
}

function generateRandomSerial() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getCleanHeaders(formHeaders = {}) {
    return {
        'User-Agent': CONFIG.userAgent,
        'Origin': CONFIG.origin,
        'Referer': CONFIG.referer,
        'Product-Code': 'magiceraser',
        'Product-Serial': generateRandomSerial(),
        'Router-Key': 'photo_editor_me_v6',
        'Sec-Ch-Ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?1',
        'Sec-Ch-Ua-Platform': '"Android"',
        ...formHeaders
    };
}

function getAxiosInstance() {
    const proxyConfig = PROXY_LIST.length > 0 ? PROXY_LIST[currentProxyIndex] : false;
    return axios.create({
        baseURL: CONFIG.baseUrl,
        timeout: 30000,
        validateStatus: () => true,
        proxy: proxyConfig
    });
}

function rotateProxy() {
    if (PROXY_LIST.length > 0) {
        currentProxyIndex = (currentProxyIndex + 1) % PROXY_LIST.length;
    }
}

async function checkRouterStatus(apiClient) {
    try {
        await apiClient.get('/api/pai/common/system-parameters', {
            params: { full_key: 'router_free.photo_editor_me_v6' },
            headers: getCleanHeaders()
        });
        return true;
    } catch (err) {
        return false;
    }
}

async function createJobFromUrl(apiClient, imageUrl, prompt) {
    const form = new FormData();
    form.append('model_name', 'magiceraser_v6');
    form.append('prompt', prompt);
    form.append('original_image_url', imageUrl);
    form.append('aspect_ratio', 'default');
    form.append('output_format', 'jpg');
    form.append('mode', 'editor');
    form.append('megapixels', '1');

    const res = await apiClient.post('/api/runtime/jobs/create-job', form, {
        headers: getCleanHeaders(form.getHeaders())
    });

    if (res.status !== 200 || !res.data?.code) {
        throw new Error(res.data?.message?.en || `Server Error (Code: ${res.status})`);
    }

    if (res.data.code !== 100000) {
        if (res.data.message?.en?.toLowerCase().includes('insufficient')) {
            throw new Error('INSUFFICIENT_CREDITS'); 
        }
        throw new Error(res.data.message?.en || `API Error (Code: ${res.data.code})`);
    }

    return res.data.result.job_id;
}

async function pollJobStatus(apiClient, jobId, maxAttempts = 40, interval = 3000) {
    for (let i = 1; i <= maxAttempts; i++) {
        const res = await apiClient.get(`/api/runtime/jobs/get-job/${jobId}`, {
            headers: getCleanHeaders()
        });
        
        const status = res.data?.result?.status;
        
        if (status === 1) return res.data.result.output_url;
        if (status === -1) throw new Error('AI processing failed on server.');
        
        await new Promise(r => setTimeout(r, interval));
    }
    throw new Error('Timeout waiting for AI result.');
}

// Main AI Process Function
export async function editImageAI(imageUrl, prompt) {
    if (PROXY_LIST.length === 0) {
        await fetchProxies();
    }

    let success = false;
    let attempts = 0;
    const maxTotalAttempts = Math.max(PROXY_LIST.length * 2, 3);
    let lastError = '';

    while (!success && attempts < maxTotalAttempts) {
        attempts++;
        try {
            const apiClient = getAxiosInstance();
            
            await checkRouterStatus(apiClient);
            const jobId = await createJobFromUrl(apiClient, imageUrl, prompt);
            const resultUrl = await pollJobStatus(apiClient, jobId);
            
            return resultUrl;

        } catch (error) {
            lastError = error.message;
            rotateProxy();
        }
    }
    throw new Error(lastError || "Failed to process image with available proxies.");
}

// ==========================================
//          WHATSAPP BOT COMMAND
// ==========================================

cmd({
    pattern: "editimg",
    alias: ["magiceraser", "eraseai", "editimage"],
    desc: "Edit image using Magic Eraser AI",
    category: "ai",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        const msg = mek || m;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isQuotedImage = quoted?.imageMessage;
        const isImage = msg.message?.imageMessage;

        if (!q) {
            await react("❌");
            return reply("⚠️ *براہ کرم پرامپٹ (Prompt) فراہم کریں!*\n\n*مثال:* `.editimg remove background` (تصویر کو کیپشن میں یا ریپلائی کر کے بھیجیں)");
        }

        if (!isImage && !isQuotedImage) {
            await react("❌");
            return reply("⚠️ *براہ کرم ایک تصویر کو ٹیگ کریں یا کیپشن کے ساتھ کمانڈ لگائیں!*");
        }

        await react("⏳");

        // Media Download and Upload Logic (Image Buffer to URL)
        const targetMsg = isQuotedImage ? quoted.imageMessage : msg.message.imageMessage;
        const stream = await conn.downloadContentFromMessage(targetMsg, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Host image temporarily using catbox.moe
        const uploadForm = new FormData();
        uploadForm.append('reqtype', 'fileupload');
        uploadForm.append('fileToUpload', buffer, { filename: 'image.jpg' });

        const uploadRes = await axios.post('https://catbox.moe/user/api.php', uploadForm, {
            headers: uploadForm.getHeaders()
        });

        const tempImageUrl = uploadRes.data?.trim();

        if (!tempImageUrl || !tempImageUrl.startsWith('http')) {
            await react("❌");
            return reply("❌ *تصویر کو سرور پر اپلوڈ کرنے میں ناکامی ہوئی۔*");
        }

        // Call AI Function
        const editedImageUrl = await editImageAI(tempImageUrl, q);

        if (!editedImageUrl) {
            await react("❌");
            return reply("❌ *تصویر ایڈٹ کرنے میں ناکامی ہوئی۔*");
        }

        // Send back edited image
        await conn.sendMessage(m.chat, {
            image: { url: editedImageUrl },
            caption: `✨ *AI Edit Result*\n\n📝 *Prompt:* ${q}`
        }, { quoted: mek });

        await react("✅");

    } catch (err) {
        console.error("EditImage Error:", err);
        await react("❌");
        await reply(`❌ *Error:* ${err.message}`);
    }
});
