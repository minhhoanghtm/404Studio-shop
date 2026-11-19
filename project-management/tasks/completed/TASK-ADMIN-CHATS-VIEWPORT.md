# TASK-ADMIN-CHATS-VIEWPORT: Fix Admin Chats Full-Viewport Layout & Independent Scrolling

**Mã Task**: `TASK-ADMIN-CHATS-VIEWPORT`  
**Trạng thái**: `COMPLETED`  
**Độ ưu tiên**: `HIGH`  
**Chủ sở hữu**: Senior React/TypeScript Engineer, UI/UX Designer & CSS Layout Specialist  
**Ngày khởi tạo**: 20/11/2026  
**Ngày hoàn thành**: 20/11/2026  

---

## 1. MỤC TIÊU & PHẠM VI

1. **Khắc phục lỗi cuộn toàn trang (Document-level vertical scroll):**
   - Thiết kế lại layout trang `/admin/chats` để toàn bộ giao diện nằm trọn trong một viewport duy nhất (`100dvh` / `h-screen`).
   - Loại bỏ hoàn toàn thanh cuộn dọc ngoài ý muốn tại cấp document (`document.documentElement.scrollHeight <= clientHeight`).
   - Cố định Admin Sidebar, Top Header, Chat Toolbar, Conversation Header và Message Composer trong mọi tình huống.

2. **Hai vùng cuộn độc lập (Independent Scroll Areas):**
   - **Vùng 1 (Danh sách hội thoại):** Cuộn danh sách khách hàng mà không làm di chuyển Header hay Message Window.
   - **Vùng 2 (Nội dung tin nhắn):** Cuộn lịch sử tin nhắn dài độc lập, không làm trôi Conversation Header và Message Composer.

3. **Hành vi tự động cuộn thông minh (Smart Auto-scroll Behavior):**
   - Tự động cuộn xuống tin nhắn mới nhất khi mở cuộc trò chuyện.
   - Giữ nguyên vị trí cuộn khi người dùng chủ động cuộn lên đọc lịch sử tin nhắn cũ (không tự động kéo xuống).
   - Tự động cuộn xuống khi có tin nhắn mới nếu người dùng đang ở gần đáy (`isNearBottom`).
   - Cung cấp nút tiện ích "Xuống tin nhắn mới nhất" khi đang đọc ở phía trên.

4. **Tương thích Responsive đa màn hình (Responsive Design):**
   - **Desktop (1920x1080, 1366x768):** Layout 2 cột song song (Conversation List 340px + Message Window flex-1), không có thanh cuộn trang.
   - **Tablet (768x1024):** Cân đối tỷ lệ 2 cột, không tràn ngang (`overflow-x`).
   - **Mobile (390x844, 375x667):** Trải nghiệm 1 cột mượt mà: ban đầu hiển thị danh sách hội thoại; khi chọn hội thoại thì chuyển sang khung chat toàn màn hình kèm nút "← Quay lại danh sách".

5. **Bảo toàn nghiệp vụ (Preserve Business Logic):**
   - Không thay đổi logic Chat Backend, WebSocket, API hoặc quy trình gửi/nhận tin nhắn.
   - Không làm ảnh hưởng đến các màn hình Admin khác.

---

## 2. ACCEPTANCE CRITERIA

- [x] Trang `/admin/chats` không có document-level vertical scrollbar trên mọi độ phân giải.
- [x] Vùng danh sách hội thoại có `overflow-y-auto` độc lập với thanh cuộn riêng.
- [x] Vùng tin nhắn có `overflow-y-auto` độc lập với thanh cuộn riêng.
- [x] Header và Composer luôn cố định trong tầm nhìn, không bị che khuất hay đẩy ra khỏi màn hình.
- [x] Hỗ trợ nút quay lại danh sách trên thiết bị di động (Mobile 1-column view).
- [x] Smart Auto-scroll hoạt động chính xác (scroll khi ở đáy, không scroll khi đọc tin cũ, có nút cuộn xuống nhanh).
- [x] Hỗ trợ đầy đủ Light/Dark Mode và độ tương phản theo chuẩn WCAG AA.
- [x] Playwright E2E kiểm thử tự động trên Desktop, Laptop, Tablet và Mobile đạt 100% PASS.
- [x] Tất cả quality gates cục bộ (TypeScript strict, Oxlint, Vitest, Vite build) và CI/CD GitHub Actions đạt PASS.

---

## 3. CHI TIẾT TRIỂN KHAI & BÁO CÁO KIỂM THỬ
- **Cải tiến `AdminLayout`**: Bổ sung cờ `fullHeight?: boolean`. Khi bật, layout container áp dụng `h-dvh max-h-dvh overflow-hidden` và ghim header `shrink-0`, kích hoạt mobile slide-over drawer khi cần.
- **Tái cấu trúc `AdminChatPage`**: Áp dụng mô hình CSS Grid/Flex `flex-1 min-h-0 overflow-hidden`, phân lập hai container cuộn riêng biệt kèm `overscroll-contain`.
- **Báo cáo kiểm thử**: [ADMIN_CHATS_VIEWPORT_TEST.md](file:///d:/Project/404Studio/project-management/test-reports/frontend/ADMIN_CHATS_VIEWPORT_TEST.md) (PASS 100%).
