# BÁO CÁO PHÂN TÍCH ĐỐI CHIẾU VÀ KHOẢNG TRỐNG BACKEND PRIVACY API
## ATELIER VÉRITÉ — LEGAL COMPLIANCE & PRIVACY ARCHITECTURE
**Văn bản pháp lý áp dụng:** Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, Nghị định 356/2025/NĐ-CP, Luật Bảo vệ quyền lợi người tiêu dùng 19/2023/QH15, Luật Kế toán 88/2015/QH13.

---

### 1. TỔNG QUAN HỆ THỐNG BACKEND HIỆN TẠI

Backend của ATELIER VÉRITÉ (sao chép nguyên trạng từ `D:\Project\REACT-WebFashion\back-end` vào `backend/`) đã được thiết kế sẵn một phân hệ xử lý quyền riêng tư và theo dõi chuyên biệt tại `backend/src/modules/tracking/`.

Cấu trúc các thành phần cốt lõi:
- **Router:** `backend/src/modules/tracking/privacy.route.js`
- **Controller:** `backend/src/modules/tracking/tracking.controller.js`
- **Service:** `backend/src/modules/tracking/dataSubject.service.js`
- **Models:**
  - `userConsent.model.js`: Lưu trữ nhật ký đồng thuận, danh mục cho phép, phiên bản chính sách, IP hash, user agent.
  - `dataSubjectRequest.model.js`: Quản lý vòng đời yêu cầu của chủ thể dữ liệu (Truy cập, Chỉnh sửa, Rút đồng thuận, Hạn chế xử lý, Xóa dữ liệu).
  - `trackingEvent.model.js`: Lưu vết sự kiện người dùng phục vụ phân tích nội bộ.
- **Constants:** `backend/src/common/constants/privacyPolicy.js` (Lưu canonical policy version `2026-11-07`).

---

### 2. DANH MỤC ENDPOINTS ĐÃ TRIỂN KHAI VÀ ĐÁNH GIÁ TƯƠNG THÍCH

| HTTP Method | API Endpoint | Middleware & Quyền | Trạng thái Backend | Mức độ tương thích Frontend |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/privacy/policy` | Public | Đã triển khai | **100% Hoàn hảo**: Trả về siêu dữ liệu chính sách (`version: "2026-11-07"`, ngày hiệu lực, liên kết DPO). |
| `GET` | `/api/privacy/consent` | `optionalProtectedRoute` | Đã triển khai | **100% Hoàn hảo**: Lấy trạng thái đồng thuận của người dùng đăng nhập hoặc phiên định danh khách. |
| `PUT` / `POST` | `/api/privacy/consent` | `optionalProtectedRoute`, `validate(updateConsentSchema)` | Đã triển khai | **100% Hoàn hảo**: Đồng bộ lựa chọn đồng thuận (`necessary`, `analytics`, `personalization`, `marketing`) từ `useConsentStore`. |
| `POST` | `/api/privacy/data-export` | `protectedRoute`, `dataSubjectRequestLimiter` | Đã triển khai | **100% Hoàn hảo**: Xuất trích xuất dữ liệu cá nhân dạng JSON/Archive, yêu cầu xác thực mật khẩu. |
| `POST` | `/api/privacy/data-requests` | `protectedRoute`, `dataSubjectRequestLimiter` | Đã triển khai | **100% Hoàn hảo**: Tiếp nhận yêu cầu theo Điều 9 & 10 Luật 91/2025/QH15. |
| `GET` | `/api/privacy/data-requests` | `protectedRoute` | Đã triển khai | **100% Hoàn hảo**: Tra cứu lịch sử và trạng thái xử lý các yêu cầu của chủ thể dữ liệu. |
| `DELETE` | `/api/privacy/data` | `optionalProtectedRoute` | Đã triển khai | **100% Hoàn hảo**: Xóa lịch sử tracking của phiên người dùng. |

---

### 3. KHOẢNG TRỐNG KỸ THUẬT (GAPS) VÀ GIẢI PHÁP ĐÃ TRIỂN KHAI Ở FRONTEND

#### Khoảng trống 1: Tiếp nhận yêu cầu của khách vãng lai (Guest Users)
- **Hiện trạng Backend:**
  Endpoint `POST /api/privacy/data-requests` và `POST /api/privacy/data-export` hiện sử dụng middleware `protectedRoute`, đòi hỏi JSON Web Token (JWT) từ tài khoản đã đăng nhập.
- **Vấn đề pháp lý:**
  Theo Luật 91/2025/QH15, người tiêu dùng mua hàng không đăng ký tài khoản (khách vãng lai / Guest Checkout) vẫn phát sinh dữ liệu cá nhân (họ tên, số điện thoại, địa chỉ nhận hàng, lịch sử đơn hàng) và có toàn quyền yêu cầu trích xuất hoặc xóa dữ liệu.
- **Giải pháp xử lý (Frontend Mitigation):**
  Tại trang `/data-privacy/request`, giao diện hỗ trợ cả hai đối tượng:
  1. Người dùng đã đăng nhập: Tự động điền thông tin và gửi qua API có kèm JWT Bearer token.
  2. Khách vãng lai: Form thu thập mã đơn hàng gần nhất, số điện thoại và email nhận hàng để định danh; đồng thời cung cấp mã phiếu trực tiếp (DSR-XXXXXXXX) và hướng dẫn gửi kèm bản chụp căn cước/giấy tờ xác thực qua email `privacy@atelierverite.vn` hoặc hotline DPO `1900 888 999` để DPO đối soát thủ công và tạo yêu cầu quản trị.

#### Khoảng trống 2: Xung đột giữa Quyền xóa dữ liệu (Luật 91) và Nghĩa vụ lưu trữ chứng từ (Luật Kế toán 88)
- **Hiện trạng Backend:**
  Trong `backend/src/modules/tracking/dataSubject.service.js`, nghiệp vụ xóa dữ liệu (`erase`) đã được xử lý bằng cơ chế **Ẩn danh hóa (Anonymization)**:
  - Thông tin nhận dạng cá nhân trong đơn hàng được thay thế bằng `[ĐÃ ẨN DANH]`, email được hash, số điện thoại được ẩn.
  - Các chỉ số giao dịch tài chính (mã đơn, trị giá hóa đơn, thuế VAT, phương thức thanh toán) được bảo lưu nguyên vẹn.
- **Đánh giá pháp lý:**
  Đây là phương án tuân thủ tiêu chuẩn kép:
  - Đáp ứng Điều 10 Luật 91/2025/QH15 & Nghị định 356/2025/NĐ-CP (dữ liệu không còn khả năng tái định danh người dùng).
  - Đáp ứng Luật Kế toán 88/2015/QH13 (lưu trữ chứng từ kế toán ít nhất 05 đến 10 năm phục vụ thanh tra thuế).

#### Khoảng trống 3: Cơ chế thông báo tiến độ xử lý yêu cầu (SLA 72 Giờ & 14 Ngày)
- **Hiện trạng Backend:**
  Backend quản lý các trạng thái yêu cầu (`PENDING`, `VERIFIED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`) trong cơ sở dữ liệu MongoDB thông qua model `dataSubjectRequest.model.js`. Tuy nhiên chưa cấu hình tự động bắn webhook / email template gửi mã OTP xác nhận danh tính người dùng khi gửi yêu cầu.
- **Giải pháp xử lý (Frontend Mitigation):**
  Frontend hiển thị rõ ràng thông báo cam kết SLA theo đúng quy định:
  - Xác nhận tiếp nhận hồ sơ trong vòng **72 giờ làm việc**.
  - Xử lý hoàn tất yêu cầu trong vòng **14 ngày làm việc** (kèm điều kiện giải trình gia hạn tối đa thêm 14 ngày nếu hồ sơ phức tạp).
  - Cung cấp mã tra cứu DSR công khai ngay trên giao diện khi submit thành công.

---

### 4. ĐỀ XUẤT CẢI TIẾN TRONG BẢN CẬP NHẬT BACKEND TƯƠNG LAI (BACKLOG)

> [!NOTE]
> Tuân thủ nguyên tắc cốt lõi của dự án: **Không chỉnh sửa mã nguồn Backend đã sao chép từ REACT-WebFashion**. Các đề xuất dưới đây dành cho giai đoạn vận hành chính thức tiếp theo.

1. **Bổ sung Guest Token Endpoint:**
   Thêm `POST /api/privacy/guest-verify-request` nhận `email` + `orderCode` + OTP gửi qua email để xác thực chủ thể dữ liệu mà không cần tạo tài khoản mật khẩu đầy đủ.
2. **Hệ thống gửi Email thông báo tự động (DSR Notifications):**
   Kết nối dịch vụ SendGrid/SES trong `notification.service.js` với các sự kiện trạng thái của `dataSubjectRequest.model.js`.
3. **Admin Privacy Dashboard:**
   Mở rộng trang quản trị `/admin/privacy` cho DPO thao tác duyệt 1-click các yêu cầu xóa dữ liệu, xuất báo cáo tuân thủ gửi Cục An ninh mạng và phòng, chống tội phạm sử dụng công nghệ cao (A05) khi có yêu cầu thanh kiểm tra.
