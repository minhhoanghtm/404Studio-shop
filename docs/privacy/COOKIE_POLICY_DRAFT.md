# DỰ THẢO CHÍNH SÁCH COOKIE VÀ CÔNG NGHỆ THEO DÕI (COOKIE POLICY DRAFT)

**Phiên bản**: `2026-11-07`  
**Ngày cập nhật gần nhất**: 16/11/2026  
**Căn cứ pháp lý áp dụng**: Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 & Nghị định 356/2025/NĐ-CP  
**Phân loại tài liệu**: TRANG ĐỘC LẬP (Không gộp vào Chính sách Bảo mật)

---

## 1. GIỚI THIỆU VỀ COOKIE & NGUYÊN TẮC "ĐỒNG THUẬN TRƯỚC" (PRIOR CONSENT)

1. Cookie là các tệp văn bản nhỏ hoặc mã định danh kỹ thuật số được lưu trữ trong trình duyệt web của Quý khách khi truy cập website **ATELIER VÉRITÉ**.
2. **Cam kết Tuân thủ Bắt buộc**:
   - Website áp dụng cơ chế **Chặn trước (Prior Consent Blocking)**.
   - Khi Quý khách truy cập lần đầu, **chỉ có Cookie Thiết yếu được phép hoạt động**.
   - Tất cả các Cookie Phân tích (Analytics), Cookie Cá nhân hóa (Personalization) và Cookie Tiếp thị Quảng cáo (Marketing/Advertising) **đều bị vô hiệu hóa hoàn toàn** cho tới khi Quý khách bấm *"Chấp nhận tất cả"* hoặc tùy chỉnh cho phép từng nhóm cụ thể.
   - Chúng tôi không coi việc Quý khách tiếp tục cuộn chuột, đóng thông báo hoặc tiếp tục duyệt web là sự đồng thuận.

---

## 2. PHÂN LOẠI CÁC NHÓM COOKIE

Chúng tôi phân loại công nghệ theo dõi thành 4 nhóm rõ ràng:

1. **Cookie Thiết yếu (Strictly Necessary)**: Bắt buộc để website vận hành kỹ thuật, bảo vệ phiên đăng nhập bảo mật (JWT), duy trì giỏ hàng mua sắm và lưu giữ trạng thái lựa chọn quyền riêng tư của Quý khách. Nhóm này không thể tắt.
2. **Cookie Phân tích & Đo lường (Analytics & Performance)**: Giúp Chúng tôi đo lường số lượt truy cập ẩn danh, thời gian phản hồi của máy chủ, phát hiện lỗi đồ họa WebGL ThreeUI và nâng cao hiệu năng tải trang. Chỉ kích hoạt khi Quý khách đồng thuận.
3. **Cookie Cá nhân hóa (Personalization & Preferences)**: Ghi nhớ các tùy chọn thẩm mỹ như chế độ giao diện Sáng/Tối (Light/Dark mode), lịch sử tra cứu kích cỡ may đo và lưu trữ danh sách yêu thích. Chỉ kích hoạt khi Quý khách đồng thuận.
4. **Cookie Tiếp thị & Quảng cáo (Marketing & Advertising)**: Được sử dụng để hiển thị các bộ sưu tập giới hạn phù hợp với sở thích thời trang của Quý khách trên các nền tảng mạng xã hội hoặc đối tác tiếp thị. Chỉ kích hoạt khi Quý khách đồng thuận.

---

## 3. BẢNG KIỂM KÊ CHI TIẾT CÁC COOKIE THỰC TẾ TRÊN HỆ THỐNG

| Tên Cookie / Định danh | Đơn vị cung cấp | Mục đích kỹ thuật | Nhóm Cookie | Thời hạn lưu trữ | Bên thứ nhất / Bên thứ ba | Cách thu hồi & Từ chối |
|---|---|---|---|---|---|---|
| `atelier_patron_auth` | Atelier Vérité | Lưu trữ trạng thái phiên đăng nhập bảo mật của khách hàng và token xác thực JWT | **Thiết yếu** | Phiên duyệt web / 7 ngày | Bên thứ nhất (1st Party) | Xóa qua nút Đăng xuất |
| `atelier_bag_cart` | Atelier Vérité | Lưu giữ danh mục tác phẩm trong túi mua sắm của khách hàng | **Thiết yếu** | 30 ngày | Bên thứ nhất (1st Party) | Xóa bằng nút dọn sạch giỏ |
| `atelier_privacy_consent` | Atelier Vérité | Lưu trữ trạng thái lựa chọn đồng thuận cookie, danh mục cho phép và phiên bản chính sách | **Thiết yếu** | 12 tháng | Bên thứ nhất (1st Party) | Tùy chỉnh tại Cookie Settings |
| `atelier_theme_mode` | Atelier Vérité | Ghi nhớ tùy chọn giao diện Đen Noir (`dark`) hoặc Trắng Ngà (`light`) | **Cá nhân hóa** | Vĩnh viễn / Đến khi xóa | Bên thứ nhất (1st Party) | Tắt qua Cookie Settings |
| `atelier_wishlist` | Atelier Vérité | Lưu danh mục sản phẩm yêu thích của khách hàng | **Cá nhân hóa** | 90 ngày | Bên thứ nhất (1st Party) | Tắt qua Cookie Settings |
| `_ga`, `_ga_*` | Google Analytics | Thu thập số liệu thống kê ẩn danh về lưu lượng truy cập và hành vi duyệt trang | **Phân tích** | 2 năm | Bên thứ ba (3rd Party - Google LLC) | Tắt qua Cookie Settings |
| `_fbp` | Meta Platforms | Đo lường hiệu quả các chiến dịch tiếp thị bộ sưu tập thời trang trên Instagram/Facebook | **Tiếp thị** | 90 ngày | Bên thứ ba (3rd Party - Meta Inc.) | Tắt qua Cookie Settings |
| `_ttp` | TikTok Pte. Ltd. | Đo lường chuyển đổi từ các video sàn diễn thời trang trên nền tảng TikTok | **Tiếp thị** | 13 tháng | Bên thứ ba (3rd Party - TikTok) | Tắt qua Cookie Settings |

> [!NOTE]
> Các thẻ theo dõi của bên thứ ba (Google, Meta, TikTok) **chỉ được tải động vào trình duyệt sau khi Quý khách cấp quyền tương ứng**. Nếu Quý khách từ chối, tệp script của bên thứ ba hoàn toàn không được tải về máy của Quý khách.

---

## 4. CÁCH THỨC QUẢN LÝ VÀ THU HỒI SỰ ĐỒNG THUẬN

Quý khách có toàn quyền thay đổi hoặc rút lại sự đồng thuận bất kỳ lúc nào thông qua 3 cách đơn giản:

1. **Bảng điều khiển Tùy chọn Cookie trực tuyến**: Bấm vào liên kết **"Cài đặt Cookie" (Cookie Settings)** nằm ở chân trang (Footer) của mọi trang web hoặc trong [Trung tâm quyền riêng tư](/data-privacy).
2. **Cài đặt trình duyệt web**: Quý khách có thể tự chặn hoặc xóa cookie bằng cách truy cập cài đặt của trình duyệt:
   - Google Chrome: `chrome://settings/cookies`
   - Apple Safari: Preferences > Privacy > Block all cookies
   - Mozilla Firefox: Options > Privacy & Security > Cookies and Site Data
   - Microsoft Edge: `edge://settings/content/cookies`
3. **Hiệu lực của việc thu hồi**: Khi Quý khách tắt một nhóm cookie, hệ thống sẽ ngừng ngay lập tức việc kích hoạt hoặc gửi sự kiện tới công cụ đó, đồng thời xóa các cookie liên quan trong phạm vi quyền hạn kỹ thuật của trình duyệt.
