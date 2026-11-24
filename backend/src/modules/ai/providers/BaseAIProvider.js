/**
 * Base AI Provider Abstraction
 * Defines capabilities, standard contracts, and helper utilities.
 */

export const AI_CAPABILITIES = Object.freeze({
  CHAT: "CHAT",
  REASONING: "REASONING",
  VISION: "VISION",
  TOOL_CALLING: "TOOL_CALLING",
  STRUCTURED_OUTPUT: "STRUCTURED_OUTPUT",
  EMBEDDING: "EMBEDDING",
  IMAGE_GENERATION: "IMAGE_GENERATION",
  IMAGE_EDITING: "IMAGE_EDITING",
  STREAMING: "STREAMING",
});

export const PROVIDER_STATUS = Object.freeze({
  CONNECTED: "CONNECTED",
  CONFIGURED_UNVERIFIED: "CONFIGURED_UNVERIFIED",
  NOT_CONFIGURED: "NOT_CONFIGURED",
  INVALID_KEY: "INVALID_KEY",
  RATE_LIMITED: "RATE_LIMITED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  UNAVAILABLE: "UNAVAILABLE",
  MODEL_NOT_FOUND: "MODEL_NOT_FOUND",
  BILLING_REQUIRED: "BILLING_REQUIRED",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  LOCAL_PROVIDER_UNAVAILABLE: "LOCAL_PROVIDER_UNAVAILABLE",
});

/** Normalizes provider failures without returning provider bodies, keys, or account metadata to the UI. */
export function classifyProviderFailure(error) {
  const detail = String(error?.message || error || "");
  if (/\b404\b|no longer available|model.*not found/i.test(detail)) return { status: PROVIDER_STATUS.MODEL_NOT_FOUND, message: "The configured model is not available from this provider." };
  if (/\b402\b|insufficient credits|billing|required payment/i.test(detail)) return { status: PROVIDER_STATUS.BILLING_REQUIRED, message: "Provider billing or credits are required." };
  if (/\b429\b|rate limit|quota/i.test(detail)) return { status: PROVIDER_STATUS.RATE_LIMITED, message: "Provider rate limit or quota was reached." };
  if (/\b401\b|invalid.*key|authentication/i.test(detail)) return { status: PROVIDER_STATUS.INVALID_KEY, message: "Provider rejected the configured credential." };
  if (/timeout|abort/i.test(detail)) return { status: PROVIDER_STATUS.TIMEOUT, message: "Provider request timed out." };
  if (/fetch failed|ECONN|ENOTFOUND|network/i.test(detail)) return { status: PROVIDER_STATUS.NETWORK_ERROR, message: "Network connection to the provider failed." };
  return { status: PROVIDER_STATUS.UNAVAILABLE, message: "Provider is currently unavailable." };
}

export class BaseAIProvider {
  constructor({ id, name, defaultModel, capabilities = [] }) {
    this.id = id;
    this.name = name;
    this.defaultModel = defaultModel;
    this.capabilities = new Set(capabilities);
  }

  hasCapability(capability) {
    return this.capabilities.has(capability);
  }

  getCapabilities() {
    return Array.from(this.capabilities);
  }

  /**
   * Determine live provider configuration status
   */
  async getStatus() {
    throw new Error(`getStatus() not implemented for ${this.id}`);
  }

  /**
   * Test latency and API health
   */
  async testConnection() {
    throw new Error(`testConnection() not implemented for ${this.id}`);
  }

  /**
   * Standard Chat Completion
   */
  async chat({ messages, tools = [], model = null, temperature = 0.7, maxTokens = 2048 }) {
    throw new Error(`chat() not supported by ${this.id}`);
  }

  /**
   * Vision Analysis (image + prompt)
   */
  async analyzeVision({ imageUrls = [], prompt, model = null }) {
    throw new Error(`analyzeVision() not supported by ${this.id}`);
  }

  /**
   * Image Generation
   */
  async generateImage({ prompt, width = 1024, height = 1024, n = 1, style = "vivid", model = null }) {
    throw new Error(`generateImage() not supported by ${this.id}`);
  }

  /**
   * Cost metadata is deliberately conservative. A provider must explicitly
   * identify itself as zero-cost before it can run with a zero-dollar budget.
   */
  getImageCostProfile() {
    return { kind: "UNKNOWN", estimatedCostUsd: null };
  }

  /**
   * Image Editing
   */
  async editImage({ imageUrl, prompt, maskUrl = null, model = null }) {
    throw new Error(`editImage() not supported by ${this.id}`);
  }
}

export default BaseAIProvider;
