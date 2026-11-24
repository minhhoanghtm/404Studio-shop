import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Clock, Award, ArrowRight, ShieldCheck, Plus } from 'lucide-react';
import { ProductCard } from '../../../shared/components/ProductCard';
import { useHomeRecommendations, RecommendationTab } from '../hooks/useHomeRecommendations';
import { useConsentStore } from '../../../shared/consent';
import { useBehaviorTracking } from '../../../shared/tracking/useBehaviorTracking';
import { useCartStore } from '../../../shared/stores/useCartStore';

export const CuratedForYouSection: React.FC = () => {
  const {
    tab,
    setTab,
    products,
    mode,
    loading,
    hasPersonalizationConsent,
  } = useHomeRecommendations('for-you');

  const { openPreferences } = useConsentStore();
  const { trackRecommendationClick } = useBehaviorTracking();
  const { addItem } = useCartStore();

  const tabs: Array<{ id: RecommendationTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'for-you', label: 'Dành Riêng Cho Quý Khách', icon: Sparkles },
    { id: 'trending', label: 'Đang Được Yêu Thích', icon: TrendingUp },
    { id: 'new-arrivals', label: 'Mới Phát Hành', icon: Clock },
    { id: 'best-sellers', label: 'Kiệt Tác Bán Chạy', icon: Award },
  ];

  const getSectionHeading = () => {
    switch (tab) {
      case 'for-you':
        return hasPersonalizationConsent && mode === 'personalized'
          ? {
              subtitle: 'ĐẶC QUYỀN PHONG CÁCH HAUTE COUTURE',
              title: 'Tuyển chọn cá nhân hóa riêng biệt',
              desc: 'Gợi ý thông minh dựa trên lịch sử tương tác, danh mục quan tâm và phong cách thẩm mỹ riêng biệt của quý khách.',
            }
          : {
              subtitle: 'TUYỂN TẬP TINH HOA ATELIER VÉRITÉ',
              title: 'Có thể quý khách sẽ thích',
              desc: 'Các sản phẩm may đo biểu tượng được chế tác thủ công với phom dáng kiến trúc và chất liệu thượng hạng.',
            };
      case 'trending':
        return {
          subtitle: 'XU HƯỚNG SÀN RUNWAY QUỐC TẾ',
          title: 'Kiểu dáng được tìm kiếm nhiều nhất',
          desc: 'Những thiết kế được giới mộ điệu ưu ái lựa chọn trong mùa mốt Xuân Hè 2026.',
        };
      case 'new-arrivals':
        return {
          subtitle: 'ẤN BẢN PHÁT HÀNH ĐỢT ĐẦU',
          title: 'Sản phẩm mới ra mắt',
          desc: 'Các tuyệt tác vừa hoàn thiện từ xưởng may Paris và Como, sản xuất giới hạn theo từng đợt cắt vải.',
        };
      case 'best-sellers':
        return {
          subtitle: 'KIỆT TÁC KHẲNG ĐỊNH ĐẲNG CẤP',
          title: 'Sản phẩm bán chạy nhất',
          desc: 'Những bộ trang phục và phụ kiện da được đặt may nhiều nhất bởi các thành viên danh dự của Maison.',
        };
    }
  };

  const heading = getSectionHeading();

  return (
    <section
      data-testid="section-curated-for-you"
      className="w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header Meta */}
        <div className="flex items-center justify-between pb-6 mb-16 border-b border-[var(--border)] text-[11px] font-mono tracking-[0.25em] text-[var(--accent)] uppercase font-semibold">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30">03</span>
            <span>CÁ NHÂN HÓA THỜI TRANG · CURATED FOR YOU</span>
          </div>
          <div className="flex items-center gap-2">
            {hasPersonalizationConsent ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--accent)]">
                <ShieldCheck className="w-3.5 h-3.5" /> Thuật toán cá nhân hóa AI kích hoạt
              </span>
            ) : (
              <button
                type="button"
                onClick={openPreferences}
                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] underline transition-colors"
              >
                Cài đặt quyền riêng tư
              </button>
            )}
          </div>
        </div>

        {/* Title and Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[var(--accent)] font-medium">
              {heading.subtitle}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[var(--text-primary)] font-normal tracking-tight">
              {heading.title}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans font-light leading-relaxed">
              {heading.desc}
            </p>
          </div>

          <Link
            to="/products"
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors self-start md:self-end font-semibold pb-1 border-b border-[var(--text-primary)]/40 hover:border-[var(--accent)]"
          >
            <span>Toàn bộ sản phẩm</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Luxury Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-12 pb-4 border-b border-[var(--border)]">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'bg-[var(--text-primary)] text-[var(--inverse-text)] shadow-md font-bold'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--accent)]' : ''}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="space-y-4 animate-pulse">
                <div className="aspect-[3/4] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl" />
                <div className="h-4 bg-[var(--bg-card)] rounded w-3/4" />
                <div className="h-3 bg-[var(--bg-card)] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] space-y-3">
            <Sparkles className="w-8 h-8 mx-auto text-[var(--accent)]" />
            <p className="text-sm font-serif">Đang hoàn tất quá trình chọn lọc sản phẩm cho danh mục này.</p>
            <Link to="/products" className="inline-block text-xs uppercase tracking-widest font-mono text-[var(--accent)] underline">
              Xem cửa hàng chính
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {products.slice(0, 4).map((product, idx) => (
              <div
                key={product.id}
                onClick={() => trackRecommendationClick(product.id, tab, idx)}
                className="group flex flex-col justify-between"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
