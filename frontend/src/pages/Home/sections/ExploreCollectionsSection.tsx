import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

interface CollectionCard {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  itemCount: string;
  image: string;
  link: string;
  gridClass: string;
}

const COLLECTIONS: CollectionCard[] = [
  {
    id: 'women',
    tag: 'FEMININE ARCHITECTURE',
    title: 'Thời Trang Nữ',
    subtitle: 'Đầm lụa cắt canh xéo 30-momme & Áo choàng len phi cấu trúc',
    itemCount: '24 Thiết kế',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
    link: '/products?category=women',
    gridClass: 'lg:col-span-7 aspect-[16/11]',
  },
  {
    id: 'accessories',
    tag: 'HANDMADE LEATHER',
    title: 'Đồ Da & Phụ Kiện',
    subtitle: 'Túi da Box Calfskin điêu khắc hình khối đánh số thứ tự riêng',
    itemCount: '16 Kiệt tác',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=85',
    link: '/products?category=accessories',
    gridClass: 'lg:col-span-5 aspect-[4/5]',
  },
  {
    id: 'couture',
    tag: 'HAUTE COUTURE FW26',
    title: 'Bộ Sưu Tập Độc Bản',
    subtitle: 'Phục trang may đo thủ công cá nhân hóa theo từng số đo cơ thể',
    itemCount: 'Ấn bản giới hạn',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=85',
    link: '/collections',
    gridClass: 'lg:col-span-5 aspect-[4/5]',
  },
  {
    id: 'men',
    tag: 'CONTEMPORARY TAILORING',
    title: 'Thời Trang Nam',
    subtitle: 'Âu phục Savile Row phom rủ tự nhiên với nẹp ve áo sắc nét',
    itemCount: '28 Thiết kế',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85',
    link: '/products?category=men',
    gridClass: 'lg:col-span-7 aspect-[16/11]',
  },
];

export const ExploreCollectionsSection: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section
      data-testid="section-explore-collections"
      className="w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3 text-[11px] font-mono tracking-[0.25em] text-[var(--accent)] uppercase font-semibold">
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30">02</span>
              <span>KHÁM PHÁ DANH MỤC · EXPLORE REALMS</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[var(--text-primary)] font-normal tracking-tight">
              Bốn phân khu tạo tác hình thể
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans font-light leading-relaxed">
              Mỗi danh mục đại diện cho một ngôn ngữ may đo riêng biệt, phát triển từ phom dáng kiến trúc đương đại và chất liệu tuyển chọn từ Paris, Como và Yorkshire.
            </p>
          </div>

          <Link
            to="/collections"
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors self-start md:self-end font-semibold pb-1 border-b border-[var(--text-primary)]/40 hover:border-[var(--accent)]"
          >
            <span>Toàn bộ bộ sưu tập</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Asymmetric Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-stretch">
          {COLLECTIONS.map((col) => {
            const isHovered = hoveredId === col.id;
            return (
              <Link
                key={col.id}
                to={col.link}
                onMouseEnter={() => setHoveredId(col.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-lg transition-all duration-700 block ${col.gridClass}`}
              >
                {/* Background Image with Zoom */}
                <img
                  src={col.image}
                  alt={col.title}
                  className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${
                    isHovered ? 'scale-105' : 'scale-100'
                  }`}
                  loading="lazy"
                />

                {/* Editorial Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 transition-opacity duration-500" />

                {/* Top Badge: Item count & Tag */}
                <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-white/90">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase bg-black/40 backdrop-blur-md border border-white/20 font-medium">
                    {col.tag}
                  </span>
                  <span className="text-[11px] font-mono tracking-wider text-white/80">
                    {col.itemCount}
                  </span>
                </div>

                {/* Bottom Content Area */}
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-2xl sm:text-3xl text-white font-normal group-hover:text-[#D4AF37] transition-colors">
                        {col.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-white/80 font-sans font-light line-clamp-2 mt-1">
                        {col.subtitle}
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 group-hover:bg-[#D4AF37] group-hover:text-black group-hover:border-[#D4AF37] transition-all duration-300">
                      <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
