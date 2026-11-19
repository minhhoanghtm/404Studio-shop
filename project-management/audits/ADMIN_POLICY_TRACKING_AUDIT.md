# AUDIT BÁO CÁO TOÀN DIỆN: ADMIN POLICY MANAGEMENT & USER TRACKING ANALYTICS

**Dự án**: Atelier Vérité (High Fashion ThreeUI E-Commerce)  
**Workspace**: `d:\Project\404Studio`  
**Ngày thực hiện**: 19/11/2026  
**Tiêu chuẩn bảo mật & pháp lý**: Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 & Nghị định 356/2025/NĐ-CP  
**Nguyên tắc**: 100% Real Backend API, Zero Mock API, Zero Fake Data/Events, Không can thiệp Backend nguồn `D:\Project\REACT-WebFashion`.

---

## 1. TỔNG QUAN HIỆN TRẠNG HỆ THỐNG

### 1.1. Môi trường và Hạ tầng
- **Frontend**: React 19.3.1, Vite 8.3.6, TypeScript 7.0.2 (Strict Mode), Tailwind CSS 3.4.19, Zustand 5.1.0, Lucide React, Oxlint, Vitest 5.1.0 (60/60 tests passing), Playwright 1.65.1.
- **Backend**: Express 4.18.2, MongoDB Atlas (34 collections, kết nối thực tế xác minh thành công), Redis 7.0 (`redis_local:6379`, kết nối thực tế xác minh thành công), BullMQ 5.78.0, Socket.io 4.8.3.
- **Git & Repository**: Branch `main`, remote `origin/main` (`https://github.com/minhhoanghtm/404Studio-shop.git`), working tree clean trước khi thực hiện task.
- **Dữ liệu thực tế ghi nhận trong CSDL**:
  - `pages`: 3 bản ghi (trong đó có 1 trang `policy` với slug `policy`, type `policy`, status `published`, kèm 3 sections `hero`, `story`, `cta`).
  - `user_events`: 2.762 sự kiện tracking thực tế đã được thu thập và lưu trữ.
  - `user_consents`: 32 bản ghi đồng thuận người dùng thực tế.
  - `datasubjectrequests`: Collection sẵn sàng cho các quyền xuất/xóa dữ liệu.

---

## 2. AUDIT CHI TIẾT THEO TỪNG HỆ THỐNG

### 2.1. Quản lý chính sách doanh nghiệp (Policy Management)

| Thành phần | Endpoint Backend | Quyền hạn (RBAC) | Trạng thái hiện tại | Đánh giá & Hành động |
|---|---|---|:---:|---|
| **Lấy danh sách trang / chính sách công khai** | `GET /api/pages` (hỗ trợ `type=policy`, `status=published`, search, sort, pagination) | Public | `WORKING` | Tích hợp trực tiếp từ client public |
| **Xem chi tiết chính sách công khai** | `GET /api/pages/:slug` | Public | `WORKING` | Tự động populate các khối sections (`story`, `hero`, `cta`) |
| **Tăng lượt xem chính sách** | `PATCH /api/pages/:slug/view` | Public | `WORKING` | Đã có deduplication qua Redis |
| **Lấy danh sách chính sách (Admin)** | `GET /api/admin/pages` (hỗ trợ `type=policy`, `status`, `search`, `sortBy`, `sortOrder`, `page`, `limit`) | Admin (`protectedRoute`, `adminOnly`) | `WORKING` | Tích hợp vào bảng `/admin/policies` |
| **Xem chi tiết trang (Admin)** | `GET /api/admin/pages/:id` & `GET /api/admin/pages/:id/detail` | Admin (`protectedRoute`, `adminOnly`) | `WORKING` | Trả về `{ page, sections }` |
| **Tạo mới chính sách (Admin)** | `POST /api/admin/pages` | Admin (`protectedRoute`, `adminOnly`) | `WORKING` | Validate qua Zod (`page.validator.js`), lưu `Page` và `PageSection` trong transaction |
| **Chỉnh sửa chính sách (Admin)** | `PUT /api/admin/pages/:id` | Admin (`protectedRoute`, `adminOnly`) | `WORKING` | Hỗ trợ cập nhật tiêu đề, slug, status, seo, sections |
| **Xóa chính sách (Admin)** | `DELETE /api/admin/pages/:id` | Admin (`protectedRoute`, `adminOnly`) | `WORKING` | Xóa an toàn kèm xóa các sections liên kết |
| **Vòng đời chính sách (Lifecycle)** | `status: "draft" \| "published" \| "archived"` | Admin | `WORKING` | Backend hỗ trợ 3 trạng thái này |
| **Quy trình phê duyệt nhiều cấp (Review Workflow)** | `PENDING_REVIEW` -> `APPROVED` | N/A | `BLOCKED_BY_BACKEND` | Schema `Page` của backend chỉ hỗ trợ enum `['draft', 'published', 'archived']`. Không có workflow phê duyệt đa cấp |
| **Lịch sử phiên bản chuyên biệt (Version History Diff)** | Bảng / Model `policy_versions` riêng | N/A | `BLOCKED_BY_BACKEND` | Backend chưa có collection lưu snapshot lịch sử sửa đổi của từng phiên bản; hiển thị thông tin thời gian cập nhật `updatedAt`, `publishedAt` và gắn nhãn chưa hỗ trợ cho diff chi tiết |
| **Giao diện Admin quản trị chính sách** | Routes: `/admin/policies`, `/admin/policies/new`, `/admin/policies/:id/edit`, `/admin/policies/:id/history` | Admin | `MISSING` | Cần xây dựng mới theo chuẩn UI ThreeUI, Dark/Light mode, tiếng Việt 100% |
| **Đồng bộ trang công khai** | `/privacy-policy`, `/terms-of-service`, `/cookie-policy`, `/returns-refunds` | Public | `PARTIAL` | Hiện tại đang hiển thị nội dung mẫu tĩnh, cần kết nối API backend `GET /api/pages/:slug` để hiển thị chính sách được xuất bản thực tế |

---

### 2.2. Hệ thống phân tích hành vi & Tracking người dùng (User Tracking Analytics)

| Thành phần | Endpoint Backend | Quyền hạn (RBAC) | Trạng thái hiện tại | Đánh giá & Hành động |
|---|---|---|:---:|---|
| **Thống kê tổng quan hành vi (Overview KPIs)** | `GET /api/events/analytics/overview` (hoặc `/api/tracking/analytics/overview`) | Admin (`protectedRoute`, `adminOnly`) | `WORKING` | Trả về: `totalEvents`, `activeUsersCount`, `activeSessionsCount`, `eventTypeStats`, `recommendationMetrics` (impressions, clicks, CTR), `aiMetrics`, `topViewedProducts`, `topSearches`. Lọc theo `startDate`, `endDate` |
| **Phễu chuyển đổi tuần tự (Funnel Analytics)** | `GET /api/events/analytics/funnel` | Admin (`protectedRoute`, `adminOnly`) | `WORKING` | Tính toán nghiêm ngặt: `sessionFunnel`, `userFunnel`, `rawStages` (view -> cart -> checkout -> purchase) |
| **Thống kê lưu lượng & hiệu năng (Activity Analytics)** | `GET /api/events/analytics/activity` | Admin (`protectedRoute`, `adminOnly`) | `WORKING` | Trả về: `pageAnalytics` (views, dwell time, active/idle time), `trafficSources`, `apiMetrics` (latency, slow, error count), `checkoutFunnel` |
| **Quan sát người dùng trực tuyến (Live Presence)** | `GET /api/events/presence/live` | Admin (`protectedRoute`, `adminOnly`) | `WORKING` | Đọc dữ liệu từ Redis: session ID, status (active, idle, away, background), route hiện tại, thiết bị |
| **Dòng thời gian hành trình phiên (Session Timeline)** | `GET /api/events/presence/session/:sessionId` | Admin (`protectedRoute`, `adminOnly`) | `WORKING` | Lấy chi tiết chuỗi sự kiện của 1 session cụ thể |
| **Luồng SSE trực tuyến (Live Stream)** | `GET /api/events/presence/stream` | Admin (`protectedRoute`, `adminOnly`) | `WORKING` | Hỗ trợ Server-Sent Events cập nhật real-time |
| **Danh sách khách hàng (Patron Management)** | `GET /api/user/admin/users` | Admin (`protectedRoute`, `adminOnly`) | `WORKING` | Danh sách người dùng đã đăng ký với phân quyền RBAC |
| **Thống kê KPI đơn hàng & doanh thu** | `GET /api/order/admin/kpi`, `/api/order/admin/revenue`, `/api/order/admin/stats` | Admin (`protectedRoute`, `adminOnly`) | `WORKING` | Cung cấp số liệu doanh thu và đơn hàng thực tế |
| **Danh mục sự kiện phân trang tùy biến (Raw Event Search)** | `GET /api/events/admin/events` (với search/filter nâng cao cho toàn bộ 2.762 sự kiện) | Admin | `BLOCKED_BY_BACKEND` | Backend chỉ có endpoint tổng hợp theo loại sự kiện (`eventTypeStats`) và timeline theo session cụ thể (`/presence/session/:sessionId`), chưa có endpoint phân trang toàn bộ log sự kiện thô. Giao diện sẽ hiển thị thống kê tổng hợp thực tế và ghi chú trạng thái backend |
| **Báo cáo đồng thuận chi tiết (Consent Admin Stats)** | `GET /api/privacy/admin/consent-stats` | Admin | `BLOCKED_BY_BACKEND` | Backend có `user_consents` (32 bản ghi), `GET /api/privacy/policy`, và `GET /api/privacy/data-requests`, nhưng chưa có route aggregate riêng cho admin. Hiển thị thông tin chính sách, yêu cầu quyền chủ thể dữ liệu và thông báo trạng thái backend |
| **Giao diện Admin Tracking Dashboard** | Routes: `/admin/tracking`, `/admin/tracking/users`, `/admin/tracking/events`, `/admin/tracking/products`, `/admin/tracking/consent` | Admin | `MISSING` | Cần triển khai trọn bộ các trang chuyên biệt |

---

## 3. PHÂN LOẠI TRẠNG THÁI TỔNG THỂ

1. **EXISTING & WORKING**:
   - Backend CRUD APIs cho `Page` và `PageSection` tại `/api/admin/pages` và `/api/pages`.
   - Backend Analytics APIs: Overview, Funnel, Activity, Live Presence, Session Timeline tại `/api/events/*`.
   - Data Subject Requests API tại `/api/privacy/data-requests`.
   - Admin Layout, Auth Store (JWT Bearer tokens), Theme Store (Dark/Light sync), Centralized API client.
   - CSDL thực tế với 2.762 sự kiện và 32 bản ghi đồng thuận.

2. **PARTIAL**:
   - Public legal pages (`/privacy-policy`, v.v.): Đã có giao diện, nhưng chưa đồng bộ tự động với `GET /api/pages/:slug` khi có chính sách xuất bản trên backend.

3. **MISSING (CẦN XÂY DỰNG TRONG TASK NÀY)**:
   - Module `AdminPolicies`: Danh sách chính sách, bộ lọc, tìm kiếm, sắp xếp, phân trang.
   - Module `AdminPolicyCreate` & `AdminPolicyEdit`: Form tạo và chỉnh sửa chính sách, Rich Content Editor, HTML sanitizer, preview, SEO settings.
   - Module `AdminPolicyHistory`: Trang lịch sử phiên bản hiển thị metadata thực tế và thông báo giới hạn backend.
   - Module `AdminTracking`: Dashboard phân tích hành vi người dùng, biểu đồ xu hướng, funnel, KPIs thực tế.
   - Module `AdminTrackingUsers`: Phân tích hành vi người dùng, phiên hoạt động trực tuyến, thời gian lưu trang.
   - Module `AdminTrackingEvents`: Phân tích tần suất và phân bổ loại sự kiện có thật.
   - Module `AdminTrackingProducts`: Phân tích sản phẩm xem nhiều nhất, tìm kiếm nhiều nhất, hiệu quả gợi ý.
   - Module `AdminTrackingConsent`: Thống kê tuân thủ quyền riêng tư, phiên bản chính sách có hiệu lực, danh sách yêu cầu quyền chủ thể dữ liệu (DSR).
   - Sidebar navigation trong `AdminLayout` bổ sung các menu mục tương ứng.

4. **BLOCKED_BY_BACKEND (GIỚI HẠN BACKEND NGUYÊN BẢN)**:
   - Quy trình phê duyệt đa cấp `PENDING_REVIEW` -> `APPROVED` (Schema chỉ có `draft`, `published`, `archived`).
   - Bảng lưu snapshot diff lịch sử phiên bản chính sách chuyên biệt.
   - Endpoint phân trang tìm kiếm log sự kiện thô bất kỳ (`/api/events/admin/events`).
   - Endpoint tổng hợp số liệu consent riêng biệt cho admin (`/api/privacy/admin/stats`).
   - *Biện pháp*: Hiển thị trạng thái rõ ràng trên UI, sử dụng 100% dữ liệu thực từ các endpoint tương đương có sẵn (`eventTypeStats`, `data-requests`, `policyMetadata`), tuyệt đối không tạo mock hoặc fake data.

---

## 4. KẾ HOẠCH HÀNH ĐỘNG CHI TIẾT

1. **Task Management**: Khởi tạo `TASK-ADMIN-POLICY-MANAGEMENT.md` và `TASK-ADMIN-TRACKING-ANALYTICS.md` trong `project-management/tasks/in-progress/`. Cập nhật `TASK_INDEX.md`.
2. **API Client Extension**: Mở rộng `src/shared/api/index.ts` để bổ sung các domain services `adminPoliciesApi` và `adminTrackingApi` ánh xạ trực tiếp đến các backend endpoints thật.
3. **Admin Policy Management**:
   - Xây dựng folder `src/pages/AdminPolicies/` với bảng danh sách, filter, search, status badge, pagination.
   - Xây dựng folder `src/pages/AdminPolicyCreate/` và `src/pages/AdminPolicyEdit/` với rich text editor an toàn (XSS-sanitized), metadata, preview mode.
   - Xây dựng folder `src/pages/AdminPolicyHistory/`.
   - Kết nối public legal pages (`PrivacyPolicyPage`, `TermsOfServicePage`, `CookiePolicyPage`, `ReturnsRefundsPage`) để fetch dynamic content từ backend `GET /api/pages/:slug` với fallback thông minh.
4. **Admin Tracking & Behavior Analytics**:
   - Xây dựng `src/pages/AdminTracking/` (Dashboard KPI, Funnel, Event Distribution, Live Status).
   - Xây dựng `src/pages/AdminTrackingUsers/` (User & Presence Analytics).
   - Xây dựng `src/pages/AdminTrackingEvents/` (Event Metrics & Session Journeys).
   - Xây dựng `src/pages/AdminTrackingProducts/` (Product Engagement, Top Searches, Recommendation CTR).
   - Xây dựng `src/pages/AdminTrackingConsent/` (Privacy & Consent Compliance).
5. **Admin Navigation & Routing**: Cập nhật `AdminLayout.tsx` và `App.tsx` với route guards và sidebar links.
6. **Testing & Quality Gates**:
   - Unit & Component tests (`vitest`).
   - Security & XSS protection tests.
   - End-to-End tests (`playwright`).
   - TypeScript compilation (`tsc -b`).
   - Linter checks (`npm run lint`).
   - Production bundle build (`npm run build`).
   - Docker container validation.
7. **Commit, Push & CI/CD**:
   - Commit với format `feat(admin): add policy management and tracking analytics`.
   - Push lên GitHub, giám sát GitHub Actions.
   - Bàn giao và tài liệu hóa.
