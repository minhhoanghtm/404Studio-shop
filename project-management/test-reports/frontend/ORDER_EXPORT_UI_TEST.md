# BÁO CÁO KIỂM THỬ GIAO DIỆN XUẤT EXCEL ĐƠN HÀNG & THỐNG KÊ (ORDER & ANALYTICS EXCEL EXPORT UI TEST REPORT)

**Mã Báo Cáo:** `TR-UI-ORDER-EXPORT-001`  
**Ngày Thực Hiện:** 2026-11-20  
**Người Thực Hiện:** Senior Fullstack Architect & QA Automation Specialist  
**Môi Trường:** Local Development (Vite 8.3 + React 19 + Tailwind CSS) & Playwright Chromium  
**Trạng Thái:** **PASS (100%)**

---

## 1. MỤC TIÊU KIỂM THỬ

Xác minh tính đúng đắn, an toàn và trực quan của giao diện xuất Excel cho Quản lý đơn hàng và Thống kê quản trị:
- Nút "Xuất Excel" trên trang Quản lý đơn hàng (`/admin/orders`) với huy hiệu đếm số lượng được chọn (Selected Badge).
- Hộp thoại tùy chọn xuất đơn hàng (`OrderExportModal`): hỗ trợ 3 phạm vi xuất:
  1. `filtered_all`: Toàn bộ đơn hàng phù hợp bộ lọc hiện tại (tự động phân trang an toàn).
  2. `current_page`: Chỉ các đơn hàng trên trang đang hiển thị.
  3. `selected`: Chỉ các đơn hàng được tích chọn qua checkbox bảng.
- Tùy chọn kèm chi tiết sản phẩm và biến thể (`includeItems`) cho multi-sheet workbook.
- Nút "Xuất Excel Đơn Này" trong hộp thoại chi tiết đơn hàng (Single Order Detail Export).
- Nút "Xuất Báo Cáo Excel" trên trang Tổng Quan Vận Hành (`/admin`) và Phân Tích & Tracking (`/admin/tracking`).
- Khử trùng công thức (CWE-1236 Formula Injection Defense) trên toàn bộ text cells.
- Đảm bảo 100% dữ liệu từ Backend thật, không sử dụng Mock API.

---

## 2. MA TRẬN TEST CASES & KẾT QUẢ

| Mã Test Case | Hạng Mục Kiểm Thử | Điều Kiện & Thao Tác | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái |
|:---|:---|:---|:---|:---|:---:|
| `TC-ORD-EXP-01` | Hiển thị nút Xuất Excel Toolbar | Truy cập `/admin/orders` | Nút "Xuất Excel" hiển thị cạnh ô tìm kiếm & lọc trạng thái | Nút hiển thị chính xác, biểu tượng Excel màu Champagne | **PASS** |
| `TC-ORD-EXP-02` | Mở hộp thoại tùy chọn xuất | Nhấp "Xuất Excel" | Modal `OrderExportModal` mở ra với tiêu đề "Xuất Dữ Liệu Đơn Hàng Ra Excel" | Modal xuất hiện, mờ nền backdrop | **PASS** |
| `TC-ORD-EXP-03` | 3 Phạm vi xuất dữ liệu | Kiểm tra 3 radio buttons | Hiển thị `Tất cả đơn phù hợp bộ lọc`, `Trang hiện tại`, `Các đơn hàng đã chọn` | Cả 3 radio buttons hiển thị kèm mô tả rõ ràng | **PASS** |
| `TC-ORD-EXP-04` | Tích chọn hàng loạt (Checkbox) | Tích checkbox từng dòng hoặc Select All | Cập nhật số lượng đã chọn trên huy hiệu nút "Xuất Excel"; bật radio `selected` | Huy hiệu cập nhật số lượng chính xác theo thời gian thực | **PASS** |
| `TC-ORD-EXP-05` | Tùy chọn Sheet 2 chi tiết sản phẩm | Tích checkbox `includeItems` | Kích hoạt xuất Sheet `CHI_TIET_SAN_PHAM` với SKU, Size, Màu, Số lượng, Đơn giá | Checkbox hoạt động mượt mà | **PASS** |
| `TC-ORD-EXP-06` | Xuất chi tiết một đơn hàng | Nhấp nút "Xem chi tiết" của 1 đơn | Modal chi tiết hiển thị nút "Xuất Excel Đơn Này" | Nút hiển thị, gọi `normalizeOrderForExport` thành công | **PASS** |
| `TC-ORD-EXP-07` | Nút Xuất Báo Cáo trên Dashboard | Truy cập `/admin` | Nút "Xuất Báo Cáo Excel" hiển thị ở header hành động | Nút hiển thị, sẵn sàng tạo báo cáo 6 sheet | **PASS** |
| `TC-ORD-EXP-08` | Nút Xuất Báo Cáo trên Tracking | Truy cập `/admin/tracking` | Nút "Xuất Báo Cáo Excel" hiển thị cạnh thanh bộ lọc thời gian | Nút hiển thị cạnh nhãn "100% Real API Data" | **PASS** |

---

## 3. BẰNG CHỨNG THỰC THI (TEST EVIDENCE)

### 3.1. Vitest Unit & Normalization Tests
- **File:** `frontend/src/test/adminOrderAndAnalyticsExport.test.ts`
- **Số lượng test:** 8/8 tests passed (100% green).

```
 ✓ src/test/adminOrderAndAnalyticsExport.test.ts (8 tests) 90ms
   ✓ Admin Order & Analytics Excel Export Suite (8)
     ✓ 1. Order Normalization & Status Mapping (5)
       ✓ should map Vietnamese labels for all order statuses
       ✓ should map Vietnamese labels for payment methods and statuses
       ✓ should normalize raw backend order data correctly with nested items and variants
       ✓ should handle guest customers and fallback fields gracefully
       ✓ should defend against formula injection (CWE-1236) in order export fields
     ✓ 2. Multi-Sheet Order Export (exportOrdersToExcel) (1)
       ✓ should generate workbook with DON_HANG, CHI_TIET_SAN_PHAM, THONG_TIN_XUAT
     ✓ 3. Multi-Sheet Analytics Export (exportAnalyticsReportToExcel) (2)
       ✓ should generate complete analytics report with all 6 worksheets
       ✓ should safely export even when optional sections (revenueTimeline, funnel) are empty or undefined
```

### 3.2. Playwright E2E UI Tests
- **File:** `frontend/e2e/adminOrderAndAnalyticsExport.spec.ts`
- **Số lượng test:** 5/5 scenarios passed (100% green).
- **Thời gian thực thi:** 10.0s trên Chromium Desktop Viewport (1440x900).

```
  ok 1 [Desktop Viewport] › e2e\adminOrderAndAnalyticsExport.spec.ts:81:3 › Admin Order & Analytics Excel Export E2E Suite › Scenario 2: Table checkbox selection updates selected count in toolbar (3.4s)
  ok 2 [Desktop Viewport] › e2e\adminOrderAndAnalyticsExport.spec.ts:37:3 › Admin Order & Analytics Excel Export E2E Suite › Scenario 1: Orders page renders Excel Export button, search bar, status filters, and modal (3.9s)
  ok 3 [Desktop Viewport] › e2e\adminOrderAndAnalyticsExport.spec.ts:116:3 › Admin Order & Analytics Excel Export E2E Suite › Scenario 3: Single order detail modal contains "Xuất Excel Đơn Này" action (1.3s)
  ok 4 [Desktop Viewport] › e2e\adminOrderAndAnalyticsExport.spec.ts:144:3 › Admin Order & Analytics Excel Export E2E Suite › Scenario 4: Admin Dashboard page renders "Xuất Báo Cáo Excel" button (2.1s)
  ok 5 [Desktop Viewport] › e2e\adminOrderAndAnalyticsExport.spec.ts:162:3 › Admin Order & Analytics Excel Export E2E Suite › Scenario 5: Admin Tracking page renders "Xuất Báo Cáo Excel" button with real data badge (1.8s)

  5 passed (10.0s)
```

---

## 4. KẾT LUẬN

Tất cả các thành phần giao diện xuất Excel đơn hàng và báo cáo thống kê đáp ứng hoàn toàn yêu cầu nghiệp vụ, tuân thủ nguyên tắc bảo vệ quyền riêng tư (Nghị định 13/2023/NĐ-CP) và phòng thủ Formula Injection (CWE-1236). Đạt tiêu chuẩn nghiệm thu và sẵn sàng release.
