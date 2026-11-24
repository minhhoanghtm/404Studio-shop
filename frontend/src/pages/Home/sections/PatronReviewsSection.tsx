import React, { useState } from 'react';
import { Star, ShieldCheck, Quote, ChevronLeft, ChevronRight, Award } from 'lucide-react';

interface PatronReview {
  id: string;
  name: string;
  role: string;
  city: string;
  avatar: string;
  rating: number;
  date: string;
  productPurchased: string;
  quote: string;
}

const PATRON_REVIEWS: PatronReview[] = [
  {
    id: 'rev-01',
    name: 'Bà Nguyễn Khánh Linh',
    role: 'Nhà Sưu Tầm & Giám Đốc Sáng Tạo',
    city: 'TP. Hồ Chí Minh',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    rating: 5,
    date: 'Tháng 11, 2026',
    productPurchased: 'Áo Choàng Dạ Cashmere Cắt Khối Cổ Điển',
    quote:
      'Tôi từng đặt may đo tại nhiều nhà mốt danh tiếng ở Paris, nhưng đường khâu canevas lông ngựa và độ rũ của chiếc áo choàng Atelier Vérité này hoàn toàn vượt ngoài kỳ vọng. Nhẹ bẫng nhưng giữ form uy nghi lạ kỳ.',
  },
  {
    id: 'rev-02',
    name: 'Ông Trần Minh Đức',
    role: 'Kiến Trúc Sư Trưởng & Đối Tác Sáng Lập',
    city: 'Hà Nội',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    rating: 5,
    date: 'Tháng 10, 2026',
    productPurchased: 'Bộ Suit Len Super 160s Cấu Trúc Vai Mềm',
    quote:
      'Tỷ lệ vai áo và ve xếch mang đậm ngôn ngữ kiến trúc tối giản. Chất vải Super 160s có khả năng phục hồi nếp gấp kỳ diệu sau chuyến bay dài từ Tokyo về Hà Nội.',
  },
  {
    id: 'rev-03',
    name: 'Bà Valerie Dang',
    role: 'Doanh Nhân & Thành Viên Hội Đồng Nghệ Thuật',
    city: 'Đà Nẵng & Singapore',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    rating: 5,
    date: 'Tháng 11, 2026',
    productPurchased: 'Đầm Lụa Dòng Nước Cắt Xéo 30-Momme',
    quote:
      'Chất lụa 30-momme dầy dặn và mịn như ngọc trai, không hề mỏng manh như lụa công nghiệp. Dịch vụ giao hàng găng tay trắng tận cửa tại villa riêng vô cùng chỉn chu và kín đáo.',
  },
  {
    id: 'rev-04',
    name: 'Ông Charles Vũ',
    role: 'Nhà Đầu Tư Tài Chính Nghệ Thuật',
    city: 'Paris & TP. Hồ Chí Minh',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    rating: 5,
    date: 'Tháng 09, 2026',
    productPurchased: 'Măng Tô Dạ Lông Cừu Virgin Wool',
    quote:
      'Sự tinh tế của Atelier Vérité nằm ở những chi tiết ẩn: đường khâu tay hạt gạo viền ve áo, lót cupro thở êm và khuy sừng khắc chìm. Một thương hiệu Việt mang chuẩn mực Haute Couture thực thụ.',
  },
];

export const PatronReviewsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => {
    setCurrentIndex((c) => (c === 0 ? PATRON_REVIEWS.length - 1 : c - 1));
  };

  const next = () => {
    setCurrentIndex((c) => (c === PATRON_REVIEWS.length - 1 ? 0 : c + 1));
  };

  return (
    <section
      aria-label="Cảm nhận từ giới mộ điệu"
      className="py-24 border-t border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--accent)] font-medium mb-3">
              <Award className="w-3.5 h-3.5" />
              <span>VOICES OF DISTINCTION · LỜI BẢO CHỨNG TỪ GIỚI MỘ ĐIỆU</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[var(--text-primary)]">
              Dấu Ấn Trải Nghiệm Khách Hàng
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end text-[var(--accent)]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[var(--accent)]" />
                ))}
              </div>
              <span className="text-xs text-[var(--text-secondary)] font-mono mt-1 block">
                4.98 / 5.0 TỪ 1,200+ HỘI VIÊN PATRON
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                aria-label="Đánh giá trước"
                className="w-10 h-10 border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                aria-label="Đánh giá kế tiếp"
                className="w-10 h-10 border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PATRON_REVIEWS.map((review, idx) => (
            <div
              key={review.id}
              className={`p-8 border border-[var(--border)] bg-[var(--bg-page)] relative transition-all duration-300 ${
                idx === currentIndex ? 'ring-1 ring-[var(--accent)]' : ''
              }`}
            >
              <Quote className="w-8 h-8 text-[var(--text-muted)] opacity-30 absolute top-6 right-6" />

              <div className="flex items-center gap-1 text-[var(--accent)] mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[var(--accent)]" />
                ))}
              </div>

              <blockquote className="font-serif text-lg sm:text-xl text-[var(--text-primary)] font-light leading-relaxed mb-6 italic">
                "{review.quote}"
              </blockquote>

              <div className="text-xs text-[var(--accent)] font-medium mb-6 uppercase tracking-wider">
                Đã mua: {review.productPurchased}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-[var(--border)]">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-11 h-11 rounded-full object-cover grayscale"
                  loading="lazy"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {review.name}
                    </span>
                    <span title="Hội viên bảo chứng">
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] block">
                    {review.role} · {review.city}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
