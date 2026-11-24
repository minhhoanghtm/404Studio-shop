# TODO — Làm mới website Atelier Vérité

## [ ] Hệ thống thị giác, typography và chuyển động toàn website
- “Hãy thiết kế lại toàn bộ website hiện tại, thay thế hoàn toàn giao diện cũ bằng một thiết kế hiện đại, ấn tượng và có cá tính riêng. Giữ nguyên mục tiêu, nội dung quan trọng và các chức năng đang có; tập trung nâng cấp hệ thống nhận diện, bố cục, màu sắc, typography, hình ảnh và trải nghiệm tương tác.”
- Áp dụng hướng editorial couture đã duyệt: nền giấy ngà, chữ than, màu mận/đỏ rượu là màu nhận diện, vàng đồng trầm chỉ làm điểm nhấn; giữ chế độ tối và các lựa chọn theme đã lưu.
- Typography tiêu đề Cormorant Garamond/Italiana, nội dung và điều khiển Plus Jakarta Sans; bảo đảm tiếng Việt dễ đọc, phân cấp rõ, khoảng trắng hợp lý và không làm nội dung dài khó đọc.
- Thêm chuyển động đẹp mắt, mượt mà, có chủ đích cho nội dung khi xuất hiện/cuộn, ảnh, menu, nút và thẻ; hiệu ứng tự nhiên, phản hồi nhanh, không làm chậm tải, nhấp nháy, gây chóng mặt hoặc cản trở việc đọc.
- Ưu tiên opacity/transform, dùng Motion và ThreeUI hiện có; tôn trọng `prefers-reduced-motion` bằng cách giảm/tắt hiệu ứng khi được yêu cầu.
- Dùng lại hình ảnh/asset phù hợp đã có; không dùng placeholder, không lặp ảnh để lấp nội dung, không bịa số liệu, khách hàng, đánh giá hoặc tính năng.

## [ ] Storefront và các luồng mua sắm
- Làm mới trang chủ, danh mục/tìm kiếm, sản phẩm/chi tiết sản phẩm, bộ sưu tập, lookbook, journal, giới thiệu, liên hệ, hỗ trợ và các trang chính sách theo cùng ngôn ngữ thiết kế; bố cục cần giàu nhịp điệu editorial, không lặp một lưới thẻ ở mọi khu vực.
- Làm mới header, mega-menu/menu mobile, footer, product card, modal/drawer, nút và các phần giao diện dùng chung; điều hướng, CTA, trạng thái hover/focus/active phải rõ.
- Giữ nguyên URL, văn bản/nội dung quan trọng, ảnh và dữ liệu sản phẩm, lọc/tìm kiếm, wishlist, giỏ hàng, mã giảm giá, thanh toán, tài khoản, biểu mẫu, link, API và các luồng nghiệp vụ đang hoạt động; chỉ thay đổi trình bày/tương tác thị giác.
- Bảo đảm trang sản phẩm, cart và checkout ưu tiên khả năng đọc, lựa chọn biến thể, giá VND, CTA và tiến trình thao tác; không làm thay đổi dữ liệu hoặc API.

## [ ] Tài khoản, hỗ trợ và quản trị
- Áp dụng hệ thống thiết kế đồng bộ cho đăng nhập/đăng ký, tài khoản/đơn hàng, biểu mẫu hỗ trợ/chính sách và các trang admin hiện có.
- Ưu tiên dễ đọc và rõ trạng thái trong checkout, biểu mẫu tài khoản và dashboard/admin; trang quản trị dùng trang trí tiết chế hơn storefront.
- Giữ nguyên quyền truy cập, bảo mật, trạng thái form, API, dữ liệu, chức năng admin và hành vi hiện hữu; không thay đổi backend.

## [ ] Responsive, khả năng truy cập và khai báo route
- Website hoạt động tốt trên desktop, tablet và điện thoại; menu, văn bản, hình ảnh và CTA thích ứng với màn hình nhỏ, không tràn ngang hoặc tạo vùng chạm khó dùng.
- Duy trì tương phản tốt, cỡ chữ dễ đọc, điều hướng bàn phím, trạng thái focus dễ nhận biết, cấu trúc tiêu đề hợp lý và mô tả ảnh có ý nghĩa.
- Tạo `frontend/public/manus-routes.json` từ những trang/route thật trong `frontend/src/App.tsx`, gồm route động; không khai báo API, asset, system endpoint, route 404-only hoặc ID không có thật.
- Không thay đổi user Git, remote, branch; bảo toàn các thay đổi/tệp có sẵn trong repository, không đọc hoặc đưa `.env` vào commit; không xuất bản website công khai trong nhiệm vụ này.
