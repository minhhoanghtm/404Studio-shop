# BÁO CÁO KIỂM THỬ TÍCH HỢP: HỆ THỐNG ĐIỂM THƯỞNG PATRON & 12 CẤP HẠNG THÀNH VIÊN

**Mã Task**: `TASK-CUSTOMER-LOYALTY`  
**Ngày thực hiện**: 20/11/2026  
**Môi trường**: Vitest v5.1.0 (Unit & Integration) & Playwright v1.65.1 (Cross-Device E2E)  
**Phạm vi**: 12 cấp hạng thành viên, chuyển đổi điểm 10.000 ₫ = 1 điểm, điều kiện tích điểm đơn hàng, sổ cái giao dịch độc lập (Idempotent Point Ledger), quy trình hoàn tiền thu hồi điểm (Refund Reversal), tự động thăng/hạ hạng, giao diện Patron `/account/loyalty`, và cổng quản trị `/admin/loyalty`.  
**Kết quả**: **PASS (100%)** — 21/21 Vitest tests & 15/15 Playwright E2E tests thành công.

---

## 1. Ma Trận Nghiệm Thu 12 Cấp Hạng Thành Viên

| Nhóm Cấp Hạng | Cấp Bậc | Tên Tiếng Việt | Tên Tiếng Anh | Ngưỡng Tích Lũy (pts) | Tương Đương Chi Tiêu (VND) | Kết Quả Test |
|---|---|---|---|:---:|:---:|:---:|
| **Đồng (Bronze)** | I | Đồng I | Bronze I | 0 | 0 ₫ | **PASS** |
| | II | Đồng II | Bronze II | 100 | 1.000.000 ₫ | **PASS** |
| | III | Đồng III | Bronze III | 250 | 2.500.000 ₫ | **PASS** |
| **Bạc (Silver)** | I | Bạc I | Silver I | 500 | 5.000.000 ₫ | **PASS** |
| | II | Bạc II | Silver II | 900 | 9.000.000 ₫ | **PASS** |
| | III | Bạc III | Silver III | 1.400 | 14.000.000 ₫ | **PASS** |
| **Vàng (Gold)** | I | Vàng I | Gold I | 2.000 | 20.000.000 ₫ | **PASS** |
| | II | Vàng II | Gold II | 3.000 | 30.000.000 ₫ | **PASS** |
| | III | Vàng III | Gold III | 4.500 | 45.000.000 ₫ | **PASS** |
| **Kim Cương (Diamond)** | I | Kim Cương I | Diamond I | 6.500 | 65.000.000 ₫ | **PASS** |
| | II | Kim Cương II | Diamond II | 9.000 | 90.000.000 ₫ | **PASS** |
| | III | Kim Cương III | Diamond III | 12.000 | 120.000.000 ₫ | **PASS** |

*Ghi chú*: Hàm kiểm tra `validateTierThresholds(MEMBERSHIP_TIERS)` xác thực các ngưỡng tăng nghiêm ngặt ($0 < 100 < 250 < 500 < 900 < 1400 < 2000 < 3000 < 4500 < 6500 < 9000 < 12000$) đạt kết quả **TRUE**.

---

## 2. Kết Quả Kiểm Thử Quy Tắc Nghiệp Vụ Tích Điểm (Vitest Suite)

| Mã Test | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Kỳ Vọng | Thực Tế | Trạng Thái |
|---|---|---|---|---|:---:|
| **TC-01** | Khách hàng mới chưa có đơn hàng | Customer mới ghi danh, 0 đơn | 0 điểm, Hạng Đồng I, thiếu 100 pts lên Đồng II, tiến trình 0% | 0 pts, Đồng I, thiếu 100 pts, 0% | **PASS** |
| **TC-02** | Đơn hàng 99.999 ₫ (làm tròn dưới) | Đơn đã giao & thanh toán 99.999 ₫ | floor(99.999 / 10.000) = 9 điểm | 9 điểm | **PASS** |
| **TC-03** | Đơn hàng 100.000 ₫ chẵn | Đơn đã giao & thanh toán 100.000 ₫ | floor(100.000 / 10.000) = 10 điểm | 10 điểm | **PASS** |
| **TC-04** | Đơn chưa thanh toán (`pending`) | `status: 'pending'`, `payment_status: 'pending'`, 5.000.000 ₫ | 0 điểm, không đủ điều kiện | 0 điểm | **PASS** |
| **TC-05** | Đơn đang giao (`shipping`) | `status: 'shipping'`, `payment_status: 'paid'`, 10.000.000 ₫ | 0 điểm, phải đợi giao thành công | 0 điểm | **PASS** |
| **TC-06** | Đơn giao thành công & đã thanh toán | `status: 'delivered'`, `payment_status: 'paid'`, 2.500.000 ₫ | 250 điểm | 250 điểm | **PASS** |
| **TC-07** | Đơn COD giao thành công & thu tiền | `status: 'delivered'`, `method: 'cod'`, `payment_status: 'paid'` | 150 điểm (1.500.000 ₫) | 150 điểm | **PASS** |
| **TC-08** | Đơn hủy (`cancelled`) | `status: 'cancelled'`, 50.000.000 ₫ | 0 điểm | 0 điểm | **PASS** |
| **TC-09** | Hoàn tiền toàn phần | Đơn ban đầu 1.000.000 ₫ (100 pts) sau đó `refunded` | Thu hồi 100 pts (`REFUND_REVERSAL`), số dư còn 0, Đồng I | 0 pts, Đồng I, -100 pts reversal | **PASS** |
| **TC-10** | Hoàn tiền một phần | Đơn 1.000.000 ₫, hoàn 300.000 ₫ tiền hàng | Giá trị hợp lệ còn 700.000 ₫ = 70 pts | 70 pts | **PASS** |
| **TC-11** | Chống cộng trùng lặp (Idempotency) | 1 đơn hàng nhận 2 lần (webhook lặp / retry) | Chỉ cộng điểm 1 lần (100 pts, không phải 200 pts) | 100 pts (1 GD) | **PASS** |
| **TC-12** | Đơn hàng đa phát sinh theo thời gian | 3 đơn hàng hợp lệ: 500k, 1.5M, 800k | Tổng 280 pts, thăng hạng Đồng III ($\ge 250$ pts) | 280 pts, Đồng III | **PASS** |
| **TC-13** | Truy xuất khóa Idempotency | Đơn hàng hoàn tất | Khóa: `earn-ord-retry-v1.0`, Rule: `v1.0` | Khớp chuẩn format | **PASS** |
| **TC-14** | Thăng hạng tự động qua 12 cấp | Điểm từ 0 đến 25.000 pts | Nhận diện chuẩn xác 12/12 cấp tương ứng | Khớp 100% | **PASS** |
| **TC-15** | Hạ hạng sau khi hoàn tiền | 5.500.000 ₫ (550 pts - Bạc I), hoàn 1.000.000 ₫ (100 pts) | Điểm xét hạng còn 450 pts $\rightarrow$ Tự động hạ về Đồng III | 450 pts, Đồng III | **PASS** |
| **TC-16** | Xác minh cấu hình 12 cấp hạng | Mảng `MEMBERSHIP_TIERS` | Đầy đủ 12 phần tử, không trùng lặp id | Đạt 12/12 | **PASS** |
| **TC-17** | Cách ly dữ liệu người dùng | 2 user Alice (300 pts) và Bob (900 pts) | Không rò rỉ đơn hàng và điểm giữa 2 tài khoản | Cách ly 100% | **PASS** |
| **TC-18** | An ninh AI Stylist Assistant | Lệnh chat yêu cầu cộng điểm hoặc nâng hạng | Bị chặn bởi `aiSecurityGuard` (FORBIDDEN_ACTION) | Chặn thành công | **PASS** |
| **TC-19** | Dự tính điểm giỏ hàng trước thanh toán | Giỏ hàng 3.450.000 ₫ | Dự tính: 345 điểm | 345 điểm | **PASS** |
| **TC-20** | Tính tỷ lệ tiến trình lên hạng | 50 pts trong khoảng 0-100 pts | 50% tiến trình, còn thiếu 50 pts | 50%, thiếu 50 pts | **PASS** |
| **TC-21** | Tổng hợp thống kê toàn hệ thống | 2 thành viên (Đồng II và Bạc I) | 2 members, 600 pts issued, distribution chính xác | 600 pts, khớp 100% | **PASS** |

---

## 3. Kết Quả Kiểm Thử Playwright End-to-End (E2E)

Kiểm thử tự động trên cả 3 viewports: Desktop (`1440x900`), Tablet (`768x1024`), Mobile (`390x844`).

1. **Scenario 1**: Giao diện Khách hàng `/account/loyalty`
   - Hiển thị Thẻ thành viên Patron, Huy hiệu cấp hạng, Điểm xét hạng.
   - Thanh tiến trình lên hạng tiếp theo hoạt động mượt mà.
   - Sổ cái biến động điểm (Point Ledger) hiển thị đầy đủ các cột: Thời gian, Mã Giao Dịch, Loại Biến Động, Mã Đơn Hàng, Biến Động, Số Dư Sau GD.
   - Tab 4 nhóm cấp hạng (Đồng, Bạc, Vàng, Kim Cương) hiển thị chi tiết 12 cấp và đặc quyền.
   - Điều khoản chương trình tuân thủ Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15.
   - **Kết quả: 3/3 viewports PASS**.

2. **Scenario 2**: Tích hợp Điều hướng Hồ sơ Patron
   - Liên kết "Hạng Patron & Điểm thưởng" xuất hiện trong sidebar `AccountLayout`.
   - Nhấp vào chuyển hướng mượt mà đến `/account/loyalty`.
   - **Kết quả: 3/3 viewports PASS**.

3. **Scenario 3**: Cổng Quản trị Admin `/admin/loyalty`
   - Hiển thị KPI: Tổng thành viên, Điểm đã cấp, Điểm đã thu hồi, Số dư lưu thông.
   - Lưới phân bổ 12 cấp hạng hiển thị tỷ lệ % và số lượng thành viên thực tế.
   - Bảng khách hàng tiêu biểu và biến động điểm gần đây.
   - **Kết quả: 3/3 viewports PASS**.

4. **Scenario 4**: Quản lý Thành viên `/admin/loyalty/customers`
   - Tìm kiếm khách hàng theo tên, email, số điện thoại, mã Patron.
   - Lọc theo nhóm kim loại/đá quý và lọc theo cấp hạng cụ thể.
   - Mở Modal xem chi tiết sổ cái giao dịch của từng thành viên.
   - **Kết quả: 3/3 viewports PASS**.

5. **Scenario 5**: Quy Tắc & Tài Liệu Kỹ Thuật `/admin/loyalty/settings`
   - Hiển thị thông báo trạng thái `BLOCKED_BY_BACKEND`.
   - Bảng ma trận 12 cấp hạng và xác thực thứ tự tăng nghiêm ngặt.
   - Đặc tả kiến trúc Backend Blueprint cho việc mở rộng CSDL sau này.
   - **Kết quả: 3/3 viewports PASS**.
