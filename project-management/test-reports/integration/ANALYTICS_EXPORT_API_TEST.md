# BÁO CÁO KIỂM THỬ TÍCH HỢP XUẤT BÁO CÁO THỐNG KÊ EXCEL (ANALYTICS EXCEL EXPORT INTEGRATION REPORT)

**Mã Báo Cáo:** `TR-INT-ANALYTICS-EXP-001`  
**Ngày Thực Hiện:** 2026-11-20  
**Người Thực Hiện:** Senior Fullstack Architect & Data Integration Specialist  
**Môi Trường:** Local Integration Testing & Backend Replica  
**Trạng Thái:** **PASS (100%)**

---

## 1. MỤC TIÊU KIỂM THỬ

Xác minh khả năng trích xuất, tổng hợp và định dạng số liệu kinh doanh đa chiều từ Backend thật để tạo báo cáo Excel (.xlsx):
- Tích hợp đồng thời 5 endpoints thống kê thật từ máy chủ:
  1. `GET /api/order/admin/kpi`: Doanh thu tổng hợp, tổng đơn, tổng khách, số sản phẩm bán, giá trị đơn trung bình.
  2. `GET /api/order/admin/stats`: Phân loại đơn hàng theo trạng thái (đã giao, chờ xử lý, đã hủy, xác nhận, đang giao).
  3. `GET /api/order/admin/revenue?type=month`: Biến động doanh thu theo mốc thời gian.
  4. `GET /api/products?limit=500`: Danh mục sản phẩm, biến thể và lượng tồn kho thực tế.
  5. `GET /api/events/analytics/funnel`: Phễu chuyển đổi hành vi người dùng (Home → Item → Cart → Checkout → Purchase).
- Kiểm tra cơ chế gom lỗi mềm (`Promise.allSettled`): báo cáo vẫn tạo thành công ngay cả khi một số mục tùy chọn (như phễu tracking) chưa có dữ liệu.
- Phân biệt rõ ràng giữa **doanh thu thực nhận** (các đơn hàng `delivered` đã thanh toán) và **giá trị đơn chờ xử lý / đã hủy**.
- Kiểm tra tính đầy đủ của 6 trang tính (worksheets): `TONG_QUAN`, `DOANH_THU`, `TRANG_THAI_DON`, `TON_KHO_SAN_PHAM`, `HANH_VI_TRACKING`, `THONG_TIN_BAO_CAO`.

---

## 2. MA TRẬN TEST CASES TÍCH HỢP

| Mã Test Case | Hạng Mục Kiểm Thử | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|:---|:---|:---|:---|:---|:---:|
| `TC-INT-ANA-01` | Đồng bộ KPI Tài Chính | `adminApi.getStats()` | Thu thập đủ `totalRevenue`, `totalOrders`, `totalCustomers`, `avgOrderValue` | Dữ liệu chính xác từ endpoint `/order/admin/kpi` | **PASS** |
| `TC-INT-ANA-02` | Thống kê phân loại đơn | `adminApi.getOrderStats()` | Thu thập đủ số lượng đơn theo 5 trạng thái | Dữ liệu đồng bộ từ `/order/admin/stats` | **PASS** |
| `TC-INT-ANA-03` | Tiến trình doanh thu tháng | `adminApi.getRevenue('month')` | Thu thập mảng `[{ date, revenue }]` | Mảng dữ liệu mốc thời gian hiển thị tại Sheet 2 | **PASS** |
| `TC-INT-ANA-04` | Danh mục & Tồn kho sản phẩm | `productsApi.getProducts({ limit: 500 })` | Lấy danh sách sản phẩm, số biến thể, tổng tồn kho | Sheet 4 phân loại tồn kho an toàn vs sắp hết hàng | **PASS** |
| `TC-INT-ANA-05` | Phễu chuyển đổi Tracking | `adminTrackingApi.getFunnel()` | Lấy 5 bước phễu, tỷ lệ chuyển đổi, tỷ lệ rơi rụng | Sheet 5 hiển thị các bước phễu và tỷ lệ phần trăm | **PASS** |
| `TC-INT-ANA-06` | Xử lý dữ liệu rỗng / tối thiểu | Payload chỉ có KPI cơ bản | Workbook sinh đủ 6 sheet mà không phát sinh ngoại lệ | Báo cáo tạo thành công mượt mà | **PASS** |
| `TC-INT-ANA-07` | Định dạng tiền tệ & số liệu | Các cột doanh thu, giá tiền | Định dạng số tiền `#,##0 "₫"`, tỷ lệ `%` | Hiển thị chuyên nghiệp trên phần mềm Microsoft Excel | **PASS** |

---

## 3. CẤU TRÚC 6 WORKBOOK SHEETS BÁO CÁO QUẢN TRỊ

1. **`TONG_QUAN`**: Tóm tắt các chỉ số tài chính trọng yếu (Doanh thu đã ghi nhận, Đơn hoàn tất, Đơn đang xử lý, Tỷ lệ giao hàng thành công, Giá trị đơn bình quân, Khách hàng VIP).
2. **`DOANH_THU`**: Chi tiết doanh thu theo từng mốc thời gian, tính tỷ trọng đóng góp và ghi chú phân kỳ.
3. **`TRANG_THAI_DON`**: Ma trận phân tích 5 trạng thái đơn hàng (Đã giao, Đang vận chuyển, Đã xác nhận, Chờ xử lý, Đã hủy) kèm tỷ lệ phần trăm và doanh thu tương ứng.
4. **`TON_KHO_SAN_PHAM`**: Danh mục toàn bộ sản phẩm, danh mục cha, giá niêm yết, giá ưu đãi, số lượng biến thể, tồn kho và trạng thái cảnh báo tồn (An toàn / Sắp hết hàng).
5. **`HANH_VI_TRACKING`**: Phễu chuyển đổi từ Trang chủ, Xem sản phẩm, Thêm giỏ hàng, Đặt hàng đến Hoàn tất thanh toán.
6. **`THONG_TIN_BAO_CAO`**: Thông tin người lập báo cáo, quyền hạn, thời điểm trích xuất và tuyên bố bảo mật dữ liệu doanh nghiệp.

---

## 4. KẾT LUẬN

Module xuất báo cáo thống kê quản trị đáp ứng 100% tiêu chí đề ra, kết nối API Backend thực tế, không dùng dữ liệu giả lập, đem lại công cụ đắc lực cho đội ngũ quản trị cấp cao của thương hiệu Atelier Vérité.
