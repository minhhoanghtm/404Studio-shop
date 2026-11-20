/**
 * Standard Permission Codes and Role Mappings for Atelier Vérité RBAC
 */

export const PERMISSIONS = {
  // Dashboard & KPI
  DASHBOARD_VIEW: "dashboard:view",

  // Products & Catalog
  PRODUCT_VIEW: "product:view",
  PRODUCT_CREATE: "product:create",
  PRODUCT_UPDATE: "product:update",
  PRODUCT_DELETE: "product:delete",

  // Orders
  ORDER_VIEW: "order:view",
  ORDER_UPDATE: "order:update",
  ORDER_CANCEL: "order:cancel",

  // Users & Staff
  USER_VIEW: "user:view",
  USER_UPDATE: "user:update",
  USER_LOCK: "user:lock",

  // RBAC & Roles Management
  ROLE_MANAGE: "role:manage",

  // Real-time Chat & Support
  CHAT_REPLY: "chat:reply",

  // Vouchers, Discounts & Marketing Campaigns
  COUPON_MANAGE: "coupon:manage",

  // CMS Content, Pages, Policies & Lookbooks
  CONTENT_MANAGE: "content:manage",

  // Financial & Tracking Reports
  REPORT_VIEW: "report:view",
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const PERMISSION_GROUPS = [
  {
    group: "Bảng Điều Khiển & Số Liệu",
    items: [
      { key: PERMISSIONS.DASHBOARD_VIEW, label: "Xem Bảng điều khiển & KPI", description: "Xem tổng quan doanh thu, đơn hàng và biểu đồ vận hành" },
      { key: PERMISSIONS.REPORT_VIEW, label: "Xem Báo cáo & Phân tích", description: "Xuất dữ liệu Excel báo cáo tài chính và tracking" },
    ],
  },
  {
    group: "Quản Lý Sản Phẩm",
    items: [
      { key: PERMISSIONS.PRODUCT_VIEW, label: "Xem Sản phẩm & Danh mục", description: "Xem danh sách và chi tiết sản phẩm thời trang" },
      { key: PERMISSIONS.PRODUCT_CREATE, label: "Thêm Mới Sản phẩm", description: "Tạo sản phẩm, tải ảnh và cấu hình biến thể" },
      { key: PERMISSIONS.PRODUCT_UPDATE, label: "Chỉnh Sửa Sản phẩm", description: "Cập nhật giá bán, mô tả, tồn kho và trạng thái" },
      { key: PERMISSIONS.PRODUCT_DELETE, label: "Xóa Sản phẩm", description: "Xóa sản phẩm hoặc biến thể khỏi hệ thống" },
    ],
  },
  {
    group: "Quản Lý Đơn Hàng",
    items: [
      { key: PERMISSIONS.ORDER_VIEW, label: "Xem Đơn hàng", description: "Tra cứu và xem danh sách đơn hàng toàn hệ thống" },
      { key: PERMISSIONS.ORDER_UPDATE, label: "Xử Lý & Cập nhật Đơn", description: "Duyệt đơn, cập nhật tiến độ may đo, đóng gói, giao hàng" },
      { key: PERMISSIONS.ORDER_CANCEL, label: "Hủy & Hoàn tiền Đơn hàng", description: "Hủy đơn hàng và xác nhận hoàn tiền" },
    ],
  },
  {
    group: "Khách Hàng & Người Dùng",
    items: [
      { key: PERMISSIONS.USER_VIEW, label: "Xem Hồ sơ Người dùng", description: "Xem danh sách khách hàng, nhân viên và lịch sử mua hàng" },
      { key: PERMISSIONS.USER_UPDATE, label: "Cập nhật Thông tin User", description: "Chỉnh sửa thông tin hồ sơ và điểm thưởng khách hàng" },
      { key: PERMISSIONS.USER_LOCK, label: "Khóa / Mở khóa Tài khoản", description: "Khóa quyền truy cập hoặc kích hoạt lại tài khoản" },
    ],
  },
  {
    group: "Chăm Sóc Khách Hàng (CSKH)",
    items: [
      { key: PERMISSIONS.CHAT_REPLY, label: "Tư Vấn & Chat Trực Tuyến", description: "Tiếp nhận và phản hồi tin nhắn của thượng khách thời gian thực" },
    ],
  },
  {
    group: "Tiếp Thị & Khuyến Mãi",
    items: [
      { key: PERMISSIONS.COUPON_MANAGE, label: "Quản Lý Mã Giảm Giá & Popup", description: "Tạo mã voucher, thiết lập chiến dịch sale và popup ưu đãi" },
    ],
  },
  {
    group: "Nội Dung & Chính Sách CMS",
    items: [
      { key: PERMISSIONS.CONTENT_MANAGE, label: "Quản Lý Trang & Chính Sách", description: "Sử dụng Page Builder, biên tập lookbook và chỉnh sửa chính sách" },
    ],
  },
  {
    group: "Quản Trị Hệ Thống & Phân Quyền",
    items: [
      { key: PERMISSIONS.ROLE_MANAGE, label: "Quản Trị Vai Trò & Phân Quyền", description: "Cấu hình role, cấp/chặn quyền overrides và xem audit logs" },
    ],
  },
];

export const SYSTEM_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  CUSTOMER: "customer",
  GUEST: "guest",
};

/**
 * Default permission matrix for initial system roles
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  [SYSTEM_ROLES.ADMIN]: ALL_PERMISSIONS, // Admin has all permissions
  [SYSTEM_ROLES.MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_LOCK,
    PERMISSIONS.CHAT_REPLY,
    PERMISSIONS.COUPON_MANAGE,
    PERMISSIONS.CONTENT_MANAGE,
  ],
  [SYSTEM_ROLES.STAFF]: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.CHAT_REPLY,
    PERMISSIONS.CONTENT_MANAGE,
  ],
  [SYSTEM_ROLES.CUSTOMER]: [], // Customers operate on their own data via customer routes
  [SYSTEM_ROLES.GUEST]: [],
};
