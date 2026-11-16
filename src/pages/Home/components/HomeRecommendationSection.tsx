import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Clock, Award, ArrowRight, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { ProductCard } from '../../../shared/components/ProductCard';
import { useHomeRecommendations, RecommendationTab } from '../hooks/useHomeRecommendations';
import { useConsentStore } from '../../../shared/consent';
import { useBehaviorTracking } from '../../../shared/tracking/useBehaviorTracking';

export const HomeRecommendationSection: React.FC = () => {
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

  const tabs: Array<{ id: RecommendationTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'for-you', label: 'Dành riêng cho bạn', icon: Sparkles },
    { id: 'trending', label: 'Đang được yêu thích', icon: TrendingUp },
    { id: 'new-arrivals', label: 'Hàng mới về', icon: Clock },
    { id: 'best-sellers', label: 'Bán chạy nhất', icon: Award },
  ];

  const getSectionHeading = () => {
    switch (tab) {
      case 'for-you':
        return hasPersonalizationConsent && mode === 'personalized'
          ? {
              subtitle: 'Đặc quyền phong cách Haute Couture',
              title: 'Dành Riêng Cho Quý Khách',
              desc: 'Gợi ý thông minh dựa trên lịch sử tương tác, danh mục quan tâm và phong cách thẩm mỹ riêng biệt của quý khách.',
            }
          : {
              subtitle: 'Tuyển tập tinh hoa Atelier',
              title: 'Có Thể Quý Khách Sẽ Thích',
              desc: 'Các tác phẩm may đo biểu tượng được chế tác thủ công với phom dáng kiến trúc và chất liệu thượng hạng.',
            };
      case 'trending':
        return {
          subtitle: 'Xu hướng sàn Runway quốc tế',
          title: 'Kiểu Dáng Được Tìm Kiếm Nhiều Nhất',
          desc: 'Những thiết kế được công chúng mộ điệu và giới thượng lưu ưu ái lựa chọn trong mùa mốt Thu/Đông 2026.',
        };
      case 'new-arrivals':
        return {
          subtitle: 'Ấn bản phát hành đợt đầu',
          title: 'Tác Phẩm Mới Ra Mắt',
          desc: 'Các tuyệt tác vừa hoàn thiện từ xưởng may Paris và Como, sản xuất giới hạn theo từng đợt cắt vải.',
        };
      case 'best-sellers':
        return {
          subtitle: 'Kiệt tác khẳng định đẳng cấp',
          title: 'Tác Phẩm Bán Chạy Nhất',
          desc: 'Những bộ trang phục và phụ kiện da được đặt may nhiều nhất bởi các thành viên danh dự của Maison.',
        };
    }
  };

  const heading = getSectionHeading();

  return (
    <section
      data-testid="home-recommendation-section"
      className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10"
    >
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="space-y-3 max-w-2xl">
          <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> {heading.subtitle}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
            {heading.title}
          </h2>
          <p className="text-xs sm:text-sm text-platinum-dark font-sans font-light leading-relaxed">
            {heading.desc}
          </p>
        </div>

        {/* Action Link */}
        <Link
          to="/products"
          className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white hover:text-champagne transition-colors self-start md:self-end"
        >
          <span>Xem toàn bộ bộ sưu tập</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Luxury Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-10 pb-4 border-b border-white/5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              data-testid={`rec-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-300 ${
                isActive
                  ? 'bg-champagne text-noir-950 font-semibold shadow-lg shadow-champagne/10'
                  : 'bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.08] border border-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-noir-950' : 'text-champagne'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Privacy Notice Pill for 'for-you' tab when consent is not yet granted */}
      {tab === 'for-you' && !hasPersonalizationConsent && (
        <div
          data-testid="personalization-consent-notice"
          className="mb-8 p-4 rounded-xl bg-white/[0.02] border border-champagne/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/70"
        >
          <div className="flex items-center gap-2.5 text-white/80">
            <ShieldCheck className="w-4 h-4 text-champagne shrink-0" />
            <span>
              Quý khách đang xem danh mục phổ quát. Để nhận đề xuất cá nhân hóa theo phong cách riêng, vui lòng bật tùy chọn <strong>Cá nhân hóa</strong> trong quyền riêng tư.
            </span>
          </div>
          <button
            type="button"
            onClick={openPreferences}
            className="inline-flex items-center gap-1.5 text-champagne hover:underline uppercase text-[11px] font-semibold tracking-wider shrink-0"
          >
            <SlidersHorizontal className="w-3 h-3" /> Cài đặt quyền riêng tư
          </button>
        </div>
      )}

      {/* Product Display Stage */}
      {loading ? (
        // Skeleton Shimmer Loading State
        <div
          data-testid="recommendation-skeleton"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex flex-col space-y-3 animate-pulse">
              <div className="w-full aspect-[4/5] bg-white/[0.04] rounded-xl" />
              <div className="h-4 bg-white/[0.06] rounded w-3/4" />
              <div className="h-3 bg-white/[0.03] rounded w-1/2" />
              <div className="h-4 bg-white/[0.05] rounded w-1/3 pt-1" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div
          data-testid="recommendation-product-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {products.map((product, idx) => (
            <div
              key={product.id || idx}
              onClick={() => trackRecommendationClick(product.id, tab, idx + 1)}
            >
              <ProductCard product={product} aspectRatio="editorial" />
            </div>
          ))}
        </div>
      ) : (
        // Empty State Fallback
        <div
          data-testid="recommendation-empty-state"
          className="py-16 text-center space-y-4 rounded-2xl bg-white/[0.01] border border-white/5"
        >
          <Sparkles className="w-8 h-8 text-champagne/40 mx-auto" />
          <h3 className="font-serif text-lg text-white">Chưa có tác phẩm phù hợp</h3>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            Hệ thống đang cập nhật các thiết kế mới nhất. Quý khách vui lòng khám phá toàn bộ danh mục sản phẩm.
          </p>
          <Link
            to="/products"
            className="inline-block mt-2 px-6 py-2.5 rounded-full bg-champagne text-noir-950 font-semibold text-xs uppercase tracking-wider hover:bg-champagne-light transition-colors"
          >
            Khám phá cửa hàng
          </Link>
        </div>
      )}
    </section>
  );
};
