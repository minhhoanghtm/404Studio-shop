import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, TrendingUp, ArrowRight, Plus } from 'lucide-react';
import { useHomeRecommendations } from '../hooks/useHomeRecommendations';
import { formatCurrency } from '../../../shared/utils/formatters';
import { useCartStore } from '../../../shared/stores/useCartStore';

export const TrendingBestsellersSection: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'bestseller' | 'trending'>('bestseller');
  const { products, loading } = useHomeRecommendations(activeMode === 'bestseller' ? 'best-sellers' : 'trending');
  const { addItem } = useCartStore();

  return (
    <section
      data-testid="section-trending-bestsellers"
      className="w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header Meta */}
        <div className="flex items-center justify-between pb-6 mb-16 border-b border-[var(--border)] text-[11px] font-mono tracking-[0.25em] text-[var(--accent)] uppercase font-semibold">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30">06</span>
            <span>PHOM DÁNG BIỂU TƯỢNG · ICONIC SILHOUETTES</span>
          </div>
          <span className="hidden sm:inline-block text-[var(--text-muted)]">DỰA TRÊN DỮ LIỆU ĐẶT MAY THỰC TẾ</span>
        </div>

        {/* Section Title & Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[var(--accent)] font-medium">
              DEFINITIVE PIECES
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[var(--text-primary)] font-normal tracking-tight">
              Những phom dáng định hình mùa mốt
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans font-light leading-relaxed">
              Các thiết kế nhận được nhiều lượt đặt may đo nhất từ giới mộ điệu, được tôn vinh nhờ cấu trúc đường cắt sắc sảo và sự thoải mái trong đời sống thực.
            </p>
          </div>

          {/* Toggle between Best Sellers & Trending */}
          <div className="flex items-center gap-2 p-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)] self-start md:self-end">
            <button
              type="button"
              onClick={() => setActiveMode('bestseller')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-300 ${
                activeMode === 'bestseller'
                  ? 'bg-[var(--text-primary)] text-[var(--inverse-text)] font-bold shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Bán Chạy Nhất</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('trending')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-300 ${
                activeMode === 'trending'
                  ? 'bg-[var(--text-primary)] text-[var(--inverse-text)] font-bold shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Thịnh Hành Runway</span>
            </button>
          </div>
        </div>

        {/* 4 Ranked Silhouette Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading
            ? [1, 2, 3, 4].map((n) => (
                <div key={n} className="space-y-4 animate-pulse">
                  <div className="aspect-[3/4] bg-[var(--bg-card)] rounded-xl" />
                  <div className="h-4 bg-[var(--bg-card)] rounded w-2/3" />
                </div>
              ))
            : products.slice(0, 4).map((product, idx) => (
                <article
                  key={product.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                >
                  {/* Top Ranking Badge */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-[var(--bg-page)]">
                    <img
                      src={product.featuredImage}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase bg-black/75 text-[#D4AF37] border border-[#D4AF37]/30 backdrop-blur-md font-bold">
                        NO. 0{idx + 1}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-mono tracking-wider uppercase text-[var(--text-muted)]">
                        {product.subCategory || 'Haute Couture'}
                      </p>
                      <Link
                        to={`/products/${product.slug}`}
                        className="font-serif text-base text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1 font-medium mt-1"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-[var(--text-secondary)] font-sans font-light line-clamp-2 mt-1">
                        {product.composition || '100% Sợi tự nhiên may đo kiến trúc'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[var(--border)]/70 flex items-center justify-between gap-3">
                      <span className="font-serif text-base font-semibold text-[var(--accent)]">
                        {formatCurrency(product.price)}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const variant = product.variants?.[0];
                          addItem({
                            productId: product.id,
                            productSlug: product.slug,
                            name: product.name,
                            price: product.price,
                            quantity: 1,
                            selectedColor: variant?.colorName || 'Phiên bản tiêu chuẩn',
                            selectedColorHex: variant?.colorHex || '#d4af37',
                            selectedSize: 'M',
                            image: product.featuredImage,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold bg-[var(--text-primary)] text-[var(--inverse-text)] hover:bg-[var(--accent)] hover:text-white transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Túi</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
        </div>
      </div>
    </section>
  );
};
