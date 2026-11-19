# TASK-CATEGORY-IMAGE-MANAGEMENT: Category Images, Upload & Cross-Platform Display

**Mã Task**: `TASK-CATEGORY-IMAGE-MANAGEMENT`  
**Trạng thái**: `COMPLETED`  
**Độ ưu tiên**: `CRITICAL`  
**Chủ sở hữu**: Senior Fullstack Engineer & UI/UX Specialist  
**Ngày khởi tạo**: 20/11/2026  
**Ngày hoàn thành**: 20/11/2026  

---

## 1. MỤC TIÊU & PHẠM VI
1. Nâng cấp module Quản lý Danh mục (`/admin/categories`) với trường hình ảnh đại diện bắt buộc (phù hợp với `category.model.js` schema).
2. Xây dựng component `CategoryImageUploader`: Hỗ trợ chọn file từ máy, kéo thả (drag & drop), xem trước realtime, thay thế ảnh, xóa ảnh, validation dung lượng (tối đa 5MB) và định dạng (JPG, PNG, WebP).
3. Tích hợp endpoint thật `POST /api/upload` (sử dụng Multer và Sharp tại backend, chuyển đổi WebP tối ưu).
4. Hiển thị hình ảnh danh mục trên bảng Admin, thẻ danh mục, dropdown và các phân đoạn trang chủ.
5. Kết nối 100% Backend API thật (`/api/categories`, `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id`).

---

## 2. ACCEPTANCE CRITERIA
- [x] Category form yêu cầu ảnh bắt buộc theo đúng backend schema `Category.image`.
- [x] Component `CategoryImageUploader` hoạt động mượt mà với drag-and-drop và xem trước.
- [x] Upload ảnh thành công lên backend qua `POST /api/upload`.
- [x] Bảng danh mục Admin hiển thị thumbnail ảnh thật của từng danh mục.
- [x] Thêm, sửa, xóa danh mục gọi trực tiếp Backend API thật (không dùng local state giả lập).
- [x] Kiểm thử tự động (Unit & E2E) đạt 100% PASS.

---

## 3. KẾT QUẢ TRIỂN KHAI & BÁO CÁO KIỂM THỬ
- Báo cáo kiểm thử: `project-management/test-reports/frontend/CATEGORY_IMAGE_UI_TEST.md`.
- Unit tests: `frontend/src/test/excelImportExport.test.ts` (Suite 4: 4/4 PASS).
- Playwright E2E: `frontend/e2e/adminExcelAndCategoryImages.spec.ts` (Scenario 1: PASS).
