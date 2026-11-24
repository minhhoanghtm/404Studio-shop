import BaseAIProvider, { AI_CAPABILITIES, PROVIDER_STATUS } from "./BaseAIProvider.js";

export class FluxProvider extends BaseAIProvider {
  constructor(apiKey = null) {
    super({
      id: "flux",
      name: "FLUX.1 (Black Forest Labs)",
      defaultModel: "black-forest-labs/flux-1-schnell",
      capabilities: [
        AI_CAPABILITIES.IMAGE_GENERATION,
        AI_CAPABILITIES.IMAGE_EDITING,
      ],
    });
    this.customApiKey = apiKey;
  }

  getApiKey() {
    return this.customApiKey || process.env.FLUX_API_KEY || "";
  }

  async getStatus() {
    const key = this.getApiKey();
    if (!key) return PROVIDER_STATUS.NOT_CONFIGURED;
    // A key alone does not prove that the unsupported adapter can generate.
    return PROVIDER_STATUS.CONFIGURED_UNVERIFIED;
  }

  async testConnection() {
    const key = this.getApiKey();
    if (!key) {
      return {
        success: false,
        status: PROVIDER_STATUS.NOT_CONFIGURED,
        message: "Chưa cấu hình FLUX_API_KEY. Quý quản trị viên có thể nhập key tại Cài Đặt AI.",
      };
    }
    return {
      success: false,
      status: PROVIDER_STATUS.UNAVAILABLE,
      message: "FLUX key is present but this deployment has no verified direct FLUX adapter. Configure a supported FLUX endpoint before enabling image generation.",
    };
  }

  async generateImage({ prompt, width = 1024, height = 1024, n = 1, style = "vivid", model = null }) {
    const key = this.getApiKey();
    if (!key) throw new Error("FLUX_NOT_CONFIGURED: Thiếu API key cho FLUX");
    throw new Error("FLUX_DIRECT_ADAPTER_UNAVAILABLE: Configure Cloudflare, Pollinations, or a verified FLUX direct adapter; this provider never substitutes OpenAI output.");
  }
}

export default FluxProvider;
