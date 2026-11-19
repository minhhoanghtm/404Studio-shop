# TASK-PRODUCT-VARIANTS: Rename Artwork Management to Product Management & Multi-Variant Inventory

**Mã Task**: `TASK-PRODUCT-VARIANTS`  
**Trạng thái**: `COMPLETED`  
**Độ ưu tiên**: `CRITICAL`  
**Chủ sở hữu**: Senior Fullstack Engineer, E-commerce Architect & Inventory Specialist  
**Ngày khởi tạo**: 20/11/2026  
**Ngày hoàn thành**: 20/11/2026  

---

## 1. MỤC TIÊU & KẾT QUẢ ĐẠT ĐƯỢC

1. **Đổi tên nhãn giao diện ("Quản lý tác phẩm" -> "Quản lý sản phẩm")**:
   - [x] Đã cập nhật sidebar Admin, Admin Dashboard, Admin Categories, Admin Orders, Admin Tracking, Admin Tracking Products.
   - [x] Đã rà soát và chuẩn hóa toàn bộ các luồng e-commerce khách hàng: Giỏ hàng (`/cart`), Tra cứu đơn hàng (`/order-lookup`), Thanh toán (`/checkout`), Đánh giá (`/reviews`), Trang chủ, Chi tiết sản phẩm (`/products/:slug`), Bộ sưu tập (`/collections`), Ngôn ngữ tiếng Việt (`vi/common.ts`).
   - [x] Giữ lại các thuật ngữ mỹ thuật chân thực ở phần bình luận phong cách / di sản Haute Couture nơi thích hợp.

2. **Quản lý Đa Biến Thể Sản Phẩm (Multi-Variant Management)**:
   - [x] Xây dựng `VariantTable.tsx` hỗ trợ tạo biến thể đơn, sinh hàng loạt theo màu và bảng chọn kích cỡ (XS, S, M, L, XL, XXL, FreeSize).
   - [x] Mỗi biến thể quản lý đầy đủ: Màu sắc (`color`), Kích cỡ (`size`), Tồn kho (`stock`), Ảnh biến thể (`image_url`), SKU tự động.
   - [x] Ngăn chặn triệt để tổ hợp Màu + Size trùng lặp (không phân biệt hoa/thường hay khoảng trắng).
   - [x] Cho phép tải trước dữ liệu biến thể khi chỉnh sửa (`AdminProductEditPage.tsx`).

3. **Tính toán Tồn kho Tự động (Automatic Stock Aggregation)**:
   - [x] Công thức `TotalStock = SUM(VariantStock)` hoạt động tức thời trên UI.
   - [x] Khóa ô tổng tồn kho (`read-only`) khi sản phẩm có cấu hình biến thể.
   - [x] Bắt buộc tồn kho là số nguyên không âm (`stock >= 0`), lọc bỏ số thập phân, NaN, Infinity.
   - [x] Thử nghiệm thực tế: `10 + 15 + 20 + 5 = 50` hoạt động chính xác tuyệt đối.

4. **Kết nối 100% Backend API Thật (Zero Mock API)**:
   - [x] Kết nối trực tiếp API Backend (`/api/products`, `/api/products/detail/:id`, `/api/categories`).
   - [x] Phù hợp hoàn hảo với lệnh tạo Backend `createProduct.command.js` và `updateProduct.command.js`.
   - [x] Ghi nhận minh bạch các giới hạn Backend trong `docs/backend/BACKEND_PRODUCT_VARIANT_GAPS.md`.

5. **Kiểm Thử & Quality Gates**:
   - [x] Unit Tests: `frontend/src/test/adminProductVariants.test.ts` (8/8 tests PASS).
   - [x] Playwright E2E: `frontend/e2e/adminProductVariants.spec.ts` (3/3 scenarios PASS).
   - [x] TypeScript Strict Mode: `npx tsc -b` (0 errors).
   - [x] Oxlint Linter: `npm run lint` (0 errors).
   - [x] Production Build: `npm run build` (Hoàn tất thành công trong 3.71s).
   - [x] Docker Compose: 3 file cấu hình `compose.yaml` hợp lệ (0 errors).
   - [x] Báo cáo kiểm thử: `PRODUCT_VARIANTS_UI_TEST.md`, `PRODUCT_VARIANTS_API_TEST.md`.
