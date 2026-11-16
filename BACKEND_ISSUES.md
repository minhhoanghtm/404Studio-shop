# BÁO CÁO CÁC VẤN ĐỀ VÀ ĐỀ XUẤT NÂNG CẤP BACKEND (BACKEND_ISSUES.md)

## 1. Nguyên Tắc Tuân Thủ Nghiêm Ngặt
Theo yêu cầu tại **PHASE 3 — GIỮ NGUYÊN BACKEND LOGIC**:
- Không sửa đổi mã nguồn Backend trong `backend/`.
- Không thay đổi contracts, controller, service, middleware, hoặc schema database.
- Mọi hạn chế hoặc tính năng mở rộng mà Backend hiện tại chưa hỗ trợ được ghi nhận chi tiết tại đây kèm hướng xử lý thích nghi tại Frontend.

---

## 2. Danh Sách Vấn Đề Ghi Nhận & Giải Pháp Thích Nghi Tại Frontend

### Vấn đề 1: Backend yêu cầu biến môi trường nghiêm ngặt khi khởi động ở Production
- **Vị trí**: `src/configs/validateEnv.js`
- **Mô tả**: Khi `NODE_ENV === "production"`, hàm `validateEnvironment()` thực thi cơ chế Fail-Fast ném ngoại lệ nếu thiếu `MONGO_CONNECTIONSTRING`, `ACCESS_TOKEN_SECRET` hoặc `REFRESH_TOKEN_SECRET`.
- **Đánh giá**: Đây là thực hành bảo mật chuẩn.
- **Giải pháp**:
  - Tại môi trường phát triển cục bộ (`NODE_ENV=development`), backend chỉ in cảnh báo mà không ngắt server nếu thiếu secrets phụ.
  - Cung cấp tệp `.env.example` đầy đủ các khóa mẫu để lập trình viên tạo file `.env` khi chạy local.

### Vấn đề 2: Các API mở rộng cho giao diện thời trang cao cấp chưa có trong Backend
Theo phân tích từ kho mã nguồn gốc:
1. **API Đăng ký nhận bản tin thời trang (`/api/newsletter/subscribe`)**:
   - Backend chưa có route riêng cho việc lưu email nhận tin ngoài form liên hệ.
   - **Xử lý tại Frontend**: Thực hiện kiểm tra định dạng email bằng Regex, hiển thị thông báo Toast xác nhận thành công và ghi nhận trạng thái cục bộ.
2. **API Đặt lịch tư vấn may đo riêng tư tại Salon (`/api/appointments/fitting`)**:
   - Backend chưa có collection riêng cho Appointment Booking.
   - **Xử lý tại Frontend**: Form đặt hẹn tại trang Contact (`/contact`) lưu thông tin liên hệ và hiển thị mã xác nhận lịch hẹn tức thì, đồng thời có thể tích hợp gửi qua endpoint hỗ trợ khách hàng (`/api/chat/message`).
3. **API Phản hồi nhanh đơn hàng (`/api/feedback/quick`)**:
   - Backend đã có đầy đủ hệ thống Reviews theo sản phẩm (`/api/reviews`), nhưng chưa có micro-feedback nhanh 1-chạm cho đơn hàng.
   - **Xử lý tại Frontend**: Chuyển hướng người dùng sang giao diện viết đánh giá sản phẩm chuẩn (`/reviews/create`) sử dụng API `POST /api/reviews`.

### Vấn đề 3: Phụ thuộc vào dịch vụ bên thứ ba (Third-party Services)
- **Dịch vụ**: Cổng GHN Sandbox, MoMo Sandbox, VNPay Sandbox, OpenRouter AI Key.
- **Giải pháp**:
  - Frontend thiết kế cơ chế dự phòng: Khi backend trả về lỗi kết nối GHN hoặc chưa cấu hình API Key, Frontend tự động fallback sang biểu phí tiêu chuẩn (Ví dụ: Miễn phí cho đơn hàng từ 12.000.000 ₫ hoặc áp dụng 30.000 ₫ phí bưu điện tiêu chuẩn).
  - Đối với thanh toán: Hỗ trợ đầy đủ COD (Thanh toán khi nhận hàng) bên cạnh MoMo và VNPay.
