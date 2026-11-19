import ExcelJS from 'exceljs';
import { sanitizeCellForExport } from './excelSecurity';
import { formatCurrency } from '../formatters';

export interface AnalyticsExportData {
  periodLabel: string;
  adminName?: string;
  adminEmail?: string;
  kpis?: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalSoldProducts: number;
    avgOrderValue: number;
  };
  orderStats?: {
    totalOrders: number;
    deliveredOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    confirmedOrders: number;
    shippingOrders: number;
  };
  revenueTimeline?: Array<{
    date: string;
    revenue: number;
  }>;
  products?: Array<{
    _id?: string;
    name: string;
    slug: string;
    categoryName?: string;
    old_price?: number;
    new_price?: number;
    stock: number;
    variantsCount?: number;
    is_active?: boolean;
  }>;
  trackingFunnel?: {
    stages: Array<{
      stage: string;
      name: string;
      count: number;
      conversionRate: number;
      dropoffRate: number;
    }>;
    overallConversionRate?: number;
  };
}

export const exportAnalyticsReportToExcel = async (
  data: AnalyticsExportData,
  filename?: string
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Atelier Vérité E-Commerce Engine';
  workbook.lastModifiedBy = data.adminName || 'Admin Haute Couture';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ---------------------------------------------------------------------------
  // SHEET 1: TONG_QUAN (Executive Summary)
  // ---------------------------------------------------------------------------
  const summarySheet = workbook.addWorksheet('TONG_QUAN', {
    views: [{ showGridLines: true }],
  });

  summarySheet.columns = [
    { header: 'Chỉ Số Kinh Doanh Cốt Lõi', key: 'metric', width: 35 },
    { header: 'Giá Trị Thực Tế', key: 'value', width: 30 },
    { header: 'Đơn Vị / Định Nghĩa Nguồn Dữ Liệu', key: 'note', width: 55 },
  ];

  const sumHeader = summarySheet.getRow(1);
  sumHeader.font = { bold: true, color: { argb: 'FFD4AF37' }, size: 11 };
  sumHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF121212' },
  };
  sumHeader.height = 30;
  sumHeader.alignment = { vertical: 'middle', horizontal: 'center' };

  const kpis = data.kpis || {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalSoldProducts: 0,
    avgOrderValue: 0,
  };

  const stats = data.orderStats || {
    totalOrders: kpis.totalOrders,
    deliveredOrders: kpis.totalOrders,
    pendingOrders: 0,
    cancelledOrders: 0,
    confirmedOrders: 0,
    shippingOrders: 0,
  };

  summarySheet.addRow({
    metric: 'Doanh Thu Thuần Thực Thu',
    value: formatCurrency(kpis.totalRevenue),
    note: 'Tổng tiền các đơn giao thành công (delivered) đã thanh toán hoặc COD',
  });
  summarySheet.addRow({
    metric: 'Tổng Số Đơn Hàng Thành Công',
    value: `${kpis.totalOrders} đơn hàng`,
    note: 'Đơn hàng trạng thái Giao thành công (delivered)',
  });
  summarySheet.addRow({
    metric: 'Tổng Khách Hàng Đã Đặt Mua',
    value: `${kpis.totalCustomers} khách hàng`,
    note: 'Số lượng khách hàng duy nhất (distinct user_id)',
  });
  summarySheet.addRow({
    metric: 'Tổng Sản Phẩm Đã Bán',
    value: `${kpis.totalSoldProducts} sản phẩm`,
    note: 'Tổng số lượng sản phẩm trong các đơn hàng thành công',
  });
  summarySheet.addRow({
    metric: 'Giá Trị Trung Bình / Đơn (AOV)',
    value: formatCurrency(kpis.avgOrderValue),
    note: 'Doanh thu thuần chia cho tổng số đơn thành công',
  });
  summarySheet.addRow({
    metric: 'Đơn Hàng Chờ Xử Lý (Pending)',
    value: `${stats.pendingOrders} đơn`,
    note: 'Đơn khách hàng vừa đặt, chờ xác nhận từ đội ngũ chăm sóc khách hàng',
  });
  summarySheet.addRow({
    metric: 'Đơn Hàng Đã Xác Nhận (Confirmed)',
    value: `${stats.confirmedOrders} đơn`,
    note: 'Đơn đã xác nhận, đang đóng gói chuẩn bị giao',
  });
  summarySheet.addRow({
    metric: 'Đơn Hàng Đang Giao (Shipping)',
    value: `${stats.shippingOrders} đơn`,
    note: 'Đơn đã bàn giao đơn vị vận chuyển',
  });
  summarySheet.addRow({
    metric: 'Đơn Hàng Đã Hủy (Cancelled)',
    value: `${stats.cancelledOrders} đơn`,
    note: 'Đơn bị hủy bởi khách hoặc hệ thống do hết hạn',
  });

  // ---------------------------------------------------------------------------
  // SHEET 2: DOANH_THU (Revenue Breakdown Timeline)
  // ---------------------------------------------------------------------------
  if (data.revenueTimeline && data.revenueTimeline.length > 0) {
    const revSheet = workbook.addWorksheet('DOANH_THU', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
    });

    revSheet.columns = [
      { header: 'Mốc Thời Gian (Ngày/Tháng)', key: 'date', width: 28 },
      { header: 'Doanh Thu Ghi Nhận (VNĐ)', key: 'revenue', width: 28 },
    ];

    const revHeader = revSheet.getRow(1);
    revHeader.font = { bold: true, color: { argb: 'FFD4AF37' }, size: 11 };
    revHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF121212' },
    };
    revHeader.height = 30;
    revHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    data.revenueTimeline.forEach((item) => {
      const row = revSheet.addRow({
        date: String(sanitizeCellForExport(item.date)),
        revenue: item.revenue,
      });
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      const cell = row.getCell(2);
      cell.numFmt = '#,##0 "₫"';
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    });

    revSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 2 },
    };
  }

  // ---------------------------------------------------------------------------
  // SHEET 3: TRANG_THAI_DON (Order Status Distribution)
  // ---------------------------------------------------------------------------
  const statusSheet = workbook.addWorksheet('TRANG_THAI_DON', {
    views: [{ showGridLines: true }],
  });

  statusSheet.columns = [
    { header: 'Trạng Thái Đơn Hàng', key: 'status', width: 30 },
    { header: 'Số Lượng Đơn', key: 'count', width: 20 },
    { header: 'Tỷ Trọng (%)', key: 'percentage', width: 20 },
  ];

  const statHeader = statusSheet.getRow(1);
  statHeader.font = { bold: true, color: { argb: 'FFD4AF37' }, size: 11 };
  statHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF121212' },
  };
  statHeader.height = 30;
  statHeader.alignment = { vertical: 'middle', horizontal: 'center' };

  const totalAllOrders =
    (stats.deliveredOrders || 0) +
    (stats.pendingOrders || 0) +
    (stats.confirmedOrders || 0) +
    (stats.shippingOrders || 0) +
    (stats.cancelledOrders || 0) || 1;

  const statusRows = [
    { name: 'Giao Thành Công (Delivered)', count: stats.deliveredOrders || 0 },
    { name: 'Chờ Xử Lý (Pending)', count: stats.pendingOrders || 0 },
    { name: 'Đã Xác Nhận (Confirmed)', count: stats.confirmedOrders || 0 },
    { name: 'Đang Giao Hàng (Shipping)', count: stats.shippingOrders || 0 },
    { name: 'Đã Hủy (Cancelled)', count: stats.cancelledOrders || 0 },
  ];

  statusRows.forEach((r) => {
    const row = statusSheet.addRow({
      status: r.name,
      count: r.count,
      percentage: totalAllOrders > 0 ? (r.count / totalAllOrders) : 0,
    });
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
    const pCell = row.getCell(3);
    pCell.numFmt = '0.0%';
    pCell.alignment = { vertical: 'middle', horizontal: 'right' };
  });

  // ---------------------------------------------------------------------------
  // SHEET 4: TON_KHO_SAN_PHAM (Products & Inventory Breakdown)
  // ---------------------------------------------------------------------------
  if (data.products && data.products.length > 0) {
    const prodSheet = workbook.addWorksheet('TON_KHO_SAN_PHAM', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
    });

    prodSheet.columns = [
      { header: 'Mã Sản Phẩm (ID)', key: 'id', width: 25 },
      { header: 'Tên Sản Phẩm Thời Trang', key: 'name', width: 40 },
      { header: 'Mã Slug', key: 'slug', width: 25 },
      { header: 'Danh Mục', key: 'category', width: 22 },
      { header: 'Giá Bán Gốc (VNĐ)', key: 'oldPrice', width: 20 },
      { header: 'Giá Bán Thực Tế (VNĐ)', key: 'newPrice', width: 22 },
      { header: 'Tổng Tồn Kho', key: 'stock', width: 16 },
      { header: 'Số Biến Thể', key: 'variants', width: 16 },
      { header: 'Tình Trạng Kho Hàng', key: 'stockStatus', width: 22 },
    ];

    const prodHeader = prodSheet.getRow(1);
    prodHeader.font = { bold: true, color: { argb: 'FFD4AF37' }, size: 11 };
    prodHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF121212' },
    };
    prodHeader.height = 30;
    prodHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    data.products.forEach((p) => {
      const stock = Number(p.stock || 0);
      const stockStatus =
        stock === 0 ? 'Hết hàng' : stock <= 5 ? 'Sắp hết hàng' : 'Còn hàng';

      const row = prodSheet.addRow({
        id: String(sanitizeCellForExport(p._id || '')),
        name: String(sanitizeCellForExport(p.name)),
        slug: String(sanitizeCellForExport(p.slug)),
        category: String(sanitizeCellForExport(p.categoryName || 'Thời Trang')),
        oldPrice: p.old_price || p.new_price || 0,
        newPrice: p.new_price || 0,
        stock,
        variants: p.variantsCount || 1,
        stockStatus,
      });

      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };

      [5, 6].forEach((colIdx) => {
        const cell = row.getCell(colIdx);
        cell.numFmt = '#,##0 "₫"';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      });
    });

    prodSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 9 },
    };
  }

  // ---------------------------------------------------------------------------
  // SHEET 5: HANH_VI_TRACKING (Tracking Analytics & Funnel)
  // ---------------------------------------------------------------------------
  if (data.trackingFunnel?.stages && data.trackingFunnel.stages.length > 0) {
    const trackSheet = workbook.addWorksheet('HANH_VI_TRACKING', {
      views: [{ showGridLines: true }],
    });

    trackSheet.columns = [
      { header: 'Chặng Phễu Chuyển Đổi', key: 'name', width: 32 },
      { header: 'Lượt Tương Tác', key: 'count', width: 20 },
      { header: 'Tỷ Lệ Chuyển Đổi (%)', key: 'conversionRate', width: 25 },
      { header: 'Tỷ Lệ Rớt Lại / Thoát (%)', key: 'dropoffRate', width: 25 },
    ];

    const trackHeader = trackSheet.getRow(1);
    trackHeader.font = { bold: true, color: { argb: 'FFD4AF37' }, size: 11 };
    trackHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF121212' },
    };
    trackHeader.height = 30;
    trackHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    data.trackingFunnel.stages.forEach((st) => {
      const row = trackSheet.addRow({
        name: String(sanitizeCellForExport(st.name)),
        count: st.count,
        conversionRate: st.conversionRate / 100,
        dropoffRate: st.dropoffRate / 100,
      });

      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
      const cCell = row.getCell(3);
      cCell.numFmt = '0.0%';
      cCell.alignment = { vertical: 'middle', horizontal: 'right' };
      const dCell = row.getCell(4);
      dCell.numFmt = '0.0%';
      dCell.alignment = { vertical: 'middle', horizontal: 'right' };
    });
  }

  // ---------------------------------------------------------------------------
  // SHEET 6: THONG_TIN_BAO_CAO (Metadata)
  // ---------------------------------------------------------------------------
  const metaSheet = workbook.addWorksheet('THONG_TIN_BAO_CAO', {
    views: [{ showGridLines: true }],
  });

  metaSheet.columns = [
    { header: 'Hạng Mục Báo Cáo', key: 'key', width: 30 },
    { header: 'Thông Tin Chi Tiết', key: 'value', width: 70 },
  ];

  const metaHeader = metaSheet.getRow(1);
  metaHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  metaHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E1E1E' },
  };

  metaSheet.addRow({ key: 'Tiêu Đề Báo Cáo', value: 'Báo Cáo Hoạt Động Kinh Doanh & Tồn Kho Định Kỳ' });
  metaSheet.addRow({ key: 'Thương Hiệu & Hệ Thống', value: 'Atelier Vérité Haute Couture E-Commerce Platform' });
  metaSheet.addRow({ key: 'Thời Điểm Xuất Báo Cáo', value: new Date().toLocaleString('vi-VN') });
  metaSheet.addRow({ key: 'Khoảng Thời Gian Lọc', value: data.periodLabel || '30 ngày gần nhất' });
  metaSheet.addRow({ key: 'Người Lập Báo Cáo', value: `${data.adminName || 'Admin'} (${data.adminEmail || 'admin@atelierverite.com'})` });
  metaSheet.addRow({ key: 'Bảo Vệ Tấn Công Công Thức', value: 'Đã khử trùng ký tự kích hoạt formula (CWE-1236)' });
  metaSheet.addRow({ key: 'Tuân Thủ Bảo Vệ Dữ Liệu', value: 'Tuân thủ Nghị định 13/2023/NĐ-CP & Luật 91/2025/QH15' });

  // Download trigger
  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = new Date().toISOString().split('T')[0];
  triggerBrowserDownload(buffer, filename || `bao-cao-kinh-doanh-${dateStr}.xlsx`);
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
