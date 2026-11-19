import ExcelJS from 'exceljs';
import { sanitizeCellForExport } from './excelSecurity';
import { formatCurrency, formatDate } from '../formatters';

export interface OrderItemExportData {
  orderCode: string;
  productId: string;
  variantId?: string;
  productName: string;
  productSku?: string;
  variantSku?: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice?: number;
  price: number;
  discount?: number;
  lineTotal?: number;
  total: number;
}

export interface OrderExportData {
  id: string;
  orderId?: string;
  orderCode: string;
  createdAt: string;
  createdDate?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  recipientPhone?: string;
  shippingAddress: string;
  status: string;
  statusLabel?: string;
  paymentMethod: string;
  paymentMethodLabel?: string;
  paymentStatus: string;
  paymentStatusLabel?: string;
  shippingStatus?: string;
  shippingStatusLabel?: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  refundAmount?: number;
  totalAmount: number;
  note?: string;
  itemsCount?: number;
  items?: OrderItemExportData[];
}

export type OrderExportRecord = OrderExportData;

export interface OrderExportOptions {
  scope: 'current_page' | 'filtered_all' | 'selected' | 'single';
  filterDescription?: string;
  adminName?: string;
  adminEmail?: string;
  orders: OrderExportData[];
  filename?: string;
  includeItems?: boolean;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý (Pending)',
  confirmed: 'Đã xác nhận (Confirmed)',
  shipping: 'Đang giao hàng (Shipping)',
  delivered: 'Giao thành công (Delivered)',
  cancelled: 'Đã hủy (Cancelled)',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  momo: 'Ví điện tử MoMo',
  vnpay: 'Cổng VNPAY QR / Thẻ',
  credit_card: 'Thẻ tín dụng quốc tế (Visa/Mastercard)',
  bank_transfer: 'Chuyển khoản ngân hàng',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ thanh toán',
  awaiting_verification: 'Chờ đối soát',
  paid: 'Đã thanh toán',
  failed: 'Thanh toán thất bại',
  expired: 'Hết hạn thanh toán',
  refunded: 'Đã hoàn tiền',
};

const SHIPPING_STATUS_LABELS: Record<string, string> = {
  not_shipped: 'Chưa xuất kho',
  delivering: 'Đang vận chuyển',
  delivered: 'Đã giao hàng',
  returned: 'Chuyển hoàn',
};

export const mapOrderStatusLabel = (status?: string): string =>
  ORDER_STATUS_LABELS[status?.toLowerCase() || ''] || status || 'Chờ xử lý';

export const mapPaymentMethodLabel = (method?: string): string =>
  PAYMENT_METHOD_LABELS[method?.toLowerCase() || ''] || method || 'Chưa xác định';

export const mapPaymentStatusLabel = (status?: string): string =>
  PAYMENT_STATUS_LABELS[status?.toLowerCase() || ''] || status || 'Chờ thanh toán';

export const mapShippingStatusLabel = (status?: string): string =>
  SHIPPING_STATUS_LABELS[status?.toLowerCase() || ''] || status || 'Chưa xuất kho';

/**
 * Normalizes raw order document from backend into standardized OrderExportData
 */
export const normalizeOrderForExport = (raw: any): OrderExportData => {
  const id = String(raw._id || raw.id || '');
  const orderCode = raw.orderCode || raw.order_code || (id ? `ORD-${id.slice(-8).toUpperCase()}` : 'ORD-UNKNOWN');
  const address = raw.shipping_address || {};
  const user = raw.user_id || raw.customer || {};

  const customerName =
    address.full_name ||
    address.name ||
    user.name ||
    raw.customerName ||
    raw.customer_name ||
    raw.guest_email ||
    'Khách vãng lai';

  const customerEmail =
    user.email ||
    raw.customerEmail ||
    raw.customer_email ||
    raw.guest_email ||
    'Chưa cung cấp';

  const customerPhone =
    address.phone ||
    user.phone ||
    raw.customerPhone ||
    raw.customer_phone ||
    'Chưa cung cấp';

  const fullAddress = [
    address.address_detail || address.street || address.address,
    address.ward,
    address.district,
    address.city,
  ]
    .filter(Boolean)
    .join(', ') || raw.shippingAddress || 'Chưa cập nhật địa chỉ';

  const subtotal = Number(raw.original_price || raw.subtotal || raw.total_price || raw.totalAmount || 0);
  const discount = Number(raw.discount_amount || raw.discount || 0);
  const shippingFee = Number(raw.shipping_fee || raw.shippingFee || 0);
  const totalAmount = Number(raw.total_price || raw.totalAmount || (subtotal - discount + shippingFee));
  const refundAmount = raw.payment_status === 'refunded' ? Number(raw.refund_amount || raw.refundAmount || totalAmount) : 0;
  const note = raw.note || raw.order_note || '';

  const statusLabel = mapOrderStatusLabel(raw.status);
  const paymentMethodLabel = mapPaymentMethodLabel(raw.payment_method || raw.paymentMethod);
  const paymentStatusLabel = mapPaymentStatusLabel(raw.payment_status || raw.paymentStatus);
  const shippingStatusLabel = mapShippingStatusLabel(raw.shipping_status || raw.shippingStatus || raw.status);

  // Flatten items if available
  const items: OrderItemExportData[] = (raw.items || []).map((it: any) => {
    const pId = String(it.product_id?._id || it.product_id || it.productId || '');
    const vId = String(it.variant_id?._id || it.variant_id || it.variantId || '');
    const pName = it.product_name || it.product_id?.name || it.productName || 'Sản phẩm thời trang';
    const pSku = it.product_sku || it.product_id?.sku || it.sku || '';
    const vSku = it.variant_sku || it.variant_id?.sku || it.variant?.sku || '';
    const color = it.variant?.color || it.color || it.variant_id?.color || 'Tiêu chuẩn';
    const size = it.variant?.size || it.size || it.variant_id?.size || 'Tiêu chuẩn';
    const qty = Number(it.quantity || 1);
    const unitPrice = Number(it.price || it.unitPrice || 0);
    const disc = Number(it.discount || 0);
    const lineTotal = Number(it.total_price || it.total || (qty * unitPrice - disc));

    return {
      orderCode: String(sanitizeCellForExport(orderCode)),
      productId: pId,
      variantId: vId || undefined,
      productName: String(sanitizeCellForExport(pName)),
      productSku: String(sanitizeCellForExport(pSku)),
      variantSku: String(sanitizeCellForExport(vSku)),
      color: String(sanitizeCellForExport(color)),
      size: String(sanitizeCellForExport(size)),
      quantity: qty,
      unitPrice,
      price: unitPrice,
      discount: disc,
      lineTotal: lineTotal > 0 ? lineTotal : qty * unitPrice,
      total: lineTotal > 0 ? lineTotal : qty * unitPrice,
    };
  });

  return {
    id,
    orderId: id,
    orderCode: String(sanitizeCellForExport(orderCode)),
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    createdDate: raw.createdAt || raw.created_at || new Date().toISOString(),
    customerName: String(sanitizeCellForExport(customerName)),
    customerEmail: String(sanitizeCellForExport(customerEmail)),
    customerPhone: String(sanitizeCellForExport(customerPhone)),
    recipientPhone: String(sanitizeCellForExport(customerPhone)),
    shippingAddress: String(sanitizeCellForExport(fullAddress)),
    status: raw.status || 'pending',
    statusLabel,
    paymentMethod: raw.payment_method || raw.paymentMethod || 'cod',
    paymentMethodLabel,
    paymentStatus: raw.payment_status || raw.paymentStatus || 'pending',
    paymentStatusLabel,
    shippingStatus: raw.shipping_status || raw.shippingStatus || raw.status || 'not_shipped',
    shippingStatusLabel,
    subtotal,
    discount,
    shippingFee,
    refundAmount,
    totalAmount,
    note: String(sanitizeCellForExport(note)),
    itemsCount: items.length,
    items: items.length > 0 ? items : [],
  };
};

/**
 * Core Export Function: Generates professional multi-sheet Excel file (.xlsx)
 */
export const exportOrdersToExcel = async (options: OrderExportOptions): Promise<void> => {
  const { scope, filterDescription, adminName, adminEmail, orders, filename } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Atelier Vérité E-Commerce Engine';
  workbook.lastModifiedBy = adminName || 'Admin Haute Couture';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ---------------------------------------------------------------------------
  // SHEET 1: DON_HANG (Orders Master)
  // ---------------------------------------------------------------------------
  const orderSheet = workbook.addWorksheet('DON_HANG', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
  });

  orderSheet.columns = [
    { header: 'Mã Hệ Thống (ID)', key: 'id', width: 26 },
    { header: 'Mã Đơn Hàng', key: 'orderCode', width: 18 },
    { header: 'Ngày Tạo Đơn', key: 'createdAt', width: 20 },
    { header: 'Tên Khách Hàng', key: 'customerName', width: 26 },
    { header: 'Số Điện Thoại', key: 'customerPhone', width: 16 },
    { header: 'Địa Chỉ Giao Hàng', key: 'shippingAddress', width: 45 },
    { header: 'Trạng Thái Đơn', key: 'status', width: 18 },
    { header: 'Phương Thức Thanh Toán', key: 'paymentMethod', width: 32 },
    { header: 'Trạng Thái Thanh Toán', key: 'paymentStatus', width: 22 },
    { header: 'Tạm Tính (VNĐ)', key: 'subtotal', width: 18 },
    { header: 'Giảm Giá (VNĐ)', key: 'discount', width: 16 },
    { header: 'Phí Vận Chuyển (VNĐ)', key: 'shippingFee', width: 20 },
    { header: 'Số Tiền Hoàn (VNĐ)', key: 'refundAmount', width: 18 },
    { header: 'Tổng Tiền (VNĐ)', key: 'totalAmount', width: 20 },
  ];

  // Header Styling
  const orderHeader = orderSheet.getRow(1);
  orderHeader.font = { bold: true, color: { argb: 'FFD4AF37' }, size: 11 };
  orderHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF121212' },
  };
  orderHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  orderHeader.height = 30;

  // Populate Order Rows
  orders.forEach((ord) => {
    const row = orderSheet.addRow({
      id: String(sanitizeCellForExport(ord.id)),
      orderCode: String(sanitizeCellForExport(ord.orderCode)),
      createdAt: formatDate(ord.createdAt),
      customerName: String(sanitizeCellForExport(ord.customerName)),
      customerPhone: String(sanitizeCellForExport(ord.customerPhone || '')),
      shippingAddress: String(sanitizeCellForExport(ord.shippingAddress)),
      status: String(sanitizeCellForExport(ord.status)),
      paymentMethod: String(sanitizeCellForExport(ord.paymentMethod)),
      paymentStatus: String(sanitizeCellForExport(ord.paymentStatus)),
      subtotal: ord.subtotal,
      discount: ord.discount,
      shippingFee: ord.shippingFee,
      refundAmount: ord.refundAmount || 0,
      totalAmount: ord.totalAmount,
    });

    // Formatting currency cells
    [10, 11, 12, 13, 14].forEach((colIdx) => {
      const cell = row.getCell(colIdx);
      cell.numFmt = '#,##0 "₫"';
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    });

    // Center alignment for code and status
    [1, 2, 3, 5, 7, 9].forEach((colIdx) => {
      row.getCell(colIdx).alignment = { vertical: 'middle', horizontal: 'center' };
    });
  });

  // AutoFilter
  orderSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 14 },
  };

  // ---------------------------------------------------------------------------
  // SHEET 2: CHI_TIET_SAN_PHAM (Order Items)
  // ---------------------------------------------------------------------------
  const allItems: OrderItemExportData[] = [];
  orders.forEach((o) => {
    if (o.items && o.items.length > 0) {
      allItems.push(...o.items);
    }
  });

  if (allItems.length > 0) {
    const itemSheet = workbook.addWorksheet('CHI_TIET_SAN_PHAM', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
    });

    itemSheet.columns = [
      { header: 'Mã Đơn Hàng', key: 'orderCode', width: 18 },
      { header: 'Mã Sản Phẩm (ID/SKU)', key: 'productId', width: 25 },
      { header: 'Mã Biến Thể (ID/SKU)', key: 'variantId', width: 25 },
      { header: 'Tên Sản Phẩm Thời Trang', key: 'productName', width: 40 },
      { header: 'Màu Sắc', key: 'color', width: 16 },
      { header: 'Kích Cỡ', key: 'size', width: 14 },
      { header: 'Số Lượng', key: 'quantity', width: 12 },
      { header: 'Đơn Giá (VNĐ)', key: 'price', width: 18 },
      { header: 'Giảm Giá (VNĐ)', key: 'discount', width: 16 },
      { header: 'Thành Tiền (VNĐ)', key: 'total', width: 20 },
    ];

    const itemHeader = itemSheet.getRow(1);
    itemHeader.font = { bold: true, color: { argb: 'FFD4AF37' }, size: 11 };
    itemHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF121212' },
    };
    itemHeader.alignment = { vertical: 'middle', horizontal: 'center' };
    itemHeader.height = 30;

    allItems.forEach((it) => {
      const row = itemSheet.addRow({
        orderCode: String(sanitizeCellForExport(it.orderCode)),
        productId: String(sanitizeCellForExport(it.productId)),
        variantId: String(sanitizeCellForExport(it.variantId || 'N/A')),
        productName: String(sanitizeCellForExport(it.productName)),
        color: String(sanitizeCellForExport(it.color || 'Tiêu chuẩn')),
        size: String(sanitizeCellForExport(it.size || 'Tiêu chuẩn')),
        quantity: it.quantity,
        price: it.price,
        discount: it.discount || 0,
        total: it.total,
      });

      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
      [8, 9, 10].forEach((colIdx) => {
        const cell = row.getCell(colIdx);
        cell.numFmt = '#,##0 "₫"';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      });
      [1, 2, 3, 5, 6].forEach((colIdx) => {
        row.getCell(colIdx).alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });

    itemSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 10 },
    };
  }

  // ---------------------------------------------------------------------------
  // SHEET 3: THONG_TIN_XUAT (Metadata & Compliance Audit)
  // ---------------------------------------------------------------------------
  const metaSheet = workbook.addWorksheet('THONG_TIN_XUAT', {
    views: [{ showGridLines: true }],
  });

  metaSheet.columns = [
    { header: 'Hạng Mục Báo Cáo', key: 'key', width: 30 },
    { header: 'Chi Tiết Thông Tin', key: 'value', width: 70 },
  ];

  const metaHeader = metaSheet.getRow(1);
  metaHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  metaHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E1E1E' },
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'Đã hủy' ? o.totalAmount : 0), 0);

  metaSheet.addRow({ key: 'Hệ Thống Xuất Dữ Liệu', value: 'Atelier Vérité E-Commerce Engine (ThreeUI Luxury Store)' });
  metaSheet.addRow({ key: 'Thời Điểm Xuất', value: new Date().toLocaleString('vi-VN') });
  metaSheet.addRow({ key: 'Tài Khoản Quản Trị Thực Hiện', value: `${adminName || 'Admin'} (${adminEmail || 'admin@atelierverite.com'})` });
  metaSheet.addRow({ key: 'Phạm Vi Xuất Dữ Liệu', value: scope === 'single' ? 'Chi tiết một đơn hàng' : scope === 'selected' ? 'Các đơn hàng được chọn' : scope === 'current_page' ? 'Các đơn hàng trên trang hiện tại' : 'Toàn bộ đơn hàng phù hợp bộ lọc' });
  metaSheet.addRow({ key: 'Bộ Lọc Áp Dụng', value: filterDescription || 'Tất cả trạng thái' });
  metaSheet.addRow({ key: 'Tổng Số Đơn Hàng Xuất', value: `${orders.length} đơn hàng` });
  metaSheet.addRow({ key: 'Tổng Doanh Thu Hợp Lệ', value: formatCurrency(totalRevenue) });
  metaSheet.addRow({ key: 'Tiêu Chuẩn Bảo Mật', value: 'CWE-1236 Spreadsheet Formula Injection Protection (Sanitized)' });
  metaSheet.addRow({ key: 'Quy Định Quyền Riêng Tư', value: 'Tuân thủ Nghị định 13/2023/NĐ-CP & Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15' });

  // Download trigger
  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = new Date().toISOString().split('T')[0];
  const defaultName = scope === 'single' && orders[0]
    ? `chi-tiet-don-hang-${orders[0].orderCode}.xlsx`
    : `danh-sach-don-hang-${dateStr}.xlsx`;

  triggerBrowserDownload(buffer, filename || defaultName);
};

const triggerBrowserDownload = (buffer: ExcelJS.Buffer, filename: string) => {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
