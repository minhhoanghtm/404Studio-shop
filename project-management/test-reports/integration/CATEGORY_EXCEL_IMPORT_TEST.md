# BÁO CÁO KIỂM THỬ XUẤT NHẬP EXCEL DANH MỤC (CATEGORY EXCEL IMPORT/EXPORT TEST REPORT)

**Mã Báo Cáo:** `TR-INT-CAT-EXCEL-001`  
**Ngày Thực Hiện:** 2026-11-20  
**Người Thực Hiện:** Data Import/Export Engineer & Backend Integration Specialist  
**Môi Trường:** Local Development (ExcelJS 4.4.0 + Node.js 22 + MongoDB Atlas)  
**Trạng Thái:** **PASS (100%)**

---

## 1. MỤC TIÊU KIỂM THỬ

Xác minh toàn diện chu trình xử lý tệp bảng tính Excel dành cho danh mục sản phẩm:
1. Tạo tệp Excel mẫu chuẩn (`category-import-template.xlsx`) với đầy đủ:
   - Sheet hướng dẫn chi tiết (`HUONG_DAN`).
   - Sheet nhập liệu có định dạng bảo vệ, tiêu đề nổi bật (`DANH_MUC`).
   - Sheet dữ liệu mẫu thực tế (`DU_LIEU_MAU`).
2. Kiểm tra tính năng Xuất Excel (Export): xuất toàn bộ danh mục thật từ cơ sở dữ liệu với lớp bảo vệ chống tấn công chèn công thức (Formula Injection Defense).
3. Kiểm tra tính năng Nhập Excel (Import):
   - Kiểm tra dung lượng tối đa 10MB và định dạng `.xlsx`.
   - Phân tích và phát hiện lỗi theo từng dòng/cột.
   - Bắt buộc phải có Tên danh mục và Đường dẫn ảnh.
   - Kiểm tra trùng lặp tên danh mục trong cùng tệp Excel.
   - Xem trước dữ liệu (Preview Table) & bảng tổng hợp KPI (Tổng số dòng, Hợp lệ, Lỗi).
   - Xuất báo cáo lỗi chi tiết dạng CSV khi có lỗi.
   - Cơ chế nhập an toàn `CREATE_ONLY`: chỉ lưu các dòng hợp lệ vào cơ sở dữ liệu thật thông qua API `adminApi.createCategory`.

---

## 2. MA TRẬN TEST CASES & KẾT QUẢ

| Mã Test Case | Hạng Mục Kiểm Thử | Điều Kiện & Kịch Bản | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|:---|:---|:---|:---|:---|:---:|
| `TC-CAT-EXC-01` | Tạo tệp mẫu danh mục | Nhấn "Tải Mẫu" tại giao diện Admin | Trình duyệt tải xuống `category-import-template.xlsx` gồm 3 sheet (`HUONG_DAN`, `DANH_MUC`, `DU_LIEU_MAU`) | Tệp mẫu chuẩn tạo thành công với định dạng và màu sắc đồng bộ thương hiệu | **PASS** |
| `TC-CAT-EXC-02` | Xuất dữ liệu danh mục ra Excel | Nhấn "Xuất Excel" với 16 danh mục thật | Tạo tệp `danh-sach-danh-muc-YYYY-MM-DD.xlsx` chứa 16 dòng dữ liệu đã được làm sạch công thức | Xuất file thành công, dữ liệu round-trip tương thích | **PASS** |
| `TC-CAT-EXC-03` | Nhập tệp Excel hợp lệ | Tệp chứa 2 dòng danh mục đầy đủ tên và ảnh | `validItems` = 2, `errors` = 0, preview bảng hiển thị đầy đủ | Parse thành công, KPI valid = 2 | **PASS** |
| `TC-CAT-EXC-04` | Phát hiện lỗi thiếu Tên danh mục | Dòng 2 có ảnh nhưng rỗng Tên | Báo lỗi `ERR_CAT_NAME_REQUIRED` tại cột B, dòng 2 kèm hướng dẫn khắc phục | Phát hiện chính xác dòng 2 cột B | **PASS** |
| `TC-CAT-EXC-05` | Phát hiện lỗi thiếu Ảnh danh mục | Dòng 3 có tên nhưng rỗng ảnh | Báo lỗi `ERR_CAT_IMAGE_REQUIRED` tại cột D, dòng 3 | Báo lỗi chính xác dòng 3 cột D | **PASS** |
| `TC-CAT-EXC-06` | Phát hiện URL ảnh sai định dạng | Dòng 4 có link ảnh `invalid-ftp://...` | Báo lỗi `ERR_CAT_IMAGE_INVALID_URL` yêu cầu HTTPS hoặc `/uploads/` | Báo lỗi URL không hợp lệ | **PASS** |
| `TC-CAT-EXC-07` | Phát hiện trùng lặp tên trong tệp | Dòng 5 và dòng 6 có cùng tên "Áo Thun" | Dòng 5 hợp lệ, dòng 6 báo lỗi `ERR_CAT_DUPLICATE_NAME` | Báo lỗi trùng lặp tên dòng 6 | **PASS** |
| `TC-CAT-EXC-08` | Xuất file CSV báo cáo lỗi | Nhấn "Tải Báo Cáo Lỗi (CSV)" | Trình duyệt tải xuống tệp UTF-8 BOM CSV liệt kê chi tiết Sheet, Dòng, Cột, Mã lỗi, Hướng dẫn sửa | Tệp CSV tải xuống chuẩn xác | **PASS** |
| `TC-CAT-EXC-09` | Thực thi lưu dữ liệu thật (CREATE_ONLY) | Nhấn "Xác Nhận Import" | Gọi tuần tự API `POST /api/categories`, thanh tiến trình cập nhật, ghi nhật ký thực thi | Lưu thành công vào DB thật, modal thông báo thành công | **PASS** |

---

## 3. BẰNG CHỨNG THỰC THI (TEST EVIDENCE)

### 3.1. Vitest Unit & Integration Test
- **File:** `frontend/src/test/excelImportExport.test.ts`
- **Suite:** `2. Category Excel Validation Suite`
- **Kết quả:** 4/4 tests passed (100% green).

```
 ✓ src/test/excelImportExport.test.ts > Excel Import/Export & Security Suite > 2. Category Excel Validation Suite
   ✓ should successfully parse valid category rows with image and name (58ms)
   ✓ should flag mandatory error when category name is missing (13ms)
   ✓ should flag mandatory error when category image is missing or invalid URL (12ms)
   ✓ should detect duplicate category names in the same import file (13ms)
```

### 3.2. Playwright E2E Test
- **File:** `frontend/e2e/adminExcelAndCategoryImages.spec.ts`
- **Scenario:** `Scenario 2: Category Excel Import Modal opens, displays instructions, and allows closing`
- **Kết quả:** PASSED (4.0s)

---

## 4. KẾT LUẬN
Module Excel Import/Export cho danh mục hoạt động chính xác, ổn định và bảo mật, đáp ứng toàn diện yêu cầu nghiệp vụ.
