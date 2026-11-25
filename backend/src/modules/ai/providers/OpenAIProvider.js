import fs from "fs";
import path from "path";
import BaseAIProvider, { AI_CAPABILITIES, PROVIDER_STATUS } from "./BaseAIProvider.js";
import { getBackendListenConfig } from "../../../configs/network.config.js";

const DESIGNS_DIR = path.resolve(process.cwd(), "uploads", "designs");
if (!fs.existsSync(DESIGNS_DIR)) {
  fs.mkdirSync(DESIGNS_DIR, { recursive: true });
}

export class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey = null) {
    super({
      id: "openai",
      name: "OpenAI GPT & GPT Image",
      defaultModel: "gpt-4o",
      capabilities: [
        AI_CAPABILITIES.CHAT,
        AI_CAPABILITIES.REASONING,
        AI_CAPABILITIES.VISION,
        AI_CAPABILITIES.TOOL_CALLING,
        AI_CAPABILITIES.STRUCTURED_OUTPUT,
        AI_CAPABILITIES.IMAGE_GENERATION,
        AI_CAPABILITIES.IMAGE_EDITING,
        AI_CAPABILITIES.STREAMING,
      ],
    });
    this.customApiKey = apiKey;
    this.defaultImageModel = "gpt-image-1-mini";
  }

  getApiKey() {
    return this.customApiKey || process.env.OPENAI_API_KEY || "";
  }

  getImageCostProfile() {
    return { kind: "METERED_KNOWN", estimatedCostUsd: 0.02 };
  }

  async getStatus() {
    const key = this.getApiKey();
    if (!key) return PROVIDER_STATUS.NOT_CONFIGURED;
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(6000),
      });
      if (res.status === 200) return PROVIDER_STATUS.CONNECTED;
      if (res.status === 401) return PROVIDER_STATUS.INVALID_KEY;
      if (res.status === 429) return PROVIDER_STATUS.RATE_LIMITED;
      return PROVIDER_STATUS.UNAVAILABLE;
    } catch {
      return PROVIDER_STATUS.UNAVAILABLE;
    }
  }

  async testConnection() {
    const start = Date.now();
    const key = this.getApiKey();
    if (!key) {
      return { success: false, status: PROVIDER_STATUS.NOT_CONFIGURED, message: "Chưa cấu hình OPENAI_API_KEY" };
    }
    try {
      const res = await fetch("https://api.openai.com/v1/models/gpt-4o-mini", {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(8000),
      });
      const latencyMs = Date.now() - start;
      if (res.status === 200) {
        return { success: true, status: PROVIDER_STATUS.CONNECTED, latencyMs, message: "Kết nối OpenAI thành công" };
      }
      return { success: false, status: res.status === 401 ? PROVIDER_STATUS.INVALID_KEY : PROVIDER_STATUS.UNAVAILABLE, latencyMs, message: `Lỗi kết nối OpenAI: HTTP ${res.status}` };
    } catch (err) {
      return { success: false, status: PROVIDER_STATUS.UNAVAILABLE, latencyMs: Date.now() - start, message: err.message };
    }
  }

  async chat({ messages, tools = [], model = null, temperature = 0.7, maxTokens = 2048 }) {
    const key = this.getApiKey();
    if (!key) throw new Error("OPENAI_NOT_CONFIGURED: Thiếu OPENAI_API_KEY");

    const targetModel = model || process.env.OPENAI_CHAT_MODEL || this.defaultModel;
    const body = {
      model: targetModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (tools && tools.length > 0) {
      body.tools = tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters || { type: "object", properties: {} },
        },
      }));
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(parseInt(process.env.AI_REQUEST_TIMEOUT_MS) || 60000),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenAI Chat API Error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    return {
      provider: "openai",
      model: targetModel,
      message: choice?.message?.content || "",
      toolCalls: choice?.message?.tool_calls || [],
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
    };
  }

  async analyzeVision({ imageUrls = [], prompt, model = "gpt-4o" }) {
    const key = this.getApiKey();
    if (!key) throw new Error("OPENAI_NOT_CONFIGURED: Thiếu OPENAI_API_KEY");

    const contentParts = [{ type: "text", text: prompt || "Phân tích hình ảnh này cho mục đích thiết kế thời trang và quảng cáo." }];
    for (const url of imageUrls) {
      contentParts.push({
        type: "image_url",
        image_url: { url },
      });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: model || "gpt-4o",
        messages: [{ role: "user", content: contentParts }],
        max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(parseInt(process.env.AI_REQUEST_TIMEOUT_MS) || 60000),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenAI Vision Error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    return {
      provider: "openai",
      model: model || "gpt-4o",
      analysis: data.choices?.[0]?.message?.content || "",
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
    };
  }

  async generateImage({ prompt, width = 1024, height = 1024, n = 1, style = "vivid", model = null }) {
    const key = this.getApiKey();
    if (!key) throw new Error("OPENAI_NOT_CONFIGURED: Thiếu OPENAI_API_KEY");

    const targetModel = model || process.env.OPENAI_IMAGE_MODEL || this.defaultImageModel;
    
    // Choose appropriate size
    let size = "1024x1024";
    if (height > width) {
      size = "1024x1792";
    } else if (width > height) {
      size = "1792x1024";
    }

    const body = {
      model: targetModel,
      prompt,
      n: Math.min(n, 1), // standard generation
      size,
    };

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenAI Image Generation Error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const images = (data.data || []).map((item, idx) => {
      let imgUrl = item.url;
      if (!imgUrl && item.b64_json) {
        const filename = `gen_${Date.now()}_${idx}.png`;
        const filepath = path.join(DESIGNS_DIR, filename);
        fs.writeFileSync(filepath, Buffer.from(item.b64_json, "base64"));
        imgUrl = `${getBackendListenConfig(process.env).publicUrl}/uploads/designs/${filename}`;
      }
      return {
        url: imgUrl,
        b64Data: item.b64_json ? `data:image/png;base64,${item.b64_json}` : null,
        revisedPrompt: item.revised_prompt || prompt,
        width,
        height,
      };
    });

    return {
      provider: "openai",
      model: targetModel,
      images,
      costUsd: 0.02 * images.length,
    };
  }
}

export default OpenAIProvider;
