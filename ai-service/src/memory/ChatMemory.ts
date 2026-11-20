import { ChatMessage, ShoppingMemoryState } from '../types/index.js';

export interface ChatMemory {
  get(conversationId: string): Promise<ChatMessage[]>;
  add(conversationId: string, messages: ChatMessage[]): Promise<void>;
  clear(conversationId: string): Promise<void>;
  getState(conversationId: string): Promise<ShoppingMemoryState>;
  updateState(conversationId: string, patch: Partial<ShoppingMemoryState>): Promise<ShoppingMemoryState>;
}

export class InMemoryChatMemory implements ChatMemory {
  private readonly histories: Map<string, ChatMessage[]> = new Map();
  private readonly states: Map<string, ShoppingMemoryState> = new Map();
  private readonly maxMessages: number;

  constructor(maxMessages = 20) {
    this.maxMessages = maxMessages;
  }

  public async get(conversationId: string): Promise<ChatMessage[]> {
    return this.histories.get(conversationId) || [];
  }

  public async add(conversationId: string, messages: ChatMessage[]): Promise<void> {
    const existing = this.histories.get(conversationId) || [];
    const updated = [...existing, ...messages];
    if (updated.length > this.maxMessages) {
      this.histories.set(conversationId, updated.slice(updated.length - this.maxMessages));
    } else {
      this.histories.set(conversationId, updated);
    }
  }

  public async clear(conversationId: string): Promise<void> {
    this.histories.delete(conversationId);
    this.states.delete(conversationId);
  }

  public async getState(conversationId: string): Promise<ShoppingMemoryState> {
    let state = this.states.get(conversationId);
    if (!state) {
      state = {
        userIntent: null,
        candidateProducts: [],
        selectedProduct: null,
        selectedColor: null,
        selectedSize: null,
        quantity: 1,
        pendingAction: null,
        toolResults: [],
      };
      this.states.set(conversationId, state);
    }
    return { ...state };
  }

  public async updateState(
    conversationId: string,
    patch: Partial<ShoppingMemoryState>
  ): Promise<ShoppingMemoryState> {
    const current = await this.getState(conversationId);
    const updated: ShoppingMemoryState = {
      ...current,
      ...patch,
      // If candidates are updated, merge or replace as appropriate
      candidateProducts: patch.candidateProducts !== undefined ? patch.candidateProducts : current.candidateProducts,
      toolResults: patch.toolResults !== undefined ? patch.toolResults : current.toolResults,
    };
    this.states.set(conversationId, updated);
    return updated;
  }
}
