export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: Role;
  content: string;
  name?: string;
  toolCallId?: string;
  metadata?: Record<string, unknown>;
}

export interface CandidateProduct {
  id: string;
  name: string;
  slug?: string;
  price?: number;
  finalPrice?: number;
  image?: string;
  variants?: Array<{
    variant_id: string;
    color?: string;
    size?: string;
    stock?: number;
  }>;
}

export interface ShoppingMemoryState {
  userIntent: string | null;
  candidateProducts: CandidateProduct[];
  selectedProduct: CandidateProduct | null;
  selectedColor: string | null;
  selectedSize: string | null;
  quantity: number;
  pendingAction: Record<string, unknown> | null;
  toolResults: Array<{
    toolName: string;
    args: Record<string, unknown>;
    result: unknown;
    timestamp: number;
  }>;
}

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  score?: number;
}

export interface FilterExpression {
  sourceType?: string | string[];
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  permissionScope?: string;
  [key: string]: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolExecutionResult {
  success: boolean;
  code?: string;
  message?: string;
  data?: unknown;
  actionId?: string;
  actionType?: string;
  status?: string;
  requiresConfirmation?: boolean;
  [key: string]: unknown;
}

export interface ChatRequestPayload {
  content: string;
  conversationId?: string | null;
  metadata?: Record<string, unknown>;
  confirmAction?: Record<string, unknown>;
  cancelAction?: boolean | Record<string, unknown>;
  mode?: 'agent' | 'rag' | 'search';
}

export interface ChatResponsePayload {
  conversationId: string | null;
  reply: string;
  intent?: string;
  candidateProducts?: CandidateProduct[];
  selectedProduct?: CandidateProduct | null;
  actionResult?: unknown;
  pendingAction?: unknown;
  executedTools?: string[];
  sources?: Array<{ id: string; title?: string; snippet?: string; score?: number }>;
  metadata?: Record<string, unknown>;
}
