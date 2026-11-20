import { Document as IDocument } from '../types/index.js';

/**
 * Spring AI Document abstraction in TypeScript.
 * Holds text content, rich metadata, and vector similarity score.
 */
export class Document implements IDocument {
  public id: string;
  public content: string;
  public metadata: Record<string, unknown>;
  public score?: number;

  constructor({
    id,
    content,
    metadata = {},
    score,
  }: {
    id: string;
    content: string;
    metadata?: Record<string, unknown>;
    score?: number;
  }) {
    this.id = id;
    this.content = content;
    this.metadata = metadata;
    this.score = score;
  }
}
