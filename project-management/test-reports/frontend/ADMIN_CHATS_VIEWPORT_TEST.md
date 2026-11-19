# BÁO CÁO KIỂM THỬ GIAO DIỆN HỘP THƯ CSKH ADMIN TOÀN VIEWPORT & CUỘN ĐỘC LẬP (ADMIN CHATS VIEWPORT & INDEPENDENT SCROLLING TEST REPORT)

**Mã Báo Cáo:** `TR-UI-ADMIN-CHATS-VIEWPORT-001`  
**Ngày Thực Hiện:** 20/11/2026  
**Người Thực Hiện:** Senior React/TypeScript Engineer, UI/UX Designer & CSS Layout Specialist  
**Môi Trường:** Local Development (Vite 8.3 + React 19 + Tailwind CSS) & Playwright Chromium  
**Trạng Thái:** **PASS (100%)**

---

## 1. MỤC TIÊU KIỂM THỬ

Xác minh tính đúng đắn của việc tái cấu trúc layout trang `/admin/chats`:
1. **Triệt tiêu Document Scrollbar:** Đảm bảo toàn bộ giao diện trang nằm trọn trong một viewport duy nhất (`100dvh` / `h-screen`), không bao giờ phát sinh thanh cuộn dọc ngoài ý muốn ở cấp document (`document.documentElement.scrollHeight <= window.innerHeight`).
2. **Hai vùng cuộn độc lập:**
   - Vùng danh sách cuộc trò chuyện (`[data-testid="conversation-list-scroll"]`) cuộn độc lập khi danh sách dài.
   - Vùng nội dung tin nhắn (`[data-testid="message-list-scroll"]`) cuộn độc lập khi lịch sử tin nhắn dài.
3. **Cố định các thành phần điều hướng:**
   - Admin Sidebar, Top Header, Chat Toolbar, Conversation Header và Message Composer luôn giữ nguyên vị trí, không bị cuộn trôi hay che khuất.
4. **Hành vi tự động cuộn (Smart Auto-Scroll):**
   - Khi chuyển cuộc trò chuyện: tự động nhảy xuống tin nhắn mới nhất.
   - Khi gửi hoặc nhận tin nhắn mới: tự động cuộn xuống nếu đang ở gần cuối (`nearBottom`).
   - Khi người dùng chủ động cuộn lên đọc tin cũ: không bị ép giật xuống đáy; hiển thị nút tiện ích "Xuống tin nhắn mới nhất" với hiệu ứng cuộn mượt.
5. **Khả năng tương thích Responsive:**
   - Desktop (1920x1080) và Laptop (1366x768): 2 cột cân xứng, zero document scroll.
   - Tablet (768x1024): 2 cột cân bằng, không có thanh cuộn ngang (`overflow-x`).
   - Mobile (390x844 & 375x667): Chế độ 1 cột mượt mà, hỗ trợ chuyển đổi giữa Danh sách và Khung chat bằng nút "← Quay lại danh sách".

---

## 2. MA TRẬN TEST CASES & KẾT QUẢ

| Mã Test Case | Hạng Mục Kiểm Thử | Điều Kiện & Độ Phân Giải | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|:---|:---|:---|:---|:---|:---:|
| `TC-CHAT-VP-01` | Ràng buộc viewport Desktop & Laptop | 1920x1080 & 1366x768 | `scrollHeight <= innerHeight + 2`, không cuộn trang | Document scrollHeight hoàn toàn vừa vặn viewport | **PASS** |
| `TC-CHAT-VP-02` | Cuộn độc lập danh sách hội thoại | Danh sách hội thoại dài | Cuộn danh sách không làm dịch chuyển Header hay Message Window | Cuộn mượt mà, overscroll-contain cách ly hoàn toàn | **PASS** |
| `TC-CHAT-VP-03` | Cuộn độc lập khung tin nhắn | Cuộc trò chuyện nhiều tin nhắn | Cuộn tin nhắn không làm dịch chuyển Conversation Header hay Composer | Cuộn độc lập, Header và Composer cố định chắc chắn | **PASS** |
| `TC-CHAT-VP-04` | Nút cuộn xuống tin nhắn mới nhất | Cuộn lên đầu khung tin nhắn | Nút "Xuống tin nhắn mới nhất" nổi ở giữa đáy; bấm vào cuộn êm xuống cuối | Nút xuất hiện và cuộn mượt mà | **PASS** |
| `TC-CHAT-VP-05` | Gửi tin nhắn & ghim Composer | Nhập tin nhắn và bấm Gửi/Enter | Tin nhắn mới thêm vào cuối, tự động cuộn xuống, Composer giữ nguyên vị trí | Tin nhắn hiển thị ngay lập tức, tự động focus lại ô nhập | **PASS** |
| `TC-CHAT-VP-06` | Chuyển đổi cuộc trò chuyện | Nhấp chọn khách hàng khác | Cập nhật tên khách hàng, avatar và lịch sử tin nhắn tương ứng | Đổi hội thoại mượt mà, nhảy ngay xuống đáy tin mới | **PASS** |
| `TC-CHAT-VP-07` | Tìm kiếm & lọc danh mục | Nhập từ khóa tìm kiếm | Lọc đúng khách hàng, ẩn các kết quả không khớp | Lọc theo thời gian thực chính xác | **PASS** |
| `TC-CHAT-VP-08` | Hiển thị Tablet 2 cột | 768x1024 (iPad Viewport) | 2 cột hiển thị đầy đủ, không phát sinh thanh cuộn ngang | Giao diện cân đối, không tràn layout | **PASS** |
| `TC-CHAT-VP-09` | Trải nghiệm 1 cột Mobile | 390x844 & 375x667 | Khởi đầu xem danh sách; bấm khách hàng mở khung chat; có nút Back | Chuyển đổi 1 cột mượt mà, zero document scroll | **PASS** |

---

## 3. BẰNG CHỨNG THỰC THI (TEST EVIDENCE)

### Playwright E2E UI Tests
- **File:** `frontend/e2e/adminChatsViewport.spec.ts`
- **Số lượng test:** 5/5 scenarios passed (100% green).
- **Thời gian thực thi:** 12.2s trên Chromium Viewport Suite.

```
Running 5 tests using 2 workers

  ok 1 [Desktop Viewport] › e2e\adminChatsViewport.spec.ts:98:3 › Admin Chats Full-Viewport Layout & Independent Scrolling E2E Suite › Scenario 2: Sending a message appends bubble, triggers auto-scroll, and pins composer (4.0s)
  ok 2 [Desktop Viewport] › e2e\adminChatsViewport.spec.ts:40:3 › Admin Chats Full-Viewport Layout & Independent Scrolling E2E Suite › Scenario 1: Desktop & Laptop viewports maintain zero document scroll and dual independent scroll areas (5.0s)
  ok 3 [Desktop Viewport] › e2e\adminChatsViewport.spec.ts:138:3 › Admin Chats Full-Viewport Layout & Independent Scrolling E2E Suite › Scenario 3: Conversation switching updates message panel and search filters list cleanly (2.4s)
  ok 4 [Desktop Viewport] › e2e\adminChatsViewport.spec.ts:170:3 › Admin Chats Full-Viewport Layout & Independent Scrolling E2E Suite › Scenario 4: Tablet 768x1024 renders balanced two-column layout without horizontal overflow (2.1s)
  ok 5 [Desktop Viewport] › e2e\adminChatsViewport.spec.ts:196:3 › Admin Chats Full-Viewport Layout & Independent Scrolling E2E Suite › Scenario 5: Mobile viewports support 1-column drilldown and seamless back navigation (2.1s)

  5 passed (12.2s)
```

---

## 4. KẾT LUẬN

Trang Hộp thư CSKH Trực tuyến (`/admin/chats`) đã được khắc phục hoàn toàn lỗi cuộn toàn trang, hoạt động chuẩn xác theo cấu trúc Full-Viewport với hai vùng cuộn độc lập, đáp ứng tiêu chuẩn trải nghiệm người dùng cao cấp của thương hiệu Atelier Vérité.
