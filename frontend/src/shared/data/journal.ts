import { JournalArticle } from '../types';

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    id: 'art-01',
    slug: 'the-architecture-of-draping',
    title: 'Kiến Trúc Của Sự Buông Rủ: Hình Thể Trong Chuyển Động Vĩnh Cửu',
    excerpt: 'Nghiên cứu sâu sắc bên trong xưởng may Paris khám phá cách những đường cắt xéo giải phóng phom dáng khỏi sự gò bó cơ học.',
    category: 'Ghi chép Atelier',
    author: 'Geneviève Laurent, Giám đốc Sáng tạo',
    date: '18/10/2026',
    readTime: '6 phút đọc',
    coverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=85',
    sections: [
      {
        heading: 'Ranh Giới Giữa Cấu Trúc Và Sự Tự Do',
        paragraph: 'Trong may đo cổ điển Pháp, trang phục thường tìm cách uốn nắn cơ thể — ép buộc vải vóc vào những cấu trúc hình học bất di bất dịch. Tại Atelier Vérité, chúng tôi đảo ngược giáo điều lịch sử này. Chúng tôi không hỏi vải vóc có thể ép cơ thể làm gì, mà tìm kiếm sự cân bằng động học tự nhiên khi trọng lực trở thành người cộng sự lớn nhất.',
        quote: '“Sự xa xỉ đích thực không hề gò bó; nó ban tặng cảm giác nhẹ bẫng cho tâm hồn.”',
      },
      {
        heading: 'Kỹ Thuật Cắt Xéo Vải: Vật Lý Và Triết Học',
        paragraph: 'Cắt vải theo góc chéo 45 độ biến những sợi dệt cứng cáp thành một lớp màng sống động, phản hồi linh hoạt theo từng chuyển động. Trong thiết kế Đầm Lụa Dòng Nước FW26 của chúng tôi, hơn 11 mét lụa dâu tằm 30-momme được ghim hoàn toàn bằng tay trên ma-nơ-canh giải phẫu cổ điển suốt bốn ngày ròng rã.',
        image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=85',
      },
      {
        heading: 'Sự Vĩnh Cửu Của Dáng Hình Tĩnh Lặng',
        paragraph: 'Cam kết sáng tạo chậm đồng nghĩa với việc từ chối sự đào thải theo mùa. Khi một phom dáng đạt đến sự hài hòa giữa tỷ lệ và sự thoải mái, nó vượt lên khỏi chu kỳ ngắn ngủi của thời trang nhanh để trở thành một tác phẩm trường tồn trong tủ đồ của giới mộ điệu.',
      },
    ],
  },
  {
    id: 'art-02',
    slug: 'behind-the-silk-lyon-ateliers',
    title: 'Phía Sau Những Thớ Lụa: Khung Dệt Thế Kỷ Bên Bờ Sông Rhône',
    excerpt: 'Hành trình tới Lyon gặp gỡ những nghệ nhân dệt bậc thầy gìn giữ kỹ thuật jacquard và lụa dâu tằm từ thế kỷ 18.',
    category: 'Nghệ thuật thủ công',
    author: 'Henri Duprès',
    date: '29/09/2026',
    readTime: '8 phút đọc',
    coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=85',
    sections: [
      {
        heading: 'Nước, Bầu Khí Quyển Và Những Sợi Chỉ',
        paragraph: 'Tại Lyon, nghề dệt lụa gắn liền với khí hậu vi mô cũng như thiên tài cơ khí. Độ ẩm tinh tế dọc theo dòng sông Rhône ngăn những sợi tơ tằm thô siêu nhỏ bị tưa khi chúng lướt qua những con thoi cổ phục chế với tốc độ hàng trăm nhịp mỗi phút.',
      },
      {
        heading: 'Chuẩn Mực Định Lượng 30-Momme',
        paragraph: 'Trong khi y phục thương mại hiếm khi vượt quá định lượng 16-momme, Atelier Vérité đặt hàng mật độ 30-momme phi thường. Kết quả là thớ lụa có độ đầm tay tuyệt hảo, khả năng che phủ kín đáo và độ bắt sáng óng ánh tựa dòng thủy ngân nguội.',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
      },
    ],
  },
  {
    id: 'art-03',
    slug: 'monochrome-brutalism-fw26',
    title: 'Chủ Nghĩa Thô Mộc Đơn Sắc: Giải Phẫu Mùa Thu/Đông 2026',
    excerpt: 'Khám phá cuộc đối thoại điêu khắc giữa kiến trúc bê tông hiện đại và những phom dáng bề thế của bộ sưu tập runway.',
    category: 'Chiến dịch',
    author: 'Clara Moreau',
    date: '14/08/2026',
    readTime: '5 phút đọc',
    coverImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=85',
    sections: [
      {
        heading: 'Tuyên Ngôn Của Chủ Nghĩa Hiện Đại',
        paragraph: 'Ghi hình tại Khu phức hợp Barbican ở London và Biệt thự Savoye ở Poissy, chiến dịch FW26 khám phá sự cộng hưởng sâu sắc giữa bê tông thô và len lông cừu nguyên chất hai mặt dày dặn.',
        quote: '“Kiến trúc là tác phẩm điêu khắc để con người sinh sống; y phục là kiến trúc thân mật ôm ấp lấy cơ thể.”',
      },
    ],
  },
];
