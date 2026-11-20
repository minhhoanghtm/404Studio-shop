import { ChatMemory } from './ChatMemory.js';
import { CandidateProduct, ChatMessage, ShoppingMemoryState } from '../types/index.js';

export interface AdvisorContext {
  userId?: string | null;
  role?: string;
  conversationId: string;
  state: ShoppingMemoryState;
}

/**
 * Spring AI Advisor pattern: Intercepts request and response, maintaining conversation context
 * and state transitions across multi-turn shopping dialogs with robust Vietnamese Unicode handling.
 */
export class ShoppingMemoryAdvisor {
  private readonly memory: ChatMemory;

  constructor(memory: ChatMemory) {
    this.memory = memory;
  }

  /**
   * Before advising: Load past messages and extract conversation entity state
   */
  public async beforeCall(
    conversationId: string,
    userPrompt: string
  ): Promise<{ history: ChatMessage[]; state: ShoppingMemoryState }> {
    const history = await this.memory.get(conversationId);
    let state = await this.memory.getState(conversationId);

    const lower = userPrompt.toLowerCase().trim();

    // 0. Reset selection if user asks for a fresh search: "Tìm áo thun", "Gợi ý đầm dạ hội", "Search váy"
    if (
      /^(?:tìm|search|gợi ý|tìm kiếm|xem)/iu.test(lower) ||
      /tìm.*(giúp|hộ|cho)|gợi ý.*cho/iu.test(lower)
    ) {
      state = await this.memory.updateState(conversationId, {
        selectedProduct: null,
        selectedColor: null,
        selectedSize: null,
        candidateProducts: [],
        userIntent: 'SEARCH_PRODUCTS',
      });
    }

    // 1. Detect candidate selection: "mẫu đầu tiên", "mẫu 1", "cái đầu", "mẫu số 2", "cái thứ 2"
    if (state.candidateProducts.length > 0 && !state.selectedProduct) {
      let chosenIndex = -1;
      if (/mẫu\s*(đầu|1|nhất|tiên)|cái\s*(đầu|1|nhất|tiên)|thứ\s*1/i.test(lower)) {
        chosenIndex = 0;
      } else if (/mẫu\s*(2|hai|nhì)|cái\s*(2|hai|nhì)|thứ\s*2/i.test(lower)) {
        chosenIndex = 1;
      } else if (/mẫu\s*(3|ba)|cái\s*(3|ba)|thứ\s*3/i.test(lower)) {
        chosenIndex = 2;
      } else {
        // Try matching candidate product name substring
        for (let i = 0; i < state.candidateProducts.length; i++) {
          const candidate = state.candidateProducts[i];
          if (candidate?.name && lower.includes(candidate.name.toLowerCase())) {
            chosenIndex = i;
            break;
          }
        }
      }

      if (chosenIndex >= 0 && chosenIndex < state.candidateProducts.length) {
        const selected = state.candidateProducts[chosenIndex];
        state = await this.memory.updateState(conversationId, {
          selectedProduct: selected,
          userIntent: 'SELECT_VARIANT',
        });
      }
    }

    // 2. Extract Color with Unicode boundary
    const colorMatch = lower.match(/(?:^|[^\p{L}\p{N}])(đen|trắng|be|nâu|xanh|đỏ|hồng|xám|vàng|tím|ghi)(?:$|[^\p{L}\p{N}])/iu);
    if (colorMatch) {
      state = await this.memory.updateState(conversationId, {
        selectedColor: colorMatch[1]?.trim().toLowerCase(),
      });
    }

    // 3. Extract Size with Unicode boundary
    const sizeMatch = lower.match(/(?:^|[^\p{L}\p{N}])(?:size|cỡ)?\s*([sml]|xl|xxl|2xl|3xl)(?:$|[^\p{L}\p{N}])/iu);
    if (sizeMatch && !/oversize/i.test(lower)) {
      const s = (sizeMatch[1] || '').toUpperCase();
      state = await this.memory.updateState(conversationId, {
        selectedSize: s,
      });
    }

    // 4. Extract Quantity
    const qtyMatch = lower.match(/(\d+)\s*(?:chiếc|cái|món|sp|áo|quần|váy|đầm)|(?:mua|lấy|thêm)\s*(\d+)/iu);
    if (qtyMatch) {
      const q = parseInt(qtyMatch[1] || qtyMatch[2] || '1', 10);
      if (q > 0 && q <= 10) {
        state = await this.memory.updateState(conversationId, { quantity: q });
      }
    }

    // 5. Intent classification
    if (/(?:chính\s*sách|chinh\s*sach|đổi\s*trả|doi\s*tra|bảo\s*hành|bao\s*hanh|giao\s*hàng|giao\s*hang|vận\s*chuyển|van\s*chuyen|hoàn\s*tiền|hoan\s*tien)/iu.test(lower)) {
      state = await this.memory.updateState(conversationId, {
        userIntent: 'POLICY_INQUIRY',
        selectedProduct: null,
      });
    } else if (/(?:gặp|chuyển|nói\s*chuyện|liên\s*hệ)\s*(?:nhân\s*viên|tư\s*vấn\s*viên|người\s*thật|cskh)|(?:gặp|chat\s*với)\s*nhân\s*viên/iu.test(lower)) {
      state = await this.memory.updateState(conversationId, {
        userIntent: 'HANDOFF_TO_STAFF',
      });
    } else if (/(?:xem|kiểm\s*tra|check|coi)\s*(?:giỏ|gio|gio\s*hang|giỏ\s*hàng)/iu.test(lower) || lower === 'giỏ hàng' || lower === 'xem giỏ hàng') {
      state = await this.memory.updateState(conversationId, {
        userIntent: 'VIEW_CART',
      });
    } else if (/thêm.*vào.*giỏ|cho.*vào.*giỏ|mua|đặt.*hàng/iu.test(lower)) {
      if (!state.userIntent || state.userIntent === 'SEARCH_PRODUCTS' || state.userIntent === 'POLICY_INQUIRY') {
        state = await this.memory.updateState(conversationId, {
          userIntent: 'ADD_TO_CART',
        });
      }
    }

    return { history, state };
  }

  /**
   * After advising: Save user message, assistant reply, and state changes
   */
  public async afterCall(
    conversationId: string,
    userMessage: ChatMessage,
    assistantMessage: ChatMessage,
    patchState?: Partial<ShoppingMemoryState>
  ): Promise<void> {
    await this.memory.add(conversationId, [userMessage, assistantMessage]);
    if (patchState) {
      await this.memory.updateState(conversationId, patchState);
    }
  }

  public async setCandidateProducts(
    conversationId: string,
    candidates: CandidateProduct[]
  ): Promise<void> {
    await this.memory.updateState(conversationId, {
      candidateProducts: candidates,
    });
  }
}
