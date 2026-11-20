import {
  ChatMessage,
  ChatResponsePayload,
  CandidateProduct,
  ToolDefinition,
} from '../types/index.js';
import { PromptTemplate } from './PromptTemplate.js';
import { ShoppingMemoryAdvisor } from '../memory/ShoppingMemoryAdvisor.js';
import { QuestionAnswerAdvisor } from '../rag/QuestionAnswerAdvisor.js';
import { ToolRegistry } from '../tools/ToolRegistry.js';
import { SafetyGuardrails } from '../security/SafetyGuardrails.js';
import { BackendAuthContext } from '../tools/NodeBackendClient.js';

export interface ChatClientOptions {
  defaultSystemPrompt?: string;
  memoryAdvisor?: ShoppingMemoryAdvisor;
  ragAdvisor?: QuestionAnswerAdvisor;
  toolRegistry?: ToolRegistry;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export class ChatClientBuilder {
  private defaultSystemPrompt =
    'Bạn là Trợ lý Mua sắm Thông minh & Stylist AI cao cấp của Atelier Vérité (Thời trang Haute Couture & Ready-to-Wear). ' +
    'Luôn giao tiếp bằng tiếng Việt lịch thiệp, tinh tế, sang trọng. ' +
    'Khi khách hàng muốn mua hoặc thêm vào giỏ hàng, hãy chủ động hỗ trợ từng bước: tìm sản phẩm thật, hỏi chọn mẫu, hỏi màu sắc/kích cỡ, kiểm tra tồn kho và thêm vào giỏ hàng thật qua hệ thống. ' +
    'Tuyệt đối không bịa đặt sản phẩm, giá cả hay tồn kho. Giá và tồn kho luôn lấy từ dữ liệu hệ thống được cung cấp.';
  private memoryAdvisor?: ShoppingMemoryAdvisor;
  private ragAdvisor?: QuestionAnswerAdvisor;
  private toolRegistry?: ToolRegistry;
  private apiKey?: string;
  private baseUrl?: string;
  private model?: string;

  public defaultSystem(systemPrompt: string): this {
    this.defaultSystemPrompt = systemPrompt;
    return this;
  }

  public defaultMemoryAdvisor(advisor: ShoppingMemoryAdvisor): this {
    this.memoryAdvisor = advisor;
    return this;
  }

  public defaultRagAdvisor(advisor: QuestionAnswerAdvisor): this {
    this.ragAdvisor = advisor;
    return this;
  }

  public defaultToolRegistry(registry: ToolRegistry): this {
    this.toolRegistry = registry;
    return this;
  }

  public modelConfig(config: { apiKey?: string; baseUrl?: string; model?: string }): this {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.model = config.model;
    return this;
  }

  public build(): ChatClient {
    return new ChatClient({
      defaultSystemPrompt: this.defaultSystemPrompt,
      memoryAdvisor: this.memoryAdvisor,
      ragAdvisor: this.ragAdvisor,
      toolRegistry: this.toolRegistry,
      apiKey: this.apiKey || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
      baseUrl: this.baseUrl || (process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1'),
      model: this.model || process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || 'meta-llama/llama-3.1-70b-instruct',
    });
  }
}

export class ChatClientPromptRequest {
  private readonly client: ChatClient;
  private userText = '';
  private customSystemPrompt?: string;
  private conversationId = 'default';
  private authContext: BackendAuthContext = { role: 'guest' };
  private confirmAction?: Record<string, unknown>;
  private cancelAction?: boolean | Record<string, unknown>;

  constructor(client: ChatClient) {
    this.client = client;
  }

  public user(text: string): this {
    this.userText = text;
    return this;
  }

  public system(prompt: string): this {
    this.customSystemPrompt = prompt;
    return this;
  }

  public conversation(id: string): this {
    this.conversationId = id;
    return this;
  }

  public auth(context: BackendAuthContext): this {
    this.authContext = context;
    return this;
  }

  public confirmation(confirmAction?: Record<string, unknown>, cancelAction?: boolean | Record<string, unknown>): this {
    this.confirmAction = confirmAction;
    this.cancelAction = cancelAction;
    return this;
  }

  public async call(): Promise<{ chatResponse: () => Promise<ChatResponsePayload> }> {
    const response = await this.client.executePrompt({
      userText: this.userText,
      systemPrompt: this.customSystemPrompt,
      conversationId: this.conversationId,
      authContext: this.authContext,
      confirmAction: this.confirmAction,
      cancelAction: this.cancelAction,
    });

    return {
      chatResponse: async () => response,
    };
  }
}

export class ChatClient {
  private readonly options: ChatClientOptions;

  constructor(options: ChatClientOptions) {
    this.options = options;
  }

  public static builder(): ChatClientBuilder {
    return new ChatClientBuilder();
  }

  public prompt(): ChatClientPromptRequest {
    return new ChatClientPromptRequest(this);
  }

  /**
   * Orchestrate LLM turn: Memory Advisors, RAG, Tool Calling, Structured Output
   */
  public async executePrompt(params: {
    userText: string;
    systemPrompt?: string;
    conversationId: string;
    authContext: BackendAuthContext;
    confirmAction?: Record<string, unknown>;
    cancelAction?: boolean | Record<string, unknown>;
  }): Promise<ChatResponsePayload> {
    const { userText, conversationId, authContext } = params;

    // 1. Safety Guardrails evaluation
    const guardrail = SafetyGuardrails.evaluateInput(userText);
    if (guardrail.blocked) {
      return {
        conversationId,
        reply: guardrail.replyMessage || 'Thao tác không được phép thực hiện.',
        metadata: { blocked: true, code: guardrail.code, reason: guardrail.reason },
      };
    }

    // 2. Chat Memory Advisor: load history & extract entities
    let memoryState = this.options.memoryAdvisor
      ? (await this.options.memoryAdvisor.beforeCall(conversationId, userText)).state
      : null;

    // 3. Handle explicit Cancel Action
    if (params.cancelAction) {
      if (this.options.memoryAdvisor) {
        await this.options.memoryAdvisor.afterCall(
          conversationId,
          { role: 'user', content: userText },
          { role: 'assistant', content: 'Đã hủy thao tác theo yêu cầu của bạn.' },
          { pendingAction: null, selectedProduct: null }
        );
      }
      return {
        conversationId,
        reply: 'Đã hủy thao tác theo yêu cầu của bạn. Quý khách có muốn khám phá mẫu trang phục nào khác không ạ?',
        pendingAction: null,
        actionResult: { status: 'CANCELLED' },
      };
    }

    // 4. Handle explicit Confirm Action (Confirmation Gate for cart / order)
    if (params.confirmAction && this.options.toolRegistry) {
      const toolToRun = (params.confirmAction.actionType as string) || 'addToCart';
      const items = params.confirmAction.items as any[];
      const firstItem = items?.[0];

      const execResult = await this.options.toolRegistry.executeTool(
        toolToRun,
        firstItem
          ? {
              product_id: firstItem.product_id || firstItem.productId,
              variant_id: firstItem.variant_id || firstItem.variantId,
              color: firstItem.color,
              size: firstItem.size,
              quantity: firstItem.quantity || 1,
              confirmed: true,
            }
          : params.confirmAction,
        authContext
      );

      const reply = execResult.success
        ? `Đã thêm sản phẩm vào giỏ hàng thành công! Quý khách có muốn tiến hành thanh toán hay tiếp tục chọn đồ ạ?`
        : `Không thể hoàn tất thao tác: ${execResult.message || 'Lỗi hệ thống'}`;

      if (this.options.memoryAdvisor) {
        await this.options.memoryAdvisor.afterCall(
          conversationId,
          { role: 'user', content: userText },
          { role: 'assistant', content: reply },
          { pendingAction: null, selectedProduct: null }
        );
      }

      return {
        conversationId,
        reply,
        actionResult: execResult,
        pendingAction: null,
      };
    }

    // 5. Multi-turn Workflow orchestration based on Memory & Intent
    const lower = userText.toLowerCase().trim();
    const isPolicyInquiry =
      /(?:chính\s*sách|chinh\s*sach|đổi\s*trả|doi\s*tra|giao\s*hàng|giao\s*hang|bảo\s*hành|bao\s*hanh|bảng\s*size|bang\s*size|vận\s*chuyển|van\s*chuyen|hoàn\s*tiền|hoan\s*tien|liên\s*hệ|lien\s*he)/iu.test(lower) ||
      memoryState?.userIntent === 'POLICY_INQUIRY';

    // Step Policy / RAG (evaluated first so questions don't get hijacked by shopping intent)
    if (isPolicyInquiry) {
      let policyText = '';
      let policySources: Array<{ id: string; title?: string; snippet?: string; score?: number }> = [];

      if (this.options.ragAdvisor) {
        const rag = await this.options.ragAdvisor.retrieveContext(userText);
        if (rag.sources.length > 0) {
          policyText = rag.sources[0]?.snippet || '';
          policySources = rag.sources;
        }
      }

      if (!policyText && this.options.toolRegistry) {
        try {
          const pResult: any = await this.options.toolRegistry.executeTool(
            'searchPublishedPolicies',
            { query: userText },
            authContext
          );
          if (pResult?.chunks?.length > 0) {
            policyText = pResult.chunks.map((c: any) => c.content).join('\n\n');
            policySources = pResult.chunks.map((c: any, idx: number) => ({
              id: `policy-${idx}`,
              title: c.title || 'Chính sách Atelier Vérité',
              snippet: String(c.content).slice(0, 300),
            }));
          }
        } catch {
          // Fall through to standard policy
        }
      }

      if (!policyText) {
        policyText =
          'Chính sách đổi trả của Atelier Vérité: Quý khách được đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên tem mác, chưa qua sử dụng hoặc giặt ủi. Atelier Vérité hỗ trợ đổi size hoặc đổi sang mẫu khác hoàn toàn miễn phí tại hệ thống boutique hoặc qua dịch vụ thu hồi tận nơi.';
        policySources = [
          {
            id: 'policy-default',
            title: 'Chính sách đổi trả & hoàn tiền Atelier Vérité',
            snippet: policyText,
          },
        ];
      }

      const reply = `Theo quy định và chính sách chính thức của Atelier Vérité:\n\n${policyText}\n\nQuý khách có cần tư vấn chi tiết thêm về điều kiện đổi trả hay hướng dẫn gửi lại hàng không ạ?`;

      if (this.options.memoryAdvisor) {
        await this.options.memoryAdvisor.afterCall(
          conversationId,
          { role: 'user', content: userText },
          { role: 'assistant', content: reply },
          { userIntent: 'POLICY_INQUIRY', selectedProduct: null }
        );
      }

      return {
        conversationId,
        reply,
        sources: policySources,
      };
    }

    const isSearchIntent =
      /^(?:tìm|search|gợi ý|tìm kiếm|xem)/iu.test(lower) ||
      /tìm.*giúp|gợi ý.*cho|xem.*sản phẩm|kiếm.*áo|kiếm.*quần|kiếm.*váy|kiếm.*đầm/iu.test(lower) ||
      memoryState?.userIntent === 'SEARCH_PRODUCTS';

    const isAddToCartIntent =
      /thêm.*vào.*giỏ|cho.*vào.*giỏ|mua|đặt.*hàng/i.test(lower) ||
      memoryState?.userIntent === 'ADD_TO_CART';

    // Step A: User asks to search product OR add to cart with no product selected yet
    if ((isSearchIntent || isAddToCartIntent) && (!memoryState?.selectedProduct || memoryState.candidateProducts.length === 0)) {
      if (this.options.toolRegistry) {
        // Run real semantic search
        const searchResult = await this.options.toolRegistry.executeTool(
          'searchProducts',
          { keyword: userText, limit: 4 },
          authContext
        );

        const foundProducts: CandidateProduct[] = [];
        if (searchResult && (Array.isArray(searchResult) || Array.isArray((searchResult as any).results))) {
          const rawList = Array.isArray(searchResult) ? searchResult : (searchResult as any).results;
          for (const item of rawList) {
            const p = item.product || item.metadata || item;
            foundProducts.push({
              id: String(p._id || p.id || item.sourceId),
              name: p.name || 'Sản phẩm Atelier',
              slug: p.slug,
              price: p.price ?? p.new_price ?? p.price_number,
              finalPrice: p.new_price ?? p.price,
              image: p.image || p.displayProduct?.[0] || '',
            });
          }
        }

        if (foundProducts.length > 0) {
          if (this.options.memoryAdvisor) {
            await this.options.memoryAdvisor.setCandidateProducts(conversationId, foundProducts);
            await this.options.memoryAdvisor.afterCall(
              conversationId,
              { role: 'user', content: userText },
              {
                role: 'assistant',
                content: `Atelier Vérité tìm thấy các thiết kế phù hợp với yêu cầu của quý khách. Quý khách ưng ý mẫu nào nhất ạ?`,
              },
              { userIntent: 'ADD_TO_CART', candidateProducts: foundProducts }
            );
          }

          const productBulletList = foundProducts
            .map((p, idx) => `${idx + 1}. **${p.name}** - ${typeof p.finalPrice === 'number' ? p.finalPrice.toLocaleString('vi-VN') + 'đ' : ''}`)
            .join('\n');

          return {
            conversationId,
            reply: `Atelier Vérité tìm thấy các thiết kế phù hợp với yêu cầu của quý khách:\n\n${productBulletList}\n\nQuý khách muốn chọn mẫu nào (ví dụ: *Mẫu đầu tiên*, *Mẫu 2*) ạ?`,
            intent: 'ADD_TO_CART',
            candidateProducts: foundProducts,
          };
        }
      }
    }

    // Step B: User has selected a product (e.g. "Mẫu đầu tiên"), now check/ask variants
    if (memoryState?.selectedProduct) {
      const selected = memoryState.selectedProduct;
      const needColor = !memoryState.selectedColor;
      const needSize = !memoryState.selectedSize;

      // If missing color or size, ask user
      if (needColor || needSize) {
        let variantHint = '';
        if (this.options.toolRegistry) {
          const varRes = await this.options.toolRegistry.executeTool(
            'getProductVariants',
            { product_id: selected.id },
            authContext
          );
          if (Array.isArray(varRes)) {
            const colors = [...new Set(varRes.map((v) => v.color).filter(Boolean))];
            const sizes = [...new Set(varRes.map((v) => v.size).filter(Boolean))];
            variantHint = `\n(Màu hiện có: ${colors.join(', ') || 'Tiêu chuẩn'} | Size: ${sizes.join(', ') || 'Freesize'})`;
          }
        }

        const reply = `Quý khách đã chọn **${selected.name}**. Quý khách muốn chọn màu sắc và kích cỡ nào${variantHint} ạ?`;
        if (this.options.memoryAdvisor) {
          await this.options.memoryAdvisor.afterCall(
            conversationId,
            { role: 'user', content: userText },
            { role: 'assistant', content: reply }
          );
        }

        return {
          conversationId,
          reply,
          selectedProduct: selected,
          candidateProducts: memoryState.candidateProducts,
        };
      }

      // If user has provided product + color + size, check stock & execute addToCart!
      if (this.options.toolRegistry) {
        const qty = memoryState.quantity || 1;
        const addRes = await this.options.toolRegistry.executeTool(
          'addToCart',
          {
            product_id: selected.id,
            color: memoryState.selectedColor,
            size: memoryState.selectedSize,
            quantity: qty,
          },
          authContext
        );

        let reply = '';
        let pendingAction = null;

        if (addRes.requiresConfirmation || addRes.status === 'PENDING_CONFIRMATION') {
          reply = `Đã kiểm tra tồn kho cho **${selected.name}** (${memoryState.selectedColor}, size ${memoryState.selectedSize}, số lượng: ${qty}). Quý khách vui lòng bấm nút "Xác nhận" để thêm vào giỏ hàng nhé!`;
          pendingAction = addRes;
        } else if (addRes.success) {
          reply = `Đã thêm thành công **${selected.name}** (${memoryState.selectedColor}, size ${memoryState.selectedSize}, x${qty}) vào giỏ hàng của quý khách!`;
        } else {
          reply = addRes.message || 'Không thể thêm sản phẩm vào giỏ hàng. Quý khách vui lòng thử lại.';
        }

        if (this.options.memoryAdvisor) {
          await this.options.memoryAdvisor.afterCall(
            conversationId,
            { role: 'user', content: userText },
            { role: 'assistant', content: reply },
            { pendingAction, selectedProduct: null, userIntent: null }
          );
        }

        return {
          conversationId,
          reply,
          selectedProduct: selected,
          actionResult: addRes,
          pendingAction,
        };
      }
    }


    // Step D: General assistance via real LLM API or fallback
    const systemPrompt = params.systemPrompt || this.options.defaultSystemPrompt || '';
    const llmReply = await this.callLlmApi([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText },
    ]);

    if (this.options.memoryAdvisor) {
      await this.options.memoryAdvisor.afterCall(
        conversationId,
        { role: 'user', content: userText },
        { role: 'assistant', content: llmReply }
      );
    }

    return {
      conversationId,
      reply: llmReply,
      candidateProducts: memoryState?.candidateProducts || [],
    };
  }

  /**
   * Call external LLM provider with fallback handling
   */
  private async callLlmApi(messages: ChatMessage[]): Promise<string> {
    const apiKey = this.options.apiKey;
    const baseUrl = this.options.baseUrl || 'https://openrouter.ai/api/v1';
    const model = this.options.model || 'meta-llama/llama-3.1-70b-instruct';

    if (!apiKey || apiKey.startsWith('sk-or-v1-your')) {
      return (
        'Xin kính chào quý khách! Tôi là Stylist AI của Atelier Vérité. ' +
        'Tôi sẵn sàng hỗ trợ quý khách tìm kiếm trang phục Haute Couture, kiểm tra bảng size, áp dụng voucher ưu đãi và quản lý giỏ hàng.'
      );
    }

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 800,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        throw new Error(`LLM provider error: ${res.status}`);
      }

      const json = await res.json() as any;
      return json?.choices?.[0]?.message?.content || 'Xin lỗi quý khách, hệ thống AI đang cập nhật.';
    } catch {
      return (
        'Dạ, Atelier Vérité đã ghi nhận yêu cầu của quý khách. ' +
        'Quý khách muốn tìm kiếm trang phục dạ tiệc, áo blazer phong cách kiến trúc hay tư vấn bảng size chuẩn ạ?'
      );
    }
  }
}
