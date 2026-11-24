const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const DEFAULT_TTL_MS = 60 * 60 * 1000;

/**
 * Read-only, process-local catalog cache. It intentionally never mutates a
 * configured model: an administrator must explicitly choose a discovered one.
 */
export class OpenRouterModelRegistry {
  constructor({ ttlMs = DEFAULT_TTL_MS, fetchImpl = fetch } = {}) {
    this.ttlMs = ttlMs;
    this.fetchImpl = fetchImpl;
    this.cache = null;
    this.cachedAt = 0;
  }

  async discover({ force = false } = {}) {
    if (!force && this.cache && Date.now() - this.cachedAt < this.ttlMs) return this.cache;
    const response = await this.fetchImpl(OPENROUTER_MODELS_URL, { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error(`OPENROUTER_MODEL_CATALOG_ERROR: HTTP ${response.status}`);
    const body = await response.json();
    this.cache = (body.data || []).map((model) => ({
      id: model.id,
      name: model.name || model.id,
      provider: String(model.id || "").split("/")[0],
      contextLength: model.context_length || null,
      inputModalities: model.architecture?.input_modalities || [],
      outputModalities: model.architecture?.output_modalities || [],
      supportsTools: (model.supported_parameters || []).includes("tools"),
      supportsStructuredOutput: (model.supported_parameters || []).includes("structured_outputs") || (model.supported_parameters || []).includes("response_format"),
      promptPrice: model.pricing?.prompt ?? null,
      completionPrice: model.pricing?.completion ?? null,
    }));
    this.cachedAt = Date.now();
    return this.cache;
  }

  async find(provider, options = {}) {
    const catalog = await this.discover(options);
    return catalog.filter((model) => model.provider === provider);
  }

  async isAvailable(modelId, options = {}) {
    const catalog = await this.discover(options);
    return catalog.some((model) => model.id === modelId);
  }

  getCacheMetadata() {
    return { cachedAt: this.cachedAt || null, ttlMs: this.ttlMs, cached: Boolean(this.cache) };
  }
}

const openRouterModelRegistry = new OpenRouterModelRegistry();
export default openRouterModelRegistry;
