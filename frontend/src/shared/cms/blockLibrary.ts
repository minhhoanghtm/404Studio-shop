/**
 * ATELIER VÉRITÉ — Visual CMS Block Library Registry
 * Defines all available blocks across 6 core categories with default content and styles.
 */

import { BlockDefinition, BlockItem, BlockType } from './types';

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // ================= CONTENT =================
  {
    type: 'heading',
    category: 'content',
    label: 'Tiêu Đề (Heading)',
    description: 'Tiêu đề phân cấp từ H1 đến H4 với font Serif hoặc Sans',
    iconName: 'Heading',
    defaultContent: {
      text: 'Tiêu Đề Nội Dung',
      level: 'h2',
      tagline: 'DANH MỤC THỜI TRANG',
    },
    defaultStyles: {
      fontSize: '3xl',
      fontWeight: 'semibold',
      textAlign: 'left',
      fontFamily: 'serif',
      textColor: '#ffffff',
      marginBottom: 16,
    },
  },
  {
    type: 'paragraph',
    category: 'content',
    label: 'Đoạn Văn (Paragraph)',
    description: 'Đoạn văn bản mô tả, font chuẩn Atelier Vérité',
    iconName: 'AlignLeft',
    defaultContent: {
      text: 'Mỗi tác phẩm trong bộ sưu tập là sự giao thoa tinh tế giữa di sản may đo thủ công truyền thống và hơi thở kiến trúc đương đại.',
    },
    defaultStyles: {
      fontSize: 'base',
      fontWeight: 'normal',
      textAlign: 'left',
      fontFamily: 'sans',
      textColor: 'rgba(255, 255, 255, 0.75)',
      marginBottom: 16,
    },
  },
  {
    type: 'rich_text',
    category: 'content',
    label: 'Văn Bản Định Dạng (Rich Text)',
    description: 'Khối văn bản tự do hỗ trợ bôi đậm, in nghiêng, gạch đầu dòng',
    iconName: 'FileText',
    defaultContent: {
      html: '<p>Chất liệu lụa tơ tằm thượng hạng kết hợp len cashmere nguyên bản mang lại cảm giác nhẹ tênh nhưng giữ nhiệt hoàn hảo.</p>',
    },
    defaultStyles: {
      fontSize: 'base',
      textColor: 'rgba(255, 255, 255, 0.8)',
      marginBottom: 20,
    },
  },
  {
    type: 'quote',
    category: 'content',
    label: 'Trích Dẫn (Quote)',
    description: 'Khối trích dẫn nghệ thuật kèm tác giả',
    iconName: 'Quote',
    defaultContent: {
      quote: 'Sự tối giản không phải là thiếu hụt, mà là sự hoàn hảo khi không còn gì để lược bỏ.',
      author: 'Giám Đốc Sáng Tạo — Atelier Vérité',
    },
    defaultStyles: {
      fontSize: 'xl',
      fontFamily: 'serif',
      textAlign: 'center',
      textColor: '#d4af37',
      paddingTop: 24,
      paddingBottom: 24,
    },
  },
  {
    type: 'list',
    category: 'content',
    label: 'Danh Sách (List)',
    description: 'Danh sách đánh dấu hoặc có số thứ tự',
    iconName: 'List',
    defaultContent: {
      ordered: false,
      items: [
        'Quy trình may đo thủ công tại xưởng Haute Couture',
        'Kiểm định chất lượng 3 vòng độc lập',
        'Bảo hành đường may và phụ kiện trọn đời',
      ],
    },
    defaultStyles: {
      fontSize: 'base',
      textColor: 'rgba(255, 255, 255, 0.75)',
      marginBottom: 16,
    },
  },
  {
    type: 'table',
    category: 'content',
    label: 'Bảng Dữ Liệu (Table)',
    description: 'Bảng thông tin có tiêu đề cột và các hàng dữ liệu',
    iconName: 'Table',
    defaultContent: {
      headers: ['Chỉ Tiêu', 'Quy Chuẩn', 'Cam Kết'],
      rows: [
        ['Chất Liệu', '100% Tơ Tằm Tự Nhiên', 'Nguồn gốc xuất xứ rõ ràng'],
        ['Gia Công', 'May tay 80%', 'Đạt chuẩn Haute Couture'],
        ['Đổi Trả', '15 Ngày Miễn Phí', 'Hỗ trợ tận nơi'],
      ],
    },
    defaultStyles: {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      marginBottom: 24,
    },
  },
  {
    type: 'accordion',
    category: 'content',
    label: 'Hỏi Đáp / Thu Phóng (Accordion)',
    description: 'Danh sách câu hỏi thu gọn mở ra khi người dùng nhấn chọn',
    iconName: 'HelpCircle',
    defaultContent: {
      items: [
        {
          title: 'Làm thế nào để đặt lịch may đo cá nhân hóa?',
          content: 'Quý khách có thể liên hệ trực tiếp qua số hotline hoặc để lại lời nhắn trên website để chuyên viên đặt hẹn tại Atelier.',
        },
        {
          title: 'Thời gian hoàn thiện một tác phẩm may đo là bao lâu?',
          content: 'Thông thường từ 14 đến 21 ngày làm việc tùy thuộc vào độ phức tạp của hoa văn thêu tay.',
        },
      ],
    },
    defaultStyles: {
      marginBottom: 24,
    },
  },
  {
    type: 'divider',
    category: 'content',
    label: 'Đường Phân Cách (Divider)',
    description: 'Đường kẻ mảnh mạ vàng hoặc trung tính tạo khoảng ngắt',
    iconName: 'Minus',
    defaultContent: {
      style: 'solid',
      showEmblem: false,
    },
    defaultStyles: {
      borderColor: 'rgba(212, 175, 55, 0.3)',
      marginTop: 32,
      marginBottom: 32,
    },
  },

  // ================= MEDIA =================
  {
    type: 'image',
    category: 'media',
    label: 'Hình Ảnh Đơn (Image)',
    description: 'Ảnh sắc nét với tỉ lệ chuẩn, hỗ trợ xem trước và chú thích',
    iconName: 'Image',
    defaultContent: {
      url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
      alt: 'Atelier Lookbook Feature',
      caption: 'Bộ sưu tập Đông Xuân — Haute Couture Limited',
    },
    defaultStyles: {
      borderRadius: 'sm',
      aspectRatio: '16/9',
      objectFit: 'cover',
      marginBottom: 24,
    },
  },
  {
    type: 'gallery',
    category: 'media',
    label: 'Bộ Sưu Tập Ảnh (Gallery)',
    description: 'Lưới hiển thị từ 2 đến 6 ảnh nghệ thuật',
    iconName: 'Grid',
    defaultContent: {
      columns: 3,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800&auto=format&fit=crop',
          caption: 'Góc nhìn 01 — Đường nét cắt may',
        },
        {
          url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
          caption: 'Góc nhìn 02 — Họa tiết dệt kim',
        },
        {
          url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop',
          caption: 'Góc nhìn 03 — Phong thái đương đại',
        },
      ],
    },
    defaultStyles: {
      marginBottom: 32,
    },
  },
  {
    type: 'video',
    category: 'media',
    label: 'Video Nhúng (Video Embed)',
    description: 'Video giới thiệu sàn diễn từ YouTube hoặc Vimeo',
    iconName: 'Video',
    defaultContent: {
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Fashion Show Runway Autumn/Winter',
    },
    defaultStyles: {
      aspectRatio: '16/9',
      marginBottom: 32,
    },
  },
  {
    type: 'banner',
    category: 'media',
    label: 'Banner Toàn Chiều Ngang (Full Banner)',
    description: 'Hình nền trải rộng kèm tiêu đề và nút kêu gọi hành động',
    iconName: 'Layers',
    defaultContent: {
      imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1600&auto=format&fit=crop',
      title: 'DI SẢN MAY ĐO THỜI GIAN',
      subtitle: 'Khám phá bộ sưu tập độc bản mùa này',
      buttonText: 'Khám Phá Ngay',
      buttonLink: '/collections',
    },
    defaultStyles: {
      paddingTop: 64,
      paddingBottom: 64,
      textAlign: 'center',
      marginBottom: 40,
    },
  },
  {
    type: 'image_text',
    category: 'media',
    label: 'Ảnh Kèm Văn Bản (Image + Text)',
    description: 'Bố cục 2 cột: Một bên là hình ảnh, một bên là nội dung thuyết minh',
    iconName: 'Columns',
    defaultContent: {
      imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop',
      imagePosition: 'left',
      title: 'Triết Lý Sáng Tạo Độc Bản',
      content: 'Chúng tôi tin rằng vẻ đẹp thực sự bắt nguồn từ sự chân thực và tôn trọng phẩm giá tự nhiên của chất liệu.',
      buttonText: 'Về Chúng Tôi',
      buttonLink: '/about',
    },
    defaultStyles: {
      marginBottom: 32,
    },
  },

  // ================= LAYOUT =================
  {
    type: 'section',
    category: 'layout',
    label: 'Khối Phân Vùng (Section)',
    description: 'Khối bao ngoài với nền màu, khoảng đệm trên/dưới',
    iconName: 'Box',
    defaultContent: {
      title: 'Phân Vùng Chính',
    },
    defaultStyles: {
      paddingTop: 48,
      paddingBottom: 48,
      backgroundColor: 'transparent',
    },
  },
  {
    type: 'container',
    category: 'layout',
    label: 'Khung Giới Hạn (Container)',
    description: 'Khung giới hạn chiều ngang chuẩn (max-w-4xl, max-w-6xl)',
    iconName: 'Maximize2',
    defaultContent: {
      maxWidth: 'max-w-5xl',
    },
    defaultStyles: {},
  },
  {
    type: 'two_columns',
    category: 'layout',
    label: 'Hai Cột (Two Columns)',
    description: 'Chia đôi không gian theo tỉ lệ 50/50 hoặc 60/40',
    iconName: 'Columns',
    defaultContent: {
      ratio: '50-50',
      leftContent: 'Cột bên trái: Nội dung hoặc hình ảnh minh họa',
      rightContent: 'Cột bên phải: Nội dung chi tiết bổ trợ',
    },
    defaultStyles: {
      marginBottom: 24,
    },
  },
  {
    type: 'three_columns',
    category: 'layout',
    label: 'Ba Cột (Three Columns)',
    description: 'Chia đều 3 cột cho các đặc điểm nổi bật hoặc thông điệp cốt lõi',
    iconName: 'Grid',
    defaultContent: {
      columns: [
        { title: 'Tôn Trọng Di Sản', text: 'Kế thừa tinh hoa may đo thủ công Pháp và Á Đông.' },
        { title: 'Chất Liệu Bền Vững', text: '100% nguồn sợi tự nhiên có thể phân hủy sinh học.' },
        { title: 'Dịch Vụ Độc Bản', text: 'Chăm sóc cá nhân hóa chuẩn phục vụ hoàng gia.' },
      ],
    },
    defaultStyles: {
      marginBottom: 32,
    },
  },
  {
    type: 'spacer',
    category: 'layout',
    label: 'Khoảng Trống (Spacer)',
    description: 'Tạo khoảng cách trống linh hoạt giữa các khối',
    iconName: 'ChevronsUpDown',
    defaultContent: {
      height: 48,
    },
    defaultStyles: {},
  },

  // ================= COMMERCE =================
  {
    type: 'product_grid',
    category: 'commerce',
    label: 'Lưới Sản Phẩm (Product Grid)',
    description: 'Hiển thị danh sách sản phẩm thời trang theo danh mục hoặc bộ lọc',
    iconName: 'ShoppingBag',
    defaultContent: {
      title: 'Sản Phẩm Trong Bộ Sưu Tập',
      limit: 4,
      categorySlug: '',
    },
    defaultStyles: {
      marginBottom: 40,
    },
  },
  {
    type: 'featured_product',
    category: 'commerce',
    label: 'Sản Phẩm Tâm Điểm (Featured Spotlight)',
    description: 'Làm nổi bật một sản phẩm đinh kèm thông tin giá và nút mua nhanh',
    iconName: 'Sparkles',
    defaultContent: {
      productTitle: 'Áo Khoác Dạ Dáng Dài Khâu Tay',
      price: 18500000,
      originalPrice: 22000000,
      imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=800&auto=format&fit=crop',
      productLink: '/products',
    },
    defaultStyles: {
      paddingTop: 32,
      paddingBottom: 32,
      marginBottom: 32,
    },
  },
  {
    type: 'lookbook_gallery',
    category: 'commerce',
    label: 'Thư Viện Lookbook (Lookbook Reel)',
    description: 'Trình chiếu album thời trang kèm liên kết trang phục',
    iconName: 'Camera',
    defaultContent: {
      title: 'Runway Lookbook Capsule',
      photos: [
        { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop' },
        { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop' },
      ],
    },
    defaultStyles: {
      marginBottom: 32,
    },
  },
  {
    type: 'voucher_cta',
    category: 'commerce',
    label: 'Ưu Đãi / Mã Giảm Giá (Voucher CTA)',
    description: 'Khung nhận mã ưu đãi kèm nút sao chép mã nhanh',
    iconName: 'Ticket',
    defaultContent: {
      code: 'ATELIER15',
      discount: 'Giảm 15% Đơn Đầu Tiên',
      expiry: 'Áp dụng cho khách hàng VIP và thành viên mới',
    },
    defaultStyles: {
      backgroundColor: 'rgba(212, 175, 55, 0.08)',
      borderColor: 'rgba(212, 175, 55, 0.3)',
      marginBottom: 24,
    },
  },

  // ================= INTERACTIVE =================
  {
    type: 'cta_button',
    category: 'interactive',
    label: 'Nút Kêu Gọi (CTA Button)',
    description: 'Nút bấm dẫn liên kết nổi bật màu vàng champagne hoàng gia',
    iconName: 'MousePointer',
    defaultContent: {
      label: 'Khám Phá Ngay',
      link: '/products',
      variant: 'primary',
    },
    defaultStyles: {
      textAlign: 'center',
      marginBottom: 16,
    },
  },
  {
    type: 'tabs',
    category: 'interactive',
    label: 'Thẻ Nội Dung (Tabs)',
    description: 'Chuyển đổi qua lại giữa các nội dung khác nhau trên cùng vị trí',
    iconName: 'Bookmark',
    defaultContent: {
      tabs: [
        { label: 'Quy Trình May Đo', content: 'Từ phác thảo bản vẽ trên giấy đến công đoạn dựng mẫu toile.' },
        { label: 'Tuyển Chọn Vải', content: 'Vải được nhập khẩu độc quyền từ Lyon (Pháp) và Biella (Ý).' },
      ],
    },
    defaultStyles: {
      marginBottom: 32,
    },
  },
  {
    type: 'timeline',
    category: 'interactive',
    label: 'Dòng Lịch Sử (Timeline)',
    description: 'Trình diễn các mốc thời gian phát triển thương hiệu',
    iconName: 'Clock',
    defaultContent: {
      events: [
        { year: '2020', title: 'Khởi Khắc Atelier', desc: 'Thành lập xưởng may đo may mặc thủ công đầu tiên tại Hà Nội.' },
        { year: '2023', title: 'Triển Lãm Tuần Lễ Thời Trang', desc: 'Ra mắt BST Haute Couture tại sàn diễn quốc tế.' },
        { year: '2026', title: 'Atelier Vérité 2.0', desc: 'Ứng dụng công nghệ định hình phong cách cá nhân hóa thông minh.' },
      ],
    },
    defaultStyles: {
      marginBottom: 32,
    },
  },
  {
    type: 'countdown',
    category: 'interactive',
    label: 'Đồng Hồ Đếm Ngược (Countdown)',
    description: 'Đếm ngược thời gian sự kiện mở bán hoặc kết thúc ưu đãi',
    iconName: 'Timer',
    defaultContent: {
      targetDate: '2026-12-31T23:59:59',
      title: 'Thời Gian Còn Lại Cho BST Độc Bản',
    },
    defaultStyles: {
      textAlign: 'center',
      marginBottom: 24,
    },
  },

  // ================= LEGAL & COMPLIANCE =================
  {
    type: 'table_of_contents',
    category: 'legal',
    label: 'Mục Lục Văn Bản (Table of Contents)',
    description: 'Danh sách các điều khoản pháp lý có liên kết cuộn nhanh',
    iconName: 'BookOpen',
    defaultContent: {
      title: 'Mục Lục Điều Khoản',
      items: [
        { title: '1. Định Nghĩa & Phạm Vi Áp Dụng', anchor: '#section-1' },
        { title: '2. Quyền Của Chủ Thể Dữ Liệu', anchor: '#section-2' },
        { title: '3. Quy Trình Thu Thập & Bảo Vệ', anchor: '#section-3' },
      ],
    },
    defaultStyles: {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      marginBottom: 24,
    },
  },
  {
    type: 'policy_section',
    category: 'legal',
    label: 'Điều Khoản Pháp Lý (Policy Article)',
    description: 'Một điều khoản chính thức có số điều, tiêu đề và nội dung',
    iconName: 'Shield',
    defaultContent: {
      articleNumber: 'Điều 1',
      title: 'Quyền của Chủ Thể Dữ Liệu Cá Nhân',
      content: 'Theo quy định của Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, Quý khách hàng có quyền được biết, đồng ý, rút lại sự đồng ý, yêu cầu truy cập và yêu cầu xóa dữ liệu cá nhân bất kỳ lúc nào.',
    },
    defaultStyles: {
      marginBottom: 20,
    },
  },
  {
    type: 'cookie_table',
    category: 'legal',
    label: 'Bảng Phân Loại Cookie (Cookie Table)',
    description: 'Bảng minh bạch các loại cookie và thời hạn lưu trữ',
    iconName: 'PieChart',
    defaultContent: {
      categories: [
        { name: 'Cần Thiết Tuyệt Đối', purpose: 'Duy trì đăng nhập và giỏ hàng', duration: 'Phiên làm việc' },
        { name: 'Phân Tích & Hiệu Năng', purpose: 'Đo lường lưu lượng ẩn danh', duration: '12 Tháng' },
        { name: 'Tiếp Thị & Cá Nhân Hóa', purpose: 'Gợi ý sản phẩm phù hợp', duration: '6 Tháng' },
      ],
    },
    defaultStyles: {
      marginBottom: 24,
    },
  },
  {
    type: 'consent_trigger',
    category: 'legal',
    label: 'Nút Mở Tùy Chọn Cookie (Consent Trigger)',
    description: 'Kích hoạt hộp thoại quản lý đồng ý cookie tuân thủ Nghị định 356/2025',
    iconName: 'Sliders',
    defaultContent: {
      buttonText: 'Tùy Chỉnh Lựa Chọn Cookie Của Bạn',
    },
    defaultStyles: {
      textAlign: 'center',
      marginBottom: 20,
    },
  },
  {
    type: 'privacy_request_trigger',
    category: 'legal',
    label: 'Đường Dẫn Yêu Cầu Dữ Liệu (Data Request)',
    description: 'Dẫn người dùng tới biểu mẫu yêu cầu trích xuất hoặc xóa dữ liệu',
    iconName: 'FileText',
    defaultContent: {
      buttonText: 'Gửi Yêu Cầu Về Dữ Liệu Cá Nhân (DSAR)',
      link: '/data-privacy-request',
    },
    defaultStyles: {
      textAlign: 'center',
      marginBottom: 20,
    },
  },
  {
    type: 'returns_steps',
    category: 'legal',
    label: 'Quy Trình Đổi Trả (Returns Process)',
    description: 'Các bước thực hiện đổi trả hàng hóa rõ ràng, minh bạch',
    iconName: 'RefreshCw',
    defaultContent: {
      steps: [
        { step: '01', title: 'Thông Báo', desc: 'Liên hệ trong vòng 15 ngày kể từ ngày nhận hàng' },
        { step: '02', title: 'Đóng Gói', desc: 'Giữ nguyên tem mác, hộp và hóa đơn mua hàng' },
        { step: '03', title: 'Thu Hồi & Hoàn Tiền', desc: 'Nhân viên bưu tá nhận hàng và hoàn tiền trong 24 giờ' },
      ],
    },
    defaultStyles: {
      marginBottom: 24,
    },
  },
  {
    type: 'effective_date',
    category: 'legal',
    label: 'Ngày Hiệu Lực (Effective Date)',
    description: 'Thông báo ngày chính thức có hiệu lực của văn bản quy định',
    iconName: 'Calendar',
    defaultContent: {
      dateText: 'Chính sách này có hiệu lực chính thức từ ngày 16 tháng 11 năm 2026',
    },
    defaultStyles: {
      fontSize: 'sm',
      textColor: 'rgba(255, 255, 255, 0.5)',
      fontFamily: 'mono',
      marginBottom: 12,
    },
  },
  {
    type: 'policy_version',
    category: 'legal',
    label: 'Phiên Bản Văn Bản (Policy Version)',
    description: 'Huy hiệu số phiên bản văn bản quản trị (v2.4.0)',
    iconName: 'Tag',
    defaultContent: {
      version: 'Phiên bản: 2026-v2.4 (Tuân thủ Nghị định 356/2025/NĐ-CP)',
    },
    defaultStyles: {
      fontSize: 'xs',
      textColor: '#d4af37',
      fontFamily: 'mono',
      marginBottom: 16,
    },
  },
];

/**
 * Creates a new instance of a BlockItem with a unique ID and default attributes.
 */
export function createBlockInstance(type: BlockType): BlockItem {
  const def = BLOCK_DEFINITIONS.find((b) => b.type === type);
  const id = `block_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (!def) {
    return {
      id,
      type,
      category: 'content',
      label: type,
      content: {},
      styles: {},
      responsive: {},
    };
  }

  return {
    id,
    type: def.type,
    category: def.category,
    label: def.label,
    content: JSON.parse(JSON.stringify(def.defaultContent)),
    styles: def.defaultStyles ? JSON.parse(JSON.stringify(def.defaultStyles)) : {},
    responsive: {
      hideOnMobile: false,
      hideOnTablet: false,
      hideOnDesktop: false,
    },
  };
}
