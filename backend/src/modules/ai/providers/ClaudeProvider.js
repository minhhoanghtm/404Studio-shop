import BaseAIProvider, { AI_CAPABILITIES, PROVIDER_STATUS, classifyProviderFailure } from "./BaseAIProvider.js";

export class ClaudeProvider extends BaseAIProvider {
  constructor(apiKey = null) {
    super({
      id: "claude",
      name: "Anthropic Claude 3.5 Sonnet",
      defaultModel: "anthropic/claude-haiku-5.5",
      capabilities: [
        AI_CAPABILITIES.CHAT,
        AI_CAPABILITIES.REASONING,
        AI_CAPABILITIES.VISION,
        AI_CAPABILITIES.TOOL_CALLING,
        AI_CAPABILITIES.STRUCTURED_OUTPUT,
        AI_CAPABILITIES.STREAMING,
      ],
    });
    this.customApiKey = apiKey;
    this.defaultDirectModel = process.env.ANTHROPIC_DIRECT_MODEL || "claude-3-5-sonnet-20241022";
    this.defaultGatewayModel = process.env.OPENROUTER_CLAUDE_MODEL || "anthropic/claude-haiku-5.5";
  }

  getApiKey() {
    return this.customApiKey || process.env.ANTHROPIC_API_KEY || "";
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
        message: "Chưa cấu hình ANTHROPIC_API_KEY. Quý quản trị viên có thể nhập key tại Cài Đặt AI.",
      };
    }

    try {
      if (!key) {
        const gatewayResult = await this.chat({ messages: [{ role: "user", content: "Reply with exactly: pong" }], maxTokens: 5, temperature: 0 });
        return { success: Boolean(gatewayResult.message), status: PROVIDER_STATUS.CONNECTED, latencyMs: Date.now() - start, message: "Claude qua OpenRouter đã phản hồi" };
      }
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 5,
          messages: [{ role: "user", content: "Ping" }],
        }),
        signal: AbortSignal.timeout(8000),
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return { success: true, status: PROVIDER_STATUS.CONNECTED, latencyMs, message: "Kết nối Anthropic Claude thành công" };
      }
      return {
        success: false,
        status: res.status === 401 ? PROVIDER_STATUS.INVALID_KEY : res.status === 429 ? PROVIDER_STATUS.RATE_LIMITED : PROVIDER_STATUS.UNAVAILABLE,
        latencyMs,
        message: `Lỗi kết nối Claude: HTTP ${res.status}`,
      };
    } catch (err) {
      return { success: false, latencyMs: Date.now() - start, ...classifyProviderFailure(err) };
    }
  }

  async chat({ messages, tools = [], model = null, temperature = 0.7, maxTokens = 2048 }) {
    const directKey = this.getApiKey();
    const targetModel = model || process.env.ANTHROPIC_CHAT_MODEL || (directKey ? this.defaultDirectModel : this.defaultGatewayModel);

    if (directKey) {
      // Direct Anthropic Messages API
      const systemMsg = messages.find((m) => m.role === "system")?.content || "";
      const conversationMsgs = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));

      const body = {
        model: targetModel,
        max_tokens: maxTokens,
        temperature,
        system: systemMsg,
        messages: conversationMsgs,
      };

      if (tools && tools.length > 0) {
        body.tools = tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters,
        }));
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": directKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(parseInt(process.env.AI_REQUEST_TIMEOUT_MS) || 60000),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Anthropic Direct API Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const textBlock = data.content?.find((c) => c.type === "text");
      const toolUseBlocks = data.content
        ?.filter((c) => c.type === "tool_use")
        .map((tu) => ({
          id: tu.id,
          function: { name: tu.name, arguments: JSON.stringify(tu.input || {}) },
        }));

      return {
        provider: "claude",
        model: targetModel,
        message: textBlock?.text || "",
        toolCalls: toolUseBlocks || [],
        usage: {
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
        },
      };
    }

    // OpenRouter Unified Gateway for Claude
    const orKey = this.getOpenRouterKey();
    if (!orKey) throw new Error("CLAUDE_NOT_CONFIGURED: Thiếu ANTHROPIC_API_KEY hoặc OPENROUTER_API_KEY");

    const orModel = targetModel.includes("/") ? targetModel : `anthropic/${targetModel}`;
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
      throw new Error(`Claude via Gateway Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    return {
      provider: "claude",
      model: orModel,
      message: choice?.message?.content || "",
      toolCalls: choice?.message?.tool_calls || [],
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
    };
  }

  async analyzeVision({ imageUrls = [], prompt, model = "claude-3-5-sonnet-20241022" }) {
    const orKey = this.getOpenRouterKey();
    if (!orKey) throw new Error("CLAUDE_NOT_CONFIGURED: Thiếu API key cho Claude Vision");

    const contentParts = [{ type: "text", text: prompt || "Phân tích hình ảnh này cho mục đích tiếp thị thời trang." }];
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
        model: "anthropic/claude-3.5-sonnet",
        messages: [{ role: "user", content: contentParts }],
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) throw new Error(`Claude Vision Error: HTTP ${res.status}`);
    const data = await res.json();
    return {
      provider: "claude",
      model: "anthropic/claude-3.5-sonnet",
      analysis: data.choices?.[0]?.message?.content || "",
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
    };
  }

  /**
   * Claude does not have native raster image generation.
   * As required by Master Prompt Section 3, Claude creates the creative brief
   * and invokes the authorized Image Generation Tool (OpenAI DALL-E or Gemini Imagen).
   */
  async generateImage({ prompt, width = 1024, height = 1024, n = 1, style = "vivid" }) {
    const { OpenAIProvider } = await import("./OpenAIProvider.js");
    const imageTool = new OpenAIProvider();
    const result = await imageTool.generateImage({ prompt, width, height, n, style });
    return {
      ...result,
      textProvider: "claude",
      imageProvider: "openai (dall-e-3)",
    };
  }
}

export default ClaudeProvider;
