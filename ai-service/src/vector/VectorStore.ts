import { Document } from './Document.js';
import { FilterExpression } from '../types/index.js';
import { EmbeddingModel, OpenAiEmbeddingModel } from './EmbeddingModel.js';

export interface VectorStore {
  add(documents: Document[]): Promise<void>;
  similaritySearch(query: string, topK?: number, filter?: FilterExpression): Promise<Document[]>;
}

/**
 * High-performance In-Memory & Backend-integrated VectorStore based on Spring AI VectorStore principles.
 * Uses Cosine Similarity for semantic matching and metadata filtering.
 */
export class NodeVectorStore implements VectorStore {
  private readonly documents: Map<string, { doc: Document; vector: number[] }> = new Map();
  private readonly embeddingModel: EmbeddingModel;
  private readonly nodeBackendUrl: string;
  private readonly localOnly: boolean;

  constructor(options: {
    embeddingModel?: EmbeddingModel;
    nodeBackendUrl?: string;
    localOnly?: boolean;
  } = {}) {
    this.embeddingModel = options.embeddingModel || new OpenAiEmbeddingModel();
    this.nodeBackendUrl = String(options.nodeBackendUrl || process.env.NODE_BACKEND_BASE_URL || '').trim().replace(/\/$/, '');
    this.localOnly = options.localOnly ?? false;
    if (!this.localOnly && !this.nodeBackendUrl) {
      throw new Error('Missing NODE_BACKEND_BASE_URL for remote NodeVectorStore.');
    }
  }

  public async add(documents: Document[]): Promise<void> {
    if (!documents || documents.length === 0) return;

    const texts = documents.map((d) => `${d.content} ${JSON.stringify(d.metadata || {})}`);
    const vectors = await this.embeddingModel.embedBatch(texts);

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const vec = vectors[i];
      if (doc && vec) {
        this.documents.set(doc.id, { doc, vector: vec });
      }
    }
  }

  /**
   * Cosine similarity between two normalized vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const mag = Math.sqrt(normA) * Math.sqrt(normB);
    return mag > 0 ? dot / mag : 0;
  }

  /**
   * Matches metadata filters according to Spring AI filter expressions
   */
  private matchesFilter(doc: Document, filter?: FilterExpression): boolean {
    if (!filter) return true;

    if (filter.sourceType) {
      const expected = Array.isArray(filter.sourceType) ? filter.sourceType : [filter.sourceType];
      if (!expected.includes(String(doc.metadata.sourceType))) {
        return false;
      }
    }

    if (filter.categorySlug && doc.metadata.categorySlug !== filter.categorySlug) {
      return false;
    }

    if (typeof filter.minPrice === 'number' && typeof doc.metadata.price === 'number') {
      if (doc.metadata.price < filter.minPrice) return false;
    }

    if (typeof filter.maxPrice === 'number' && typeof doc.metadata.price === 'number') {
      if (doc.metadata.price > filter.maxPrice) return false;
    }

    if (filter.inStock === true && doc.metadata.inStock === false) {
      return false;
    }

    return true;
  }

  public async similaritySearch(
    query: string,
    topK = 5,
    filter?: FilterExpression
  ): Promise<Document[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // 1. Try querying Node Backend semantic search if not localOnly
    if (!this.localOnly) {
      try {
        const res = await fetch(`${this.nodeBackendUrl}/api/ai/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: trimmed,
            sourceType: filter?.sourceType,
            topK,
            minPrice: filter?.minPrice,
            maxPrice: filter?.maxPrice,
            categorySlug: filter?.categorySlug,
            inStock: filter?.inStock,
          }),
          signal: AbortSignal.timeout(5000),
        });

        if (res.ok) {
          const json = await res.json() as any;
          const results = json?.data?.results || [];
          if (Array.isArray(results) && results.length > 0) {
            return results.map((r: any) => new Document({
              id: String(r.sourceId || r.metadata?._id || r.id),
              content: r.content || r.metadata?.name || '',
              metadata: {
                ...r.metadata,
                sourceType: r.sourceType,
                name: r.metadata?.name,
                price: r.metadata?.price,
                slug: r.metadata?.slug,
                image: r.metadata?.image,
              },
              score: r.similarityScore ?? r.score,
            }));
          }
        }
      } catch {
        // Fallback to in-memory vector store
      }
    }

    // 2. In-memory vector store matching
    const queryVector = await this.embeddingModel.embed(trimmed);
    const scored: Array<{ doc: Document; score: number }> = [];

    for (const { doc, vector } of this.documents.values()) {
      if (!this.matchesFilter(doc, filter)) continue;
      const score = this.cosineSimilarity(queryVector, vector);
      scored.push({ doc: new Document({ ...doc, score }), score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => s.doc);
  }
}
