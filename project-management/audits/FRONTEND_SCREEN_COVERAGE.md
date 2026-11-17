# BÁO CÁO ĐỘ PHỦ MÀN HÌNH FRONTEND (FRONTEND_SCREEN_COVERAGE.md)

## 1. Phân Loại Toàn Bộ Tính Năng & Màn Hình

### Nhóm 1: Màn hình đã có sẵn trên giao diện ThreeUI & Kết nối API Backend
1. **Trang chủ (`/`)**: ThreeUI Hero WebGL Shaders, New Arrivals, Featured Collections, Cloth Simulation Lookbook, Manifesto, Journal Preview. Kết nối `GET /api/products`, `GET /api/categories`, `GET /api/banners`.
2. **Danh mục sản phẩm (`/products`)**: Bộ lọc phân loại, sắp xếp giá VND, lọc tồn kho. Kết nối `GET /api/products`, `GET /api/categories`.
3. **Chi tiết sản phẩm (`/products/:slug`)**: Gallery zoom đa ảnh, chọn kích thước, bảng chọn màu, tồn kho. Kết nối `GET /api/products/:slug`, `GET /api/product_variants/:id`, `GET /api/products/:id/availability`.
4. **Bộ sưu tập (`/collections`, `/collections/:slug`)**: Danh sách bộ sưu tập sàn diễn & chi tiết chuyên khảo. Kết nối `GET /api/campaigns`.
5. **Tìm kiếm thời gian thực (`/search`)**: Ô tìm kiếm và gợi ý trực tiếp. Kết nối `GET /api/products/search`.
6. **Danh sách yêu thích (`/wishlist`)**: Lưu trữ và 1-chạm chuyển vào giỏ. Kết nối `GET/POST/DELETE /api/favorites`.
7. **Giỏ hàng (`/cart`, `CartDrawer`)**: Quản lý số lượng, xóa item, thanh tiến độ freeship, nhập voucher. Kết nối `GET /api/cart`, `POST /api/cart_items`, `PUT`, `DELETE`.
8. **Thanh toán (`/checkout`)**: Điền địa chỉ nhận hàng, chọn hình thức giao, tính phí ship GHN, chọn COD/MoMo/VNPay. Kết nối `POST /api/order`, `POST /api/shipping/fee`.
9. **Xác nhận đơn hàng (`/order-success`)**: Hiển thị mã đơn hàng, bảo đảm hộp tuyết tùng và tiến trình xử lý.
10. **Tài khoản cá nhân (`/account`, `/orders`, `/orders/:id`, `/account/addresses`, `/account/settings`)**: Tổng quan hạng thành viên Haute Circle, lịch sử đơn hàng, sổ địa chỉ. Kết nối `GET /api/user/me`, `GET /api/order/my-orders`, `GET /api/order/:id`.
11. **Đăng nhập & Đăng ký (`/login`, `/register`)**: Form đăng nhập email/mật khẩu, đăng ký thành viên. Kết nối `POST /api/auth/login`, `POST /api/auth/register`.
12. **Trang thông tin & dịch vụ (`/about`, `/journal`, `/journal/:slug`, `/contact`, `/support`, `/404`)**: Di sản xưởng may, tạp chí bài viết, đặt hẹn salon tư vấn, hỗ trợ FAQ.

---

### Nhóm 2: Màn hình cần thiết kế và xây dựng mới theo chuẩn ThreeUI
Dựa trên các API Backend thực tế được phát hiện:

1. **Khách hàng — Xác thực OTP kích hoạt tài khoản (`/verify-otp`)**:
   - Thư mục: `src/pages/Auth/VerifyOtpPage.tsx`
   - API: `POST /api/auth/verify-otp`, `POST /api/auth/register/send-otp`
   - Giao diện: Ô nhập 6 chữ số OTP phong cách Haute Couture, đồng hồ đếm ngược 60s, nút gửi lại mã.
2. **Khách hàng — Quên mật khẩu & Khôi phục (`/reset-password`)**:
   - Thư mục: `src/pages/Auth/ResetPasswordPage.tsx`
   - API: `POST /api/auth/password/forgot`, `POST /api/auth/password/reset`
   - Giao diện: 2 bước (Bước 1: Nhập email nhận OTP; Bước 2: Nhập OTP và mật khẩu mới).
3. **Khách hàng — Tra cứu đơn hàng không cần đăng nhập (`/order-lookup`)**:
   - Thư mục: `src/pages/OrderLookup/OrderLookupPage.tsx`
   - API: `GET /api/order/lookup`
   - Giao diện: Nhập mã đơn hàng và số điện thoại, hiển thị trạng thái vận chuyển và danh sách tác phẩm.
4. **Khách hàng — Kết quả thanh toán điện tử (`/payment-result`)**:
   - Thư mục: `src/pages/PaymentResult/PaymentResultPage.tsx`
   - API: `GET /api/order/:id`, callback từ MoMo / VNPay
   - Giao diện: Xác thực trạng thái giao dịch (Thành công / Đang xử lý / Thất bại), mã đối soát, nút chuyển đến đơn hàng.
5. **Khách hàng — Thư viện phiếu ưu đãi Atelier (`/vouchers`) & Ví voucher cá nhân (`/my-coupons`)**:
   - Thư mục: `src/pages/Vouchers/VouchersPage.tsx`, `src/pages/Account/MyCouponsPage.tsx`
   - API: `GET /api/vouchers`, `GET /api/vouchers/my`, `POST /api/vouchers/save`
   - Giao diện: Thẻ vé may đo luxury, hiển thị giá trị giảm %, số tiền cố định, thời hạn sử dụng, nút Lưu voucher.
6. **Khách hàng — Thư viện ảnh Lookbook thời trang (`/lookbooks`)**:
   - Thư mục: `src/pages/Lookbooks/LookbooksPage.tsx`
   - API: `GET /api/lookbooks`
   - Giao diện: Bộ sưu tập hình ảnh nghệ thuật khổ lớn, điểm chạm mua sắm (Shoppable Hotspots).
7. **Khách hàng — Đánh giá tác phẩm sau mua sắm (`/reviews/create`)**:
   - Thư mục: `src/pages/Reviews/CreateReviewPage.tsx`
   - API: `POST /api/reviews`
   - Giao diện: Chọn xếp hạng số sao (1-5 sao), viết cảm nhận chất liệu vải, độ vừa vặn và đính kèm ảnh.
8. **Khách hàng — Trợ lý AI Shopping Assistant (`AiAssistantModal.tsx`)**:
   - Thư mục: `src/shared/components/AiAssistantModal.tsx`
   - API: `POST /api/ai/chat`
   - Giao diện: Hộp thoại tư vấn may đo thông minh, gợi ý trang phục phù hợp với vóc dáng và sự kiện.
9. **Quản trị viên (Admin Portal — `/admin/*`)**:
   - Bố cục: `src/pages/Admin/AdminLayout.tsx` (Thanh điều hướng Sidebar sang trọng, huy hiệu Atelier, phân quyền Admin).
   - **Tổng quan quản trị (`/admin`)**: Thẻ thống kê doanh thu, đơn hàng, khách hàng mới, sản phẩm bán chạy.
   - **Quản lý tác phẩm & biến thể (`/admin/products`)**: Bảng danh sách sản phẩm, bộ lọc, modal thêm/sửa sản phẩm.
   - **Quản lý danh mục (`/admin/categories`)**: Bảng danh mục thời trang phân cấp, thêm/sửa/xóa danh mục.
   - **Quản lý đơn hàng (`/admin/orders`)**: Danh sách đơn hàng toàn hệ thống, cập nhật trạng thái đơn (*Đang xử lý -> Đang giao -> Đã giao*).
   - **Quản lý khách hàng (`/admin/customers`)**: Danh sách tài khoản khách hàng, trạng thái hoạt động, khóa/mở khóa.
   - **Quản lý mã ưu đãi (`/admin/coupons`)**: Tạo và quản lý mã voucher giảm giá, hạn mức sử dụng.
   - **Quản lý tin nhắn CSKH (`/admin/chats`)**: Hộp thư trò chuyện trực tuyến với khách hàng.
   - **Cài đặt hệ thống (`/admin/settings`)**: Cấu hình thông tin thương hiệu, hotline, địa chỉ salon.

---

### Nhóm 3: Chức năng nội bộ không cần màn hình riêng
- `POST /api/events` (Tracking analytics nền)
- `POST /api/privacy/consent` (Xử lý qua Cookie banner góc dưới)
- `POST /api/auth/refresh` (Xử lý tự động qua Axios Interceptor)
- `BullMQ Worker` & `Cron Jobs` (Tiến trình chạy ngầm phía server)
