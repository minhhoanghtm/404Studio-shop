# BÁO CÁO PHÂN TÍCH LỖ HỔNG VÀ ĐỀ XUẤT NÂNG CẤP API BẢO MẬT BACKEND (PHASE 14)

**Dự án**: ThreeUI Fashion E-Commerce Storefront (*Atelier Vérité*)  
**Mô-đun**: Backend Security Architecture Audit & RFC Specifications  
**Trạng thái tuân thủ**: `BLOCKED_BY_BACKEND` (Do tuân thủ nguyên tắc cấm can thiệp mã nguồn backend gốc tại `D:\Project\REACT-WebFashion`)  
**Tác giả**: Senior Application Security Engineer & Lead API Architect  
**Ngày phát hành**: 17/11/2026  

---

## 1. TỔNG QUAN VÀ RÀNG BUỘC KỸ THUẬT

Theo nguyên tắc bất di bất dịch của dự án:
> **"Không sửa Backend nguồn tại `D:\Project\REACT-WebFashion`. Không tự ý thay đổi logic nghiệp vụ Backend chưa được phê duyệt."**

Frontend đã triển khai cơ chế phòng thủ nhiều lớp (`aiSecurityGuard`, `SecurityVerificationModal`) và cô lập các thao tác nhạy cảm. Tuy nhiên, qua quá trình kiểm toán toàn diện backend (`backend/src/`), đội ngũ kỹ sư bảo mật đã phát hiện một số khoảng trống quan trọng trong hệ thống API bảo mật của Backend hiện hữu.

Tài liệu này ghi nhận chi tiết các hạn chế (`BLOCKED_BY_BACKEND`), phân tích rủi ro an ninh và cung cấp tài liệu kỹ thuật RFC (Request for Comments) chuẩn mực để đội ngũ Backend phát triển và hoàn thiện trong các đợt phát hành kế tiếp.

---

## 2. DANH MỤC LỖ HỔNG VÀ KHOẢNG TRỐNG AN NINH BACKEND

| Mã hạn chế | Danh mục | Mức độ rủi ro | Trạng thái hiện tại |
|---|---|:---:|:---:|
| `GAP-SEC-01` | **Thiếu API đổi Email có xác thực OTP** | **NGHIÊM TRỌNG (HIGH)** | `BLOCKED_BY_BACKEND` |
| `GAP-SEC-02` | **Đổi mật khẩu thiếu bước xác minh OTP hai yếu tố** | **TRUNG BÌNH (MEDIUM)** | `BLOCKED_BY_BACKEND` |
| `GAP-SEC-03` | **Thiếu cơ chế thu hồi phiên (Token Revocation) tập trung** | **TRUNG BÌNH (MEDIUM)** | `BLOCKED_BY_BACKEND` |
| `GAP-SEC-04` | **Chưa tích hợp cổng phát tán SMS OTP thực tế** | **THẤP (LOW)** | `BLOCKED_BY_BACKEND` |

---

## 3. CHI TIẾT KHOẢNG TRỐNG VÀ THIẾT KẾ ĐỀ XUẤT RFC

---

### 3.1. GAP-SEC-01: Thiếu API Đổi Email Có Xác Thực OTP

#### Thực trạng hiện tại
- Endpoint cập nhật thông tin cá nhân: `PUT /api/v1/user/updateProfile`.
- Payload chấp nhận: `{ name, email, avatar, ... }`.
- **Lỗ hổng**: Người dùng (hoặc kẻ tấn công có session token) có thể gửi yêu cầu thay đổi trường `email` trực tiếp mà không cần cung cấp bất kỳ mã xác nhận nào từ email cũ hoặc email mới.
- **Hệ quả**: Nếu một phiên làm việc bị rò rỉ (qua XSS hoặc đánh cắp thiết bị), kẻ tấn công có thể đổi email tài khoản sang địa chỉ của chúng, sau đó sử dụng tính năng "Quên mật khẩu" (`/auth/password/forgot`) để chiếm đoạt hoàn toàn tài khoản (Full Account Takeover - ATO).

#### Giải pháp tình thế tại Frontend
Frontend đã chủ động chặn luồng đổi email tự động không có OTP, hiển thị thông báo trạng thái `BLOCKED_BY_BACKEND` và yêu cầu khách hàng liên hệ ban quản trị để thực hiện quy trình xác minh danh tính thủ công.

#### Đề xuất thiết kế RFC cho Backend

##### Endpoint 1: Gửi OTP xác thực đổi Email
```http
POST /api/v1/user/email/send-otp
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "newEmail": "new.patron@example.com"
}
```
**Quy trình xử lý tại Backend**:
1. Kiểm tra email mới hợp lệ và chưa tồn tại trong cơ sở dữ liệu (`User.findOne({ email: newEmail })`).
2. Sinh mã OTP 6 chữ số CSPRNG thông qua `otp.service.js`.
3. Gửi email xác nhận chứa mã OTP đến `newEmail` (kèm email cảnh báo bảo mật tới email hiện tại của người dùng).
4. Lưu mã băm HMAC-SHA256 với prefix `EMAIL_CHANGE:<userId>` vào Redis/Memory với TTL 300 giây.

##### Endpoint 2: Xác thực OTP và cập nhật Email
```http
POST /api/v1/user/email/verify
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "newEmail": "new.patron@example.com",
  "otp": "839201"
}
```
**Quy trình xử lý tại Backend**:
1. Lấy mã băm OTP tương ứng với `EMAIL_CHANGE:<userId>`.
2. So khớp bằng `crypto.timingSafeEqual`. Nếu sai quá 5 lần -> Hủy mã và khóa 60 giây.
3. Nếu hợp lệ: Cập nhật `user.email = newEmail`, lưu lại lịch sử thay đổi `user.emailHistory.push(...)`.
4. Hủy mã OTP và thu hồi toàn bộ refresh token cũ để buộc đăng nhập lại.

---

### 3.2. GAP-SEC-02: Đổi Mật Khẩu Thiếu Bước Xác Minh OTP Hai Yếu Tố

#### Thực trạng hiện tại
- Endpoint hiện tại: `PUT /api/v1/user/updatePassword`.
- Payload chấp nhận: `{ currentPassword, newPassword }`.
- Phương thức này tuân thủ chuẩn xác thực truyền thống nhưng chưa đáp ứng cấp độ bảo mật cao cấp (MFA/Step-up Authentication) cho phân khúc thương mại điện tử xa xỉ. Nếu mật khẩu hiện tại bị lộ qua bàn phím cơ hoặc ghi chép, tài khoản vẫn có nguy cơ bị thay đổi mật khẩu trực tiếp.

#### Đề xuất thiết kế RFC cho Backend
Bổ sung tùy chọn yêu cầu OTP xác minh chủ quyền trước khi đổi mật khẩu:
```http
POST /api/v1/user/password/send-otp
Authorization: Bearer <accessToken>
```
Sau đó endpoint cập nhật mật khẩu tiếp nhận:
```http
PUT /api/v1/user/updatePassword
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "currentPassword": "HauteCouture2026!",
  "newPassword": "NewStrongPassword2026@",
  "otp": "492018"
}
```

---

### 3.3. GAP-SEC-03: Thiếu Cơ Chế Thu Hồi Phiên (Token Revocation) Tập Trung

#### Thực trạng hiện tại
- Khi người dùng đổi mật khẩu thành công qua `/user/updatePassword` hoặc `/auth/password/reset`, backend cập nhật mật khẩu mới nhưng các JWT Access Token và Refresh Token đã cấp cho các thiết bị khác vẫn tiếp tục có hiệu lực cho đến khi hết hạn tự nhiên (Access Token: 15 phút, Refresh Token: 7 ngày).

#### Rủi ro an ninh
Kẻ tấn công đang duy trì phiên đăng nhập trái phép trên thiết bị khác vẫn có thể thực hiện giao dịch trong cửa sổ thời gian token còn hiệu lực.

#### Đề xuất thiết kế RFC cho Backend
1. **Trường `tokenVersion` hoặc `passwordChangedAt` trong User Schema**:
   ```javascript
   // backend/src/models/user.model.js
   const userSchema = new mongoose.Schema({
     // ...
     passwordChangedAt: { type: Date, default: Date.now },
     tokenVersion: { type: Number, default: 0 }
   });
   ```
2. **Kiểm tra trong Auth Middleware**:
   ```javascript
   // backend/src/middlewares/auth.middleware.js
   if (decoded.iat < user.passwordChangedAt.getTime() / 1000) {
     return res.status(401).json({ 
       success: false, 
       message: 'Mật khẩu đã được thay đổi gần đây. Vui lòng đăng nhập lại.' 
     });
   }
   ```
3. **Danh sách đen Redis (Token Blacklist)**: Lưu các refresh token đã bị hủy vào Redis với thời gian sống bằng phần thời gian còn lại của token.

---

### 3.4. GAP-SEC-04: Chưa Tích Hợp Cổng Phát Tán SMS OTP Thực Tế

#### Thực trạng hiện tại
Trong `backend/src/services/otp.service.js`, việc phát sinh mã OTP cho số điện thoại (`/user/phone/send-otp`) đang ghi nhận mã ra log console máy chủ trong môi trường phát triển (Development / Mock). Chưa có cấu hình kết nối tới Gateway viễn thông chính thức (như eSMS, VNPT, Vietguys, Twilio).

#### Đề xuất thiết kế RFC cho Backend
Tích hợp SMS Provider thông qua kiến trúc hàng đợi bất đồng bộ BullMQ:
1. Thêm cấu hình biến môi trường trong `backend/.env`:
   ```env
   SMS_PROVIDER=esms # hoặc vietguys / twilio
   SMS_API_KEY=your_api_key
   SMS_SECRET_KEY=your_secret_key
   SMS_BRANDNAME=ATELIER_V
   ```
2. Tạo Worker chuyên trách xử lý gửi SMS trong `backend/src/workers/sms.worker.js`.

---

## 4. KẾT LUẬN VÀ KẾ HOẠCH BÀN GIAO

Việc ghi nhận các hạn chế kỹ thuật trên dưới định danh `BLOCKED_BY_BACKEND` thể hiện sự minh bạch, tôn trọng nguyên tắc toàn vẹn mã nguồn và chuẩn hóa quy trình phát triển phần mềm doanh nghiệp.

Toàn bộ các yêu cầu bảo mật ở tầng Frontend và AI Agent đã được triển khai phòng thủ ở mức tối đa, sẵn sàng tương thích ngay khi đội ngũ Backend phát hành các API mở rộng theo tài liệu RFC này.
