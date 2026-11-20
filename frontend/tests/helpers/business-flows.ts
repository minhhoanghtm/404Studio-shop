export interface BusinessFlowMethod {
  methodId: string; // e.g. "cach01", "cach02", "cach03"
  methodName: string;
  description: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  backendVerification: string;
  databaseVerification: string;
}

export interface BusinessFlowItem {
  id: string; // e.g. "add_to_cart"
  name: string;
  entryRoute: string;
  category: 'Commerce' | 'Customer' | 'Admin' | 'Marketing' | 'CMS';
  methods: BusinessFlowMethod[];
}

export const BUSINESS_FLOW_MATRIX: BusinessFlowItem[] = [
  // ── 1. Search & Filter Products ───────────────────────────────────────────
  {
    id: 'search_products',
    name: 'Tìm Kiếm & Lọc Sản Phẩm',
    entryRoute: '/',
    category: 'Commerce',
    methods: [
      {
        methodId: 'cach01',
        methodName: 'Tìm Kiếm Nhanh Bằng Header Modal',
        description: 'Mở modal tìm kiếm nhanh từ Header, nhập từ khóa và xem kết quả gợi ý thời gian thực',
        preconditions: 'Người dùng ở bất kỳ trang nào có Header',
        steps: [
          'Nhấn biểu tượng Kính lúp (Search) trên Header',
          'Chờ QuickSearchModal hiển thị',
          'Nhập từ khóa "Áo"',
          'Xem danh sách sản phẩm gợi ý và nhấn vào sản phẩm đầu tiên',
        ],
        expectedResult: 'Điều hướng đến trang chi tiết sản phẩm tương ứng',
        backendVerification: 'GET /api/products?search=ao trả về danh sách sản phẩm thực tế',
        databaseVerification: 'Collection `products` chứa các bản ghi phù hợp từ khóa',
      },
      {
        methodId: 'cach02',
        methodName: 'Lọc & Sắp Xếp Trên Trang Danh Mục',
        description: 'Truy cập /products, lọc theo danh mục và sắp xếp theo giá',
        preconditions: 'Kho sản phẩm có ít nhất 2 sản phẩm',
        steps: [
          'Điều hướng đến /products',
          'Chọn bộ lọc danh mục (Ví dụ: Thời trang Nữ hoặc Tất cả)',
          'Thay đổi thứ tự sắp xếp (Giá: Thấp đến Cao)',
          'Kiểm tra danh sách sản phẩm cập nhật tương ứng',
        ],
        expectedResult: 'Danh sách sản phẩm được sắp xếp đúng thứ tự giá',
        backendVerification: 'GET /api/products?sort=price_asc trả về dữ liệu chuẩn',
        databaseVerification: 'Dữ liệu khớp trường `price` trong collection `products`',
      },
      {
        methodId: 'cach03',
        methodName: 'Tìm Kiếm Thông Minh Bằng Trợ Lý Stylist AI',
        description: 'Mở cửa sổ chat Stylist AI, yêu cầu gợi ý trang phục dạ tiệc / thu đông',
        preconditions: 'Dịch vụ AI backend và vector database hoạt động',
        steps: [
          'Nhấn nút Stylist AI nổi ở góc dưới bên phải',
          'Chờ AiAssistantModal hiển thị',
          'Gửi câu hỏi gợi ý trang phục thời trang cao cấp',
          'Quan sát phản hồi thông minh và thẻ sản phẩm gợi ý từ AI',
        ],
        expectedResult: 'AI đưa ra lời khuyên phong cách và hiển thị sản phẩm liên quan',
        backendVerification: 'POST /api/ai/chat trả về câu trả lời và sản phẩm từ DB thật',
        databaseVerification: 'Vector embeddings và collection `products` được truy vấn',
      },
    ],
  },

  // ── 2. Add to Bag / Cart Operations ───────────────────────────────────────
  {
    id: 'add_to_cart',
    name: 'Thêm Sản Phẩm Vào Giỏ Hàng',
    entryRoute: '/products/ao-thun-tron-oversize-nam',
    category: 'Commerce',
    methods: [
      {
        methodId: 'cach01',
        methodName: 'Thêm Từ Trang Chi Tiết Sản Phẩm (PDP)',
        description: 'Chọn màu sắc, kích cỡ, số lượng trên trang chi tiết và nhấn Thêm vào túi',
        preconditions: 'Sản phẩm có tồn kho khả dụng',
        steps: [
          'Điều hướng đến chi tiết sản phẩm /products/ao-thun-tron-oversize-nam',
          'Chọn màu sắc (Color) từ danh sách biến thể',
          'Chọn kích cỡ (Size) khả dụng',
          'Tăng số lượng lên 2',
          'Nhấn nút "Thêm Vào Túi Mua Sắm"',
          'Quan sát CartDrawer trượt ra từ bên phải',
        ],
        expectedResult: 'Sản phẩm với đúng màu, size và số lượng hiển thị trong CartDrawer',
        backendVerification: 'POST /api/cart hoặc Zustand store đồng bộ state',
        databaseVerification: 'Biến thể sản phẩm khớp dữ liệu collection `products`',
      },
      {
        methodId: 'cach02',
        methodName: 'Thao Tác Điều Chỉnh Giỏ Hàng & Quick View',
        description: 'Mở giỏ hàng, cập nhật số lượng, xóa sản phẩm và kiểm tra tổng tiền',
        preconditions: 'Giỏ hàng có ít nhất 1 sản phẩm',
        steps: [
          'Mở /cart',
          'Tăng số lượng sản phẩm bằng nút (+)',
          'Giảm số lượng sản phẩm bằng nút (-)',
          'Kiểm tra tổng tiền tạm tính tự động tính lại chính xác',
        ],
        expectedResult: 'Tổng tiền cập nhật thời gian thực, không phát sinh lỗi số âm hoặc NaN',
        backendVerification: 'Kiểm tra logic tính tiền chuẩn format VND',
        databaseVerification: 'State giỏ hàng phản ánh đúng giá trị',
      },
    ],
  },

  // ── 3. Checkout & Payment ─────────────────────────────────────────────────
  {
    id: 'checkout_order',
    name: 'Quy Trình Đặt Hàng & Thanh Toán',
    entryRoute: '/checkout',
    category: 'Commerce',
    methods: [
      {
        methodId: 'cach01',
        methodName: 'Đặt Hàng Thanh Toán Khi Nhận Hàng (COD)',
        description: 'Điền thông tin nhận hàng, chọn COD và hoàn tất tạo đơn hàng',
        preconditions: 'Giỏ hàng có ít nhất 1 sản phẩm',
        steps: [
          'Mở /checkout',
          'Nhập họ tên: "Nguyễn Văn Test"',
          'Nhập số điện thoại: "0901234567"',
          'Nhập địa chỉ: "123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM"',
          'Chọn phương thức thanh toán: COD (Thanh toán khi nhận hàng)',
          'Nhấn "Xác Nhận Đặt Hàng"',
        ],
        expectedResult: 'Điều hướng đến trang Order Success hoặc xác nhận đơn hàng',
        backendVerification: 'POST /api/orders tạo đơn với `paymentMethod: COD`',
        databaseVerification: 'Đơn hàng mới được ghi vào collection `orders` với status pending',
      },
      {
        methodId: 'cach02',
        methodName: 'Khách Hàng Tra Cứu Đơn Hàng Vãng Lai',
        description: 'Sử dụng công cụ Order Lookup để kiểm tra tình trạng đơn',
        preconditions: 'Có mã đơn hàng hoặc số điện thoại trong hệ thống',
        steps: [
          'Điều hướng đến /order-lookup',
          'Nhập số điện thoại hoặc mã đơn hàng',
          'Nhấn "Tra Cứu"',
          'Xem thông tin trạng thái vận chuyển và danh sách sản phẩm',
        ],
        expectedResult: 'Hiển thị chi tiết đơn hàng tương ứng với thông tin tìm kiếm',
        backendVerification: 'GET /api/orders/lookup xác thực quyền truy cập',
        databaseVerification: 'Dữ liệu khớp collection `orders`',
      },
    ],
  },

  // ── 4. Voucher & Coupon Application ───────────────────────────────────────
  {
    id: 'voucher_management',
    name: 'Áp Dụng Mã Ưu Đãi (Vouchers)',
    entryRoute: '/vouchers',
    category: 'Commerce',
    methods: [
      {
        methodId: 'cach01',
        methodName: 'Áp Dụng Mã Giảm Giá Trực Tiếp Trong Giỏ Hàng',
        description: 'Nhập mã VANGUARD15 vào ô mã giảm giá trong giỏ hàng',
        preconditions: 'Mã VANGUARD15 hợp lệ trong hệ thống',
        steps: [
          'Thêm sản phẩm vào giỏ và mở /cart',
          'Nhập mã "VANGUARD15" vào ô mã giảm giá',
          'Nhấn nút "Áp Dụng"',
          'Kiểm tra thông báo thành công và mức chiết khấu 15% hiển thị',
        ],
        expectedResult: 'Tổng tiền giỏ hàng giảm 15% tương ứng với điều kiện voucher',
        backendVerification: 'POST /api/vouchers/apply xác thực voucher',
        databaseVerification: 'Mã voucher được tra cứu trong collection `vouchers`',
      },
      {
        methodId: 'cach02',
        methodName: 'Xem Danh Sách & Sao Chép Mã Từ Trang Vouchers',
        description: 'Truy cập /vouchers, duyệt các thẻ voucher độc quyền và sao chép mã',
        preconditions: 'Hệ thống có các voucher đang hoạt động',
        steps: [
          'Mở /vouchers',
          'Cuộn xem danh sách voucher (VANGUARD15, LUXE20, WELCOME10)',
          'Nhấn nút "Sao Chép Mã" trên thẻ voucher',
          'Kiểm tra thông báo toast "Đã sao chép mã ưu đãi"',
        ],
        expectedResult: 'Mã voucher được lưu vào clipboard thành công',
        backendVerification: 'GET /api/vouchers trả về danh sách voucher thực tế',
        databaseVerification: 'Collection `vouchers` chứa thông tin hợp lệ',
      },
    ],
  },

  // ── 5. Customer Authentication & Account ──────────────────────────────────
  {
    id: 'customer_account',
    name: 'Quản Lý Tài Khoản Khách Hàng',
    entryRoute: '/login',
    category: 'Customer',
    methods: [
      {
        methodId: 'cach01',
        methodName: 'Đăng Nhập Khách Hàng & Khôi Phục Phiên',
        description: 'Đăng nhập với tài khoản patron, chuyển hướng đến /account và kiểm tra phiên',
        preconditions: 'Tài khoản khách hàng tồn tại trong database',
        steps: [
          'Mở /login',
          'Nhập email: "charlotte.vane@atelierverite.com"',
          'Nhập mật khẩu: "HauteCouture2026!"',
          'Nhấn "Đăng Nhập"',
          'Kiểm tra chuyển hướng đến trang /account',
        ],
        expectedResult: 'Đăng nhập thành công, hiển thị tên khách hàng và menu tài khoản',
        backendVerification: 'POST /api/auth/login trả về JWT token và patron profile',
        databaseVerification: 'User record trong collection `users`',
      },
      {
        methodId: 'cach02',
        methodName: 'Kiểm Tra Hệ Thống Điểm Thưởng 12 Hạng (Loyalty)',
        description: 'Truy cập /account/loyalty, kiểm tra hạng thành viên, thanh tiến độ và lịch sử điểm',
        preconditions: 'Khách hàng đã đăng nhập',
        steps: [
          'Mở /account/loyalty',
          'Xem huy hiệu hạng thành viên (Đồng / Bạc / Vàng / Kim Cương)',
          'Xem thanh tiến độ điểm thưởng đến cấp tiếp theo',
          'Xem danh sách các quyền lợi đặc quyền của hạng hiện tại',
        ],
        expectedResult: 'Hiển thị đầy đủ thông tin điểm thưởng và đặc quyền thành viên',
        backendVerification: 'GET /api/loyalty/profile trả về tier và điểm tích lũy',
        databaseVerification: 'Dữ liệu khớp `loyaltyPoints` của user trong database',
      },
    ],
  },

  // ── 6. Admin Product Management ───────────────────────────────────────────
  {
    id: 'admin_products',
    name: 'Quản Trị Sản Phẩm & Biến Thể',
    entryRoute: '/admin/products',
    category: 'Admin',
    methods: [
      {
        methodId: 'cach01',
        methodName: 'Xem Danh Sách & Xuất Báo Cáo Excel Sản Phẩm',
        description: 'Truy cập /admin/products, tìm kiếm sản phẩm và nhấn Xuất Excel',
        preconditions: 'Quyền quản trị viên Admin',
        steps: [
          'Mở /admin/products',
          'Nhập từ khóa tìm kiếm sản phẩm',
          'Nhấn nút "Xuất Excel" (.xlsx)',
          'Kiểm tra thông báo tải xuống file thành công',
        ],
        expectedResult: 'File Excel sản phẩm được tạo đầy đủ thông tin biến thể và tồn kho',
        backendVerification: 'GET /api/admin/products trả về dữ liệu thật',
        databaseVerification: 'Collection `products`',
      },
      {
        methodId: 'cach02',
        methodName: 'Tạo Sản Phẩm Mới Với Đa Biến Thể Tự Động Tính Tồn Kho',
        description: 'Mở /admin/products/new, thêm các biến thể màu sắc, size và kiểm tra tổng tồn kho',
        preconditions: 'Quyền quản trị viên Admin',
        steps: [
          'Mở /admin/products/new',
          'Nhập tên sản phẩm: "Áo Dạ May Đo Haute Couture 2026"',
          'Chọn danh mục',
          'Thêm biến thể 1: Đen, Size M, Tồn kho: 10',
          'Thêm biến thể 2: Be, Size L, Tồn kho: 15',
          'Kiểm tra trường Tổng tồn kho tự động hiển thị 25 (read-only)',
        ],
        expectedResult: 'Tổng tồn kho tự động tính bằng tổng tồn kho các biến thể',
        backendVerification: 'Đồng bộ logic tính tồn kho theo tiêu chuẩn backend',
        databaseVerification: 'Tổ hợp màu sắc + size không bị trùng lặp',
      },
    ],
  },

  // ── 7. Admin Category Management ──────────────────────────────────────────
  {
    id: 'admin_categories',
    name: 'Quản Lý Danh Mục & Hình Ảnh',
    entryRoute: '/admin/categories',
    category: 'Admin',
    methods: [
      {
        methodId: 'cach01',
        methodName: 'Xem Danh Sách Danh Mục & Kiểm Tra Hình Ảnh Bắt Buộc',
        description: 'Truy cập /admin/categories, kiểm tra ảnh đại diện danh mục và nút xuất Excel',
        preconditions: 'Quyền quản trị viên Admin',
        steps: [
          'Mở /admin/categories',
          'Kiểm tra tất cả danh mục hiển thị kèm thumbnail hình ảnh',
          'Nhấn nút "Xuất Excel" danh mục',
          'Kiểm tra file Excel được tạo',
        ],
        expectedResult: 'Danh mục hiển thị đầy đủ hình ảnh và xuất Excel hợp lệ',
        backendVerification: 'GET /api/categories trả về danh sách có `imageUrl`',
        databaseVerification: 'Collection `categories`',
      },
    ],
  },

  // ── 8. Admin Order Management ─────────────────────────────────────────────
  {
    id: 'admin_orders',
    name: 'Quản Lý Đơn Hàng & Xuất Báo Cáo',
    entryRoute: '/admin/orders',
    category: 'Admin',
    methods: [
      {
        methodId: 'cach01',
        methodName: 'Lọc Đơn Hàng Theo Trạng Thái & Xuất Excel Đa Phạm Vi',
        description: 'Truy cập /admin/orders, lọc trạng thái và xuất báo cáo đơn hàng ra Excel',
        preconditions: 'Quyền quản trị viên Admin',
        steps: [
          'Mở /admin/orders',
          'Lọc đơn hàng theo trạng thái (Tất cả / Chờ xác nhận / Đang giao)',
          'Nhấn nút "Xuất Excel" đơn hàng',
          'Kiểm tra quá trình tạo file báo cáo kinh doanh',
        ],
        expectedResult: 'Bảng đơn hàng cập nhật đúng bộ lọc và file Excel tải xuống chuẩn',
        backendVerification: 'GET /api/admin/orders trả về danh sách đơn thật',
        databaseVerification: 'Collection `orders`',
      },
    ],
  },

  // ── 9. Admin Chats Full-Viewport Layout ───────────────────────────────────
  {
    id: 'admin_chats',
    name: 'Hội Thoại Khách Hàng (Full-Viewport)',
    entryRoute: '/admin/chats',
    category: 'Admin',
    methods: [
      {
        methodId: 'cach01',
        methodName: 'Cuộn Độc Lập Danh Sách Hội Thoại & Khung Tin Nhắn',
        description: 'Kiểm tra layout trọn trong 1 viewport, cuộn độc lập conversation list và message list',
        preconditions: 'Quyền quản trị viên Admin, layout full viewport',
        steps: [
          'Mở /admin/chats',
          'Kiểm tra header và composer giữ nguyên vị trí cố định',
          'Cuộn danh sách cuộc trò chuyện bên trái (Conversation List Scroll)',
          'Chọn cuộc trò chuyện đầu tiên',
          'Cuộn nội dung tin nhắn bên phải (Message List Scroll)',
          'Nhập tin nhắn vào composer: "Atelier trân trọng cảm ơn quý khách!"',
        ],
        expectedResult: 'Trang không bị cuộn dọc toàn trang; hai vùng dữ liệu cuộn độc lập mượt mà',
        backendVerification: 'Socket.IO / API tin nhắn hoạt động bình thường',
        databaseVerification: 'Collection `conversations` và `messages`',
      },
    ],
  },

  // ── 10. Admin Visual Page Builder ─────────────────────────────────────────
  {
    id: 'admin_page_builder',
    name: 'Visual Page Builder & Quản Lý Nội Dung',
    entryRoute: '/admin/page-builder/new',
    category: 'CMS',
    methods: [
      {
        methodId: 'cach01',
        methodName: 'Áp Dụng Mẫu Trang Lookbook Runway & Biên Tập Trực Quan',
        description: 'Mở editor, nhấn Mẫu Bố Cục, chọn Mẫu Lookbook và quan sát canvas hiển thị các khối',
        preconditions: 'Quyền quản trị viên Admin',
        steps: [
          'Mở /admin/page-builder/new',
          'Nhấn nút "Mẫu Bố Cục"',
          'Chọn mẫu "Mẫu Lookbook Thời Trang (Capsule Runway)"',
          'Nhấn "Áp Dụng Mẫu Này"',
          'Kiểm tra tiêu đề và khối hình ảnh runway xuất hiện trên Live Canvas',
        ],
        expectedResult: 'Mẫu trang được áp dụng hoàn chỉnh với đầy đủ các khối AST trên Canvas',
        backendVerification: 'Zod passthrough data schema hợp lệ',
        databaseVerification: 'API lưu bản nháp kết nối `/api/admin/pages` thật',
      },
      {
        methodId: 'cach02',
        methodName: 'Kiểm Tra Tương Phản WCAG & Chuyển Đổi Khung Hình Thiết Bị',
        description: 'Chọn khối trên Canvas, mở tab Màu Sắc kiểm tra Contrast Checker và chuyển đổi Desktop/Tablet/Mobile',
        preconditions: 'Quyền quản trị viên Admin',
        steps: [
          'Chọn một khối văn bản trên Canvas',
          'Kiểm tra bảng Inspector mở ra bên phải',
          'Chuyển sang tab Màu Sắc & xem huy hiệu "Đạt chuẩn WCAG AA"',
          'Nhấn nút chuyển màn hình Máy tính bảng (Tablet 768px)',
          'Nhấn nút chuyển màn hình Điện thoại (Mobile 390px)',
        ],
        expectedResult: 'Khung Canvas co giãn mượt mà theo kích thước thiết bị đã chọn',
        backendVerification: 'Styles và responsive AST được cập nhật chuẩn xác',
        databaseVerification: 'Schema passthrough',
      },
    ],
  },

  // ── 11. Admin Promotional Campaigns ───────────────────────────────────────
  {
    id: 'admin_campaigns',
    name: 'Chiến Dịch Khuyến Mãi & Popup Banners',
    entryRoute: '/admin/campaigns',
    category: 'Marketing',
    methods: [
      {
        methodId: 'cach01',
        methodName: 'Xem Danh Sách Chiến Dịch & Kiểm Tra Smart CTA Redirect',
        description: 'Duyệt danh sách chiến dịch khuyến mãi đang hoạt động và cấu hình điều hướng an toàn',
        preconditions: 'Quyền quản trị viên Admin',
        steps: [
          'Mở /admin/campaigns',
          'Kiểm tra các thẻ thống kê chiến dịch',
          'Xem danh sách chiến dịch (Flash Sale, Mid-Season Sale)',
          'Kiểm tra huy hiệu trạng thái (Đang Hoạt Động / Sắp Diễn Ra)',
        ],
        expectedResult: 'Hiển thị danh sách chiến dịch kết nối 100% dữ liệu backend thật',
        backendVerification: 'GET /api/admin/campaigns trả về danh sách chiến dịch',
        databaseVerification: 'Collection `campaigns`',
      },
    ],
  },

  // ── 12. Admin Policies & Tracking ─────────────────────────────────────────
  {
    id: 'admin_policies_tracking',
    name: 'Chính Sách Pháp Lý & Phân Tích Hành Vi',
    entryRoute: '/admin/tracking',
    category: 'Admin',
    methods: [
      {
        methodId: 'cach01',
        methodName: 'Kiểm Tra Nhật Ký Sự Kiện & Báo Cáo Đồng Thuận Quyền Riêng Tư',
        description: 'Truy cập /admin/tracking và /admin/tracking/consent kiểm tra dữ liệu tuân thủ Nghị định 356/2025/NĐ-CP',
        preconditions: 'Quyền quản trị viên Admin',
        steps: [
          'Mở /admin/tracking',
          'Xem biểu đồ sự kiện tracking thực tế',
          'Chuyển sang trang /admin/tracking/consent',
          'Kiểm tra báo cáo tỷ lệ chấp thuận cookie (Necessary, Analytics, Personalization, Marketing)',
        ],
        expectedResult: 'Dữ liệu kiểm toán quyền riêng tư hiển thị chính xác từ backend thật',
        backendVerification: 'GET /api/admin/tracking/consent-stats',
        databaseVerification: 'Collection `privacy_consents` và `tracking_events`',
      },
    ],
  },
];
