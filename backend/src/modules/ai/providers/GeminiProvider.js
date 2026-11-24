import BaseAIProvider, { AI_CAPABILITIES, PROVIDER_STATUS, classifyProviderFailure } from "./BaseAIProvider.js";

export class GeminiProvider extends BaseAIProvider {
  constructor(apiKey = null) {
    super({
      id: "gemini",
      name: "Google Gemini 2.0 & Imagen",
      defaultModel: "google/gemini-3.8-flash",
      capabilities: [
        AI_CAPABILITIES.CHAT,
        AI_CAPABILITIES.REASONING,
        AI_CAPABILITIES.VISION,
        AI_CAPABILITIES.TOOL_CALLING,
        AI_CAPABILITIES.STRUCTURED_OUTPUT,
        AI_CAPABILITIES.IMAGE_GENERATION,
        AI_CAPABILITIES.STREAMING,
      ],
    });
    this.customApiKey = apiKey;
    this.defaultDirectModel = process.env.GEMINI_DIRECT_MODEL || "gemini-2.0-flash";
    this.defaultGatewayModel = process.env.OPENROUTER_GEMINI_MODEL || "google/gemini-3.8-flash";
    this.defaultImageModel = "imagen-3.0-generate-002";
  }

  getApiKey() {
    return this.customApiKey || process.env.GEMINI_API_KEY || "";
  }

  getOpenRouterKey() {
    return process.env.OPENROUTER_API_KEY || "";
  }

  async getStatus() {
    const key = this.getApiKey();
    if (!key) return this.getOpenRouterKey() ? PROVIDER_STATUS.CONFIGURED_UNVERIFIED : PROVIDER_STATUS.NOT_CONFIGURED;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (res.status === 200) return PROVIDER_STATUS.CONNECTED;
      if (res.status === 400 || res.status === 403) return PROVIDER_STATUS.INVALID_KEY;
      if (res.status === 429) return PROVIDER_STATUS.RATE_LIMITED;
      return PROVIDER_STATUS.UNAVAILABLE;
    } catch {
      return PROVIDER_STATUS.UNAVAILABLE;
    }
  }

  async testConnection() {
    const start = Date.now();
    const key = this.getApiKey();
    if (!key && !this.getOpenRouterKey()) {
      return {
        success: false,
        status: PROVIDER_STATUS.NOT_CONFIGURED,
        message: "Chưa cấu hình GEMINI_API_KEY. Quý quản trị viên có thể nhập key tại Cài Đặt AI.",
      };
    }

    try {
      if (!key) {
        const gatewayResult = await this.chat({
          messages: [{ role: "user", content: "Reply with exactly: pong" }],
          maxTokens: 5,
          temperature: 0,
        });
        return { success: Boolean(gatewayResult.message), status: PROVIDER_STATUS.CONNECTED, latencyMs: Date.now() - start, message: "Gemini qua OpenRouter đã phản hồi" };
      }
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "Ping" }] }] }),
          signal: AbortSignal.timeout(8000),
        }
      );
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return { success: true, status: PROVIDER_STATUS.CONNECTED, latencyMs, message: "Kết nối Google Gemini thành công" };
      }
      return {
        success: false,
        status: res.status === 403 ? PROVIDER_STATUS.INVALID_KEY : res.status === 429 ? PROVIDER_STATUS.RATE_LIMITED : PROVIDER_STATUS.UNAVAILABLE,
        latencyMs,
        message: `Lỗi Gemini API: HTTP ${res.status}`,
      };
    } catch (err) {
      return { success: false, latencyMs: Date.now() - start, ...classifyProviderFailure(err) };
    }
  }

  async chat({ messages, tools = [], model = null, temperature = 0.7, maxTokens = 2048 }) {
    const directKey = this.getApiKey();
    const targetModel = model || process.env.GEMINI_CHAT_MODEL || (directKey ? this.defaultDirectModel : this.defaultGatewayModel);

    if (directKey) {
      // Direct Google Generative Language API
      const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const body = { contents, generationConfig: { temperature, maxOutputTokens: maxTokens } };
      if (tools && tools.length > 0) {
        body.tools = [
          {
            functionDeclarations: tools.map((t) => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            })),
          },
        ];
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${directKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(parseInt(process.env.AI_REQUEST_TIMEOUT_MS) || 60000),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini Direct API Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const part = candidate?.content?.parts?.[0];
      const functionCalls = candidate?.content?.parts
        ?.filter((p) => p.functionCall)
        .map((p) => ({
          id: `call_${Date.now()}`,
          function: {
            name: p.functionCall.name,
            arguments: JSON.stringify(p.functionCall.args || {}),
          },
        }));

      return {
        provider: "gemini",
        model: targetModel,
        message: part?.text || "",
        toolCalls: functionCalls || [],
        usage: {
          inputTokens: data.usageMetadata?.promptTokenCount || 0,
          outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
        },
      };
    }

    // OpenRouter Unified Gateway for Gemini
    const orKey = this.getOpenRouterKey();
    if (!orKey) throw new Error("GEMINI_NOT_CONFIGURED: Thiếu GEMINI_API_KEY hoặc OPENROUTER_API_KEY");

    const orModel = targetModel.includes("/") ? targetModel : `google/${targetModel}`;
    const body = {
      model: orModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    };
    if (tools && tools.length > 0) {
      body.tools = tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${orKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(parseInt(process.env.AI_REQUEST_TIMEOUT_MS) || 60000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini via Gateway Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    return {
      provider: "gemini",
      model: orModel,
      message: choice?.message?.content || "",
      toolCalls: choice?.message?.tool_calls || [],
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
    };
  }

  async analyzeVision({ imageUrls = [], prompt, model = "gemini-2.0-flash-001" }) {
    const directKey = this.getApiKey();
    if (directKey) {
      const parts = [{ text: prompt || "Phân tích hình ảnh này cho mục đích thiết kế thời trang và quảng cáo." }];
      for (const url of imageUrls) {
        parts.push({
          fileData: { fileUri: url, mimeType: "image/jpeg" },
        });
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${directKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts }] }),
          signal: AbortSignal.timeout(60000),
        }
      );

      if (res.ok) {
        const data = await res.json();
        return {
          provider: "gemini",
          model,
          analysis: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
          usage: {
            inputTokens: data.usageMetadata?.promptTokenCount || 0,
            outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
          },
        };
      }
    }

    // Fallback to OpenRouter Multimodal
    const orKey = this.getOpenRouterKey();
    if (!orKey) throw new Error("GEMINI_NOT_CONFIGURED: Thiếu API key cho Vision");

    const contentParts = [{ type: "text", text: prompt || "Phân tích hình ảnh này." }];
    for (const url of imageUrls) {
      contentParts.push({ type: "image_url", image_url: { url } });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${orKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.defaultGatewayModel,
        messages: [{ role: "user", content: contentParts }],
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) throw new Error(`Gemini Vision Error: HTTP ${res.status}`);
    const data = await res.json();
    return {
      provider: "gemini",
      model: this.defaultGatewayModel,
      analysis: data.choices?.[0]?.message?.content || "",
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
    };
  }

  async generateImage({ prompt, width = 1024, height = 1024, n = 1, style = "vivid", model = null }) {
    // Imagen 3 or OpenRouter Image Generation
    const directKey = this.getApiKey();
    if (directKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${directKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instances: [{ prompt }],
              parameters: { sampleCount: Math.min(n, 4), aspectRatio: width >= height ? "1:1" : "3:4" },
            }),
            signal: AbortSignal.timeout(90000),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const images = (data.predictions || []).map((pred) => ({
            url: `data:image/png;base64,${pred.bytesBase64Encoded}`,
            revisedPrompt: prompt,
            width,
            height,
          }));
          return { provider: "gemini", model: "imagen-3.0-generate-002", images, costUsd: 0.03 * images.length };
        }
      } catch (err) {
        console.warn("[GeminiProvider] Direct Imagen error, falling back:", err.message);
      }
    }

    // Fallback: Generate via OpenRouter or OpenAI
    if (process.env.OPENAI_API_KEY) {
      const { OpenAIProvider } = await import("./OpenAIProvider.js");
      const openai = new OpenAIProvider();
      return await openai.generateImage({ prompt, width, height, n, style });
    }

    throw new Error("Không thể tạo hình ảnh với Gemini: Cần cấu hình GEMINI_API_KEY hoặc OPENAI_API_KEY");
  }
}

export default GeminiProvider;
