/**
 * ATELIER VÉRITÉ — Visual CMS Pre-configured Templates
 * Fully populated starting layouts for Lookbooks, About Us, Statutory Legal Policies, and Campaigns.
 */

import { PageTemplate } from './types';
import { createBlockInstance } from './blockLibrary';

export const PAGE_TEMPLATES: PageTemplate[] = [
  // ================= 1. LOOKBOOK TEMPLATE =================
  {
    id: 'template_lookbook',
    name: 'Mẫu Lookbook Thời Trang (Capsule Runway)',
    type: 'lookbook',
    description: 'Trang trình diễn bộ sưu tập ảnh cao cấp với bìa Hero, trích dẫn nghệ thuật, thư viện ảnh và danh mục trang phục.',
    defaultTitle: 'Lookbook Mùa Đông 2026 — Dạ Khúc Độc Bản',
    defaultSlug: 'lookbook-mua-dong-2026',
    sections: [
      {
        id: 'sec_hero_1',
        type: 'hero',
        title: 'Bìa Lookbook',
        order: 0,
        isActive: true,
        blocks: [
          {
            ...createBlockInstance('heading'),
            content: {
              text: 'DẠ KHÚC ĐỘC BẢN',
              level: 'h1',
              tagline: 'AUTUMN / WINTER 2026 CAPSULE',
            },
            styles: {
              fontSize: '4xl',
              fontFamily: 'serif',
              textAlign: 'center',
              textColor: '#ffffff',
            },
          },
          {
            ...createBlockInstance('paragraph'),
            content: {
              text: 'Bản hòa ca giữa kết cấu len lông cừu nguyên bản và nghệ thuật xếp nếp kiến trúc Atelier.',
            },
            styles: {
              fontSize: 'lg',
              textAlign: 'center',
              textColor: 'rgba(255, 255, 255, 0.7)',
            },
          },
        ],
      },
      {
        id: 'sec_story_1',
        type: 'story',
        title: 'Cảm Hứng Thiết Kế',
        order: 1,
        isActive: true,
        blocks: [
          {
            ...createBlockInstance('quote'),
            content: {
              quote: 'Thời trang không đơn thuần là phục trang, mà là cách bạn đối thoại thầm lặng với không gian xung quanh.',
              author: 'Giám Đốc Nghệ Thuật — Atelier Vérité',
            },
          },
          {
            ...createBlockInstance('image_text'),
            content: {
              imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop',
              imagePosition: 'left',
              title: 'Cảm Hứng Đêm Đông Paris',
              content: 'Lấy cảm hứng từ ánh đèn vàng phản chiếu trên mặt đá hoa cương ướt mưa của đại lộ Montaigne, bộ sưu tập hướng tới sự điềm đạm, sang trọng và trường tồn.',
              buttonText: 'Khám Phá Chi Tiết',
              buttonLink: '/collections',
            },
          },
        ],
      },
      {
        id: 'sec_gallery_1',
        type: 'gallery',
        title: 'Thư Viện Ảnh BST',
        order: 2,
        isActive: true,
        blocks: [
          createBlockInstance('gallery'),
          createBlockInstance('divider'),
        ],
      },
      {
        id: 'sec_products_1',
        type: 'products',
        title: 'Sản Phẩm Trong Lookbook',
        order: 3,
        isActive: true,
        blocks: [
          createBlockInstance('product_grid'),
          {
            ...createBlockInstance('cta_button'),
            content: {
              label: 'Xem Toàn Bộ Sản Phẩm Tại Showroom',
              link: '/products',
            },
          },
        ],
      },
    ],
  },

  // ================= 2. ABOUT US TEMPLATE =================
  {
    id: 'template_about',
    name: 'Mẫu Giới Thiệu Thương Hiệu (About Us Heritage)',
    type: 'about',
    description: 'Trang kể câu chuyện thương hiệu, triết lý may đo, dòng thời gian phát triển và các giá trị cốt lõi.',
    defaultTitle: 'Về Chúng Tôi — Di Sản May Đo Atelier Vérité',
    defaultSlug: 've-chung-toi',
    sections: [
      {
        id: 'sec_about_hero',
        type: 'hero',
        title: 'Khởi Đầu Câu Chuyện',
        order: 0,
        isActive: true,
        blocks: [
          {
            ...createBlockInstance('heading'),
            content: {
              text: 'DI SẢN MAY ĐO THỦ CÔNG ĐƯƠNG ĐẠI',
              level: 'h1',
              tagline: 'ATELIER VÉRITÉ — KỂ TỪ NĂM 2020',
            },
            styles: {
              fontSize: '4xl',
              fontFamily: 'serif',
              textAlign: 'center',
            },
          },
          {
            ...createBlockInstance('paragraph'),
            content: {
              text: 'Nơi mỗi đường kim mũi chỉ là lời cam kết về vẻ đẹp nguyên bản và phẩm giá trường cửu của người mặc.',
            },
            styles: {
              textAlign: 'center',
            },
          },
        ],
      },
      {
        id: 'sec_about_values',
        type: 'story',
        title: 'Giá Trị Cốt Lõi',
        order: 1,
        isActive: true,
        blocks: [
          createBlockInstance('three_columns'),
          createBlockInstance('divider'),
          createBlockInstance('timeline'),
        ],
      },
      {
        id: 'sec_about_cta',
        type: 'cta',
        title: 'Kêu Gọi Trải Nghiệm',
        order: 2,
        isActive: true,
        blocks: [
          {
            ...createBlockInstance('banner'),
            content: {
              imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1600&auto=format&fit=crop',
              title: 'TRẢI NGHIỆM THỬ ĐỒ TẠI ATELIER',
              subtitle: 'Mỗi buổi tư vấn trang phục riêng tư kéo dài 60 phút cùng chuyên gia tạo mẫu.',
              buttonText: 'Đặt Lịch Hẹn Ngay',
              buttonLink: '/contact',
            },
          },
        ],
      },
    ],
  },

  // ================= 3. STATUTORY LEGAL POLICY TEMPLATE =================
  {
    id: 'template_legal_policy',
    name: 'Mẫu Chính Sách Pháp Lý (Statutory Legal Policy)',
    type: 'policy',
    description: 'Mẫu chuẩn tuân thủ Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 & Nghị định 356/2025/NĐ-CP, đầy đủ mục lục, ngày hiệu lực và quyền hạn người dùng.',
    defaultTitle: 'Chính Sách Bảo Mật & Bảo Vệ Dữ Liệu Cá Nhân',
    defaultSlug: 'chinh-sach-bao-mat',
    sections: [
      {
        id: 'sec_legal_meta',
        type: 'story',
        title: 'Thông Tin Pháp Lý Bắt Buộc',
        order: 0,
        isActive: true,
        blocks: [
          {
            ...createBlockInstance('heading'),
            content: {
              text: 'CHÍNH SÁCH BẢO MẬT & BẢO VỆ DỮ LIỆU CÁ NHÂN',
              level: 'h1',
              tagline: 'VĂN BẢN QUẢN TRỊ TUÂN THỦ PHÁP LUẬT VIỆT NAM',
            },
          },
          createBlockInstance('policy_version'),
          createBlockInstance('effective_date'),
          createBlockInstance('table_of_contents'),
          createBlockInstance('divider'),
        ],
      },
      {
        id: 'sec_legal_articles',
        type: 'story',
        title: 'Nội Dung Các Điều Khoản',
        order: 1,
        isActive: true,
        blocks: [
          {
            ...createBlockInstance('policy_section'),
            content: {
              articleNumber: 'Điều 1',
              title: 'Đơn Vị Kiểm Soát & Xử Lý Dữ Liệu',
              content: 'Công ty Cổ phần Thời trang Atelier Vérité là đơn vị chịu trách nhiệm kiểm soát và xử lý dữ liệu cá nhân của khách hàng khi truy cập và mua sắm tại nền tảng thương mại điện tử theo Giấy chứng nhận ĐKKD do Sở Kế hoạch và Đầu tư TP. Hà Nội cấp.',
            },
          },
          {
            ...createBlockInstance('policy_section'),
            content: {
              articleNumber: 'Điều 2',
              title: 'Quyền Của Chủ Thể Dữ Liệu Theo Luật 91/2025/QH15',
              content: 'Khách hàng có đầy đủ quyền được biết, đồng ý hoặc từ chối, rút lại sự đồng ý, yêu cầu truy xuất, chỉnh sửa và yêu cầu xóa toàn bộ dữ liệu cá nhân bất kỳ thời điểm nào thông qua công cụ tự phục vụ trong tài khoản hoặc đường dẫn DSAR.',
            },
          },
          createBlockInstance('privacy_request_trigger'),
          createBlockInstance('cookie_table'),
          createBlockInstance('consent_trigger'),
        ],
      },
    ],
  },

  // ================= 4. CAMPAIGN LANDING TEMPLATE =================
  {
    id: 'template_campaign',
    name: 'Mẫu Chiến Dịch Khuyến Mãi (Campaign Landing)',
    type: 'landing',
    description: 'Trang sự kiện bán hàng, Flash Sale, đồng hồ đếm ngược, ưu đãi độc quyền và mã giảm giá.',
    defaultTitle: 'Sự Kiện Độc Quyền — Private Haute Couture Sale',
    defaultSlug: 'private-sale-2026',
    sections: [
      {
        id: 'sec_camp_hero',
        type: 'hero',
        title: 'Hero Chiến Dịch',
        order: 0,
        isActive: true,
        blocks: [
          {
            ...createBlockInstance('banner'),
            content: {
              imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
              title: 'PRIVATE VIP SALE 2026',
              subtitle: 'Đặc quyền trải nghiệm may đo dành riêng cho khách hàng thân thiết hạng Vàng và Kim Cương.',
              buttonText: 'Xem Ưu Đãi Ngay',
              buttonLink: '#sale-products',
            },
          },
          createBlockInstance('countdown'),
        ],
      },
      {
        id: 'sec_camp_vouchers',
        type: 'story',
        title: 'Mã Ưu Đãi VIP',
        order: 1,
        isActive: true,
        blocks: [
          createBlockInstance('voucher_cta'),
          createBlockInstance('featured_product'),
          createBlockInstance('product_grid'),
        ],
      },
    ],
  },
];
