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

// Product nouns are valid search requests in Vietnamese even when the customer
// does not prefix them with "tìm". Keep this deterministic so a provider
// outage can never turn a catalogue request into a generic greeting.
const PRODUCT_QUERY_PATTERN = /(?:áo|ao|quần|quan|váy|vay|đầm|dam|jacket|blazer|polo|shirt|t[- ]?shirt|thể thao|the thao|sportswear|sport|giày|giay|túi|tui|phụ kiện|phu kien)/iu;
const EXPLICIT_SEARCH_PATTERN = /^(?:tìm|search|gợi ý|tìm kiếm|xem)\b/iu;

function extractSearchItems(result: unknown): CandidateProduct[] {
  const value = result as any;
  const rawList = Array.isArray(value)
    ? value
    : Array.isArray(value?.results)
      ? value.results
      : Array.isArray(value?.data?.results)
        ? value.data.results
        : Array.isArray(value?.data)
          ? value.data
          : [];

  return rawList
    .map((item: any) => {
      const product = item?.product || item?.metadata || item;
      const id = product?._id || product?.id || item?.sourceId;
      if (!id) return null;
      const price = product?.price ?? product?.price_number ?? product?.new_price;
      const numericPrice = typeof price === 'number' ? price : Number(String(price).replace(/[^\d]/g, ''));
      return {
        id: String(id),
        name: String(product?.name || product?.title || 'Sản phẩm Atelier'),
        slug: product?.slug,
        price: Number.isFinite(numericPrice) ? numericPrice : undefined,
        finalPrice: Number.isFinite(numericPrice) ? numericPrice : undefined,
        image: product?.image || product?.displayProduct?.[0] || '',
      } satisfies CandidateProduct;
    })
    .filter((product: CandidateProduct | null): product is CandidateProduct => product !== null);
}

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
      const isCheckoutConfirmation = toolToRun === 'start_checkout' || toolToRun === 'prepareCheckout' || toolToRun === 'prepare_checkout';
      const confirmationArgs = isCheckoutConfirmation
        ? {
            items: (items || []).map((item) => ({
              product_id: item.product_id || item.productId,
              variant_id: item.variant_id || item.variantId || null,
              color: item.color,
              size: item.size,
              quantity: item.quantity || 1,
            })),
            reservation_id: params.confirmAction.reservationId,
            confirmed: true,
          }
        : firstItem
          ? {
              product_id: firstItem.product_id || firstItem.productId,
              variant_id: firstItem.variant_id || firstItem.variantId,
              color: firstItem.color,
              size: firstItem.size,
              quantity: firstItem.quantity || 1,
              confirmed: true,
            }
          : { ...params.confirmAction, confirmed: true };

      const execResult = await this.options.toolRegistry.executeTool(
        toolToRun,
        confirmationArgs,
        authContext
      );

      const reply = execResult.success
        ? isCheckoutConfirmation
          ? execResult.message || 'Phiên thanh toán đã sẵn sàng.'
          : `Đã thêm sản phẩm vào giỏ hàng thành công! Quý khách có muốn tiến hành thanh toán hay tiếp tục chọn đồ ạ?`
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

    const isHandoffIntent =
      /(?:gặp|chuyển|nói\s*chuyện|liên\s*hệ)\s*(?:nhân\s*viên|tư\s*vấn\s*viên|người\s*thật|cskh)|(?:gặp|chat\s*với)\s*nhân\s*viên/iu.test(lower) ||
      lower === 'gặp nhân viên' ||
      memoryState?.userIntent === 'HANDOFF_TO_STAFF';

    if (isHandoffIntent) {
      const reply =
        'Dạ, em đã sẵn sàng chuyển quý khách đến bộ phận Chuyên viên Tư vấn & CSKH của Atelier Vérité.\n\n' +
        'Quý khách vui lòng chọn tab **"Chat với nhân viên"** ở thanh tiêu đề bên trên hoặc nhấn nút chuyển nhanh bên dưới để bắt đầu cuộc trò chuyện trực tiếp ạ!';

      if (this.options.memoryAdvisor) {
        await this.options.memoryAdvisor.afterCall(
          conversationId,
          { role: 'user', content: userText },
          { role: 'assistant', content: reply },
          { userIntent: 'HANDOFF_TO_STAFF' }
        );
      }

      return {
        conversationId,
        reply,
        intent: 'HANDOFF_TO_STAFF',
        handoffReady: true,
        quickReplies: [
          { label: 'Chuyển sang nhân viên', action: 'switch_to_staff' },
        ],
      };
    }

    const isViewCartIntent =
      /(?:xem|kiểm\s*tra|check|coi)\s*(?:giỏ|gio|gio\s*hang|giỏ\s*hàng)/iu.test(lower) ||
      lower === 'giỏ hàng' ||
      lower === 'xem giỏ hàng' ||
      memoryState?.userIntent === 'VIEW_CART';

    if (isViewCartIntent) {
      let cartSummary = '';
      if (this.options.toolRegistry) {
        try {
          const cartRes: any = await this.options.toolRegistry.executeTool('getMyCart', {}, authContext);
          if (cartRes?.items?.length > 0) {
            cartSummary = `\nHiện tại giỏ hàng của quý khách có ${cartRes.items.length} món sản phẩm (Tạm tính: ${cartRes.totalPriceFormatted || cartRes.total || '0đ'}).`;
          }
        } catch {
          // ignore
        }
      }

      const reply = `Dạ, quý khách có thể kiểm tra và quản lý chi tiết giỏ hàng của mình tại đây.${cartSummary}\nQuý khách muốn xem trang giỏ hàng hay tìm thêm trang phục nào khác ạ?`;

      if (this.options.memoryAdvisor) {
        await this.options.memoryAdvisor.afterCall(
          conversationId,
          { role: 'user', content: userText },
          { role: 'assistant', content: reply },
          { userIntent: 'VIEW_CART' }
        );
      }

      return {
        conversationId,
        reply,
        intent: 'VIEW_CART',
        quickReplies: [
          { label: 'Xem giỏ hàng', action: 'view_cart', url: '/cart' },
          { label: 'Tìm áo', action: 'search' },
        ],
      };
    }

    const isCheckoutIntent = /(?:thanh\s*toán|đặt\s*hàng|mua\s*ngay|chốt\s*đơn|tiến\s*hành\s*thanh\s*toán|checkout|place\s*order|mua\s*sản\s*phẩm\s*vừa\s*chọn)/iu.test(lower);
    if (isCheckoutIntent && this.options.toolRegistry) {
      const cartResult: any = await this.options.toolRegistry.executeTool('getMyCart', {}, authContext);
      if (cartResult?.success === false) {
        return { conversationId, reply: cartResult.message || 'Không thể kiểm tra giỏ hàng lúc này.', intent: 'CHECKOUT_PREPARE', metadata: { responseType: 'error' } };
      }
      if (typeof cartResult === 'string' || !Array.isArray(cartResult?.items) || cartResult.items.length === 0) {
        return {
          conversationId,
          reply: 'Giỏ hàng của quý khách đang trống. Hãy chọn sản phẩm và biến thể trước khi tiến hành thanh toán.',
          intent: 'CHECKOUT_PREPARE',
          metadata: { responseType: 'cart_summary' },
        };
      }

      const requestedTerms = lower
        .replace(/(?:thanh\s*toán|đặt\s*hàng|mua\s*ngay|chốt\s*đơn|tiến\s*hành|checkout|place\s*order|mua\s*sản\s*phẩm\s*vừa\s*chọn)/giu, ' ')
        .trim()
        .split(/\s+/)
        .filter((term) => term.length > 1);
      const matchingItems = requestedTerms.length === 0
        ? cartResult.items
        : cartResult.items.filter((item: any) => {
            const name = String(item.product_name || item.name || '').toLocaleLowerCase('vi-VN');
            return requestedTerms.every((term) => name.includes(term));
          });

      if (matchingItems.length === 0) {
        return {
          conversationId,
          reply: 'Em chưa tìm thấy sản phẩm được yêu cầu trong giỏ hàng hiện tại. Quý khách vui lòng chọn đúng sản phẩm trong giỏ trước khi thanh toán.',
          intent: 'CHECKOUT_PREPARE',
          metadata: { responseType: 'cart_summary' },
        };
      }
      if (matchingItems.some((item: any) => !item.product_id)) {
        return {
          conversationId,
          reply: 'Hiện chưa thể xác minh đầy đủ thông tin sản phẩm trong giỏ để chuẩn bị thanh toán. Quý khách vui lòng thử lại sau.',
          intent: 'CHECKOUT_PREPARE',
          metadata: { responseType: 'error' },
        };
      }

      const checkoutResult: any = await this.options.toolRegistry.executeTool(
        'prepareCheckout',
        {
          items: matchingItems.map((item: any) => ({
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            color: item.color || undefined,
            size: item.size || undefined,
            quantity: Number(item.quantity || 1),
          })),
        },
        authContext
      );

      const reply = checkoutResult?.message || 'Không thể chuẩn bị phiên thanh toán lúc này.';
      if (this.options.memoryAdvisor) {
        await this.options.memoryAdvisor.afterCall(
          conversationId,
          { role: 'user', content: userText },
          { role: 'assistant', content: reply },
          { userIntent: 'CHECKOUT_PREPARE', pendingAction: checkoutResult?.requiresConfirmation ? checkoutResult : null }
        );
      }
      return {
        conversationId,
        reply,
        intent: 'CHECKOUT_PREPARE',
        pendingAction: checkoutResult?.requiresConfirmation ? checkoutResult : null,
        actionResult: checkoutResult,
        metadata: { responseType: checkoutResult?.requiresConfirmation ? 'confirmation_required' : 'error' },
      };
    }

    const hasExplicitProductQuery = PRODUCT_QUERY_PATTERN.test(lower);
    const isSearchIntent =
      EXPLICIT_SEARCH_PATTERN.test(lower) ||
      /tìm.*giúp|gợi ý.*cho|xem.*sản phẩm|kiếm.*áo|kiếm.*quần|kiếm.*váy|kiếm.*đầm/iu.test(lower) ||
      hasExplicitProductQuery;

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

        const foundProducts = extractSearchItems(searchResult);

        if (foundProducts.length > 0) {
          const targetProduct = foundProducts[0];

          // If action is explicitly ADD_TO_CART
          if (isAddToCartIntent) {
            // Check if user already provided color & size
            const hasColor = Boolean(memoryState?.selectedColor);
            const hasSize = Boolean(memoryState?.selectedSize);

            // If user already specified color & size, execute addToCart directly!
            if (hasColor && hasSize) {
              const qty = memoryState?.quantity || 1;
              const addRes = await this.options.toolRegistry.executeTool(
                'addToCart',
                {
                  product_id: targetProduct.id,
                  color: memoryState!.selectedColor,
                  size: memoryState!.selectedSize,
                  quantity: qty,
                },
                authContext
              );

              const reply = addRes.success
                ? `Đã kiểm tra tồn kho và thêm thành công **${targetProduct.name}** (Màu: ${memoryState!.selectedColor}, Size: ${memoryState!.selectedSize}, Số lượng: ${qty}) vào giỏ hàng của quý khách!`
                : addRes.message || 'Không thể thêm sản phẩm vào giỏ hàng.';

              if (this.options.memoryAdvisor) {
                await this.options.memoryAdvisor.afterCall(
                  conversationId,
                  { role: 'user', content: userText },
                  { role: 'assistant', content: reply },
                  { selectedProduct: null, userIntent: null }
                );
              }

              return {
                conversationId,
                reply,
                selectedProduct: targetProduct,
                candidateProducts: foundProducts,
                actionResult: addRes,
                intent: 'ADD_TO_CART',
                quickReplies: [
                  { label: 'Xem giỏ hàng', action: 'view_cart', url: '/cart' },
                  { label: 'Tiếp tục mua sắm', action: 'search' },
                ],
              };
            }

            // Otherwise, get variants and ask for color/size with quick replies
            let colors: string[] = [];
            let sizes: string[] = [];
            try {
              const varRes = await this.options.toolRegistry.executeTool(
                'getProductVariants',
                { product_id: targetProduct.id },
                authContext
              );
              if (Array.isArray(varRes) && varRes.length > 0) {
                const c = [...new Set(varRes.map((v) => v.color).filter((value): value is string => typeof value === 'string' && value.trim().length > 0))];
                const s = [...new Set(varRes.map((v) => v.size).filter((value): value is string => typeof value === 'string' && value.trim().length > 0))];
                if (c.length) colors = c as string[];
                if (s.length) sizes = s as string[];
              }
            } catch {
              // fallback
            }

            if (this.options.memoryAdvisor) {
              await this.options.memoryAdvisor.setCandidateProducts(conversationId, foundProducts);
              await this.options.memoryAdvisor.afterCall(
                conversationId,
                { role: 'user', content: userText },
                {
                  role: 'assistant',
                  content: `Atelier đã chọn mẫu **${targetProduct.name}** theo yêu cầu thêm vào giỏ hàng của quý khách. Quý khách vui lòng chọn màu sắc và kích cỡ:`,
                },
                { selectedProduct: targetProduct, candidateProducts: foundProducts, userIntent: 'ADD_TO_CART' }
              );
            }

            const productBulletList = foundProducts
              .map((p, idx) => `${idx + 1}. **${p.name}** - ${typeof p.finalPrice === 'number' ? p.finalPrice.toLocaleString('vi-VN') + 'đ' : ''}`)
              .join('\n');

            return {
              conversationId,
              reply: `Atelier Vérité đã chọn mẫu **${targetProduct.name}** theo yêu cầu thêm vào giỏ hàng của quý khách.\n\n${productBulletList}\n\nQuý khách vui lòng chọn màu sắc và kích cỡ bên dưới (hoặc bấm chọn mẫu khác) để em thêm vào giỏ hàng nhé:`,
              intent: 'ADD_TO_CART',
              selectedProduct: targetProduct,
              candidateProducts: foundProducts,
              suggestedVariants: { colors, sizes },
              quickReplies: [
                ...colors.map((c) => ({ label: `Màu ${c}`, action: 'select_color', payload: c })),
                ...sizes.map((s) => ({ label: `Size ${s}`, action: 'select_size', payload: s })),
                { label: 'Xem giỏ hàng', action: 'view_cart', url: '/cart' },
              ],
            };
          }

          // Search intent (browse/recommend)
          if (this.options.memoryAdvisor) {
            await this.options.memoryAdvisor.setCandidateProducts(conversationId, foundProducts);
            await this.options.memoryAdvisor.afterCall(
              conversationId,
              { role: 'user', content: userText },
              {
                role: 'assistant',
                content: `Atelier Vérité tìm thấy các thiết kế phù hợp với yêu cầu của quý khách. Quý khách ưng ý mẫu nào nhất ạ?`,
              },
              { userIntent: 'SEARCH_PRODUCTS', candidateProducts: foundProducts }
            );
          }

          const productBulletList = foundProducts
            .map((p, idx) => `${idx + 1}. **${p.name}** - ${typeof p.finalPrice === 'number' ? p.finalPrice.toLocaleString('vi-VN') + 'đ' : ''}`)
            .join('\n');

          return {
            conversationId,
            reply: `Atelier Vérité tìm thấy các thiết kế phù hợp với yêu cầu của quý khách:\n\n${productBulletList}\n\nQuý khách muốn chọn mẫu nào (ví dụ: *Mẫu đầu tiên*, *Mẫu 2*) ạ?`,
            intent: 'PRODUCT_SEARCH',
            candidateProducts: foundProducts,
          };
        }

        const searchFailure = searchResult as any;
        const reply = typeof searchResult === 'string'
          ? 'Hiện cửa hàng chưa tìm thấy mẫu phù hợp với yêu cầu của quý khách. Quý khách có thể thử một kiểu dáng, màu sắc hoặc khoảng giá khác.'
          : searchFailure?.success === false
            ? 'Hiện em chưa thể truy cập danh mục sản phẩm. Quý khách vui lòng thử lại sau ít phút.'
            : 'Hiện cửa hàng chưa tìm thấy mẫu phù hợp với yêu cầu của quý khách. Quý khách có thể thử một kiểu dáng, màu sắc hoặc khoảng giá khác.';

        if (this.options.memoryAdvisor) {
          await this.options.memoryAdvisor.afterCall(
            conversationId,
            { role: 'user', content: userText },
            { role: 'assistant', content: reply },
            { userIntent: null, candidateProducts: [], selectedProduct: null }
          );
        }

        return { conversationId, reply, intent: 'PRODUCT_SEARCH', candidateProducts: [] };
      }
    }

    // Step B: User has selected a product (e.g. "Mẫu đầu tiên"), now check/ask variants
    if (memoryState?.selectedProduct) {
      const selected = memoryState.selectedProduct;
      const needColor = !memoryState.selectedColor;
      const needSize = !memoryState.selectedSize;

      // If missing color or size, ask user with quick replies
      if (needColor || needSize) {
        let colors: string[] = [];
        let sizes: string[] = [];
        let variantHint = '';
        if (this.options.toolRegistry) {
          const varRes = await this.options.toolRegistry.executeTool(
            'getProductVariants',
            { product_id: selected.id },
            authContext
          );
          if (Array.isArray(varRes) && varRes.length > 0) {
            const c = [...new Set(varRes.map((v) => v.color).filter((value): value is string => typeof value === 'string' && value.trim().length > 0))];
            const s = [...new Set(varRes.map((v) => v.size).filter((value): value is string => typeof value === 'string' && value.trim().length > 0))];
            if (c.length) colors = c as string[];
            if (s.length) sizes = s as string[];
            variantHint = colors.length || sizes.length
              ? `\n(Màu hiện có: ${colors.join(', ') || 'chưa xác minh'} | Size: ${sizes.join(', ') || 'chưa xác minh'})`
              : '';
          }
        }

        const reply = `Quý khách đã chọn **${selected.name}**. Quý khách muốn chọn màu sắc và kích cỡ nào${variantHint} để thêm vào giỏ hàng ạ?`;
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
          suggestedVariants: { colors, sizes },
          quickReplies: [
            ...colors.map((c) => ({ label: `Màu ${c}`, action: 'select_color', payload: c })),
            ...sizes.map((s) => ({ label: `Size ${s}`, action: 'select_size', payload: s })),
          ],
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
          reply = `Đã kiểm tra tồn kho và thêm thành công **${selected.name}** (${memoryState.selectedColor}, size ${memoryState.selectedSize}, x${qty}) vào giỏ hàng của quý khách! Quý khách có thể xem giỏ hàng hoặc tiếp tục mua sắm.`;
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
          quickReplies: [
            { label: 'Xem giỏ hàng', action: 'view_cart', url: '/cart' },
            { label: 'Tìm áo khác', action: 'search' },
          ],
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
      return 'Dịch vụ tư vấn AI hiện chưa sẵn sàng. Quý khách có thể thử lại sau hoặc chuyển sang Chat với nhân viên để được hỗ trợ ngay.';
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
      return 'Dịch vụ tư vấn AI đang tạm thời gián đoạn. Quý khách vui lòng thử lại sau hoặc chuyển sang Chat với nhân viên.';
    }
  }
}
