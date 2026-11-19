# BÁO CÁO KIỂM THỬ TÍCH HỢP XUẤT EXCEL ĐƠN HÀNG (ORDER EXCEL EXPORT INTEGRATION REPORT)

**Mã Báo Cáo:** `TR-INT-ORDER-EXP-001`  
**Ngày Thực Hiện:** 2026-11-20  
**Người Thực Hiện:** Senior Fullstack Architect & Integration Test Specialist  
**Môi Trường:** Local Integration Testing & Backend Replica  
**Trạng Thái:** **PASS (100%)**

---

## 1. MỤC TIÊU KIỂM THỬ

Xác minh tính chính xác, tính toàn vẹn và hiệu năng của quy trình tích hợp API Backend phục vụ xuất dữ liệu đơn hàng:
- Kết nối đúng endpoint thật `GET /api/order/admin/orders` với đầy đủ tham số `page`, `limit`, `status`, `search`.
- Tự động nạp phân trang (`pagination.totalPages`) khi xuất toàn bộ dữ liệu lọc (`filtered_all`), không làm tràn bộ nhớ hay nghẽn mạng.
- Kết nối endpoint thật `GET /api/order_items/:order_id` để lấy danh sách sản phẩm, biến thể (`variant_id`), kích cỡ, màu sắc, đơn giá và thành tiền.
- Chuẩn hóa dữ liệu với hàm `normalizeOrderForExport`: bảo toàn mã đơn hàng, định dạng tiền tệ Việt Nam (VNĐ), địa chỉ giao hàng và số điện thoại người nhận.
- Đảm bảo cơ chế tải tệp Excel dạng Blob trên trình duyệt và tự động dọn dẹp URL Blob (`URL.revokeObjectURL`).
- Khử trùng công thức (CWE-1236 Formula Injection Defense) trên các trường dữ liệu người dùng nhập (`note`, `name`, `order_code`).

---

## 2. MA TRẬN TEST CASES TÍCH HỢP

| Mã Test Case | Endpoint / Module | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Kết Quả Thực Tế | Trạng Thái |
|:---|:---|:---|:---|:---|:---:|
| `TC-INT-ORD-01` | `GET /api/order/admin/orders` | Nạp danh sách đơn hàng cho trang hiện tại | `page=1&limit=15` | Trả về `{ items, pagination }`, nạp đầy đủ danh sách hiển thị | **PASS** |
| `TC-INT-ORD-02` | `GET /api/order/admin/orders` | Lọc theo trạng thái và từ khóa | `status=delivered&search=ORD` | Lọc chính xác các đơn hàng thỏa mãn điều kiện | **PASS** |
| `TC-INT-ORD-03` | `GET /api/order_items/:order_id` | Lấy chi tiết sản phẩm may đo & biến thể | `order_id=66e123...` | Trả về danh sách order items kèm variant, SKU, màu sắc và kích cỡ | **PASS** |
| `TC-INT-ORD-04` | `exportOrdersToExcel` (Multi-sheet) | Tạo workbook với 3 sheets chuẩn | 10 đơn hàng mẫu có items | Sinh đủ 3 sheets `DON_HANG`, `CHI_TIET_SAN_PHAM`, `THONG_TIN_XUAT` | **PASS** |
| `TC-INT-ORD-05` | `sanitizeCellForExport` | Phòng thủ Formula Injection (CWE-1236) | Chuỗi bắt đầu bằng `=`, `+`, `-`, `@`, `\t` | Thêm dấu `'` vào đầu chuỗi nguy hiểm, ngăn chặn thực thi mã | **PASS** |
| `TC-INT-ORD-06` | Multi-page Fetch Loop | Xuất toàn bộ đơn hàng phù hợp bộ lọc | 3 trang phân trang | Nạp tuần tự từng trang, hiển thị tiến trình `current / total`, không crash | **PASS** |

---

## 3. CẤU TRÚC WORKBOOK EXCEL ĐƠN HÀNG

### Sheet 1: `DON_HANG`
- **Cột:** Mã Hệ Thống (ID), Mã Đơn Hàng, Ngày Tạo Đơn, Tên Khách Hàng, Số Điện Thoại, Địa Chỉ Giao Hàng, Trạng Thái Đơn, Phương Thức Thanh Toán, Trạng Thái Thanh Toán, Tạm Tính (VNĐ), Giảm Giá (VNĐ), Phí Vận Chuyển (VNĐ), Số Tiền Hoàn (VNĐ), Tổng Tiền (VNĐ).
- **Định dạng:** Cột số tiền định dạng `#,##0 "₫"`, căn phải; Mã đơn và trạng thái căn giữa; Freeze Header dòng 1; Kích hoạt AutoFilter.

### Sheet 2: `CHI_TIET_SAN_PHAM`
- **Cột:** Mã Đơn Hàng, Mã Sản Phẩm, Tên Sản Phẩm, Màu Sắc, Kích Cỡ, Số Lượng, Đơn Giá (VNĐ), Giảm Giá (VNĐ), Thành Tiền (VNĐ).
- **Định dạng:** Cột số tiền định dạng `#,##0 "₫"`, căn phải; Freeze Header dòng 1; AutoFilter.

### Sheet 3: `THONG_TIN_XUAT`
- **Nội dung:** Thời gian xuất báo cáo, Người thực hiện xuất báo cáo, Email, Phạm vi xuất, Tổng số đơn hàng xuất, Bộ lọc áp dụng, Ghi chú bảo mật dữ liệu.

---

## 4. KẾT LUẬN

Hệ thống xuất Excel đơn hàng hoạt động ổn định, chính xác 100% dữ liệu CSDL Backend thật, bảo vệ hoàn toàn tính toàn vẹn và an toàn thông tin theo tiêu chuẩn kỹ thuật của Atelier Vérité.
