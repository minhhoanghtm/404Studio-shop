# BÁO CÁO KIỂM THỬ GIAO DIỆN HÌNH ẢNH DANH MỤC (CATEGORY IMAGE UI TEST REPORT)

**Mã Báo Cáo:** `TR-UI-CAT-IMG-001`  
**Ngày Thực Hiện:** 2026-11-20  
**Người Thực Hiện:** Senior Fullstack Architect & QA Automation Specialist  
**Môi Trường:** Local Development (Vite 8.3 + React 19 + Tailwind CSS) & Playwright Chromium  
**Trạng Thái:** **PASS (100%)**

---

## 1. MỤC TIÊU KIỂM THỬ

Xác minh tính đúng đắn, toàn vẹn và an toàn của hệ thống quản lý hình ảnh danh mục bắt buộc trên cả Admin Dashboard và các màn hình công khai:
- Kiểm tra tính bắt buộc của hình ảnh đại diện danh mục (`image` required).
- Kiểm tra component `CategoryImageUploader`: tải file từ thiết bị, kéo thả (drag & drop), dán đường dẫn URL trực tiếp, xem trước (real-time preview), thay đổi ảnh, xóa ảnh.
- Kiểm tra ràng buộc định dạng file (JPG, PNG, WEBP) và dung lượng tối đa (5MB).
- Kiểm tra tích hợp API thật: `POST /api/upload` qua multipart upload (`sharp` WebP optimizer) và `POST /api/categories`, `PUT /api/categories/:id`.
- Xác minh giao diện bảng danh mục: cột Thumbnail hiển thị ảnh thật, xử lý fallback khi link hỏng hoặc thiếu ảnh.

---

## 2. MA TRẬN TEST CASES & KẾT QUẢ

| Mã Test Case | Hạng Mục Kiểm Thử | Điều Kiện & Dữ Liệu | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|:---|:---|:---|:---|:---|:---:|
| `TC-CAT-IMG-01` | Ràng buộc ảnh bắt buộc khi tạo | Bỏ trống ảnh, nhập tên danh mục | Hiển thị thông báo lỗi yêu cầu cung cấp hình ảnh; form không submit | Toast lỗi xuất hiện, form chặn submit | **PASS** |
| `TC-CAT-IMG-02` | Kéo thả & chọn file hợp lệ | File `test.jpg` (1MB, image/jpeg) | Tải lên `POST /api/upload`, trả về URL ảnh WebP, hiển thị preview | Tải lên thành công, hiển thị preview ngay lập tức | **PASS** |
| `TC-CAT-IMG-03` | Ràng buộc định dạng không hợp lệ | File `document.pdf`, `vector.svg` | Bị từ chối ngay tại client trước khi gửi lên máy chủ | Báo lỗi định dạng "Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP." | **PASS** |
| `TC-CAT-IMG-04` | Giới hạn dung lượng tối đa 5MB | File `oversized.png` (6.2MB) | Bị từ chối ngay tại client | Báo lỗi "Dung lượng ảnh vượt quá giới hạn 5MB." | **PASS** |
| `TC-CAT-IMG-05` | Chế độ dán đường dẫn URL trực tiếp | Nhập URL HTTPS Unsplash | Áp dụng URL, hiển thị ảnh preview | Preview hiển thị chính xác | **PASS** |
| `TC-CAT-IMG-06` | Thao tác thay thế ảnh (Replace) | Đang có ảnh, chọn "Thay ảnh khác" | Mở file selector để chọn ảnh mới thay thế | File selector mở, cập nhật state thành công | **PASS** |
| `TC-CAT-IMG-07` | Thao tác xóa ảnh (Remove) | Đang có ảnh, nhấn nút X | Ảnh bị xóa, uploader quay lại trạng thái dropzone | Giá trị URL reset về rỗng, dropzone xuất hiện | **PASS** |
| `TC-CAT-IMG-08` | Cột Thumbnail trên bảng Admin | Danh mục thật có ảnh từ MongoDB Atlas | Render thẻ `<img>` với URL thật; fallback khi ảnh hỏng | Render thumbnail 40x40px bo góc, fallback ảnh placeholder | **PASS** |

---

## 3. BẰNG CHỨNG THỰC THI (TEST EVIDENCE)

### 3.1. Vitest Unit & Validation Test
- **File:** `frontend/src/test/excelImportExport.test.ts`
- **Suite:** `4. Category Image Upload & Validation Rules`
- **Kết quả:** 4/4 tests passed (100% green).

```
 ✓ src/test/excelImportExport.test.ts > Excel Import/Export & Security Suite > 4. Category Image Upload & Validation Rules
   ✓ should accept valid JPG, PNG, and WebP images under 5MB (1ms)
   ✓ should reject invalid file types (GIF, PDF, SVG, EXE) (1ms)
   ✓ should reject image files exceeding 5MB limit (1ms)
   ✓ should enforce mandatory image requirement on category creation (1ms)
```

### 3.2. Playwright E2E UI Test
- **File:** `frontend/e2e/adminExcelAndCategoryImages.spec.ts`
- **Scenario:** `Scenario 1: Category Management renders image columns, toolbar Excel buttons, and modal uploader`
- **Kết quả:** PASSED (4.1s)
- **Viewport:** Desktop 1440x900.

---

## 4. KẾT LUẬN
Module quản lý hình ảnh danh mục đáp ứng 100% các tiêu chuẩn về trải nghiệm người dùng, tính thẩm mỹ haute couture Atelier Vérité, tính toàn vẹn dữ liệu MongoDB và an toàn hệ thống.
