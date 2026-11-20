import { VectorStore } from '../vector/VectorStore.js';
import { Document } from '../vector/Document.js';
import { sanitizeRetrievedContent } from './ContentSanitizer.js';

export interface RagContextResult {
  contextBlock: string;
  sources: Array<{ id: string; title?: string; snippet?: string; score?: number }>;
  injectionDetected: boolean;
}

/**
 * Spring AI QuestionAnswerAdvisor implemented in TypeScript.
 * Enriches the LLM prompt with grounded context retrieved from the VectorStore.
 */
export class QuestionAnswerAdvisor {
  private readonly vectorStore: VectorStore;
  private readonly topK: number;

  constructor(vectorStore: VectorStore, topK = 4) {
    this.vectorStore = vectorStore;
    this.topK = topK;
  }

  public async retrieveContext(query: string): Promise<RagContextResult> {
    const docs = await this.vectorStore.similaritySearch(query, this.topK);

    let injectionDetected = false;
    const sources: Array<{ id: string; title?: string; snippet?: string; score?: number }> = [];
    const formattedChunks: string[] = [];

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      if (!doc) continue;
      const { sanitizedText, injectionDetected: foundInjection } = sanitizeRetrievedContent(doc.content);
      if (foundInjection) injectionDetected = true;

      const title = String(doc.metadata.name || doc.metadata.title || `Tài liệu #${i + 1}`);
      const snippet = sanitizedText.slice(0, 300);

      sources.push({
        id: doc.id,
        title,
        snippet,
        score: doc.score,
      });

      formattedChunks.push(`[Tài liệu ${i + 1}: ${title}]\n${sanitizedText}`);
    }

    const contextBlock = formattedChunks.length > 0
      ? `\n--- DỮ LIỆU CỬA HÀNG ĐƯỢC XÁC THỰC (GROUNDED TRUTH) ---\n${formattedChunks.join('\n\n')}\n--- HẾT DỮ LIỆU CỬA HÀNG ---\n`
      : '';

    return { contextBlock, sources, injectionDetected };
  }
}
