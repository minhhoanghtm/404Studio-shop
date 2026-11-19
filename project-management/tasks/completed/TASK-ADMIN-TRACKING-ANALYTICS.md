# TASK-ADMIN-TRACKING-ANALYTICS: Enterprise User Tracking & Behavioral Analytics Dashboard

**Mã Task**: `TASK-ADMIN-TRACKING-ANALYTICS`  
**Trạng thái**: `COMPLETED`  
**Độ ưu tiên**: `CRITICAL`  
**Chủ sở hữu**: Senior React/TypeScript Engineer, Data Analytics & Privacy Engineer  
**Ngày hoàn thành**: 19/11/2026  
**Mục tiêu**: Xây dựng bộ công cụ phân tích hành vi và tracking người dùng trên Admin Dashboard Atelier Vérité kết nối 100% Real Backend APIs (`/api/events/analytics/*`, `/api/events/presence/*`), sử dụng 2.762 sự kiện và 32 bản ghi đồng thuận thực tế trong CSDL, tuân thủ nghiêm ngặt Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15.

---

## 1. YÊU CẦU NGHIỆP VỤ & PHẠM VI HOÀN THÀNH

1. **Dashboard Tracking Tổng Quan (`/admin/tracking`)**:
   - Thống kê KPIs từ `GET /api/events/analytics/overview`: Tổng số sự kiện, Người dùng hoạt động, Phiên hoạt động, Tỷ lệ nhấp đề xuất (Recommendation CTR), Tỷ lệ tương tác Stylist AI.
   - Biểu đồ phân bổ loại sự kiện từ `eventTypeStats` (2.762 sự kiện thực tế).
   - Biểu đồ phễu chuyển đổi tuần tự (Sequential Cohort Funnel) từ `GET /api/events/analytics/funnel`.
   - Bảng top sản phẩm được xem nhiều nhất và từ khóa tìm kiếm hàng đầu.
   - Bộ lọc thời gian: Hôm nay, 7 ngày qua, 30 ngày qua, khoảng ngày tùy chọn.

2. **Phân tích hành vi người dùng (`/admin/tracking/users`)**:
   - Theo dõi phiên trực tuyến (Live Sessions) qua `GET /api/events/presence/live`.
   - Phân tích thời gian lưu trang (Dwell time, Active time, Idle time) từ `GET /api/events/analytics/activity`.
   - Nguồn lưu lượng truy cập (Traffic sources).
   - Bảo vệ quyền riêng tư: Giảm thiểu dữ liệu (Data Minimization), không thu thập hoặc hiển thị mật khẩu, token, OTP hoặc thông tin thanh toán nhạy cảm.

3. **Quản lý & Giám sát sự kiện (`/admin/tracking/events`)**:
   - Thống kê chi tiết khối lượng từng loại sự kiện thực tế trong hệ thống.
   - Xem hành trình sự kiện theo phiên (Session Timeline) qua `GET /api/events/presence/session/:sessionId`.
   - Hiển thị thông báo trạng thái `BLOCKED_BY_BACKEND` cho tính năng lọc phân trang log thô toàn cục chưa có API.

4. **Phân tích hành vi theo sản phẩm (`/admin/tracking/products`)**:
   - Danh sách tác phẩm thời trang có lượt xem và tương tác cao nhất từ CSDL thực.
   - Thống kê hiệu quả gợi ý cá nhân hóa và Stylist AI.
   - Tỷ lệ xác nhận hành động giỏ hàng từ AI (`cartActionConfirmedCount`).

5. **Giám sát tuân thủ quyền riêng tư & Consent (`/admin/tracking/consent`)**:
   - Hiển thị phiên bản chính sách bảo mật hiện hành từ `GET /api/privacy/policy-metadata`.
   - Danh sách và tiến độ xử lý yêu cầu quyền chủ thể dữ liệu (DSR) từ `GET /api/privacy/dsr`.
   - Hiển thị ghi chú trạng thái Backend cho endpoint tổng hợp consent chi tiết.

---

## 2. ACCEPTANCE CRITERIA SATISFACTION

- [x] Route `/admin/tracking` kết nối thành công API `GET /api/events/analytics/overview` và `GET /api/events/analytics/funnel`.
- [x] Không có mock API, không có số liệu `Math.random()`, không fake tracking events.
- [x] Phân quyền RBAC nghiêm ngặt: Chỉ Admin (`role: 'admin'`) mới có quyền truy cập.
- [x] Giao diện tiếng Việt 100%, responsive, Dark/Light mode, WCAG AA.
- [x] Các tiểu trang `/admin/tracking/users`, `/admin/tracking/events`, `/admin/tracking/products`, `/admin/tracking/consent` được tổ chức theo Page-Based structure.
- [x] Unit tests, Integration tests và E2E tests đạt 100% PASS (Vitest 69/69, Playwright 13/13).
