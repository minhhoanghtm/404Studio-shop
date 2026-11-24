import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Eye, ShoppingBag, Sparkles } from 'lucide-react';
import { useCartStore } from '../../../shared/stores/useCartStore';
import { formatCurrency } from '../../../shared/utils/formatters';

interface LookHotspot {
  id: string;
  xPercent: number;
  yPercent: number;
  productName: string;
  category: string;
  price: number;
  productSlug: string;
  image: string;
}

interface RunwayLook {
  id: string;
  lookNumber: string;
  title: string;
  caption: string;
  image: string;
  hotspots: LookHotspot[];
}

const RUNWAY_LOOKS: RunwayLook[] = [
  {
    id: 'look-01',
    lookNumber: 'LOOK 01 / SS26',
    title: 'Dáng Áo Khoác Len Khối Monolithic',
    caption: 'Len virgin wool hai mặt dệt thủ công tại Yorkshire với đường cầu vai điêu khắc sắc nét.',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=85',
    hotspots: [
      {
        id: 'hs-01',
        xPercent: 48,
        yPercent: 35,
        productName: 'Áo Khoác Len Monolithic Sculpted Coat',
        category: 'Haute Couture',
        price: 8500000,
        productSlug: 'sculpted-wool-coat',
        image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'hs-02',
        xPercent: 62,
        yPercent: 65,
        productName: 'Quần Âu Ống Suông Wool Trouser',
        category: 'May đo kiến trúc',
        price: 3200000,
        productSlug: 'wide-leg-wool-trousers',
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80',
      },
    ],
  },
  {
    id: 'look-02',
    lookNumber: 'LOOK 02 / SS26',
    title: 'Đầm Lụa Charmeuse Canh Xéo',
    caption: 'Lụa tơ tằm hữu cơ 30-momme rủ dài mềm mại theo dáng chuyển động cơ học tự nhiên.',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1400&q=85',
    hotspots: [
      {
        id: 'hs-03',
        xPercent: 52,
        yPercent: 45,
        productName: 'Đầm Lụa Charmeuse Liquid Silk Dress',
        category: 'Thời trang Nữ',
        price: 6800000,
        productSlug: 'liquid-silk-evening-dress',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80',
      },
    ],
  },
  {
    id: 'look-03',
    lookNumber: 'LOOK 03 / SS26',
    title: 'Âu Phục Tailoring Phi Cấu Trúc',
    caption: 'Suit hai hàng khuy dáng rủ nhẹ phóng khoáng, nẹp ve áo sắc sảo chuẩn xưởng may Paris.',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1400&q=85',
    hotspots: [
      {
        id: 'hs-04',
        xPercent: 46,
        yPercent: 40,
        productName: 'Blazer Double-Breasted Deconstructed',
        category: 'Thời trang Nam',
        price: 7200000,
        productSlug: 'oversized-double-breasted-suit',
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'hs-05',
        xPercent: 32,
        yPercent: 68,
        productName: 'Túi Da Box Obsidian Leather Tote',
        category: 'Đồ da & Phụ kiện',
        price: 4900000,
        productSlug: 'obsidian-leather-tote',
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80',
      },
    ],
  },
];

export const InteractiveLookbookSection: React.FC = () => {
  const [activeLookIndex, setActiveLookIndex] = useState(0);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const { addItem } = useCartStore();

  const currentLook = RUNWAY_LOOKS[activeLookIndex];

  const handleQuickAdd = (hs: LookHotspot, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: hs.id,
      productSlug: hs.productSlug,
      name: hs.productName,
      price: hs.price,
      quantity: 1,
      selectedColor: 'Phiên bản Runway',
      selectedColorHex: '#d4af37',
      selectedSize: 'M',
      image: hs.image,
    });
  };

  return (
    <section
      data-testid="section-interactive-lookbook"
      className="w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header Meta */}
        <div className="flex items-center justify-between pb-6 mb-16 border-b border-[var(--border)] text-[11px] font-mono tracking-[0.25em] text-[var(--accent)] uppercase font-semibold">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30">04</span>
            <span>SỔ PHỐI ĐỒ TƯƠNG TÁC · INTERACTIVE LOOKBOOK</span>
          </div>
          <span className="hidden sm:inline-block text-[var(--text-muted)]">KHÁM PHÁ CHI TIẾT TRÊN NGƯỜI MẪU RUNWAY</span>
        </div>

        {/* Title and Look Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[var(--accent)] font-medium">
              SPRING / SUMMER 2026 RUNWAY
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[var(--text-primary)] font-normal tracking-tight">
              Khám phá trang phục theo từng cử chỉ
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans font-light leading-relaxed">
              Nhấp vào các điểm đánh dấu trên hình ảnh người mẫu để mở thông tin may đo, giá bán và thêm nhanh sản phẩm vào túi may đo.
            </p>
          </div>

          {/* Look Switcher Pills */}
          <div className="flex items-center gap-2 p-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
            {RUNWAY_LOOKS.map((look, idx) => (
              <button
                key={look.id}
                onClick={() => {
                  setActiveLookIndex(idx);
                  setActiveHotspotId(null);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase transition-all duration-300 ${
                  activeLookIndex === idx
                    ? 'bg-[var(--text-primary)] text-[var(--inverse-text)] font-bold shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                0{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Main Lookbook Canvas with Hotspots */}
        <div className="relative aspect-[16/11] sm:aspect-[16/9] lg:aspect-[21/9] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl group">
          {/* Main Look Photo */}
          <img
            src={currentLook.image}
            alt={currentLook.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
            loading="lazy"
          />

          {/* Cinematic Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

          {/* Bottom Look Editorial Information */}
          <div className="absolute bottom-8 left-8 right-8 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4 pointer-events-none">
            <div className="space-y-1.5 max-w-xl">
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#D4AF37] block font-medium">
                {currentLook.lookNumber}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-white font-normal">
                {currentLook.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/80 font-sans font-light line-clamp-2">
                {currentLook.caption}
              </p>
            </div>

            <Link
              to="/lookbooks"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-widest text-black bg-[#D4AF37] hover:bg-white transition-all shadow-md font-semibold pointer-events-auto self-start sm:self-end"
            >
              <span>Xem ấn phẩm Runway</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Interactive Hotspot Pins */}
          {currentLook.hotspots.map((hs) => {
            const isOpen = activeHotspotId === hs.id;
            return (
              <div
                key={hs.id}
                style={{ top: `${hs.yPercent}%`, left: `${hs.xPercent}%` }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
              >
                {/* Hotspot Pulsing Button */}
                <button
                  type="button"
                  onClick={() => setActiveHotspotId(isOpen ? null : hs.id)}
                  aria-label={`Xem sản phẩm ${hs.productName}`}
                  className="relative w-9 h-9 rounded-full bg-white/90 text-noir-950 shadow-2xl flex items-center justify-center transition-transform hover:scale-125 focus:outline-none"
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <Plus className={`w-4 h-4 text-black transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                </button>

                {/* Floating Glassmorphism Product Card Popover */}
                {isOpen && (
                  <div
                    className="absolute top-12 left-1/2 -translate-x-1/2 w-72 sm:w-80 p-4 rounded-xl bg-[var(--bg-card)]/95 border border-[var(--border)] shadow-2xl backdrop-blur-xl text-[var(--text-primary)] z-30 transition-all animate-fadeIn"
                  >
                    <div className="flex gap-3">
                      <img
                        src={hs.image}
                        alt={hs.productName}
                        className="w-20 h-24 object-cover rounded-lg border border-[var(--border)] shrink-0"
                      />
                      <div className="flex flex-col justify-between overflow-hidden">
                        <div>
                          <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--accent)] font-medium block truncate">
                            {hs.category}
                          </span>
                          <h4 className="text-xs font-serif font-medium text-[var(--text-primary)] line-clamp-2 mt-0.5 leading-snug">
                            {hs.productName}
                          </h4>
                        </div>
                        <p className="text-xs font-serif font-semibold text-[var(--accent)]">
                          {formatCurrency(hs.price)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(hs, e)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-mono uppercase tracking-wider font-semibold bg-[var(--text-primary)] text-[var(--inverse-text)] hover:bg-[var(--accent)] hover:text-white transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Thêm túi</span>
                      </button>
                      <Link
                        to={`/products/${hs.productSlug}`}
                        className="px-3 py-2 rounded-lg text-[11px] font-mono uppercase tracking-wider font-semibold border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chi tiết</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
