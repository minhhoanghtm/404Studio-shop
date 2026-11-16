# BÁO CÁO TOÀN DIỆN AUDIT BACKEND (BACKEND_AUDIT.md)

## 1. Xác Định Đường Dẫn & Cấu Trúc Tổng Thể

- **Đường dẫn nguồn**: `D:\Project\REACT-WebFashion\back-end`
- **Đường dẫn đích**: `d:\Project\404Studio\backend`
- **Kiến trúc**: Node.js ES Modules (`"type": "module"`), Express.js REST API + WebSocket Socket.IO + Worker BullMQ.

---

## 2. Thông Số Kỹ Thuật & Công Nghệ Cốt Lõi

| Thành phần | Công nghệ / Thư viện | Phiên bản | Mục đích & Chi tiết triển khai |
|---|---|---|---|
| **Runtime & Framework** | Node.js + Express.js | `^4.18.2` | RESTful API, dynamic routing, middleware chain |
| **Cơ sở dữ liệu chính** | MongoDB + Mongoose | `^9.3.0` | Quản lý dữ liệu quan hệ tài liệu, schemas, transactions |
| **Cache & In-memory Store** | Redis + ioredis | `^5.11.1` | Lưu trữ session, caching sản phẩm, phân phối token |
| **Hàng đợi & Background Workers** | BullMQ | `^5.78.0` | Email worker, user tracking analytics worker, AI vector sync worker |
| **Realtime Communication** | Socket.IO + Redis Adapter | `^4.8.3` / `^8.3.0` | Live chat CSKH, thông báo đơn hàng theo thời gian thực |
| **Bảo mật & Middleware** | Helmet, CORS, Express-Mongo-Sanitize, Rate-Limit | `^8.2.0`, `^2.8.6`, `^2.2.0` | Phòng chống XSS, NoSQL Injection, giới hạn tần suất truy cập |
| **Xác thực & Ủy quyền** | JWT (`jsonwebtoken`), `bcrypt`, `google-auth-library` | `^9.0.3`, `^6.0.0`, `^10.9.0` | Access Token, Refresh Token cookie/header, Google OAuth2, RBAC |
| **Xác thực dữ liệu (Validation)** | Zod | `^4.4.3` | Schema validation cho DTOs của request payload |
| **Tác vụ định kỳ (Cron)** | node-cron | `^4.2.1` | Quét voucher hết hạn, xử lý đơn hàng quá hạn thanh toán, chiến dịch |
| **Quản lý Tệp tải lên** | Multer + Sharp | `^2.1.1`, `^0.34.5` | Xử lý ảnh đại diện, banner, tối ưu dung lượng ảnh sản phẩm |
| **Cổng thanh toán điện tử** | MoMo SDK/API, VNPay API | Tích hợp trực tiếp | Tạo link thanh toán, xử lý callback ReturnURL và IPN webhook |
| **Tích hợp Vận chuyển** | GHN (Giao Hàng Nhanh) | REST API Sandbox | Tính toán phí ship theo quận/huyện/phường xã |
| **Trí tuệ nhân tạo (AI)** | OpenRouter / OpenAI API | REST integration | AI Chatbot tư vấn phong cách, gợi ý phối đồ (Lookbook matching) |

---

## 3. Cấu Trúc Thư Mục Backend Nguồn

```
D:\Project\REACT-WebFashion\back-end\
├── src/
│   ├── common/                  # Logger winston, constants
│   ├── configs/                 # db.js, redis.js, validateEnv.js, ghn.js
│   ├── cron/                    # voucher.cron.js, order.cron.js, campaign.cron.js
│   ├── middlewares/             # auth.middleware.js, error.middleware.js, rateLimiter, maintenance
│   ├── migrations/              # Database schema migrations
│   ├── modules/                 # Cấu trúc Modular theo nghiệp vụ (Domain-Driven):
│   │   ├── ai/                  # AI Chat & Vector embedding sync
│   │   ├── auth/                # Đăng ký, đăng nhập, OTP, reset mật khẩu, refresh token
│   │   ├── banners/             # Banners quảng bá
│   │   ├── campaigns/           # Chiến dịch khuyến mãi, sự kiện flash sale
│   │   ├── carts/               # Giỏ hàng & cart items
│   │   ├── categories/          # Danh mục thời trang phân cấp
│   │   ├── communication/       # Livechat CSKH & tin nhắn
│   │   ├── favorites/           # Sản phẩm yêu thích (Wishlist)
│   │   ├── inventory/           # Quản lý tồn kho & Reservation tạm khóa hàng
│   │   ├── orders/              # Đơn hàng, lịch sử, chi tiết, quản trị đơn
│   │   ├── pages/               # Trang nội dung tĩnh CMS, lookbooks
│   │   ├── pageSections/        # Quản lý khối giao diện động
│   │   ├── payments/            # MoMo & VNPay gateway
│   │   ├── products/            # Sản phẩm & biến thể màu/size
│   │   ├── recommendations/     # Gợi ý sản phẩm thông minh & A/B testing
│   │   ├── reviews/             # Đánh giá & xếp hạng sản phẩm
│   │   ├── shipping/            # Tính phí giao hàng GHN
│   │   ├── tracking/            # Sự kiện hành vi người dùng, GDPR privacy, lịch sử tìm kiếm
│   │   ├── uploads/             # Xử lý upload ảnh
│   │   ├── users/               # Hồ sơ người dùng, sổ địa chỉ, quản trị khách hàng
│   │   ├── vouchers/            # Mã giảm giá, ví voucher, áp dụng voucher
│   │   └── websiteSettings/     # Cài đặt website, thương hiệu, bảo trì
│   ├── queues/                  # BullMQ queues & workers (email, tracking)
│   ├── routes/index.js          # Root router kết nối 35+ router con
│   ├── sockets/                 # Socket.IO connection & event handlers
│   ├── utils/                   # Helpers xử lý chuỗi, slug, thời gian
│   ├── app.js                   # Cấu hình Express app, CORS, Helmet, Parsers
│   ├── server.js                # Khởi động HTTP server, kết nối DB, Redis, Cron, Workers
│   └── worker.js                # Tiến trình worker độc lập
├── seed/                        # Dữ liệu khởi tạo (demo catalog, vouchers, test users)
├── uploads/                     # Thư mục lưu trữ hình ảnh demo & static uploads
├── Dockerfile                   # Dockerfile container chạy API
├── Dockerfile.worker            # Dockerfile container chạy BullMQ Worker
├── package.json                 # Khai báo dependencies
└── package-lock.json
```

---

## 4. Danh Mục API Endpoints & Phân Quyền

Toàn bộ hệ thống Backend cung cấp hơn 70 REST endpoints:

1. **Authentication (`/api/auth`)**:
   - `POST /login`: Đăng nhập email/mật khẩu
   - `POST /register`: Đăng ký tài khoản
   - `POST /register/send-otp`: Gửi mã OTP xác thực
   - `POST /verify-otp`: Kiểm tra mã OTP
   - `POST /password/forgot`: Quên mật khẩu
   - `POST /password/reset`: Đặt lại mật khẩu với OTP
   - `POST /refresh`: Làm mới Access Token
   - `POST /logout`: Đăng xuất (thu hồi session)
   - `POST /google`: Đăng nhập Google OAuth2

2. **User Profile & Addresses (`/api/user`)**:
   - `GET /me`: Lấy thông tin cá nhân
   - `PUT /profile`: Cập nhật hồ sơ (tên, sđt, avatar)
   - `POST /addresses`: Thêm/cập nhật địa chỉ nhận hàng
   - `GET /admin/all`: Quản trị viên xem danh sách khách hàng
   - `PUT /admin/:id/status`: Khóa/mở khóa tài khoản khách hàng

3. **Categories & Products (`/api/categories`, `/api/products`, `/api/product_variants`)**:
   - `GET /categories`, `GET /categories/:id`: Xem danh mục
   - `POST /categories`, `PUT /categories/:id`, `DELETE /categories/:id`: Quản trị danh mục
   - `GET /products`: Danh sách sản phẩm (hỗ trợ phân trang, lọc danh mục, giá, sắp xếp)
   - `GET /products/search`: Tìm kiếm sản phẩm theo từ khóa
   - `GET /products/:slug`: Chi tiết sản phẩm
   - `GET /products/:id/availability`: Kiểm tra tồn kho
   - `POST /products`, `PUT /products/:id`, `DELETE /products/:id`: Quản trị sản phẩm & biến thể
   - `GET /product_variants/:product_id`: Lấy danh sách biến thể theo sản phẩm

4. **Cart (`/api/cart`, `/api/cart_items`)**:
   - `GET /cart`: Lấy thông tin giỏ hàng của user
   - `POST /cart_items`: Thêm sản phẩm vào giỏ
   - `PUT /cart_items/:id`: Cập nhật số lượng
   - `DELETE /cart_items/:id`: Xóa sản phẩm khỏi giỏ

5. **Orders (`/api/order`, `/api/order_items`)**:
   - `POST /order`: Đặt hàng (hỗ trợ cả Guest và User có tài khoản)
   - `GET /my-orders`: Lịch sử đơn hàng của người dùng
   - `GET /lookup`: Tra cứu tiến trình đơn hàng bằng mã đơn và SĐT
   - `GET /:id`: Chi tiết đơn hàng
   - `GET /admin/all`: Quản trị viên xem toàn bộ đơn hàng
   - `PUT /:id/status`: Quản trị viên cập nhật trạng thái đơn (chờ xử lý, đang giao, hoàn thành, hủy)

6. **Payments (`/api/payments`)**:
   - `POST /momo/create`: Tạo yêu cầu thanh toán ví MoMo
   - `POST /vnpay/create`: Tạo link thanh toán VNPay
   - `GET /momo/return`, `POST /momo/ipn`: Xử lý kết quả MoMo
   - `GET /vnpay/return`, `GET /vnpay/ipn`: Xử lý kết quả VNPay

7. **Vouchers & Discounts (`/api/vouchers`)**:
   - `GET /`: Danh sách voucher công khai
   - `GET /my`: Ví voucher cá nhân
   - `POST /save`: Lưu voucher vào ví
   - `POST /apply`: Áp dụng mã giảm giá và tính số tiền giảm
   - `POST /`, `PUT /:id`, `DELETE /:id`: Quản trị mã khuyến mãi

8. **Favorites / Wishlist (`/api/favorites`)**:
   - `GET /`: Danh sách sản phẩm yêu thích của user
   - `POST /`: Thêm sản phẩm vào danh sách yêu thích
   - `DELETE /:id`: Xóa sản phẩm khỏi danh sách yêu thích

9. **Reviews & Ratings (`/api/reviews`)**:
   - `GET /product/:productId`: Lấy danh sách đánh giá của sản phẩm
   - `POST /`: Người mua gửi đánh giá số sao và nhận xét

10. **Banners & Lookbooks (`/api/banners`, `/api/lookbooks`, `/api/campaigns`)**:
    - `GET /banners`: Danh sách banner trang chủ
    - `GET /lookbooks`: Danh sách lookbook thời trang nghệ thuật
    - `GET /campaigns`: Danh sách sự kiện chiến dịch

11. **Static Pages & CMS (`/api/pages`, `/api/settings`)**:
    - `GET /pages/:slug`: Lấy nội dung trang tĩnh (policy, terms, shipping, guide, about)
    - `GET /settings`: Lấy thông tin cấu hình website (hotline, thương hiệu, địa chỉ)
    - `PUT /settings`: Quản trị viên cập nhật thiết lập website

12. **AI Shopping Assistant (`/api/ai`)**:
    - `POST /chat`: Trò chuyện tư vấn kích cỡ, gợi ý phối đồ thông minh
    - `POST /actions/:id/confirm`: Xác nhận hành động AI (thêm sản phẩm gợi ý vào giỏ)

13. **Customer Communication & Live Chat (`/api/chat`, `/api/admin`)**:
    - `POST /chat/message`: Khách gửi tin nhắn hỗ trợ
    - `GET /admin/conversations`: Quản trị viên lấy danh sách phiên chat
    - `GET /admin/messages/:id`: Lấy tin nhắn chi tiết cuộc trò chuyện

14. **Shipping & GHN Partner (`/api/shipping`)**:
    - `POST /fee`: Tính toán phí giao hàng theo địa chỉ nhận qua API GHN

---

## 5. Đối Chiếu Với Frontend Hiện Tại (ThreeUI E-Commerce)

| Nhóm chức năng Backend | Trạng thái trên Frontend ThreeUI hiện tại | Đánh giá & Hướng triển khai |
|---|---|---|
| **Trang chủ & ThreeUI Hero** | Đã có (`HomePage.tsx`), đang dùng dữ liệu mô phỏng | Kết nối `GET /api/banners`, `GET /api/campaigns`, `GET /api/products` |
| **Danh mục sản phẩm (`/products`)** | Đã có (`ProductsPage.tsx`), dùng filter cục bộ | Kết nối `GET /api/products` với query params (`category, sort, minPrice, maxPrice, page, limit`) |
| **Chi tiết sản phẩm (`/products/:slug`)** | Đã có (`ProductDetailPage.tsx`) | Kết nối `GET /api/products/:slug`, `GET /api/product_variants/:id`, kiểm tra tồn kho |
| **Giỏ hàng (`/cart`, `CartDrawer`)** | Đã có giao diện, lưu trữ qua Zustand `localStorage` | Bổ sung đồng bộ với `GET /api/cart`, `POST /api/cart_items`, `PUT`, `DELETE` khi đã đăng nhập |
| **Thanh toán (`/checkout`)** | Đã có giao diện mô phỏng | Tích hợp tính phí ship thật `POST /api/shipping/fee`, tạo đơn hàng `POST /api/order`, gọi thanh toán MoMo/VNPay |
| **Kết quả thanh toán (`/order-success`)** | Đã có giao diện cơ bản | Bổ sung màn hình xử lý kết quả thanh toán điện tử `PaymentResult` (`/payment-result`) theo dõi callback |
| **Đăng nhập / Đăng ký (`/login`, `/register`)** | Đã có giao diện | Kết nối `POST /api/auth/login`, `POST /api/auth/register`, làm mới token `POST /api/auth/refresh` |
| **Quên mật khẩu & OTP** | **Chưa có màn hình riêng** | **Cần xây dựng mới**: `/reset-password` và `/verify-otp` |
| **Tra cứu đơn hàng không cần đăng nhập** | **Chưa có màn hình riêng** | **Cần xây dựng mới**: `/order-lookup` gọi `GET /api/order/lookup` |
| **Ví Voucher khuyến mãi (`/vouchers`)** | Đã có mã ưu đãi tĩnh trong giỏ | **Cần xây dựng mới**: `/vouchers` và `/my-coupons` kết nối API voucher thực tế |
| **Lookbooks thời trang (`/lookbooks`)** | Đã có lookbook tương tác trên trang chủ | **Cần xây dựng mới**: `/lookbooks` trang gallery lookbook nghệ thuật lấy từ `GET /api/lookbooks` |
| **Đánh giá sản phẩm (`/reviews/create`)** | Chưa có form gửi đánh giá | **Cần xây dựng**: Form đánh giá sản phẩm sau khi mua hàng |
| **Trợ lý AI Shopping Assistant** | Chưa có giao diện tương tác | **Cần xây dựng**: Widget AI Assistant tư vấn thời trang gọi `POST /api/ai/chat` |
| **Module Quản Trị Viên (Admin Portal)** | **Chưa có trên Frontend ThreeUI** | **Cần xây dựng mới toàn bộ phân hệ Admin**: Dashboard, Products, Categories, Orders, Customers, Coupons, Settings, LiveChat CSKH |
