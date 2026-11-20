import { ToolDefinition } from '../types/index.js';
import { NodeBackendClient, BackendAuthContext } from './NodeBackendClient.js';
import { ToolExecutionResult } from '../types/index.js';

export class ShoppingTools {
  private readonly client: NodeBackendClient;

  constructor(client: NodeBackendClient) {
    this.client = client;
  }

  /**
   * Return the 18 tool definitions according to Spring AI / OpenAPI specifications
   */
  public getDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'searchProducts',
        description: 'Tìm kiếm sản phẩm theo ngữ nghĩa (Semantic Search), tên, phong cách, danh mục, khoảng giá và tồn kho.',
        parameters: {
          type: 'object',
          properties: {
            keyword: { type: 'string', description: 'Từ khóa hoặc mô tả sản phẩm cần tìm' },
            category_slug: { type: 'string', description: 'Slug danh mục sản phẩm' },
            min_price: { type: 'number', description: 'Giá tối thiểu (VND)' },
            max_price: { type: 'number', description: 'Giá tối đa (VND)' },
            color: { type: 'string', description: 'Màu sắc mong muốn' },
            size: { type: 'string', description: 'Kích cỡ (S, M, L, XL...)' },
            in_stock: { type: 'boolean', description: 'Chỉ tìm sản phẩm còn hàng' },
            limit: { type: 'number', description: 'Số lượng sản phẩm tối đa (mặc định 5)' },
          },
        },
      },
      {
        name: 'getProductDetails',
        description: 'Lấy thông tin chi tiết của sản phẩm (giá bán, mô tả, chất liệu, hình ảnh, thông số).',
        parameters: {
          type: 'object',
          properties: {
            product_id: { type: 'string', description: 'ID hoặc slug sản phẩm' },
            slug: { type: 'string', description: 'Slug của sản phẩm' },
          },
        },
      },
      {
        name: 'getProductVariants',
        description: 'Lấy danh sách các biến thể (màu sắc, kích thước, số lượng tồn kho từng loại) của một sản phẩm.',
        parameters: {
          type: 'object',
          properties: {
            product_id: { type: 'string', description: 'ID sản phẩm' },
          },
          required: ['product_id'],
        },
      },
      {
        name: 'checkStock',
        description: 'Kiểm tra tồn kho thời gian thực cho một sản phẩm hoặc biến thể cụ thể trước khi thêm giỏ hàng hoặc thanh toán.',
        parameters: {
          type: 'object',
          properties: {
            product_id: { type: 'string', description: 'ID sản phẩm' },
            variant_id: { type: 'string', description: 'ID biến thể (nếu có)' },
            color: { type: 'string', description: 'Màu sắc' },
            size: { type: 'string', description: 'Kích cỡ' },
            quantity: { type: 'number', description: 'Số lượng cần mua' },
          },
          required: ['product_id'],
        },
      },
      {
        name: 'addToCart',
        description: 'Thêm sản phẩm và biến thể hợp lệ vào giỏ hàng của người dùng. Hệ thống tự động xác minh giá và tồn kho thực.',
        parameters: {
          type: 'object',
          properties: {
            product_id: { type: 'string', description: 'ID sản phẩm' },
            variant_id: { type: 'string', description: 'ID biến thể (nếu có)' },
            color: { type: 'string', description: 'Màu sắc' },
            size: { type: 'string', description: 'Kích cỡ' },
            quantity: { type: 'number', description: 'Số lượng cần thêm (mặc định 1)' },
          },
          required: ['product_id'],
        },
      },
      {
        name: 'updateCart',
        description: 'Cập nhật số lượng của một mặt hàng trong giỏ hàng.',
        parameters: {
          type: 'object',
          properties: {
            item_id: { type: 'string', description: 'ID mục giỏ hàng (cart item ID)' },
            quantity: { type: 'number', description: 'Số lượng mới' },
          },
          required: ['item_id', 'quantity'],
        },
      },
      {
        name: 'removeFromCart',
        description: 'Xóa một mặt hàng khỏi giỏ hàng.',
        parameters: {
          type: 'object',
          properties: {
            item_id: { type: 'string', description: 'ID mục giỏ hàng cần xóa' },
          },
          required: ['item_id'],
        },
      },
      {
        name: 'getWishlist',
        description: 'Xem danh sách các sản phẩm yêu thích (Wishlist) của người dùng đang đăng nhập.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'addToWishlist',
        description: 'Thêm sản phẩm vào danh sách yêu thích của khách hàng.',
        parameters: {
          type: 'object',
          properties: {
            product_id: { type: 'string', description: 'ID sản phẩm cần thêm vào danh sách yêu thích' },
          },
          required: ['product_id'],
        },
      },
      {
        name: 'validateVoucher',
        description: 'Kiểm tra tính hợp lệ và số tiền giảm giá của mã voucher dựa trên tổng tiền giỏ hàng.',
        parameters: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Mã voucher (ví dụ: ATELIER10, HELLO2026)' },
            subtotal: { type: 'number', description: 'Tổng tiền giỏ hàng hiện tại (tùy chọn)' },
          },
          required: ['code'],
        },
      },
      {
        name: 'applyVoucher',
        description: 'Áp dụng mã giảm giá trực tiếp vào giỏ hàng hiện tại của khách hàng.',
        parameters: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Mã voucher cần áp dụng' },
          },
          required: ['code'],
        },
      },
      {
        name: 'getMyOrders',
        description: 'Tra cứu danh sách các đơn hàng gần đây và trạng thái xử lý/vận chuyển của khách hàng.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Số lượng đơn hàng muốn xem (mặc định 5)' },
          },
        },
      },
      {
        name: 'prepareCheckout',
        description: 'Chuẩn bị đơn hàng và giữ hàng trong kho 5 phút (Redis inventory reservation) cho khách hàng.',
        parameters: {
          type: 'object',
          properties: {
            product_id: { type: 'string', description: 'ID sản phẩm (hoặc mua từ giỏ hàng)' },
            color: { type: 'string', description: 'Màu sắc' },
            size: { type: 'string', description: 'Kích cỡ' },
            quantity: { type: 'number', description: 'Số lượng' },
          },
        },
      },
      {
        name: 'confirmOrder',
        description: 'Xác nhận đặt hàng và tạo đơn hàng thực tế sau khi khách hàng đã đồng ý xác nhận thanh toán.',
        parameters: {
          type: 'object',
          properties: {
            payment_method: { type: 'string', description: 'Phương thức: cod | momo | vnpay' },
            shipping_address: { type: 'object', description: 'Địa chỉ nhận hàng của khách' },
            voucher_code: { type: 'string', description: 'Mã voucher nếu có' },
          },
        },
      },
      {
        name: 'getLoyaltyStatus',
        description: 'Tra cứu điểm thưởng tích lũy, hạng thành viên (12 hạng) và quyền lợi của khách hàng.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'getMyProfile',
        description: 'Xem thông tin tài khoản cá nhân của khách hàng đang đăng nhập.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'updateAllowedProfileFields',
        description: 'Cập nhật các trường thông tin cá nhân được phép (Họ tên, SĐT, Địa chỉ). Tuyệt đối không cho phép đổi mật khẩu/role.',
        parameters: {
          type: 'object',
          properties: {
            fullName: { type: 'string', description: 'Họ và tên mới' },
            phone: { type: 'string', description: 'Số điện thoại mới' },
          },
        },
      },
      {
        name: 'searchPublishedPolicies',
        description: 'Tra cứu các chính sách chính thức đã xuất bản của cửa hàng: Đổi trả & hoàn tiền, Bảo hành, Giao hàng, Bảo mật, Hướng dẫn chọn size.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Câu hỏi hoặc nội dung chính sách cần tra cứu' },
          },
          required: ['query'],
        },
      },
    ];
  }

  /**
   * Execute a tool by name with authorization context
   */
  public async execute(
    name: string,
    args: Record<string, unknown>,
    authContext: BackendAuthContext
  ): Promise<ToolExecutionResult> {
    // Map camelCase to backend tool naming
    const normalizedName = this.normalizeToolName(name);
    return this.client.executeTool(normalizedName, args, authContext);
  }

  private normalizeToolName(name: string): string {
    const map: Record<string, string> = {
      searchProducts: 'search_products',
      getProductDetails: 'get_product_details',
      getProductVariants: 'get_product_variants',
      checkStock: 'check_stock',
      addToCart: 'add_to_cart',
      updateCart: 'update_cart',
      removeFromCart: 'remove_from_cart',
      getWishlist: 'get_wishlist',
      addToWishlist: 'add_to_wishlist',
      validateVoucher: 'validate_voucher',
      applyVoucher: 'apply_voucher',
      getMyOrders: 'get_my_orders',
      prepareCheckout: 'prepare_checkout',
      confirmOrder: 'confirm_order',
      getLoyaltyStatus: 'get_loyalty_status',
      getMyProfile: 'get_my_profile',
      updateAllowedProfileFields: 'update_allowed_profile_fields',
      searchPublishedPolicies: 'search_published_policies',
    };
    return map[name] || name;
  }
}
