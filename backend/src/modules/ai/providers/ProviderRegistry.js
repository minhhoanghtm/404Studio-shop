import OpenAIProvider from "./OpenAIProvider.js";
import GeminiProvider from "./GeminiProvider.js";
import ClaudeProvider from "./ClaudeProvider.js";
import DeepSeekProvider from "./DeepSeekProvider.js";
import FluxProvider from "./FluxProvider.js";
import CloudflareWorkersAIProvider from "./CloudflareWorkersAIProvider.js";
import PollinationsProvider from "./PollinationsProvider.js";
import ComfyUIProvider from "./ComfyUIProvider.js";
import { PROVIDER_STATUS } from "./BaseAIProvider.js";
import AdminAiSettings from "../models/adminAiSettings.model.js";
import openRouterModelRegistry from "./OpenRouterModelRegistry.js";

export class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.initDefaultProviders();
  }

  initDefaultProviders() {
    this.register(new OpenAIProvider());
    this.register(new GeminiProvider());
    this.register(new ClaudeProvider());
    this.register(new DeepSeekProvider());
    this.register(new FluxProvider());
    this.register(new CloudflareWorkersAIProvider());
    this.register(new PollinationsProvider());
    this.register(new ComfyUIProvider());
  }

  register(provider) {
    this.providers.set(provider.id, provider);
  }

  getProvider(id) {
    if (!id || id === "auto") return null;
    return this.providers.get(id) || null;
  }

  getAll() {
    return Array.from(this.providers.values());
  }

  getAllProviders() {
    const obj = {};
    for (const [id, provider] of this.providers.entries()) {
      obj[id] = provider;
    }
    return obj;
  }

  /**
   * Return metadata and live status of all registered providers
   */
  async getProvidersStatus() {
    const list = [];
    for (const p of this.providers.values()) {
      let status = PROVIDER_STATUS.NOT_CONFIGURED;
      try {
        status = await p.getStatus();
      } catch {
        status = PROVIDER_STATUS.UNAVAILABLE;
      }

      list.push({
        id: p.id,
        name: p.name,
        defaultModel: p.defaultModel,
        capabilities: p.getCapabilities(),
        imageCostProfile: p.hasCapability("IMAGE_GENERATION") ? p.getImageCostProfile() : null,
        status,
        configured: status === PROVIDER_STATUS.CONNECTED || status === PROVIDER_STATUS.CONFIGURED_UNVERIFIED,
        verified: status === PROVIDER_STATUS.CONNECTED,
      });
    }
    return list;
  }

  /**
   * Test specific provider connectivity
   */
  async testProvider(id) {
    const provider = this.getProvider(id);
    if (!provider) {
      return { success: false, status: PROVIDER_STATUS.UNAVAILABLE, message: `Provider "${id}" không tồn tại` };
    }
    return await provider.testConnection();
  }

  async discoverOpenRouterModels(provider, options = {}) {
    return openRouterModelRegistry.find(provider, options);
  }

  getModelCatalogCacheMetadata() {
    return openRouterModelRegistry.getCacheMetadata();
  }
}

const providerRegistry = new ProviderRegistry();
export default providerRegistry;
