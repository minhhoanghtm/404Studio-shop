# TASK-ADMIN-ORDER-EXCEL-EXPORT: Admin Order Management & Multi-Scope Excel Export

**Mã Task**: `TASK-ADMIN-ORDER-EXCEL-EXPORT`  
**Trạng thái**: `COMPLETED`  
**Độ ưu tiên**: `CRITICAL`  
**Chủ sở hữu**: Senior Fullstack Engineer & E-commerce Data Engineer  
**Ngày khởi tạo**: 20/11/2026  
**Ngày hoàn thành**: 20/11/2026  

---

## 1. MỤC TIÊU & PHẠM VI
1. Nâng cấp trang Quản lý đơn hàng (`/admin/orders`) kết nối 100% Backend API thật (`GET /api/order/admin/orders`, `PATCH /api/order/admin/orders/:id/status`, `GET /api/order_items/:order_id`).
2. Bổ sung tính năng "Xuất Excel" đa phạm vi (Filter-Aware Scope Selection):
   - Xuất các đơn đang hiển thị trên trang hiện tại (`current_page`).
   - Xuất tất cả đơn hàng phù hợp bộ lọc hiện tại (`filtered_all` - tự động nạp phân trang an toàn, không nhầm xuất chỉ trang đầu).
   - Xuất các đơn hàng được chọn qua checkbox (`selected`).
   - Xuất chi tiết một đơn hàng cụ thể kèm danh sách sản phẩm và biến thể (`single`).
3. Cấu trúc Workbook chuyên nghiệp:
   - Sheet 1: `DON_HANG` (Mã đơn, Ngày tạo, Tên khách, SĐT, Địa chỉ, Trạng thái đơn, Phương thức TT, Trạng thái TT, Tạm tính, Giảm giá, Phí ship, Tổng tiền).
   - Sheet 2: `CHI_TIET_SAN_PHAM` (Mã đơn, Mã sản phẩm/SKU, Mã biến thể/SKU, Tên SP, Màu, Size, Số lượng, Đơn giá, Thành tiền).
   - Sheet 3: `THONG_TIN_XUAT` (Metadata, thời điểm xuất, bộ lọc, tổng doanh thu, ghi chú bảo mật).
4. Tiêu chuẩn tệp `.xlsx`:
   - Freeze header, AutoFilter, định dạng tiền VND (`#,##0 "₫"`), ngày `dd/MM/yyyy HH:mm`.
   - Giữ nguyên định dạng chuỗi cho Mã đơn/SKU tránh mất số 0 đầu.
   - Phòng chống Spreadsheet Formula Injection (CWE-1236).
   - Tuyệt đối không xuất mật khẩu, token, OTP, CVV hay thông tin thanh toán nhạy cảm.
5. Tích hợp 100% API thật, không Mock API, không dữ liệu giả.

---

## 2. ACCEPTANCE CRITERIA
- [x] Kết nối `/api/order/admin/orders` và xóa bỏ toàn bộ mock fallback trong `AdminOrdersPage`.
- [x] Nút "Xuất Excel" cho phép chọn phạm vi: Trang hiện tại, Tất cả kết quả đã lọc, Các đơn đã chọn.
- [x] Xuất chi tiết đơn hàng đầy đủ sản phẩm và biến thể (Color, Size, Quantity, Unit Price).
- [x] Bảo vệ chống Spreadsheet Formula Injection (`sanitizeCellForExport`).
- [x] Hỗ trợ checkbox chọn đơn hàng trên bảng quản trị.
- [x] File Excel tải xuống chuẩn xác, mở được trên Excel/LibreOffice, AutoFilter và Freeze Header.
- [x] Đạt 100% tests (Unit & E2E) và quality gates.

---

## 3. CHI TIẾT TRIỂN KHAI & KẾT QUẢ KIỂM THỬ
- **Frontend API**: `adminApi.getAllOrders` kết nối `GET /api/order/admin/orders?page=&limit=&status=&search=`; `adminApi.getOrderItems` kết nối `GET /api/order_items/:order_id`.
- **Excel Utility**: `frontend/src/shared/utils/excel/orderExcel.ts` xây dựng quy trình chuẩn hóa `normalizeOrderForExport` và hàm xuất đa trang tính `exportOrdersToExcel`.
- **UI Components**:
  - `OrderExportModal.tsx`: Hộp thoại tùy chọn phạm vi xuất và tùy chọn Sheet 2 chi tiết sản phẩm.
  - `AdminOrdersPage.tsx`: Tích hợp checkbox hàng loạt, badge số lượng đã chọn, nút xuất toolbar và nút "Xuất Excel Đơn Này" trong modal chi tiết.
- **Báo cáo kiểm thử**:
  - `project-management/test-reports/frontend/ORDER_EXPORT_UI_TEST.md` (PASS 100%)
  - `project-management/test-reports/integration/ORDER_EXPORT_API_TEST.md` (PASS 100%)
