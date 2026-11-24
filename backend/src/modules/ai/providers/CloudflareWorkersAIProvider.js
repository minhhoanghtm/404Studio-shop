import BaseAIProvider, { AI_CAPABILITIES, PROVIDER_STATUS, classifyProviderFailure } from "./BaseAIProvider.js";

const API_ROOT = "https://api.cloudflare.com/client/v4/accounts";

/** Cloudflare Workers AI REST adapter for the documented FLUX.1 Schnell model. */
export class CloudflareWorkersAIProvider extends BaseAIProvider {
  constructor() {
    super({
      id: "cloudflare",
      name: "Cloudflare Workers AI (FLUX.1 Schnell)",
      defaultModel: process.env.CLOUDFLARE_IMAGE_MODEL || "@cf/black-forest-labs/flux-1-schnell",
      capabilities: [AI_CAPABILITIES.IMAGE_GENERATION],
    });
  }

  get accountId() { return process.env.CLOUDFLARE_ACCOUNT_ID || ""; }
  get apiToken() { return process.env.CLOUDFLARE_API_TOKEN || ""; }

  getImageCostProfile() {
    // Workers AI is metered in Neurons. The account's included allocation and
    // remaining quota are not exposed by this API, so it cannot be assumed free.
    return { kind: "METERED_UNKNOWN", estimatedCostUsd: null };
  }

  async getStatus() {
    return this.accountId && this.apiToken ? PROVIDER_STATUS.CONFIGURED_UNVERIFIED : PROVIDER_STATUS.NOT_CONFIGURED;
  }

  async testConnection() {
    if (!(this.accountId && this.apiToken)) {
      return { success: false, status: PROVIDER_STATUS.NOT_CONFIGURED, message: "Cần CLOUDFLARE_ACCOUNT_ID và CLOUDFLARE_API_TOKEN ở backend." };
    }
    // A generation request consumes metered quota; never create a throwaway image just to ping.
    return { success: false, status: PROVIDER_STATUS.CONFIGURED_UNVERIFIED, message: "Đã cấu hình nhưng chưa gửi ảnh kiểm tra để tránh tiêu thụ Neurons." };
  }

  async generateImage({ prompt, n = 1, model = null }) {
    if (!(this.accountId && this.apiToken)) throw new Error("CLOUDFLARE_NOT_CONFIGURED");
    if (n !== 1) throw new Error("CLOUDFLARE_FLUX_SCHNELL_ONE_IMAGE_PER_REQUEST");

    const targetModel = model || this.defaultModel;
    try {
      const response = await fetch(`${API_ROOT}/${encodeURIComponent(this.accountId)}/ai/run/${encodeURIComponent(targetModel)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, steps: 4 }),
        signal: AbortSignal.timeout(90_000),
      });
      if (!response.ok) throw new Error(`Cloudflare Workers AI HTTP ${response.status}`);
      const payload = await response.json();
      const base64 = payload?.result?.image || payload?.image;
      if (!base64 || typeof base64 !== "string") throw new Error("Cloudflare Workers AI returned no image payload");
      return {
        provider: this.id,
        model: targetModel,
        images: [{ url: `data:image/jpeg;base64,${base64}`, revisedPrompt: prompt }],
        // Pricing exists but remaining included quota is not verifiable; do not fabricate a number.
        costUsd: null,
        costStatus: "UNKNOWN_METERED_QUOTA",
      };
    } catch (error) {
      const normalized = classifyProviderFailure(error);
      throw new Error(`CLOUDFLARE_${normalized.status}: ${normalized.message}`);
    }
  }
}

export default CloudflareWorkersAIProvider;
