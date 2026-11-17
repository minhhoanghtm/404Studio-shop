# MA TRẬN ĐỐI CHIẾU API BACKEND VÀ MÀN HÌNH FRONTEND (API_FRONTEND_MAPPING.md)

Danh mục toàn bộ các endpoint REST API của backend, phương thức, yêu cầu xác thực, màn hình tiêu thụ trên giao diện Frontend và trạng thái tích hợp.

| Module | Endpoint | Method | Authentication | Frontend Screen | Path Đường Dẫn | Trạng Thái Tích Hợp |
|---|---|---|---|---|---|---|
| **Health** | `/api/health` | GET | Không | Khởi tạo hệ thống | `App.tsx` | Sẵn sàng |
| **Auth** | `/api/auth/login` | POST | Không | Đăng nhập | `/login` | Tích hợp |
| **Auth** | `/api/auth/register` | POST | Không | Đăng ký tài khoản | `/register` | Tích hợp |
| **Auth** | `/api/auth/register/send-otp` | POST | Không | Đăng ký & Gửi OTP | `/register`, `/verify-otp` | Tích hợp |
| **Auth** | `/api/auth/verify-otp` | POST | Không | Xác thực OTP | `/verify-otp` | Màn hình mới |
| **Auth** | `/api/auth/password/forgot` | POST | Không | Quên mật khẩu | `/reset-password` | Màn hình mới |
| **Auth** | `/api/auth/password/reset` | POST | Không | Đặt lại mật khẩu | `/reset-password` | Màn hình mới |
| **Auth** | `/api/auth/refresh` | POST | Bearer/Cookie | Axios Interceptor | Tự động nền | Tích hợp |
| **Auth** | `/api/auth/logout` | POST | Bearer | Header / Sổ tài khoản | Tất cả trang | Tích hợp |
| **User** | `/api/user/me` | GET | Bearer | Tổng quan tài khoản & Sổ địa chỉ | `/account`, `/account/settings` | Tích hợp |
| **User** | `/api/user/profile` | PUT | Bearer | Cài đặt hồ sơ cá nhân | `/account/settings` | Tích hợp |
| **User** | `/api/user/addresses` | POST | Bearer | Quản lý sổ địa chỉ | `/account/addresses`, `/checkout` | Tích hợp |
| **Categories** | `/api/categories` | GET | Không | Danh mục sản phẩm & Mega Menu | `/products`, `Header.tsx` | Tích hợp |
| **Categories** | `/api/categories/:id` | GET | Không | Lọc sản phẩm theo danh mục | `/products` | Tích hợp |
| **Categories** | `/api/categories` (Admin) | POST/PUT/DELETE | Bearer (Admin) | Quản lý danh mục | `/admin/categories` | Màn hình mới |
| **Products** | `/api/products` | GET | Không | Danh mục lưu trữ, Trang chủ | `/products`, `/` | Tích hợp |
| **Products** | `/api/products/search` | GET | Không | Tìm kiếm sản phẩm | `/search`, `QuickSearchModal.tsx` | Tích hợp |
| **Products** | `/api/products/:slug` | GET | Không | Chi tiết sản phẩm | `/products/:slug` | Tích hợp |
| **Products** | `/api/products/:id/availability` | GET | Không | Kiểm tra tồn kho theo size | `/products/:slug` | Tích hợp |
| **Products** | `/api/product_variants/:productId` | GET | Không | Biến thể màu sắc & size | `/products/:slug` | Tích hợp |
| **Products** | `/api/products` (Admin) | POST/PUT/DELETE | Bearer (Admin) | Quản trị tác phẩm & biến thể | `/admin/products` | Màn hình mới |
| **Cart** | `/api/cart` | GET | Bearer | Giỏ hàng & Ngăn kéo giỏ hàng | `/cart`, `CartDrawer.tsx` | Tích hợp |
| **Cart** | `/api/cart_items` | POST | Bearer | Thêm vào giỏ hàng | `/products/:slug`, `/cart` | Tích hợp |
| **Cart** | `/api/cart_items/:id` | PUT | Bearer | Cập nhật số lượng | `/cart`, `CartDrawer.tsx` | Tích hợp |
| **Cart** | `/api/cart_items/:id` | DELETE | Bearer | Xóa khỏi giỏ hàng | `/cart`, `CartDrawer.tsx` | Tích hợp |
| **Orders** | `/api/order` | POST | Tùy chọn / Bearer | Đặt hàng & Xác nhận | `/checkout` | Tích hợp |
| **Orders** | `/api/order/my-orders` | GET | Bearer | Lịch sử đơn hàng | `/orders`, `/account/orders` | Tích hợp |
| **Orders** | `/api/order/:id` | GET | Tùy chọn / Bearer | Chi tiết đơn hàng & Hóa đơn | `/orders/:id`, `/payment-result` | Tích hợp |
| **Orders** | `/api/order/lookup` | GET | Không | Tra cứu đơn không đăng nhập | `/order-lookup` | Màn hình mới |
| **Orders** | `/api/order/admin/all` | GET | Bearer (Admin) | Quản lý toàn bộ đơn hàng | `/admin/orders` | Màn hình mới |
| **Orders** | `/api/order/:id/status` | PUT | Bearer (Admin) | Cập nhật trạng thái xử lý đơn | `/admin/orders` | Màn hình mới |
| **Payments** | `/api/payments/momo/create` | POST | Tùy chọn / Bearer | Cổng thanh toán ví MoMo | `/checkout` | Tích hợp |
| **Payments** | `/api/payments/vnpay/create` | POST | Tùy chọn / Bearer | Cổng thanh toán VNPay | `/checkout` | Tích hợp |
| **Payments** | `/api/payments/momo/return` | GET | Không | Kết quả trả về MoMo | `/payment-result` | Màn hình mới |
| **Payments** | `/api/payments/vnpay/return` | GET | Không | Kết quả trả về VNPay | `/payment-result` | Màn hình mới |
| **Vouchers** | `/api/vouchers` | GET | Không | Danh mục phiếu ưu đãi | `/vouchers` | Màn hình mới |
| **Vouchers** | `/api/vouchers/my` | GET | Bearer | Ví voucher của tài khoản | `/my-coupons` | Màn hình mới |
| **Vouchers** | `/api/vouchers/save` | POST | Bearer | Lưu voucher vào ví | `/vouchers` | Màn hình mới |
| **Vouchers** | `/api/vouchers/apply` | POST | Bearer | Áp dụng mã giảm giá | `/cart`, `/checkout` | Tích hợp |
| **Vouchers** | `/api/vouchers` (Admin) | POST/PUT/DELETE | Bearer (Admin) | Quản trị mã khuyến mãi | `/admin/coupons` | Màn hình mới |
| **Favorites** | `/api/favorites` | GET/POST/DELETE | Bearer | Danh sách yêu thích | `/wishlist` | Tích hợp |
| **Reviews** | `/api/reviews` | POST | Bearer | Gửi đánh giá tác phẩm | `/reviews/create` | Màn hình mới |
| **Lookbooks** | `/api/lookbooks` | GET | Không | Thư viện Lookbook thời trang | `/lookbooks` | Màn hình mới |
| **Banners** | `/api/banners` | GET | Không | Banner trang chủ & Bộ sưu tập | `/`, `HeroSection.tsx` | Tích hợp |
| **Campaigns** | `/api/campaigns` | GET | Không | Chiến dịch mùa thời trang | `/`, `EditorialCampaignSection.tsx` | Tích hợp |
| **Settings** | `/api/settings` | GET | Không | Cấu hình thông tin thương hiệu | Toàn trang & Footer | Tích hợp |
| **Settings** | `/api/settings` (Admin) | PUT | Bearer (Admin) | Cập nhật cấu hình website | `/admin/settings` | Màn hình mới |
| **Customers** | `/api/user/admin/all` | GET | Bearer (Admin) | Quản lý danh sách khách hàng | `/admin/customers` | Màn hình mới |
| **Shipping** | `/api/shipping/fee` | POST | Không | Tính phí giao hàng GHN | `/checkout` | Tích hợp |
| **AI Assistant** | `/api/ai/chat` | POST | Tùy chọn / Bearer | Trợ lý tư vấn kích cỡ & phối đồ | `AiAssistantModal.tsx` | Thành phần mới |
| **Live Chat** | `/api/chat/message` | POST | Tùy chọn / Bearer | Gửi tin nhắn tư vấn trực tiếp | `/contact`, `LiveChatWidget.tsx` | Tích hợp |
| **Admin Chat** | `/api/admin/conversations` | GET | Bearer (Admin) | Hộp thư CSKH trực tuyến | `/admin/chats` | Màn hình mới |
| **Admin Stats** | `/api/admin/dashboard/stats` | GET | Bearer (Admin) | Tổng quan chỉ số doanh thu | `/admin` | Màn hình mới |
