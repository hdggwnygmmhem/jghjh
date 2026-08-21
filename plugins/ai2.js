import axios from 'axios';
import crypto from 'crypto';
import { cmd } from '../command.js'; // Apne command handler ka sahi path rakhein

// Kunci rahasia untuk enkripsi XOR dan penandatanganan HMAC
const ENCRYPTION_KEY = Buffer.from('@sk=Rigel5729%2-diordnA', 'utf-8');

// Daftar model bawaan (Mimo AI Models List)
export const MODEL_REGISTRY = [
  { id: 'xiaomi/mimo-v2.5', name: 'MiMo V2.5', provider: 'Xiaomi', premium: false },
  { id: 'xiaomi/mimo-v2-flash', name: 'MiMo V2 Flash', provider: 'Xiaomi', premium: false },
  { id: 'xiaomi/mimo-v2.5-pro', name: 'MiMo V2.5 Pro', provider: 'Xiaomi', premium: true },
  { id: 'deepseek/deepseek-v4-flash', name: 'DeepSeek v4 Flash', provider: 'DeepSeek', premium: false },
  { id: 'deepseek/deepseek-v4-pro', name: 'DeepSeek v4 Pro', provider: 'DeepSeek', premium: true },
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek v3.2', provider: 'DeepSeek', premium: true },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'Google', premium: false },
  { id: 'openai/gpt-5.4-nano', name: 'GPT-5.4 Nano', provider: 'OpenAI', premium: true },
  { id: 'z-ai/glm-4.7-flash', name: 'GLM 4.7 Flash', provider: 'Z.AI', premium: false }
];

/**
 * Utilitas Kriptografi untuk Mimo API
 */
export class MimoCrypto {
  static obfuscate(text) {
    if (!text) return '';
    const inputBuffer = Buffer.from(String(text), 'utf-8');
    const xorBuffer = Buffer.alloc(inputBuffer.length);

    for (let idx = 0; idx < inputBuffer.length; idx++) {
      xorBuffer[idx] = inputBuffer[idx] ^ ENCRYPTION_KEY[idx % ENCRYPTION_KEY.length];
    }
    
    return xorBuffer.toString('base64') + '\n';
  }

  static signRequest(rawJson, timestamp) {
    return crypto
      .createHmac('sha256', ENCRYPTION_KEY)
      .update(`${rawJson}:${timestamp}`, 'utf-8')
      .digest('base64');
  }

  static makeUuid(installTime, edition = 'full_edition') {
    const bytes = crypto.randomBytes(16).toString('hex');
    const parts = [
      bytes.substring(0, 8),
      bytes.substring(8, 12),
      bytes.substring(12, 16),
      bytes.substring(16, 20),
      bytes.substring(20, 32)
    ];
    const uuidFormat = parts.join('-');
    return `user_fi-${installTime}_uu-${uuidFormat}_pa-mimo_ed-${edition}_apv-3_anv-android__14__API__34)`;
  }
}

/**
 * Mimo AI Client class
 */
export class MimoAI {
  constructor(config = {}) {
    this.userAgent = config.userAgent || 'Neo/1.0';
    this.defaultModel = config.defaultModel || 'xiaomi/mimo-v2.5-pro';
  }

  async fetchModels() {
    try {
      const response = await axios.get('https://apps.clemy.top/ai/mimo/models.json', {
        headers: { 'User-Agent': this.userAgent },
        timeout: 5000
      });
      return response.data?.models || MODEL_REGISTRY;
    } catch (error) {
      return MODEL_REGISTRY;
    }
  }

  async sendMessage(params = {}) {
    const {
      prompt,
      messages = [],
      model = this.defaultModel,
      onStream = null
    } = params;

    const currentTime = Date.now();
    const installedTime = currentTime - 86400000;

    const conversationHistory = [...messages];
    if (prompt) {
      conversationHistory.push({ role: 'user', content: prompt });
    }

    const characterCount = conversationHistory.reduce(
      (total, msg) => total + (msg.content ? msg.content.length : 0), 
      0
    );

    const payload = {
      package: MimoCrypto.obfuscate('info.camposha.mimo'),
      uuid: MimoCrypto.obfuscate(MimoCrypto.makeUuid(installedTime, 'full_edition')),
      edition: MimoCrypto.obfuscate('full_edition'),
      subscription: MimoCrypto.obfuscate('monthly'),
      order_id: 'GPA.3312-4567-8901-23456',
      last_purchase_date: '2026-08-01',
      ai_model: MimoCrypto.obfuscate(model),
      messages: conversationHistory,
      token_usage: 0,
      thread_char_count: characterCount,
      is_premium: true,
      current_language: MimoCrypto.obfuscate('in'),
      app_version: MimoCrypto.obfuscate('3'),
      request_date: MimoCrypto.obfuscate(new Date().toISOString().split('T')[0]),
      request_time: currentTime,
      first_install: installedTime,
      version: MimoCrypto.obfuscate('android__14__API__34)'),
      session_requests: 1,
      current_session_ads: 0,
      android_id: MimoCrypto.obfuscate(crypto.randomBytes(8).toString('hex')),
      hw_fp: MimoCrypto.obfuscate(crypto.randomBytes(16).toString('hex')),
      is_rooted: false,
      is_emulator: false,
      tz: MimoCrypto.obfuscate('Asia/Jakarta'),
      currency: MimoCrypto.obfuscate('IDR'),
      country: MimoCrypto.obfuscate('ID'),
      gpa_id: 'GPA.3312-4567-8901-23456',
      extra: ''
    };

    const payloadJsonStr = JSON.stringify(payload);
    const timestampStr = String(currentTime);
    const signature = MimoCrypto.signRequest(payloadJsonStr, timestampStr);

    const apiResponse = await axios.post('https://aiv1.clemy.top/chat-completion-stream', payloadJsonStr, {
      headers: {
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Signature': signature,
        'X-Timestamp': timestampStr,
        'User-Agent': this.userAgent
      },
      responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
      let fullText = '';
      let streamBuffer = '';

      apiResponse.data.on('data', (chunk) => {
        streamBuffer += chunk.toString();
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop();

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data: ')) {
            const dataStr = cleanLine.substring(6).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const parsedData = JSON.parse(dataStr);
              const deltaContent = parsedData.choices?.[0]?.delta?.content;
              if (deltaContent) {
                fullText += deltaContent;
                if (onStream) {
                  onStream(deltaContent);
                }
              }
            } catch (err) {
              // Ignore invalid stream lines
            }
          }
        }
      });

      apiResponse.data.on('end', () => {
        const finalReply = fullText.trim();
        conversationHistory.push({ role: 'assistant', content: finalReply });
        resolve({
          response: finalReply,
          model,
          messages: conversationHistory
        });
      });

      apiResponse.data.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// Client Instantiation
const mimoClient = new MimoAI();

// ==========================================
//          WHATSAPP BOT COMMAND
// ==========================================

cmd({
    pattern: "mimo",
    alias: ["mimoai", "ai2"],
    desc: "Mimo AI Chat completion",
    category: "ai",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) {
            await react("❌");
            return reply("⚠️ *Sawal poochhein!*\n\n*Example:* `.mimo Hello, write a short poem.`");
        }

        await react("🧠");

        // Model selection via parameter (optional: model=deepseek/deepseek-v4-pro)
        let selectedModel = 'xiaomi/mimo-v2.5-pro';
        let promptText = q;

        if (q.includes('model=')) {
            const parts = q.split('model=');
            promptText = parts[0].trim();
            selectedModel = parts[1].trim();
        }

        const res = await mimoClient.sendMessage({
            prompt: promptText,
            model: selectedModel
        });

        if (!res || !res.response) {
            await react("❌");
            return reply("❌ *AI se koi jawab nahi mila.*");
        }

        await reply(res.response);
        await react("✅");

    } catch (e) {
        console.error(e);
        await react("❌");
        await reply(`❌ *Error:* ${e.message}`);
    }
});
