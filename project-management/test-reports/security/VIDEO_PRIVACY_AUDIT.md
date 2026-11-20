# KIỂM TOÁN AN TOÀN BẢO MẬT & DỮ LIỆU NHẠY CẢM TRONG VIDEO RECORDINGS

- **Report ID**: `TR-VIDEO-PRIVACY-AUDIT`
- **Ngày Kiểm Toán**: 20/11/2026
- **Tiêu Chuẩn**: Vietnam Law 91/2025/QH15, Decree 356/2025/NĐ-CP, OWASP Top 10
- **Kết Quả**: **0 LỖ HỔNG / 0 RÒ RỈ DỮ LIỆU NHẠY CẢM** (PASSED)

---

## 1. Mục Tiêu & Nguyên Tắc Bảo Mật Video
1. **Tuyệt đối không hiển thị mật khẩu rõ (Cleartext Passwords)**: Các ô mật khẩu sử dụng type=`password` hoặc giá trị đã được che.
2. **Không rò rỉ mã OTP thực tế**: Sử dụng test OTP hoặc che giấu mã OTP trong giao diện.
3. **Không ghi JWT Access Token / Refresh Token vào video**: Token được lưu trong bộ nhớ hoặc localStorage được bảo vệ, không in ra màn hình hoặc console log.
4. **Không sử dụng thông tin thanh toán thật**: Sử dụng phương thức COD hoặc môi trường MoMo sandbox.
5. **Không sử dụng thông tin khách hàng thật**: Dữ liệu kiểm thử sử dụng tài khoản mẫu sandbox (`charlotte.vane@atelierverite.com`, `director@atelierverite.com`).
6. **Không đẩy video lên Git**: Thư mục `/videos/` được cấu hình trong `.gitignore` và `.dockerignore`.

## 2. Bảng Kiểm Toán Chi Tiết

| Hạng Mục Kiểm Toán | Tiêu Chí Kiểm Tra | Kết Quả Thực Tế | Đánh Giá |
|---|---|---|:---:|
| **Mật khẩu & Credentials** | Không xuất hiện mật khẩu dạng plain text trên video frame | Đã che hoặc sử dụng trường password | **PASS** |
| **Mã OTP** | Không lộ mã OTP gửi qua SMS thực tế | Không hiển thị OTP thật | **PASS** |
| **Token & Session** | Không in JWT token, API key lên màn hình UI | Không hiển thị token | **PASS** |
| **Dữ liệu PII Khách hàng** | Không dùng email, SĐT, địa chỉ của người dùng thật | Dùng tài khoản demo cách ly | **PASS** |
| **Giao dịch tài chính** | Không tạo giao dịch ngân hàng / thẻ tín dụng thật | Sử dụng COD và sandbox test | **PASS** |
| **Git Exclusions** | Xác minh `/videos/` không bị commit vào git index | Đã xác minh qua `git check-ignore` | **PASS** |
