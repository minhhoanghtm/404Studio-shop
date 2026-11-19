# TASK-CUSTOMER-LOYALTY: CUSTOMER LOYALTY POINTS & 12-TIER MEMBERSHIP SYSTEM

**Task ID**: `TASK-CUSTOMER-LOYALTY`  
**Status**: `COMPLETED`  
**Priority**: `CRITICAL`  
**Owner**: Senior Fullstack Engineer, E-commerce Loyalty Architect & Security Specialist  
**Workspace**: `d:\Project\404Studio`  
**Started At**: 20/11/2026  
**Completed At**: 20/11/2026  

---

## 1. Mục tiêu Nghiệp vụ & Kỹ thuật

Triển khai hoàn chỉnh hệ thống Khách hàng Thân thiết & 12 Cấp hạng Thành viên cho thương hiệu thời trang cao cấp Atelier Vérité:

1. **Hệ thống 12 cấp hạng thành viên chuẩn xác**:
   - **Đồng (Bronze)**: Đồng I (0 điểm), Đồng II (100 điểm), Đồng III (250 điểm).
   - **Bạc (Silver)**: Bạc I (500 điểm), Bạc II (900 điểm), Bạc III (1.400 điểm).
   - **Vàng (Gold)**: Vàng I (2.000 điểm), Vàng II (3.000 điểm), Vàng III (4.500 điểm).
   - **Kim Cương (Diamond)**: Kim Cương I (6.500 điểm), Kim Cương II (9.000 điểm), Kim Cương III (12.000 điểm).
2. **Quy tắc quy đổi & điều kiện tích điểm**:
   - Tỷ lệ: 10.000 VND giá trị hàng hóa hợp lệ = 1 điểm (`floor(eligibleAmount / 10000)`).
   - Giá trị hợp lệ: Tiền hàng sau chiết khấu, không bao gồm phí vận chuyển, trừ phần tiền đã hoàn trả.
   - Điều kiện bắt buộc: Đơn hàng hoàn tất (`status === 'delivered'`) và thanh toán đã xác nhận (`payment_status === 'paid'`). Với COD, phải hoàn tất giao hàng và thu tiền. Đơn chưa thanh toán, đang vận chuyển hoặc đã hủy không được cộng điểm.
3. **Sổ cái điểm thưởng & Chống trùng lặp (Idempotent Point Ledger)**:
   - Giao dịch điểm độc lập: Transaction ID, Customer ID, Order ID, Event Type (`EARN`, `REFUND_REVERSAL`, `ADMIN_ADJUSTMENT`, `EXPIRATION`), Points Delta, Balance trước/sau, Thời gian, Lý do, Idempotency Reference, Rule Version.
   - Chống cộng trùng khi webhook lặp, worker retry, backend restart hoặc admin mở lại đơn hàng.
4. **Xử lý hoàn tiền & Thu hồi điểm (Refunds & Reversals)**:
   - Hoàn tiền toàn phần: Thu hồi toàn bộ điểm đã cộng.
   - Hoàn tiền một phần: Tính lại điểm theo giá trị hợp lệ còn lại và ghi nhận giao dịch chênh lệch.
   - Tự động hạ hạng nếu số điểm xét hạng sau hoàn tiền giảm xuống dưới ngưỡng.
5. **Giao diện Khách hàng (`/account/loyalty`)**:
   - Thẻ thành viên Patron sang trọng, Huy hiệu cấp hạng, Điểm xét hạng tích lũy, Thanh tiến trình lên hạng tiếp theo.
   - Thống kê điểm: Đã tích lũy, Đã thu hồi, Số dư khả dụng.
   - Sổ cái lịch sử biến động điểm chi tiết và danh sách đơn hàng đủ điều kiện.
   - Bảng đặc quyền 12 cấp hạng & Thể lệ chương trình theo quy chuẩn pháp lý Việt Nam.
6. **Giao diện Quản trị Admin (`/admin/loyalty`, `/admin/loyalty/customers`, `/admin/loyalty/transactions`, `/admin/loyalty/settings`)**:
   - Bảng điều khiển tổng quan phân bổ thành viên theo 12 cấp hạng.
   - Quản lý danh sách khách hàng và điểm thưởng theo phân quyền RBAC.
   - Tra cứu sổ cái giao dịch điểm toàn hệ thống, lọc theo đơn hàng/cấp hạng.
   - Báo cáo kiểm định kỹ thuật Backend và cảnh báo `BLOCKED_BY_BACKEND` cho các thao tác can thiệp điểm tùy tiện từ trình duyệt.
7. **Tích hợp An toàn AI Stylist Assistant**:
   - AI có thể giải thích quy tắc, tra cứu hạng/điểm của chính người dùng đã đăng nhập, tính điểm dự kiến từ giỏ hàng.
   - AI bị cấm tuyệt đối: Tự cộng điểm, tự nâng hạng, đọc điểm của người khác.

---

## 2. Nhật Ký Nghiệm Thu & Tiến Độ Hoàn Thành

- [x] **Phase 1: Audit**: Rà soát User, Order, Payment, Tracking, AI Assistant, Vouchers trong Backend và Frontend.
- [x] **Phase 2: Loyalty Domain Engine**: Xây dựng Loyalty Core Service (`src/shared/loyalty/loyaltyEngine.ts`) với 12 cấp hạng, chuyển đổi điểm, idempotent ledger, và refund reconciliation.
- [x] **Phase 3: Client API & Contracts**: Tích hợp API hợp đồng tại `src/shared/api/index.ts` và xử lý graceful fallback/synchronization với dữ liệu đơn hàng thật từ Backend.
- [x] **Phase 4: Customer Loyalty UI**: Xây dựng trang `/account/loyalty`, tích hợp vào `AccountLayout`, `AccountDashboardPage`, và cập nhật hồ sơ người dùng.
- [x] **Phase 5: Admin Loyalty Portal**: Xây dựng `/admin/loyalty`, `/admin/loyalty/customers`, `/admin/loyalty/transactions`, `/admin/loyalty/settings`, và tích hợp vào `AdminLayout`.
- [x] **Phase 6: AI Shopping Assistant Integration**: Nâng cấp `aiSecurityGuard.ts` và `AiAssistantModal.tsx` để hỗ trợ giải thích điểm và ngăn chặn prompt injection liên quan đến điểm/hạng.
- [x] **Phase 7: Testing & Quality Gates**:
  - Vitest Unit & Integration Test Suite (`src/test/loyaltySystem.test.ts`) covering all 21 test cases (100% green).
  - Playwright E2E Test Suite (`e2e/loyaltySystem.spec.ts`) across desktop, tablet, and mobile viewports (15/15 passed).
  - Oxlint (0 errors), TypeScript strict (`npx tsc -b` 0 errors), Vite build (3.52s), and Docker validation (Exit 0).
- [x] **Phase 8: Documentation & Git Delivery**:
  - Test reports in `project-management/test-reports/integration/LOYALTY_POINTS_TEST.md` and `project-management/test-reports/security/LOYALTY_SECURITY_TEST.md`.
  - Update `TASK_INDEX.md` and `PROJECT_HANDOVER.md`.
  - Move task to completed.
  - Commit `feat(loyalty): introduce customer points and membership tiers`, push to `origin/main`, monitor GitHub Actions CI/CD.
