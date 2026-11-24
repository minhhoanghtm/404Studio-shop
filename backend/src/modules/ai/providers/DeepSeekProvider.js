import BaseAIProvider, { AI_CAPABILITIES, PROVIDER_STATUS, classifyProviderFailure } from "./BaseAIProvider.js";

export class DeepSeekProvider extends BaseAIProvider {
  constructor(apiKey = null) {
    super({
      id: "deepseek",
      name: "DeepSeek V3 & R1",
      defaultModel: "deepseek/deepseek-v4.1-flash",
      capabilities: [
        AI_CAPABILITIES.CHAT,
        AI_CAPABILITIES.REASONING,
        AI_CAPABILITIES.TOOL_CALLING,
        AI_CAPABILITIES.STRUCTURED_OUTPUT,
        AI_CAPABILITIES.STREAMING,
      ],
    });
    this.customApiKey = apiKey;
    this.defaultDirectModel = process.env.DEEPSEEK_DIRECT_MODEL || "deepseek-chat";
    this.defaultGatewayModel = process.env.OPENROUTER_DEEPSEEK_MODEL || "deepseek/deepseek-v4.1-flash";
  }

  getApiKey() {
    return this.customApiKey || process.env.DEEPSEEK_API_KEY || "";
  }

  getOpenRouterKey() {
    return process.env.OPENROUTER_API_KEY || "";
  }

  async getStatus() {
    const key = this.getApiKey();
    if (key) return PROVIDER_STATUS.CONFIGURED_UNVERIFIED;
    return this.getOpenRouterKey() ? PROVIDER_STATUS.CONFIGURED_UNVERIFIED : PROVIDER_STATUS.NOT_CONFIGURED;
  }

  async testConnection() {
    const start = Date.now();
    const key = this.getApiKey();

    if (!key && !this.getOpenRouterKey()) {
      return {
        success: false,
        status: PROVIDER_STATUS.NOT_CONFIGURED,
        message: "Chưa cấu hình DEEPSEEK_API_KEY. Quý quản trị viên có thể nhập key tại Cài Đặt AI.",
      };
    }

    try {
      if (!key) {
        const gatewayResult = await this.chat({ messages: [{ role: "user", content: "Reply with exactly: pong" }], maxTokens: 5, temperature: 0 });
        return { success: Boolean(gatewayResult.message), status: PROVIDER_STATUS.CONNECTED, latencyMs: Date.now() - start, message: "DeepSeek qua OpenRouter đã phản hồi" };
      }
      const res = await fetch("https://api.deepseek.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(8000),
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return { success: true, status: PROVIDER_STATUS.CONNECTED, latencyMs, message: "Kết nối DeepSeek thành công" };
      }
      return {
        success: false,
        status: res.status === 401 ? PROVIDER_STATUS.INVALID_KEY : res.status === 429 ? PROVIDER_STATUS.RATE_LIMITED : PROVIDER_STATUS.UNAVAILABLE,
        latencyMs,
        message: `Lỗi kết nối DeepSeek: HTTP ${res.status}`,
      };
    } catch (err) {
      return { success: false, latencyMs: Date.now() - start, ...classifyProviderFailure(err) };
    }
  }

  async chat({ messages, tools = [], model = null, temperature = 0.6, maxTokens = 2048 }) {
    const directKey = this.getApiKey();
    const targetModel = model || process.env.DEEPSEEK_CHAT_MODEL || (directKey ? this.defaultDirectModel : this.defaultGatewayModel);

    const endpoint = directKey ? "https://api.deepseek.com/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions";
    const authHeader = directKey ? `Bearer ${directKey}` : `Bearer ${this.getOpenRouterKey()}`;
    const mappedModel = directKey ? targetModel : targetModel.includes("/") ? targetModel : `deepseek/${targetModel}`;

    const body = {
      model: mappedModel,
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

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(parseInt(process.env.AI_REQUEST_TIMEOUT_MS) || 60000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`DeepSeek Chat API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    return {
      provider: "deepseek",
      model: mappedModel,
      message: choice?.message?.content || "",
      toolCalls: choice?.message?.tool_calls || [],
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
    };
  }
}

export default DeepSeekProvider;
