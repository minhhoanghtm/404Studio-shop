# MASTER VIDEO COVERAGE REPORT (MP4)

- **Report ID**: `TR-FULL-VIDEO-COVERAGE`
- **Execution Date**: 20/11/2026
- **Timezone**: `Asia/Ho_Chi_Minh`
- **Target Host**: `http://127.0.0.1:5180` (Vite) -> `http://127.0.0.1:5000` (Express Backend)
- **Status**: **100% COVERAGE ACHIEVED**

---

## 1. Executive Summary

| Chỉ Số Kiểm Thử | Mục Tiêu | Đã Thực Hiện | Tỷ Lệ Đạt | Trạng Thái |
|---|:---:|:---:|:---:|:---:|
| **Tổng số Routes thực tế** | 53 | 53 | 100% | **PASS** |
| **Routes đã quay video UI** | 53 | 53 | 100% | **PASS** |
| **Tổng số Video UI đã quay** | $\ge 53$ | 53 | 100% | **PASS** |
| **Tổng số Chức năng nghiệp vụ** | 12 | 12 | 100% | **PASS** |
| **Tổng số Phương pháp nghiệp vụ** | 20 | 20 | 100% | **PASS** |
| **Phương pháp đã quay video** | 20 | 20 | 100% | **PASS** |
| **Định dạng Video MP4 H.264** | 100% | 100% | 100% | **PASS** |
| **Video giải mã hợp lệ (ffprobe)** | 100% | 73/73 | 100% | **PASS** |

---

## 2. UI Video Recordings Manifest Summary

| Mã Video | Tệp Tin MP4 | Route | Tên Trang | Viewport | Thời Lượng | Trạng Thái |
|---|---|---|---|---|:---:|:---:|
| `UI-01-20-11-2026` | `UI01-20-11-2026.mp4` | `/` | Trang Chủ (Homepage) | Desktop (1440x900) | 22s | **PASS** |
| `UI-02-20-11-2026` | `UI02-20-11-2026.mp4` | `/products` | Danh Mục Sản Phẩm (Catalog) | Desktop (1440x900) | 9s | **PASS** |
| `UI-03-20-11-2026` | `UI03-20-11-2026.mp4` | `/products/ao-thun-tron-oversize-nam` | Chi Tiết Sản Phẩm (Product Detail) | Desktop (1440x900) | 10s | **PASS** |
| `UI-04-20-11-2026` | `UI04-20-11-2026.mp4` | `/collections` | Bộ Sưu Tập (Collections) | Desktop (1440x900) | 10s | **PASS** |
| `UI-05-20-11-2026` | `UI05-20-11-2026.mp4` | `/collections/sale` | Chi Tiết Bộ Sưu Tập (Collection Detail) | Desktop (1440x900) | 9s | **PASS** |
| `UI-06-20-11-2026` | `UI06-20-11-2026.mp4` | `/lookbooks` | Lookbooks Runway | Desktop (1440x900) | 10s | **PASS** |
| `UI-07-20-11-2026` | `UI07-20-11-2026.mp4` | `/search?q=ao` | Tìm Kiếm Sản Phẩm (Search) | Desktop (1440x900) | 10s | **PASS** |
| `UI-08-20-11-2026` | `UI08-20-11-2026.mp4` | `/wishlist` | Danh Sách Yêu Thích (Wishlist) | Desktop (1440x900) | 9s | **PASS** |
| `UI-09-20-11-2026` | `UI09-20-11-2026.mp4` | `/cart` | Giỏ Hàng (Cart) | Desktop (1440x900) | 9s | **PASS** |
| `UI-10-20-11-2026` | `UI10-20-11-2026.mp4` | `/checkout` | Thanh Toán (Checkout) | Desktop (1440x900) | 11s | **PASS** |
| `UI-11-20-11-2026` | `UI11-20-11-2026.mp4` | `/order-lookup` | Tra Cứu Đơn Hàng (Order Lookup) | Desktop (1440x900) | 11s | **PASS** |
| `UI-12-20-11-2026` | `UI12-20-11-2026.mp4` | `/about` | Về Chúng Tôi (About Us) | Desktop (1440x900) | 9s | **PASS** |
| `UI-13-20-11-2026` | `UI13-20-11-2026.mp4` | `/journal` | Tạp Chí Thời Trang (Journal) | Desktop (1440x900) | 8s | **PASS** |
| `UI-14-20-11-2026` | `UI14-20-11-2026.mp4` | `/contact` | Liên Hệ (Contact) | Desktop (1440x900) | 10s | **PASS** |
| `UI-15-20-11-2026` | `UI15-20-11-2026.mp4` | `/support` | Hỗ Trợ & Câu Hỏi Thường Gặp (Support & FAQ) | Desktop (1440x900) | 10s | **PASS** |
| `UI-16-20-11-2026` | `UI16-20-11-2026.mp4` | `/privacy-policy` | Chính Sách Bảo Mật (Privacy Policy) | Desktop (1440x900) | 9s | **PASS** |
| `UI-17-20-11-2026` | `UI17-20-11-2026.mp4` | `/terms-of-service` | Điều Khoản Dịch Vụ (Terms of Service) | Desktop (1440x900) | 9s | **PASS** |
| `UI-18-20-11-2026` | `UI18-20-11-2026.mp4` | `/cookie-policy` | Chính Sách Cookie (Cookie Policy) | Desktop (1440x900) | 9s | **PASS** |
| `UI-19-20-11-2026` | `UI19-20-11-2026.mp4` | `/returns-refunds` | Chính Sách Đổi Trả & Hoàn Tiền (Returns & Refunds) | Desktop (1440x900) | 9s | **PASS** |
| `UI-20-20-11-2026` | `UI20-20-11-2026.mp4` | `/data-privacy` | Trung Tâm Quyền Riêng Tư (Privacy Center) | Desktop (1440x900) | 10s | **PASS** |
| `UI-21-20-11-2026` | `UI21-20-11-2026.mp4` | `/data-privacy/request` | Yêu Cầu Quyền Dữ Liệu (Data Privacy Request) | Desktop (1440x900) | 9s | **PASS** |
| `UI-22-20-11-2026` | `UI22-20-11-2026.mp4` | `/vouchers` | Mã Ưu Đãi (Vouchers) | Desktop (1440x900) | 9s | **PASS** |
| `UI-23-20-11-2026` | `UI23-20-11-2026.mp4` | `/login` | Đăng Nhập (Login) | Desktop (1440x900) | 9s | **PASS** |
| `UI-24-20-11-2026` | `UI24-20-11-2026.mp4` | `/register` | Đăng Ký Tài Khoản (Register) | Desktop (1440x900) | 10s | **PASS** |
| `UI-25-20-11-2026` | `UI25-20-11-2026.mp4` | `/404` | Trang Không Tìm Thấy (404 Not Found) | Desktop (1440x900) | 9s | **PASS** |
| `UI-26-20-11-2026` | `UI26-20-11-2026.mp4` | `/account` | Tổng Quan Tài Khoản (Account Dashboard) | Desktop (1440x900) | 11s | **PASS** |
| `UI-27-20-11-2026` | `UI27-20-11-2026.mp4` | `/account/orders` | Lịch Sử Đơn Hàng (Account Orders) | Desktop (1440x900) | 11s | **PASS** |
| `UI-28-20-11-2026` | `UI28-20-11-2026.mp4` | `/account/addresses` | Sổ Địa Chỉ (Account Addresses) | Desktop (1440x900) | 11s | **PASS** |
| `UI-29-20-11-2026` | `UI29-20-11-2026.mp4` | `/account/settings` | Cài Đặt Tài Khoản (Account Settings) | Desktop (1440x900) | 9s | **PASS** |
| `UI-30-20-11-2026` | `UI30-20-11-2026.mp4` | `/account/coupons` | Ưu Đãi Của Tôi (My Coupons) | Desktop (1440x900) | 11s | **PASS** |
| `UI-31-20-11-2026` | `UI31-20-11-2026.mp4` | `/account/loyalty` | Hạng Thành Viên & Điểm Thưởng (Customer Loyalty) | Desktop (1440x900) | 9s | **PASS** |
| `UI-32-20-11-2026` | `UI32-20-11-2026.mp4` | `/admin` | Bảng Điều Khiển Quản Trị (Admin Dashboard) | Desktop (1440x900) | 4s | **PASS** |
| `UI-33-20-11-2026` | `UI33-20-11-2026.mp4` | `/admin/products` | Quản Lý Sản Phẩm (Admin Products) | Desktop (1440x900) | 10s | **PASS** |
| `UI-34-20-11-2026` | `UI34-20-11-2026.mp4` | `/admin/products/new` | Thêm Sản Phẩm Mới (Admin Product Create) | Desktop (1440x900) | 11s | **PASS** |
| `UI-35-20-11-2026` | `UI35-20-11-2026.mp4` | `/admin/categories` | Quản Lý Danh Mục (Admin Categories) | Desktop (1440x900) | 10s | **PASS** |
| `UI-36-20-11-2026` | `UI36-20-11-2026.mp4` | `/admin/orders` | Quản Lý Đơn Hàng (Admin Orders) | Desktop (1440x900) | 4s | **PASS** |
| `UI-37-20-11-2026` | `UI37-20-11-2026.mp4` | `/admin/customers` | Quản Lý Khách Hàng (Admin Customers) | Desktop (1440x900) | 4s | **PASS** |
| `UI-38-20-11-2026` | `UI38-20-11-2026.mp4` | `/admin/coupons` | Quản Lý Mã Ưu Đãi (Admin Coupons) | Desktop (1440x900) | 4s | **PASS** |
| `UI-39-20-11-2026` | `UI39-20-11-2026.mp4` | `/admin/chats` | Hội Thoại Khách Hàng (Admin Chats) | Desktop (1440x900) | 8s | **PASS** |
| `UI-40-20-11-2026` | `UI40-20-11-2026.mp4` | `/admin/loyalty` | Tổng Quan Hệ Thống Điểm Thưởng (Admin Loyalty) | Desktop (1440x900) | 8s | **PASS** |
| `UI-41-20-11-2026` | `UI41-20-11-2026.mp4` | `/admin/loyalty/customers` | Thành Viên Điểm Thưởng (Admin Loyalty Customers) | Desktop (1440x900) | 4s | **PASS** |
| `UI-42-20-11-2026` | `UI42-20-11-2026.mp4` | `/admin/loyalty/transactions` | Biến Động Điểm Thưởng (Admin Loyalty Transactions) | Desktop (1440x900) | 4s | **PASS** |
| `UI-43-20-11-2026` | `UI43-20-11-2026.mp4` | `/admin/loyalty/settings` | Cấu Hình Điểm Thưởng (Admin Loyalty Settings) | Desktop (1440x900) | 11s | **PASS** |
| `UI-44-20-11-2026` | `UI44-20-11-2026.mp4` | `/admin/campaigns` | Chiến Dịch Khuyến Mãi (Admin Campaigns) | Desktop (1440x900) | 4s | **PASS** |
| `UI-45-20-11-2026` | `UI45-20-11-2026.mp4` | `/admin/campaigns/new` | Tạo Chiến Dịch Mới (Admin Campaign Create) | Desktop (1440x900) | 12s | **PASS** |
| `UI-46-20-11-2026` | `UI46-20-11-2026.mp4` | `/admin/page-builder` | Quản Lý Trang Nội Dung (Admin Page Builder Hub) | Desktop (1440x900) | 4s | **PASS** |
| `UI-47-20-11-2026` | `UI47-20-11-2026.mp4` | `/admin/page-builder/new` | Visual Page Builder Editor (New Page) | Desktop (1440x900) | 4s | **PASS** |
| `UI-48-20-11-2026` | `UI48-20-11-2026.mp4` | `/admin/policies` | Quản Lý Chính Sách Doanh Nghiệp (Admin Policies) | Desktop (1440x900) | 4s | **PASS** |
| `UI-49-20-11-2026` | `UI49-20-11-2026.mp4` | `/admin/tracking` | Tổng Quan Phân Tích Hành Vi (Admin Tracking) | Desktop (1440x900) | 8s | **PASS** |
| `UI-50-20-11-2026` | `UI50-20-11-2026.mp4` | `/admin/tracking/users` | Tracking Người Dùng (Admin Tracking Users) | Desktop (1440x900) | 8s | **PASS** |
| `UI-51-20-11-2026` | `UI51-20-11-2026.mp4` | `/admin/tracking/events` | Sự Kiện Thời Gian Thực (Admin Tracking Events) | Desktop (1440x900) | 4s | **PASS** |
| `UI-52-20-11-2026` | `UI52-20-11-2026.mp4` | `/admin/tracking/products` | Phân Tích Sản Phẩm (Admin Tracking Products) | Desktop (1440x900) | 4s | **PASS** |
| `UI-53-20-11-2026` | `UI53-20-11-2026.mp4` | `/admin/tracking/consent` | Nhật Ký Đồng Thuận Quyền Riêng Tư (Admin Tracking Consent) | Desktop (1440x900) | 8s | **PASS** |

---

## 3. Functional Flow Recordings Manifest Summary

| Mã Video | Tệp Tin MP4 | Chức Năng | Cách Thực Hiện | Thời Lượng | Trạng Thái |
|---|---|---|---|:---:|:---:|
| `search_products-01-cach01-20-11-2026` | `search_products_01-20-11-2026-cach01.mp4` | Tìm Kiếm & Lọc Sản Phẩm | `cach01`: Tìm Kiếm Nhanh Bằng Header Modal | 11s | **PASS** |
| `search_products-01-cach02-20-11-2026` | `search_products_01-20-11-2026-cach02.mp4` | Tìm Kiếm & Lọc Sản Phẩm | `cach02`: Lọc & Sắp Xếp Trên Trang Danh Mục | 8s | **PASS** |
| `search_products-01-cach03-20-11-2026` | `search_products_01-20-11-2026-cach03.mp4` | Tìm Kiếm & Lọc Sản Phẩm | `cach03`: Tìm Kiếm Thông Minh Bằng Trợ Lý Stylist AI | 15s | **PASS** |
| `add_to_cart-01-cach01-20-11-2026` | `add_to_cart_01-20-11-2026-cach01.mp4` | Thêm Sản Phẩm Vào Giỏ Hàng | `cach01`: Thêm Từ Trang Chi Tiết Sản Phẩm (PDP) | 8s | **PASS** |
| `add_to_cart-01-cach02-20-11-2026` | `add_to_cart_01-20-11-2026-cach02.mp4` | Thêm Sản Phẩm Vào Giỏ Hàng | `cach02`: Thao Tác Điều Chỉnh Giỏ Hàng & Quick View | 6s | **PASS** |
| `checkout_order-01-cach01-20-11-2026` | `checkout_order_01-20-11-2026-cach01.mp4` | Quy Trình Đặt Hàng & Thanh Toán | `cach01`: Đặt Hàng Thanh Toán Khi Nhận Hàng (COD) | 8s | **PASS** |
| `checkout_order-01-cach02-20-11-2026` | `checkout_order_01-20-11-2026-cach02.mp4` | Quy Trình Đặt Hàng & Thanh Toán | `cach02`: Khách Hàng Tra Cứu Đơn Hàng Vãng Lai | 8s | **PASS** |
| `voucher_management-01-cach01-20-11-2026` | `voucher_management_01-20-11-2026-cach01.mp4` | Áp Dụng Mã Ưu Đãi (Vouchers) | `cach01`: Áp Dụng Mã Giảm Giá Trực Tiếp Trong Giỏ Hàng | 6s | **PASS** |
| `voucher_management-01-cach02-20-11-2026` | `voucher_management_01-20-11-2026-cach02.mp4` | Áp Dụng Mã Ưu Đãi (Vouchers) | `cach02`: Xem Danh Sách & Sao Chép Mã Từ Trang Vouchers | 8s | **PASS** |
| `customer_account-01-cach01-20-11-2026` | `customer_account_01-20-11-2026-cach01.mp4` | Quản Lý Tài Khoản Khách Hàng | `cach01`: Đăng Nhập Khách Hàng & Khôi Phục Phiên | 10s | **PASS** |
| `customer_account-01-cach02-20-11-2026` | `customer_account_01-20-11-2026-cach02.mp4` | Quản Lý Tài Khoản Khách Hàng | `cach02`: Kiểm Tra Hệ Thống Điểm Thưởng 12 Hạng (Loyalty) | 7s | **PASS** |
| `admin_products-01-cach01-20-11-2026` | `admin_products_01-20-11-2026-cach01.mp4` | Quản Trị Sản Phẩm & Biến Thể | `cach01`: Xem Danh Sách & Xuất Báo Cáo Excel Sản Phẩm | 7s | **PASS** |
| `admin_products-01-cach02-20-11-2026` | `admin_products_01-20-11-2026-cach02.mp4` | Quản Trị Sản Phẩm & Biến Thể | `cach02`: Tạo Sản Phẩm Mới Với Đa Biến Thể Tự Động Tính Tồn Kho | 8s | **PASS** |
| `admin_categories-01-cach01-20-11-2026` | `admin_categories_01-20-11-2026-cach01.mp4` | Quản Lý Danh Mục & Hình Ảnh | `cach01`: Xem Danh Sách Danh Mục & Kiểm Tra Hình Ảnh Bắt Buộc | 6s | **PASS** |
| `admin_orders-01-cach01-20-11-2026` | `admin_orders_01-20-11-2026-cach01.mp4` | Quản Lý Đơn Hàng & Xuất Báo Cáo | `cach01`: Lọc Đơn Hàng Theo Trạng Thái & Xuất Excel Đa Phạm Vi | 6s | **PASS** |
| `admin_chats-01-cach01-20-11-2026` | `admin_chats_01-20-11-2026-cach01.mp4` | Hội Thoại Khách Hàng (Full-Viewport) | `cach01`: Cuộn Độc Lập Danh Sách Hội Thoại & Khung Tin Nhắn | 9s | **PASS** |
| `admin_page_builder-01-cach01-20-11-2026` | `admin_page_builder_01-20-11-2026-cach01.mp4` | Visual Page Builder & Quản Lý Nội Dung | `cach01`: Áp Dụng Mẫu Trang Lookbook Runway & Biên Tập Trực Quan | 10s | **PASS** |
| `admin_page_builder-01-cach02-20-11-2026` | `admin_page_builder_01-20-11-2026-cach02.mp4` | Visual Page Builder & Quản Lý Nội Dung | `cach02`: Kiểm Tra Tương Phản WCAG & Chuyển Đổi Khung Hình Thiết Bị | 7s | **PASS** |
| `admin_campaigns-01-cach01-20-11-2026` | `admin_campaigns_01-20-11-2026-cach01.mp4` | Chiến Dịch Khuyến Mãi & Popup Banners | `cach01`: Xem Danh Sách Chiến Dịch & Kiểm Tra Smart CTA Redirect | 6s | **PASS** |
| `admin_policies_tracking-01-cach01-20-11-2026` | `admin_policies_tracking_01-20-11-2026-cach01.mp4` | Chính Sách Pháp Lý & Phân Tích Hành Vi | `cach01`: Kiểm Tra Nhật Ký Sự Kiện & Báo Cáo Đồng Thuận Quyền Riêng Tư | 7s | **PASS** |

---

## 4. Video Storage Hygiene & Security

- Thư mục lưu trữ: `videos/UI/` và `videos/function/`.
- Toàn bộ tệp video MP4 được Git ignore qua root `.gitignore` và `.dockerignore`.
- Không có video nhị phân nào bị đưa vào Git commit history.
