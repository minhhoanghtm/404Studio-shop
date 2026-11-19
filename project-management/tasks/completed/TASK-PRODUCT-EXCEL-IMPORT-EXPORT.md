# TASK-PRODUCT-EXCEL-IMPORT-EXPORT: Product & Multi-Variant Excel Import, Export & Template

**Mã Task**: `TASK-PRODUCT-EXCEL-IMPORT-EXPORT`  
**Trạng thái**: `COMPLETED`  
**Độ ưu tiên**: `CRITICAL`  
**Chủ sở hữu**: Senior Fullstack Engineer & E-commerce Architect  
**Ngày khởi tạo**: 20/11/2026  
**Ngày hoàn thành**: 20/11/2026  

---

## 1. MỤC TIÊU & PHẠM VI
1. Tạo file Excel mẫu chuẩn `product-import-template.xlsx` tải trực tiếp từ `/admin/products`:
   - Hướng dẫn cấu trúc đa biến thể: mỗi dòng là một biến thể (Variant), các dòng cùng `productSku` thuộc về một sản phẩm chung.
   - Sheet nhập liệu có Data Validation dropdown cho kích cỡ (`XS, S, M, L, XL, XXL, FreeSize`).
   - Sheet dữ liệu mẫu mô phỏng sản phẩm thực tế: Áo dạ lông cừu có 4 biến thể (Đỏ/S: 10, Đỏ/M: 15, Đen/S: 20, Đen/L: 5 => Tổng tồn kho: 50).
2. Xây dựng tính năng Import Excel sản phẩm đa biến thể:
   - Nhóm các dòng theo `productSku`.
   - Kiểm tra tính nhất quán của thông tin sản phẩm cha giữa các dòng cùng SKU.
   - Kiểm tra biến thể: `color` bắt buộc, `size` bắt buộc, `stock` số nguyên >= 0, `price` >= 0.
   - Chặn tổ hợp (Color, Size) trùng lặp trong cùng một sản phẩm.
   - Kiểm tra mã danh mục (`categoryCode`) có tồn tại trong cơ sở dữ liệu thật.
   - Tính toán tự động tổng tồn kho: `TotalStock = SUM(VariantStock)`.
   - Hiển thị bản xem trước chi tiết (sản phẩm, số biến thể, tổng tồn kho, trạng thái).
   - Hiển thị bảng lỗi chi tiết theo Sheet, Dòng, Cột, Mã lỗi và Gợi ý sửa đổi. Cho phép tải báo cáo lỗi.
   - Thực thi import gọi trực tiếp Backend API thật (`adminApi.createProduct`).
3. Xây dựng tính năng Export Excel sản phẩm:
   - Xuất dữ liệu sản phẩm và biến thể thật ra `.xlsx` (mỗi biến thể một dòng).
   - Phòng chống Spreadsheet Formula Injection.
   - Đảm bảo tính tương thích Round-trip import.

---

## 2. ACCEPTANCE CRITERIA
- [x] Tải file Excel mẫu sản phẩm đa biến thể thành công.
- [x] Import Excel nhóm đúng sản phẩm theo `productSku` và tự động tính `TotalStock = SUM(VariantStock)`.
- [x] Chặn biến thể trùng lặp, stock âm, sai danh mục, giá không hợp lệ với báo cáo dòng/cột rõ ràng.
- [x] Export Excel sản phẩm thành công với toàn bộ biến thể.
- [x] Kết nối 100% Backend API thật, không Mock API.

---

## 3. KẾT QUẢ TRIỂN KHAI & BÁO CÁO KIỂM THỬ
- Báo cáo kiểm thử: `project-management/test-reports/integration/PRODUCT_EXCEL_IMPORT_TEST.md`.
- Báo cáo bảo mật: `project-management/test-reports/security/EXCEL_IMPORT_SECURITY_TEST.md`.
- Unit tests: `frontend/src/test/excelImportExport.test.ts` (Suite 3: 4/4 PASS).
- Playwright E2E: `frontend/e2e/adminExcelAndCategoryImages.spec.ts` (Scenario 3: PASS).
