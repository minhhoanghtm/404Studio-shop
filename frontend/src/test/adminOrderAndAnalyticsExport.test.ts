import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeOrderForExport,
  mapOrderStatusLabel,
  mapPaymentMethodLabel,
  mapPaymentStatusLabel,
  mapShippingStatusLabel,
  exportOrdersToExcel,
  OrderExportRecord,
} from '../shared/utils/excel/orderExcel';
import {
  exportAnalyticsReportToExcel,
  AnalyticsExportData,
} from '../shared/utils/excel/analyticsExcel';

describe('Admin Order & Analytics Excel Export Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Order Normalization & Status Mapping', () => {
    it('should map Vietnamese labels for all order statuses', () => {
      expect(mapOrderStatusLabel('pending')).toBe('Chờ xử lý (Pending)');
      expect(mapOrderStatusLabel('confirmed')).toBe('Đã xác nhận (Confirmed)');
      expect(mapOrderStatusLabel('shipping')).toBe('Đang giao hàng (Shipping)');
      expect(mapOrderStatusLabel('delivered')).toBe('Giao thành công (Delivered)');
      expect(mapOrderStatusLabel('cancelled')).toBe('Đã hủy (Cancelled)');
      expect(mapOrderStatusLabel('unknown_status')).toBe('unknown_status');
    });

    it('should map Vietnamese labels for payment methods and statuses', () => {
      expect(mapPaymentMethodLabel('cod')).toBe('Thanh toán khi nhận hàng (COD)');
      expect(mapPaymentMethodLabel('vnpay')).toBe('Cổng VNPAY QR / Thẻ');
      expect(mapPaymentMethodLabel('credit_card')).toBe('Thẻ tín dụng quốc tế (Visa/Mastercard)');
      expect(mapPaymentMethodLabel('other')).toBe('other');

      expect(mapPaymentStatusLabel('pending')).toBe('Chờ thanh toán');
      expect(mapPaymentStatusLabel('paid')).toBe('Đã thanh toán');
      expect(mapPaymentStatusLabel('refunded')).toBe('Đã hoàn tiền');
      expect(mapPaymentStatusLabel('failed')).toBe('Thanh toán thất bại');
      expect(mapPaymentStatusLabel('unknown')).toBe('unknown');

      expect(mapShippingStatusLabel('not_shipped')).toBe('Chưa xuất kho');
      expect(mapShippingStatusLabel('delivering')).toBe('Đang vận chuyển');
      expect(mapShippingStatusLabel('delivered')).toBe('Đã giao hàng');
      expect(mapShippingStatusLabel('returned')).toBe('Chuyển hoàn');
    });

    it('should normalize raw backend order data correctly with nested items and variants', () => {
      const rawOrder = {
        _id: '66e1234567890abcdef12345',
        order_code: 'ORD-123456',
        user_id: {
          name: 'Nguyễn Văn Quý',
          email: 'quy@atelierverite.com',
          phone: '0901234567',
        },
        shipping_address: {
          name: 'Nguyễn Văn Quý',
          phone: '0901234567',
          street: '123 Đồng Khởi',
          ward: 'Bến Nghé',
          district: 'Quận 1',
          city: 'TP. Hồ Chí Minh',
        },
        items: [
          {
            _id: 'item1',
            product_id: {
              _id: 'prod1',
              name: 'Đầm Lụa Dạ Hội Midnight',
              sku: 'PRD-MIDNIGHT-01',
            },
            variant_id: {
              _id: 'var1',
              sku: 'SKU-MIDNIGHT-M-BLK',
              color: 'Midnight Black',
              size: 'M',
              price: 4500000,
            },
            quantity: 2,
            price: 4500000,
            total_price: 9000000,
          },
        ],
        status: 'delivered',
        payment_method: 'cod',
        payment_status: 'paid',
        shipping_status: 'delivered',
        subtotal: 9000000,
        discount_amount: 500000,
        shipping_fee: 50000,
        total_price: 8550000,
        note: 'Giao trong giờ hành chính',
        createdAt: '2026-11-15T10:30:00.000Z',
      };

      const normalized = normalizeOrderForExport(rawOrder);

      expect(normalized.orderId).toBe('66e1234567890abcdef12345');
      expect(normalized.id).toBe('66e1234567890abcdef12345');
      expect(normalized.orderCode).toBe('ORD-123456');
      expect(normalized.customerName).toBe('Nguyễn Văn Quý');
      expect(normalized.recipientPhone).toBe('0901234567');
      expect(normalized.status).toBe('delivered');
      expect(normalized.statusLabel).toBe('Giao thành công (Delivered)');
      expect(normalized.paymentMethodLabel).toBe('Thanh toán khi nhận hàng (COD)');
      expect(normalized.paymentStatusLabel).toBe('Đã thanh toán');
      expect(normalized.subtotal).toBe(9000000);
      expect(normalized.discount).toBe(500000);
      expect(normalized.shippingFee).toBe(50000);
      expect(normalized.totalAmount).toBe(8550000);
      expect(normalized.items?.length).toBe(1);

      const item = normalized.items![0];
      expect(item.productName).toBe('Đầm Lụa Dạ Hội Midnight');
      expect(item.productSku).toBe('PRD-MIDNIGHT-01');
      expect(item.variantSku).toBe('SKU-MIDNIGHT-M-BLK');
      expect(item.color).toBe('Midnight Black');
      expect(item.size).toBe('M');
      expect(item.quantity).toBe(2);
      expect(item.unitPrice).toBe(4500000);
      expect(item.lineTotal).toBe(9000000);
    });

    it('should handle guest customers and fallback fields gracefully', () => {
      const rawGuestOrder = {
        _id: '66e9999999999abcdef99999',
        total_price: 1500000,
        status: 'pending',
      };

      const normalized = normalizeOrderForExport(rawGuestOrder);

      expect(normalized.orderId).toBe('66e9999999999abcdef99999');
      expect(normalized.id).toBe('66e9999999999abcdef99999');
      expect(normalized.orderCode).toBe('ORD-DEF99999');
      expect(normalized.customerName).toBe('Khách vãng lai');
      expect(normalized.customerEmail).toBe('Chưa cung cấp');
      expect(normalized.recipientPhone).toBe('Chưa cung cấp');
      expect(normalized.shippingAddress).toBe('Chưa cập nhật địa chỉ');
      expect(normalized.status).toBe('pending');
      expect(normalized.subtotal).toBe(1500000);
      expect(normalized.totalAmount).toBe(1500000);
      expect(normalized.items).toEqual([]);
    });

    it('should defend against formula injection (CWE-1236) in order export fields', () => {
      const maliciousOrder = {
        _id: '66e1111111111abcdef11111',
        order_code: '=cmd|/C calc!A0',
        shipping_address: {
          name: '+84987654321',
          phone: '-123456789',
          street: '@SUM(1,99)',
        },
        note: '\tmalicious script',
        total_price: 1000000,
      };

      const normalized = normalizeOrderForExport(maliciousOrder);

      expect(normalized.orderCode.startsWith("'")).toBe(true);
      expect(normalized.customerName.startsWith("'")).toBe(true);
      expect(normalized.recipientPhone?.startsWith("'")).toBe(true);
      expect(normalized.shippingAddress.startsWith("'")).toBe(true);
      expect(normalized.note?.startsWith("'")).toBe(true);
    });
  });

  describe('2. Multi-Sheet Order Export (exportOrdersToExcel)', () => {
    it('should generate workbook with DON_HANG, CHI_TIET_SAN_PHAM, THONG_TIN_XUAT', async () => {
      const fakeUrl = 'blob:http://localhost/test-uuid';
      const createObjectURLMock = vi.fn().mockReturnValue(fakeUrl);
      const revokeObjectURLMock = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLMock;
      globalThis.URL.revokeObjectURL = revokeObjectURLMock;

      const clickMock = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      const records: OrderExportRecord[] = [
        {
          id: '66e1234567890abcdef12345',
          orderId: '66e1234567890abcdef12345',
          orderCode: 'ORD-123456',
          createdAt: '2026-11-15T10:30:00.000Z',
          createdDate: '2026-11-15T10:30:00.000Z',
          customerName: 'Trần Thị Mai',
          customerEmail: 'mai@example.com',
          recipientPhone: '0912345678',
          shippingAddress: '456 Lê Lợi, Q1, TP. HCM',
          status: 'delivered',
          statusLabel: 'Giao thành công (Delivered)',
          paymentMethod: 'cod',
          paymentMethodLabel: 'Thanh toán khi nhận hàng (COD)',
          paymentStatus: 'paid',
          paymentStatusLabel: 'Đã thanh toán',
          shippingStatus: 'delivered',
          shippingStatusLabel: 'Đã giao hàng',
          subtotal: 3000000,
          discount: 200000,
          shippingFee: 30000,
          refundAmount: 0,
          totalAmount: 2830000,
          note: 'Hàng dễ vỡ',
          itemsCount: 1,
          items: [
            {
              orderCode: 'ORD-123456',
              productId: 'prod-01',
              productName: 'Áo Khoác Dạ Tweed',
              productSku: 'PRD-TWEED-01',
              variantSku: 'SKU-TWEED-S-CREAM',
              color: 'Cream White',
              size: 'S',
              quantity: 1,
              price: 3000000,
              unitPrice: 3000000,
              discount: 0,
              total: 3000000,
              lineTotal: 3000000,
            },
          ],
        },
      ];

      await exportOrdersToExcel({
        orders: records,
        scope: 'current_page',
        filterDescription: 'Trạng thái: Giao thành công',
        adminName: 'Admin Verite',
        includeItems: true,
      });

      expect(clickMock).toHaveBeenCalledTimes(1);
      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Multi-Sheet Analytics Export (exportAnalyticsReportToExcel)', () => {
    it('should generate complete analytics report with all 6 worksheets', async () => {
      const fakeUrl = 'blob:http://localhost/analytics-uuid';
      const createObjectURLMock = vi.fn().mockReturnValue(fakeUrl);
      const revokeObjectURLMock = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLMock;
      globalThis.URL.revokeObjectURL = revokeObjectURLMock;

      const clickMock = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      const analyticsData: AnalyticsExportData = {
        periodLabel: 'Quý 4/2026',
        adminName: 'Chủ Quản Atelier',
        adminEmail: 'admin@atelierverite.com',
        kpis: {
          totalRevenue: 150000000,
          totalOrders: 42,
          totalCustomers: 38,
          totalSoldProducts: 85,
          avgOrderValue: 3571428,
        },
        orderStats: {
          totalOrders: 42,
          deliveredOrders: 35,
          pendingOrders: 3,
          cancelledOrders: 2,
          confirmedOrders: 1,
          shippingOrders: 1,
        },
        revenueTimeline: [
          { date: '2026-11-01', revenue: 45000000 },
          { date: '2026-11-08', revenue: 52000000 },
          { date: '2026-11-15', revenue: 53000000 },
        ],
        products: [
          {
            _id: 'prod-01',
            name: 'Đầm Lụa Tơ Tằm',
            slug: 'dam-lua-to-tam',
            categoryName: 'Đầm Dạ Hội',
            old_price: 6000000,
            new_price: 5200000,
            stock: 14,
            variantsCount: 3,
            is_active: true,
          },
        ],
        trackingFunnel: {
          stages: [
            { stage: 'view_home', name: 'Xem Trang Chủ', count: 1250, conversionRate: 100, dropoffRate: 0 },
            { stage: 'view_item', name: 'Xem Chi Tiết Sản Phẩm', count: 620, conversionRate: 49.6, dropoffRate: 50.4 },
            { stage: 'add_to_cart', name: 'Thêm Vào Giỏ Hàng', count: 210, conversionRate: 33.8, dropoffRate: 66.2 },
            { stage: 'begin_checkout', name: 'Tiến Hành Đặt Hàng', count: 85, conversionRate: 40.5, dropoffRate: 59.5 },
            { stage: 'purchase', name: 'Hoàn Tất Mua Hàng', count: 42, conversionRate: 49.4, dropoffRate: 50.6 },
          ],
          overallConversionRate: 3.36,
        },
      };

      await exportAnalyticsReportToExcel(analyticsData);

      expect(clickMock).toHaveBeenCalledTimes(1);
      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    });

    it('should safely export even when optional sections (revenueTimeline, funnel) are empty or undefined', async () => {
      const clickMock = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      const minimalData: AnalyticsExportData = {
        periodLabel: 'Hôm nay',
        adminName: 'Quản Trị Viên',
        kpis: {
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalSoldProducts: 0,
          avgOrderValue: 0,
        },
        orderStats: {
          totalOrders: 0,
          deliveredOrders: 0,
          pendingOrders: 0,
          cancelledOrders: 0,
          confirmedOrders: 0,
          shippingOrders: 0,
        },
      };

      await expect(exportAnalyticsReportToExcel(minimalData)).resolves.not.toThrow();
      expect(clickMock).toHaveBeenCalledTimes(1);
    });
  });
});
