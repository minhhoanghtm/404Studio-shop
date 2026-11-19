# TASK-ADMIN-POLICY-MANAGEMENT: Enterprise Policy Lifecycle Management System

**Mã Task**: `TASK-ADMIN-POLICY-MANAGEMENT`  
**Trạng thái**: `COMPLETED`  
**Độ ưu tiên**: `CRITICAL`  
**Chủ sở hữu**: Senior React/TypeScript Engineer, Admin Dashboard Designer & Privacy Engineer  
**Ngày hoàn thành**: 19/11/2026  
**Mục tiêu**: Xây dựng toàn diện hệ thống quản lý chính sách doanh nghiệp trên Admin Dashboard Atelier Vérité kết nối 100% Real Backend APIs (`/api/admin/pages`, `/api/pages`), hỗ trợ vòng đời chính sách, rich text editor có bảo vệ XSS, xem trước (preview), và đồng bộ hiển thị lên các trang pháp lý công khai.

---

## 1. YÊU CẦU NGHIỆP VỤ & PHẠM VI HOÀN THÀNH

1. **Trang danh sách chính sách (`/admin/policies`)**:
   - Hiển thị bảng dữ liệu: Tiêu đề chính sách, Loại chính sách, Slug, Phiên bản/Cập nhật, Trạng thái (`draft`, `published`, `archived`), Lượt xem, Ngày tạo, Ngày xuất bản, Thao tác.
   - Tìm kiếm theo từ khóa tiêu đề (Search).
   - Bộ lọc theo trạng thái (`draft`, `published`, `archived`) và loại chính sách.
   - Sắp xếp và phân trang từ Backend API.
   - Thao tác nhanh: Xem chi tiết, Chỉnh sửa, Xuất bản (`published`), Ngừng hiệu lực (`archived`), Xóa an toàn (`DELETE`).

2. **Trang tạo & chỉnh sửa chính sách (`/admin/policies/new`, `/admin/policies/:id/edit`)**:
   - Thiết kế form chuẩn luxury: Title, Slug, Type (`policy`), Excerpt/Summary, Rich Content Sections, Status, SEO Title, SEO Description, SEO Keywords.
   - Rich Text / Section Editor: Hỗ trợ tiêu đề Heading H1-H6, định dạng in đậm, in nghiêng, danh sách ordered/unordered, liên kết, trích dẫn.
   - Chế độ xem trước (Preview Mode) trước khi xuất bản.
   - Bảo vệ chống Stored XSS: Khử độc (sanitize) nội dung, loại bỏ script/iframe/onload độc hại theo allowlist an toàn qua `sanitizeHtml.ts`.
   - Cảnh báo khi có thay đổi chưa lưu (Unsaved changes warning).
   - Validation trường bắt buộc bằng Zod/TypeScript.

3. **Vòng đời chính sách (Policy Lifecycle)**:
   - Hỗ trợ các trạng thái thực tế từ Backend: `draft` ⇄ `published` ⇄ `archived`.
   - Ghi nhận `BLOCKED_BY_BACKEND` cho các trạng thái chưa có trong schema backend (`PENDING_REVIEW`, `APPROVED`).
   - Giữ nguyên bằng chứng pháp lý, không cho phép xóa chính sách đã có hiệu lực khi chưa có xác nhận quyền quản trị.

4. **Đồng bộ trang công khai (Public Policy Sync)**:
   - Các trang `/privacy-policy`, `/terms-of-service`, `/cookie-policy`, `/returns-refunds` truy vấn chính sách có hiệu lực từ `GET /api/pages/:slug` qua hook `usePublicPolicy`.
   - Tự động hiển thị nội dung mới nhất khi chính sách ở trạng thái `published`.
   - Không hiển thị bản `draft` hoặc `archived` trên giao diện công khai.

---

## 2. ACCEPTANCE CRITERIA SATISFACTION

- [x] Route `/admin/policies` hiển thị danh sách chính sách từ real API backend `/api/admin/pages?type=policy`.
- [x] Route `/admin/policies/new` tạo mới chính sách thành công và lưu vào MongoDB qua API `POST /api/admin/pages`.
- [x] Route `/admin/policies/:id/edit` tải dữ liệu chi tiết từ `GET /api/admin/pages/:id/detail` và cập nhật thành công qua `PUT /api/admin/pages/:id`.
- [x] Xóa chính sách hoạt động an toàn qua `DELETE /api/admin/pages/:id`.
- [x] Trình soạn thảo có bộ lọc XSS chặt chẽ, ngăn chặn script injection (`frontend/src/shared/utils/sanitizeHtml.ts`).
- [x] Public routes hiển thị đúng nội dung khi có chính sách tương ứng được xuất bản.
- [x] Giao diện tiếng Việt 100%, responsive, hỗ trợ Light/Dark mode.
- [x] Unit tests, Integration tests và E2E tests đạt 100% PASS (Vitest 69/69, Playwright 13/13).
