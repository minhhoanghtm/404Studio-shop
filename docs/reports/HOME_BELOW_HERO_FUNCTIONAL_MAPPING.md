# MA TRẬN ĐỐI CHIẾU CHỨC NĂNG HỆ THỐNG VÀ CÁC SECTION TRANG CHỦ BÊN DƯỚI HERO
## (HOME BELOW-HERO FUNCTIONAL-TO-SECTION MAPPING MATRIX)

**Dự án:** 404Studio — Atelier Vérité E-Commerce Platform  
**Vị trí:** `D:\Project\404Studio`  
**Ngày thực hiện:** 24/11/2026  
**Trạng thái Audit:** Hoàn tất kiểm tra Runtime, Database & Frontend APIs  

---

## 1. TỔNG QUAN AUDIT HỆ THỐNG HIỆN CÓ

Hệ thống `404Studio` đã triển khai một hệ sinh thái Backend và Frontend phong phú. Dưới đây là phân loại trạng thái kiểm chứng theo đúng chuẩn mực của Master Prompt:

| Nhóm chức năng | Chức năng cụ thể | Trạng thái kỹ thuật | Bằng chứng kiểm chứng |
|---|---|---|---|
| **Catalog & Products** | Product Listing & Filtering | `IMPLEMENTED_AND_VERIFIED` | `productsApi.getProducts`, `/api/products` trả về 200, hỗ trợ sort `newest`, `price`, `rating`. |
| | Product Variants & Sizes | `IMPLEMENTED_AND_VERIFIED` | Schema `ProductVariant` chứa `colorName`, `colorHex`, mảng `sizes` kèm cờ `inStock`. |
| | Quick View & Modal Details | `IMPLEMENTED_AND_VERIFIED` | Component `ProductQuickViewModal` / `ProductDetail` kết nối trực tiếp `useCartStore`. |
| | Categories & Subcategories | `IMPLEMENTED_AND_VERIFIED` | API `/api/categories`, danh mục: `couture`, `women`, `men`, `accessories`. |
| | Collections & Lookbooks | `IMPLEMENTED_AND_VERIFIED` | `lookbooksApi.getLookbooks`, route `/lookbooks`, `LOOKBOOK_DATA` trong editorialData. |
| **Personalization & Tracking** | Behavior Tracking | `IMPLEMENTED_AND_VERIFIED` | `useBehaviorTracking.ts`, lưu `recentViewedIds`, `recentCategories`, `recentSearches`. |
| | Hybrid Recommendation Engine | `IMPLEMENTED_AND_VERIFIED` | `useHomeRecommendations.ts` kết hợp điểm số hành vi (35% recent, 25% frequent, 20% pop). |
| | Cookie Consent Protection | `IMPLEMENTED_AND_VERIFIED` | `useConsentStore.ts`, kiểm tra cờ `personalization` trước khi truy xuất tín hiệu hành vi. |
| | Recently Viewed Items | `IMPLEMENTED_AND_VERIFIED` | Lưu trữ trong localStorage qua `signals.recentViewedIds`. Tự ẩn nếu chưa có dữ liệu. |
| **Marketing & Campaigns** | Active Banners | `IMPLEMENTED_AND_VERIFIED` | `bannersApi.getActiveBanners` truy xuất banner đang chạy từ MongoDB. |
| | Campaign Management & Popups | `IMPLEMENTED_AND_VERIFIED` | `campaignsApi.getActiveCampaigns`, component `PromotionalPopup.tsx`. |
| | AI Poster & Banner Studio | `IMPLEMENTED_AND_VERIFIED` | `AdminDesignProject` và thư mục asset tĩnh `uploads/designs/`. |
| | Vouchers & Promotions | `IMPLEMENTED_AND_VERIFIED` | `vouchersApi.getVouchers`, hệ thống mã ưu đãi đặc quyền (FLASH50, FREESHIP0D). |
| **Trí Tuệ Nhân Tạo (AI)** | Stylist AI Concierge | `IMPLEMENTED_AND_VERIFIED` | Endpoint `/api/ai/chat`, modal `AiAssistantModal.tsx`, gợi ý phối đồ và thêm vào giỏ. |
| | Multi-Provider AI Gateway | `IMPLEMENTED_AND_VERIFIED` | Hỗ trợ OpenAI (`gpt-4o`, `gpt-image-1-mini`), Gemini, Claude, DeepSeek, FLUX. |
| | Natural Language Prompts | `IMPLEMENTED_AND_VERIFIED` | Nhận diện prompt ngôn ngữ tự nhiên tiếng Việt cho tìm kiếm sản phẩm và phong cách. |
| **Customer Experience** | Giỏ hàng & Thêm nhanh | `IMPLEMENTED_AND_VERIFIED` | `useCartStore.addItem`, drawer giỏ hàng mở mượt mà kèm cập nhật số lượng badge. |
| | Đánh giá khách hàng | `IMPLEMENTED_AND_VERIFIED` | `reviewsApi.getProductReviews`, `ReviewCard.tsx` hiển thị số sao và nhận xét thực tế. |
| | Tạp chí thời trang (Journal) | `IMPLEMENTED_AND_VERIFIED` | Route `/journal`, danh mục `JOURNAL_ARTICLES` với 5 bài viết khảo luận chất lượng cao. |
| | Chính sách mua sắm & Pháp lý | `IMPLEMENTED_AND_VERIFIED` | Tuân thủ Luật 91/2025/QH15 & NĐ 13/2023/NĐ-CP, route `/privacy-policy`, `/shipping`. |

---

## 2. MA TRẬN ĐỐI CHIẾU SECTION VỚI CHỨC NĂNG HỆ THỐNG (FUNCTIONAL-TO-SECTION MAPPING)

| STT | Section | Mục tiêu trải nghiệm (Business Objective) | Chức năng & API tích hợp | Nguồn dữ liệu (Data Source) | Logic tái sử dụng & Cải tiến | Tác động hiệu năng & Bảo mật | Ưu tiên |
|:---:|---|---|---|---|---|---|:---:|
| **01** | **Brand Manifesto** | Định vị thương hiệu Quiet Luxury, tôn chỉ may đo kiến trúc, kết nối nhịp thị giác từ Hero xuống | Typography Editorial, Asymmetric layout | Tôn chỉ thương hiệu Atelier Vérité (Paris - Milan - Tokyo) | Thiết kế mới tinh tế, chữ lớn serif sang trọng, tương phản cao trong Light/Dark | Zero API call, thuần CSS/DOM, không layout shift | P0 |
| **02** | **Explore Collections** | Điều hướng khách hàng đến các danh mục cốt lõi (Nữ, Nam, Phụ kiện da, Couture) | `categoriesApi.getCategories` hoặc định tuyến danh mục chuẩn | Catalog Category Schema | Lưới bất đối xứng (Editorial Asymmetric Grid), hình ảnh tỷ lệ vàng, hover zoom mượt | Ảnh WebP/CDN lazy-loaded, Link chuẩn `/products?category=...` | P0 |
| **03** | **Curated for You** | Cá nhân hóa sản phẩm dựa trên lịch sử tìm kiếm, danh mục và sản phẩm đã xem của khách | `useHomeRecommendations`, `useBehaviorTracking` | `recommendationsApi.getPersonalizedRecommendations` + Fallback pool | Tab chuyển đổi (Dành riêng cho bạn, Đang thịnh hành, Hàng mới về, Bán chạy). Tự động tôn trọng Cookie Consent | Cache in-memory 3 phút, kiểm tra consent trước khi đọc signals | P0 |
| **04** | **Interactive Lookbook & Outfit Hotspots** | Trải nghiệm khám phá outfit người mẫu Runway, xem chi tiết từng món đồ trên người mẫu | Hotspot click, Quick View trigger, `useCartStore` | `LOOKBOOK_DATA` & `productsApi` | Hotspot chấm tròn tương tác trên ảnh người mẫu; bấm vào bung popover xem sản phẩm thực và thêm nhanh vào giỏ | Lazy load ảnh lookbook, không chặn luồng cuộn | P0 |
| **05** | **New Arrivals (The Edit)** | Trình bày sản phẩm mới nhất mùa SS26 theo phong cách tạp chí thời trang | `productsApi.getProducts({ sort: 'newest', limit: 8 })` | Real MongoDB Database Catalog | Layout bất đối xứng: 1 Featured Product kích thước lớn bên trái + 4 Sản phẩm thẻ trượt bên phải kèm chọn variant | Phân trang/limit nhẹ (6-8 items), eager load ảnh đầu tiên | P0 |
| **06** | **Trending & Bestsellers** | Tôn vinh các phom dáng kinh điển được mua nhiều nhất và săn đón trên Runway | `useHomeRecommendations('trending' / 'best-sellers')` | Real Sales / Popularity signals | Hiển thị tag xu hướng (Runway Edition, Bestseller), thông số chất liệu và giá VND định dạng chuẩn | Tái sử dụng `ProductCard` nhất quán, tránh trùng lặp lưới | P1 |
| **07** | **Campaign Stories** | Hiển thị chiến dịch marketing đang kích hoạt hoặc poster AI đã được Admin duyệt | `campaignsApi.getActiveCampaigns`, `bannersApi` | MongoDB `Campaign` & `AdminDesignProject` | Khung hình Cinematic Banner rộng 100%, đếm ngược giờ Flash Sale, nút CTA nhận voucher ưu đãi | Chỉ hiển thị chiến dịch `status: active`, không gọi AI runtime | P0 |
| **08** | **Interactive Stylist AI Experience** | Giới thiệu trợ lý thời trang AI độc quyền, mời gọi trải nghiệm tìm kiếm tự nhiên | `AiAssistantModal`, `useAiChatStore`, `/api/ai/chat` | AI Shopping Assistant Service | Feature Tabs (Phối đồ thông minh, Tìm kiếm ngữ nghĩa, Cá nhân hóa) + 5 Prompt Pills bấm là mở chatbox và điền sẵn câu lệnh! | Không tạo chatbot trùng lặp; kích hoạt Modal hiện có | P0 |
| **09** | **The Art of Details / Craftsmanship** | Khẳng định chất lượng thủ công, cấu trúc nếp gấp, nguồn gốc vải và hướng dẫn chọn size | Modal bảng size, thông tin chất liệu (Virgin wool, Charmeuse Silk) | Spec chất liệu Atelier Vérité | Split layout: Cận cảnh macro thớ vải dệt + Diễn giải phom dáng kiến trúc + Nút tra cứu bảng size may đo | Tối ưu ảnh zoom cận cảnh, typography thanh lịch | P1 |
| **10** | **Fashion Journal** | Tạp chí chuyên khảo thời trang, kiến thức bảo quản và phong cách sống thượng lưu | `JOURNAL_ARTICLES`, route `/journal/:slug` | Editorial CMS Articles | 3 bài viết tiêu biểu phong cách bìa tạp chí, hiển thị thời gian đọc, ngày tháng và chuyên mục | Không tạo CMS cồng kềnh, liên kết thẳng trang chi tiết bài viết | P1 |
| **11** | **Recently Viewed** | Nhắc nhớ khách hàng về các sản phẩm đã xem trước đó để tăng tỷ lệ chốt đơn | `getLocalBehaviorSignals().recentViewedIds` | `localStorage` + `productsApi` | Hàng ngang trượt mượt mà. **Nếu khách hàng chưa xem sản phẩm nào, section tự động ẩn hoàn toàn để không để lại khoảng trống** | 0 request nếu mảng ID rỗng, bảo vệ hoàn toàn quyền riêng tư | P1 |
| **12** | **Community & Reviews** | Xây dựng niềm tin thương hiệu qua đánh giá thực tế của các Patron đã mua sắm | `reviewsApi.getProductReviews` | MongoDB Reviews Collection | Trích dẫn nhận xét tinh tế (Quote marks), xếp hạng sao vàng champagne, tên khách hàng và sản phẩm đã mua | Hiển thị review có thật, bảo đảm tính xác thực | P1 |
| **13** | **Shopping Benefits & Concierge** | Cam kết dịch vụ hậu mãi cao cấp: Vận chuyển găng tay trắng, đổi trả 7 ngày, bảo mật | Chính sách mua hàng hệ thống | `publicPoliciesApi` & Shipping standards | 4 cột biểu tượng tối giản kèm diễn giải chi tiết, liên kết đến `/returns-refunds`, `/support` | Thuần icon + text nhẹ, tăng độ uy tín thanh toán | P0 |
| **14** | **Final Editorial CTA** | Điểm chốt hạ hành trình cuộn trang, thúc đẩy hành động đăng ký thành viên hoặc khám phá | Route `/collections`, `/register` | Tôn chỉ thương hiệu | Khung ảnh toàn cảnh người mẫu Runway, tiêu đề ấn tượng, nút kêu gọi gia nhập cộng đồng Patron | Chuyển tiếp mượt mà trước khi vào Footer | P0 |
| **15** | **Signature Footer** | Chân trang biểu tượng Atelier Vérité, liên kết pháp lý đầy đủ, đăng ký newsletter | `Newsletter`, links pháp lý, chính sách Cookie | Global Footer Components | Chữ chìm watermark `ATELIER VÉRITÉ` lớn phía sau, form nhận bản tin thời trang độc quyền, icon thanh toán quốc tế | Đồng bộ hoàn hảo Theme Light/Dark, chuẩn Luật 91/2025/QH15 | P0 |

---

## 3. DANH SÁCH THÀNH PHẦN ĐƯỢC BẢO VỆ TUYỆT ĐỐI (PROTECTED COMPONENTS)

Theo quy định nghiêm ngặt của Phần I — Điều 2 Master Prompt, các thành phần sau **ĐÃ ĐƯỢC CHỤP ẢNH BASELINE VÀ KHÔNG ĐƯỢC THAY ĐỔI**:

1. **Announcement Bar**: Dòng thông báo chạy trên cùng với cam kết vận chuyển và đổi trả.
2. **Header & Brand Navigation**:
   - Logo `ATELIER VÉRITÉ` & Subtitle `PARIS · MILAN · TOKYO`.
   - Menu điều hướng chính: *BỘ SƯU TẬP, DANH MỤC, LOOKBOOKS, TẠP CHÍ, VỀ CHÚNG TÔI*.
   - Nhóm icon công cụ: *Tìm kiếm (Search), Yêu thích (Wishlist), Giỏ hàng (Cart), Tài khoản (Account)*.
   - Nút chuyển đổi giao diện *Theme Switcher (Light / Dark Mode)*.
3. **Hero Section Toàn Phần**:
   - Slider tự động 3 slides với ảnh người mẫu Runway cao cấp.
   - Thanh tiến trình thời gian (`we-slider-progress`), số trang (`01/03`).
   - Headline biểu tượng: `SPRING / SUMMER 2026 — THE QUIET STATEMENT`.
   - Cặp nút CTA: `KHÁM PHÁ BỘ SƯU TẬP` (`/collections`) và `XEM TẤT CẢ` (`/products`).
   - Tỷ lệ khung hình, khoảng cách, overlays và hiệu ứng chuyển slide.
4. **Floating Stylist AI Button**: Nút tròn cố định góc dưới bên phải kích hoạt Modal Stylist AI.

---

## 4. KẾ HOẠCH BỐ CỤC VÀ NHỊP ĐIỆU NỘI DUNG (VISUAL RHYTHM & FLOW)

Nhịp điệu cuộn trang được thiết kế như một ấn phẩm tạp chí thời trang cao cấp (*Vogue / Harper's Bazaar meets Contemporary Architecture*):

```
[PROTECTED] Announcement Bar & Header
    │
[PROTECTED] Hero Section (The Quiet Statement - 100vh)
    │
▼ Section 01: Brand Manifesto (Editorial Typography + Subtle Statement)
    │
▼ Section 02: Explore Collections (Bespoke Asymmetric Grid - Men, Women, Leather, Couture)
    │
▼ Section 03: Curated for You (Personalized Hybrid Recommendations with Tabs)
    │
▼ Section 04: Interactive Lookbook (Runway Looks with Clickable Product Hotspots)
    │
▼ Section 05: New Arrivals — The Edit (Large Star Product + Horizontal Product Rail)
    │
▼ Section 06: Trending Silhouettes & Bestsellers (Runway Favorites & High-demand pieces)
    │
▼ Section 07: Campaign Stories (Cinematic Full-Bleed Banner & Exclusive Perks)
    │
▼ Section 08: Interactive Stylist AI (Concierge Experience with Clickable Prompt Pills)
    │
▼ Section 09: The Art of Details (Macro Textures, Fabric Science & Size Guide)
    │
▼ Section 10: Fashion Journal (Editorial Articles & Theory of Modern Silhouettes)
    │
▼ Section 11: Recently Viewed (Auto-collapsing horizontal shelf for viewed products)
    │
▼ Section 12: Community & Patron Testimonials (Verified Client Reviews & Quotes)
    │
▼ Section 13: Shopping Benefits & Concierge (White-glove delivery, 7-day returns)
    │
▼ Section 14: Final Editorial CTA (Grand Finale Invitation to Patron Community)
    │
▼ Section 15: Signature Footer (Watermark Wordmark, Newsletter, Multi-column Links)
```

Tài liệu này là kim chỉ nam bắt buộc để tiến hành triển khai mã nguồn tại `frontend/src/pages/Home/`.
