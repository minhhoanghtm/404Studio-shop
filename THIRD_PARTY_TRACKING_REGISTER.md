# SỔ ĐĂNG KÝ CÔNG NGHỆ THEO DÕI & ĐƠN VỊ THỨ BA (THIRD-PARTY TRACKING REGISTER)

**Dự án**: Nền tảng Thương mại Điện tử Thời trang Cao cấp ATELIER VÉRITÉ  
**Phiên bản tài liệu**: 1.0.0 — Bản kiểm toán chính thức  
**Ngày lập**: 16/11/2026  
**Quy chuẩn áp dụng**: Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 & Nghị định 356/2025/NĐ-CP  

---

## 1. NGUYÊN TẮC QUẢN TRỊ BÊN THỨ BA

1. **Phân biệt Pháp lý Rõ ràng**:
   - **Bên Xử lý Dữ liệu theo Hợp đồng (Data Processors)**: Các đơn vị xử lý dữ liệu hoàn toàn dưới sự chỉ đạo của Atelier Vérité và chỉ phục vụ mục đích thực hiện hợp đồng (như Giao Hàng Nhanh xử lý địa chỉ giao hàng, MoMo/VNPAY xử lý thanh toán, Cloudinary lưu trữ ảnh sản phẩm).
   - **Bên thứ ba Độc lập / Đo lường Tùy chọn (Third-Party Trackers)**: Các nhà cung cấp dịch vụ phân tích, tiếp thị, quảng cáo ngoài mạng lưới (Google, Meta, TikTok). Nhóm này **bắt buộc phải có sự đồng thuận cụ thể trước khi kích hoạt**.
2. **Nguyên tắc "Zero-Leakage Prior Consent"**:
   - Không một byte dữ liệu nào được truyền tới các bên thứ ba đo lường tùy chọn khi người dùng chưa đồng thuận rõ ràng qua Consent Manager.

---

## 2. BẢNG KIỂM KÊ CÔNG NGHỆ THEO DÕI VÀ DỊCH VỤ BÊN THỨ BA

| Đơn vị cung cấp (Provider) | Dữ liệu thu thập (Data Collected) | Mục đích (Purpose) | Căn cứ pháp lý (Legal Basis) | Nhóm đồng thuận (Consent Category) | Thời hạn lưu trữ (Retention) | Chuyển dữ liệu quốc tế (Transfer) | Cách thức từ chối / Hủy (Opt-out) |
|---|---|---|---|---|---|---|---|
| **Atelier Vérité Core Engine** *(First Party)* | Trạng thái đăng nhập (JWT token), mã giỏ hàng, tùy chọn theme, lịch sử đơn hàng. | Vận hành giỏ hàng, xác thực khách hàng, bảo đảm an ninh mạng. | Hợp đồng & Lợi ích hợp pháp (Khoản 1 Điều 17 Luật 91/2025) | **Strictly Necessary (Bắt buộc)** | Phiên duyệt web / 30 ngày / 5 năm đối với đơn hàng | Lưu trữ máy chủ tại Việt Nam | Không áp dụng cho thành phần thiết yếu |
| **Công ty CP Giao Hàng Nhanh (GHN)** | Họ tên, số điện thoại, địa chỉ nhận hàng, mã đơn hàng. | Thực hiện giao kiện hàng gỗ tuyết tùng tận tay khách hàng. | Thực hiện nghĩa vụ hợp đồng mua bán | **Strictly Necessary (Hợp đồng)** | Theo thời gian hoàn tất đơn hàng và quy định bưu chính | Xử lý nội địa tại Việt Nam | Hủy đơn hàng trước khi vận chuyển |
| **Công ty CP Dịch vụ Di động Trực tuyến (MoMo)** | Mã đơn hàng, số tiền thanh toán VND, mã khách hàng ví MoMo. | Xử lý thanh toán không tiền mặt và đối soát tài chính tức thời. | Thực hiện nghĩa vụ hợp đồng mua bán | **Strictly Necessary (Thanh toán)** | 5 năm theo Luật Kế toán & phòng chống rửa tiền | Xử lý nội địa tại Việt Nam | Chọn phương thức thanh toán khác (COD / Chuyển khoản) |
| **Công ty CP Giải pháp Thanh toán Việt Nam (VNPAY)** | Mã đơn hàng, số tiền thanh toán VND, cổng ngân hàng đối soát. | Cổng thanh toán quét mã VNPAY-QR và thẻ ATM nội địa. | Thực hiện nghĩa vụ hợp đồng mua bán | **Strictly Necessary (Thanh toán)** | 5 năm theo Luật Kế toán & phòng chống rửa tiền | Xử lý nội địa tại Việt Nam | Chọn phương thức thanh toán khác (COD / Chuyển khoản) |
| **Google LLC (Google Analytics 4 - GA4)** | Địa chỉ IP (đã ẩn danh hóa / IP Anonymized), thông số thiết bị, đường dẫn trang xem, thời gian trên trang. | Đo lường hiệu năng kỹ thuật, phát hiện lỗi shader WebGL và tối ưu giao diện. | **Sự đồng thuận của chủ thể dữ liệu** (Điều 11 Luật 91/2025) | **Analytics (Tùy chọn)** | 14 tháng (theo chính sách GA4 chuẩn) | Có thể lưu trữ trên hạ tầng đám mây Google toàn cầu | Tắt mục "Cookie Phân tích" trong Cookie Settings hoặc dùng Google Opt-out Add-on |
| **Meta Platforms, Inc. (Meta Pixel)** | Mã định danh trình duyệt (`_fbp`), sự kiện thêm vào giỏ hàng, mã danh mục sản phẩm thời trang. | Đo lường hiệu quả quảng cáo bộ sưu tập trên Facebook / Instagram. | **Sự đồng thuận của chủ thể dữ liệu** (Điều 11 Luật 91/2025) | **Marketing (Tùy chọn)** | 90 ngày | Hạ tầng Meta toàn cầu | Tắt mục "Cookie Tiếp thị" trong Cookie Settings |
| **TikTok Pte. Ltd. (TikTok Pixel)** | Mã định danh thiết bị (`_ttp`), lượt xem trang bộ sưu tập video sàn diễn. | Đo lường chuyển đổi từ các video ngắn sàn diễn thời trang. | **Sự đồng thuận của chủ thể dữ liệu** (Điều 11 Luật 91/2025) | **Marketing (Tùy chọn)** | 13 tháng | Hạ tầng TikTok toàn cầu | Tắt mục "Cookie Tiếp thị" trong Cookie Settings |
| **OpenRouter / AI Inference Service** | Thuộc tính kiểu dáng thời trang, mô tả phom dáng, câu hỏi của khách hàng. *(Lưu ý: Không gửi thông tin cá nhân)*. | Vận hành Trợ lý Stylist AI gợi ý trang phục thời trang theo yêu cầu. | Sự đồng thuận của khách hàng khi mở modal trợ lý AI | **Personalization (Tùy chọn)** | Không lưu trữ dữ liệu huấn luyện (Zero-Data Retention API) | Xử lý máy chủ đám mây suy luận AI quốc tế | Đóng cửa sổ Stylist AI hoặc tắt nhóm Cá nhân hóa |

---

## 3. CƠ CHẾ CÔ LẬP VÀ PHONG TỎA (TECHNICAL ENFORCEMENT)

1. **Trước khi có sự đồng thuận**:
   - Biến toàn cục `window.dataLayer`, `window.gtag`, `window.fbq`, `window.ttq` không tồn tại hoặc ở trạng thái cô lập (Sandbox Stubs).
   - Thẻ `<script>` của các nhà cung cấp bên thứ ba không được gắn vào DOM.
   - Trình duyệt không gửi bất kỳ HTTP request nào tới các domain: `*.google-analytics.com`, `connect.facebook.net`, `analytics.tiktok.com`.
2. **Khi thu hồi đồng thuận**:
   - Consent Manager tiến hành dọn dẹp các cookie bên thứ nhất tương ứng (`_ga`, `_gid`, `_fbp`, `_ttp`).
   - Hủy bỏ các Event Listener và ngắt kết nối các lệnh gọi mạng trong phiên hiện tại.
