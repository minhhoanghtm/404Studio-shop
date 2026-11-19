# TASK-ADMIN-ANALYTICS-EXCEL-EXPORT: Enterprise Business, Inventory & Tracking Excel Export

**Mã Task**: `TASK-ADMIN-ANALYTICS-EXCEL-EXPORT`  
**Trạng thái**: `COMPLETED`  
**Độ ưu tiên**: `CRITICAL`  
**Chủ sở hữu**: E-commerce Data Engineer & Analytics Specialist  
**Ngày khởi tạo**: 20/11/2026  
**Ngày hoàn thành**: 20/11/2026  

---

## 1. MỤC TIÊU & PHẠM VI
1. Nâng cấp trang Thống kê & Tổng quan vận hành (`/admin` và `/admin/tracking`) kết nối trực tiếp Backend APIs thật:
   - `/api/order/admin/kpi`: Doanh thu thuần, đơn hàng thành công, khách hàng, sản phẩm đã bán, AOV.
   - `/api/order/admin/revenue?type=month`: Biểu đồ dòng doanh thu theo thời gian.
   - `/api/order/admin/stats`: Phân loại trạng thái đơn (chờ xử lý, xác nhận, đang giao, đã giao, hủy).
   - `/api/products`: Thống kê tồn kho, số lượng sản phẩm, biến thể, cảnh báo hết hàng.
   - `/api/events/analytics/funnel`: Thống kê phễu hành vi người dùng (Home → Item → Cart → Checkout → Purchase).
2. Xây dựng công cụ "Xuất Báo Cáo Excel" đa trang tính:
   - Sheet 1: `TONG_QUAN` (Executive Summary - Doanh thu thuần, Đơn hàng, Khách hàng, AOV).
   - Sheet 2: `DOANH_THU` (Doanh thu theo mốc thời gian).
   - Sheet 3: `TRANG_THAI_DON` (Phân bổ đơn hàng theo trạng thái).
   - Sheet 4: `TON_KHO_SAN_PHAM` (Tình trạng tồn kho sản phẩm và biến thể).
   - Sheet 5: `HANH_VI_TRACKING` (Chỉ số phễu chuyển đổi từ backend tracking).
   - Sheet 6: `THONG_TIN_BAO_CAO` (Metadata, thời điểm xuất, tiêu chuẩn bảo mật).
3. Tiêu chuẩn tệp `.xlsx`:
   - Phân biệt rõ doanh thu thuần (đã giao & đã thanh toán) với đơn chờ xử lý và đơn hủy (không tự nhận mọi đơn tạo là doanh thu).
   - Phòng chống Formula Injection (CWE-1236).
   - Không xuất dữ liệu giả lập.
   - Tuân thủ nguyên tắc Data Minimization (Nghị định 13/2023/NĐ-CP & Luật 91/2025/QH15).

---

## 2. ACCEPTANCE CRITERIA
- [x] Kết nối 100% Backend thật cho Analytics & Dashboard.
- [x] Nút "Xuất Báo Cáo Excel" tải xuống tệp workbook đa sheet phản ánh chính xác dữ liệu thật.
- [x] Phân định rõ ràng doanh thu thực tế, tiền đã thanh toán, đơn hủy và đơn đang chờ.
- [x] Thống kê tồn kho sản phẩm lấy trực tiếp từ dữ liệu MongoDB.
- [x] Bảo vệ Formula Injection trên tất cả các ô văn bản.
- [x] Kiểm thử tự động đạt 100% PASS và CI/CD xanh.

---

## 3. CHI TIẾT TRIỂN KHAI & KẾT QUẢ KIỂM THỬ
- **Frontend API**: Cung cấp `adminApi.getStats()`, `adminApi.getOrderStats()`, `adminApi.getRevenue()`, `productsApi.getProducts()`, `adminTrackingApi.getFunnel()`.
- **Excel Utility**: `frontend/src/shared/utils/excel/analyticsExcel.ts` xây dựng quy trình trích xuất và tạo workbook 6 sheet `exportAnalyticsReportToExcel`.
- **UI Component**: `AnalyticsExportButton.tsx` tích hợp trên `AdminDashboardPage.tsx` và `AdminTrackingPage.tsx`.
- **Báo cáo kiểm thử**:
  - `project-management/test-reports/integration/ANALYTICS_EXPORT_API_TEST.md` (PASS 100%)
  - `project-management/test-reports/frontend/ORDER_EXPORT_UI_TEST.md` (PASS 100%)
