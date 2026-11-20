import crypto from 'crypto';

export interface EmbeddingModel {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  dimensions(): number;
}

/**
 * Deterministic local fallback embedding generator (1536 dimensions).
 * Uses multi-pass cryptographic hashing with token normalization.
 * Guarantees zero runtime crash if external API keys or networks are offline.
 */
export class LocalFallbackEmbeddingModel implements EmbeddingModel {
  private readonly dim: number;

  constructor(dimensions = 1536) {
    this.dim = dimensions;
  }

  public dimensions(): number {
    return this.dim;
  }

  public async embed(text: string): Promise<number[]> {
    const norm = String(text || '').trim().toLowerCase();
    const vec: number[] = new Array(this.dim).fill(0);

    if (!norm) return vec;

    const words = norm.split(/\s+/).filter(Boolean);
    for (const w of words) {
      const hash = crypto.createHash('sha256').update(w).digest();
      for (let i = 0; i < hash.length; i++) {
        const idx = (hash[i] * 31 + i * 17) % this.dim;
        vec[idx] += (hash[i] - 128) / 128;
      }
    }

    // Normalize vector to unit length
    const normSq = vec.reduce((sum, v) => sum + v * v, 0);
    const mag = Math.sqrt(normSq);
    if (mag > 0) {
      for (let i = 0; i < this.dim; i++) {
        vec[i] /= mag;
      }
    }

    return vec;
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}

/**
 * OpenRouter / OpenAI Embedding Model implementation.
 */
export class OpenAiEmbeddingModel implements EmbeddingModel {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly dim: number;
  private readonly fallback: LocalFallbackEmbeddingModel;

  constructor(options: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    dimensions?: number;
  } = {}) {
    this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
    this.baseUrl = options.baseUrl || (process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1');
    this.model = options.model || process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small';
    this.dim = options.dimensions || 1536;
    this.fallback = new LocalFallbackEmbeddingModel(this.dim);
  }

  public dimensions(): number {
    return this.dim;
  }

  public async embed(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0] || this.fallback.embed(text);
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.apiKey || this.apiKey.startsWith('sk-or-v1-your')) {
      return this.fallback.embedBatch(texts);
    }

    try {
      const res = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: texts,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        return this.fallback.embedBatch(texts);
      }

      const json = await res.json() as any;
      if (Array.isArray(json?.data) && json.data.length > 0) {
        return json.data.map((item: any) => item.embedding);
      }
      return this.fallback.embedBatch(texts);
    } catch {
      return this.fallback.embedBatch(texts);
    }
  }
}
