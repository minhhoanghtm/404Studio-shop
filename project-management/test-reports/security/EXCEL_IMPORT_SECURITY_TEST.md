# BÁO CÁO KIỂM THỬ BẢO MẬT XỬ LÝ TỆP BẢNG TÍNH EXCEL (EXCEL IMPORT SECURITY & FORMULA DEFENSE TEST REPORT)

**Mã Báo Cáo:** `TR-SEC-EXCEL-001`  
**Ngày Thực Hiện:** 2026-11-20  
**Người Thực Hiện:** Privacy & Security Engineer, DevSecOps Specialist  
**Tiêu Chuẩn Đánh Giá:** OWASP Top 10, CWE-1236 (Improper Neutralization of Formula Elements in CSV/Spreadsheet File), Zero Day Vulnerability Defense  
**Trạng Thái:** **PASS (100%)**

---

## 1. MỤC TIÊU KIỂM THỬ

1. **Phòng chống tấn công chèn công thức (Spreadsheet Formula Injection / CSV Injection - CWE-1236):**
   - Đảm bảo khi người dùng xuất dữ liệu từ hệ thống ra Excel, bất kỳ trường văn bản nào bắt đầu bằng ký tự kích hoạt công thức nguy hiểm (`=`, `+`, `-`, `@`, ký tự tab `\t`, hoặc ký tự carriage return `\r`) đều phải được tự động khử trùng (sanitization) bằng cách thêm dấu nháy đơn (`'`) ở đầu.
   - Ngăn chặn triệt để nguy cơ thực thi mã từ xa (RCE) qua DDE (Dynamic Data Exchange) hoặc đánh cắp dữ liệu khi tệp Excel được mở bằng Microsoft Excel / LibreOffice Calc.
2. **Bảo vệ chống cạn kiệt tài nguyên & tấn công từ chối dịch vụ (DoS / ReDoS):**
   - Giới hạn dung lượng tệp tin tải lên tối đa là 10MB.
   - Kiểm tra tệp rỗng (0 bytes).
   - Kiểm tra định dạng tệp bắt buộc là `.xlsx`.
3. **An toàn chuỗi cung ứng mã nguồn (Supply Chain Security):**
   - Loại trừ thư viện `xlsx` (SheetJS) vốn có lỗ hổng bảo mật nghiêm trọng High Severity Prototype Pollution (GHSA-4r6h-8v6p-xvw6).
   - Sử dụng thư viện an toàn `exceljs` (phiên bản 4.4.0) đạt tiêu chuẩn `npm audit` với 0 high/critical vulnerabilities.
4. **Cơ chế nhập an toàn `CREATE_ONLY`:**
   - Quá trình import chỉ thực hiện tạo mới các bản ghi hợp lệ, tuyệt đối không tự ý ghi đè hay cập nhật hàng loạt các sản phẩm / danh mục đã tồn tại nếu chưa có cơ chế kiểm duyệt xác nhận rõ ràng.

---

## 2. MA TRẬN TEST CASES BẢO MẬT & KẾT QUẢ

| Mã Test Case | Nguy Cơ / Lỗ Hổng | Kịch Bản Kiểm Thử | Cơ Chế Phòng Thủ | Kết Quả Thực Tế | Trạng Thái |
|:---|:---|:---|:---|:---|:---:|
| `TC-SEC-EXC-01` | Formula Injection (`=`) | Xuất chuỗi `=SUM(A1:B10)` hoặc `=cmd\|'/C calc'!A0` | Tự động thêm dấu `'` thành `'=...` | Khử trùng thành công, Excel coi là chuỗi văn bản thông thường | **PASS** |
| `TC-SEC-EXC-02` | Formula Injection (`+`, `-`) | Xuất chuỗi `+123456789` hoặc `-200000` | Tự động thêm dấu `'` thành `'+...` | Khử trùng thành công, không bị coi là biểu thức số học | **PASS** |
| `TC-SEC-EXC-03` | Formula Injection (`@`) | Xuất chuỗi `@SUM(1,2)` | Tự động thêm dấu `'` | Khử trùng thành công | **PASS** |
| `TC-SEC-EXC-04` | Ký tự ẩn điều khiển (`\t`, `\r`) | Xuất chuỗi bắt đầu bằng tab hoặc xuống dòng | Kiểm tra cả raw string và trimmed string, thêm dấu `'` | Khử trùng thành công, triệt tiêu nguy cơ DDE bypass | **PASS** |
| `TC-SEC-EXC-05` | Giới hạn dung lượng 10MB | Tải lên tệp có dung lượng > 10MB | Từ chối ngay lập tức, trả về thông báo lỗi chi tiết | Tệp 11MB bị từ chối với lý do vượt quá 10MB | **PASS** |
| `TC-SEC-EXC-06` | Kiểm tra tệp 0 bytes | Tải lên tệp rỗng (0 bytes) | Từ chối xử lý, yêu cầu tệp hợp lệ | Tệp 0 bytes bị từ chối | **PASS** |
| `TC-SEC-EXC-07` | Kiểm tra phần mở rộng tệp | Tải lên tệp `.csv`, `.exe`, `.vbs` | Chặn xử lý, chỉ chấp nhận đuôi `.xlsx` | Chặn thành công các định dạng không được hỗ trợ | **PASS** |
| `TC-SEC-EXC-08` | Supply Chain Vulnerability Audit | Kiểm tra `npm audit --audit-level=high` | 0 lỗ hổng bảo mật mức High hoặc Critical | `found 0 vulnerabilities` | **PASS** |

---

## 3. BẰNG CHỨNG THỰC THI (SECURITY TEST EVIDENCE)

### 3.1. Vitest Formula Sanitization & File Safety Tests
- **File:** `frontend/src/test/excelImportExport.test.ts`
- **Suite:** `1. Excel Security & Formula Injection Defense (CWE-1236)`
- **Kết quả:** 3/3 tests passed (100% green).

```
 ✓ src/test/excelImportExport.test.ts > Excel Import/Export & Security Suite > 1. Excel Security & Formula Injection Defense (CWE-1236)
   ✓ should prepend single quote to dangerous formula prefixes (=, +, -, @, tab, cr) (8ms)
   ✓ should leave safe values unchanged (1ms)
   ✓ should validate file safety correctly (size limits, empty check, extension) (1ms)
```

### 3.2. Dependency Security Audit Evidence
```bash
$ npm audit --audit-level=high
found 0 vulnerabilities
```

---

## 4. KẾT LUẬN
Hệ thống xử lý tệp Excel hoàn toàn tuân thủ các nguyên tắc an ninh phần mềm cao cấp, triệt tiêu các vector tấn công qua tệp bảng tính, bảo vệ an toàn cho cả người dùng cuối lẫn máy chủ.
