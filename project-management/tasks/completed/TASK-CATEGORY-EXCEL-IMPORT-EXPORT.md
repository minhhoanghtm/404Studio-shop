# TASK-CATEGORY-EXCEL-IMPORT-EXPORT: Category Excel Template, Import & Export with Validation

**Mã Task**: `TASK-CATEGORY-EXCEL-IMPORT-EXPORT`  
**Trạng thái**: `COMPLETED`  
**Độ ưu tiên**: `CRITICAL`  
**Chủ sở hữu**: Data Import/Export Engineer & Backend Integration Specialist  
**Ngày khởi tạo**: 20/11/2026  
**Ngày hoàn thành**: 20/11/2026  

---

## 1. MỤC TIÊU & PHẠM VI
1. Tạo file Excel mẫu chuẩn `category-import-template.xlsx` tải trực tiếp từ giao diện Admin (Sheet Hướng Dẫn, Sheet Danh Mục với validation, Sheet Dữ Liệu Mẫu).
2. Xây dựng tính năng Import Excel danh mục:
   - Tải file `.xlsx` lên, kiểm tra MIME type, kích thước (tối đa 10MB), cấu trúc sheet.
   - Parse và kiểm tra dữ liệu theo dòng và cột: `categoryName` bắt buộc, `imageUrl` bắt buộc, kiểm tra trùng mã/slug, phát hiện vòng lặp phân cấp.
   - Xem trước dữ liệu (Preview Table), thống kê hợp lệ / không hợp lệ, bảng báo lỗi chi tiết theo dòng/cột kèm hướng dẫn khắc phục.
   - Thực thi import gọi trực tiếp Backend API thật (`adminApi.createCategory`).
3. Xây dựng tính năng Export Excel danh mục:
   - Xuất toàn bộ danh mục thực tế từ `/api/categories` ra file `.xlsx` định dạng chuyên nghiệp.
   - Phòng chống Spreadsheet Formula Injection (escape các ký tự `=`, `+`, `-`, `@`).
   - Đảm bảo khả năng Round-trip (file export có thể được import lại an toàn).

---

## 2. ACCEPTANCE CRITERIA
- [x] Tải file Excel mẫu danh mục hợp lệ, mở được trên Excel/LibreOffice.
- [x] Import Excel danh mục hiển thị đầy đủ preview và báo lỗi chính xác theo dòng/cột.
- [x] Ngăn chặn import file sai định dạng hoặc chứa mã độc formula.
- [x] Export danh mục ra Excel thành công với dữ liệu thật.
- [x] Gọi 100% Backend API thật khi xác nhận import.

---

## 3. KẾT QUẢ TRIỂN KHAI & BÁO CÁO KIỂM THỬ
- Báo cáo kiểm thử: `project-management/test-reports/integration/CATEGORY_EXCEL_IMPORT_TEST.md`.
- Báo cáo bảo mật: `project-management/test-reports/security/EXCEL_IMPORT_SECURITY_TEST.md`.
- Unit tests: `frontend/src/test/excelImportExport.test.ts` (Suite 2: 4/4 PASS).
- Playwright E2E: `frontend/e2e/adminExcelAndCategoryImages.spec.ts` (Scenario 2: PASS).
