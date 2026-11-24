import BaseAIProvider, { AI_CAPABILITIES, PROVIDER_STATUS, classifyProviderFailure } from "./BaseAIProvider.js";

const API_ROOT = "https://gen.pollinations.ai";

/** Pollinations' current OpenAI-compatible image endpoint. */
export class PollinationsProvider extends BaseAIProvider {
  constructor() {
    super({
      id: "pollinations",
      name: "Pollinations AI",
      defaultModel: process.env.POLLINATIONS_IMAGE_MODEL || "black-forest-labs/flux.1-schnell",
      capabilities: [AI_CAPABILITIES.IMAGE_GENERATION, AI_CAPABILITIES.IMAGE_EDITING],
    });
  }

  get apiKey() { return process.env.POLLINATIONS_API_KEY || ""; }

  getImageCostProfile() {
    // Catalog prices vary by model and can change. No key balance/free-credit
    // endpoint is called from the application without an explicit account scope.
    return { kind: "METERED_UNKNOWN", estimatedCostUsd: null };
  }

  async getStatus() {
    return this.apiKey ? PROVIDER_STATUS.CONFIGURED_UNVERIFIED : PROVIDER_STATUS.NOT_CONFIGURED;
  }

  async testConnection() {
    if (!this.apiKey) return { success: false, status: PROVIDER_STATUS.NOT_CONFIGURED, message: "Cần POLLINATIONS_API_KEY ở backend." };
    return { success: false, status: PROVIDER_STATUS.CONFIGURED_UNVERIFIED, message: "Đã cấu hình; catalog công khai có thể khám phá, còn quota/chi phí cần xác minh trong tài khoản Pollinations." };
  }

  async generateImage({ prompt, width = 1024, height = 1024, n = 1, model = null }) {
    if (!this.apiKey) throw new Error("POLLINATIONS_NOT_CONFIGURED");
    const targetModel = model || this.defaultModel;
    try {
      const response = await fetch(`${API_ROOT}/v1/images/generations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: targetModel, size: `${width}x${height}`, n, response_format: "b64_json" }),
        signal: AbortSignal.timeout(90_000),
      });
      if (!response.ok) throw new Error(`Pollinations HTTP ${response.status}`);
      const payload = await response.json();
      const images = (payload?.data || []).map((image) => {
        const url = image?.url || (image?.b64_json ? `data:image/png;base64,${image.b64_json}` : null);
        return url ? { url, revisedPrompt: image.revised_prompt || prompt, width, height } : null;
      }).filter(Boolean);
      if (!images.length) throw new Error("Pollinations returned no image payload");
      return { provider: this.id, model: targetModel, images, costUsd: null, costStatus: "UNKNOWN_METERED_QUOTA" };
    } catch (error) {
      const normalized = classifyProviderFailure(error);
      throw new Error(`POLLINATIONS_${normalized.status}: ${normalized.message}`);
    }
  }
}

export default PollinationsProvider;
