import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';

export const FinalEditorialCtaSection: React.FC = () => {
  const handleOpenAi = () => {
    window.dispatchEvent(
      new CustomEvent('open-stylist-ai', {
        detail: {
          prompt: 'Xin chào Stylist AI, tôi muốn được tư vấn một outfit dạ tiệc sang trọng từ bộ sưu tập mới nhất.',
        },
      })
    );
  };

  return (
    <section
      aria-label="Lời mời trải nghiệm Haute Couture"
      className="editorial-dark-section relative py-24 sm:py-28 border-t border-[var(--border)] overflow-hidden bg-black text-white"
    >
      {/* Editorial Background Image with luxurious haute couture lighting */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=2000&q=85"
          alt="Atelier Vérité Runway Finale"
          className="w-full h-full object-cover object-center opacity-50 sm:opacity-55 scale-105 transition-transform duration-1000 ease-out hover:scale-100"
          loading="lazy"
        />
        {/* Balanced luxury radial vignette: transparent in center, dark at edges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0.85)_100%)]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center" style={{ color: '#ffffff' }}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[var(--accent)]/50 bg-black/70 backdrop-blur-md text-[11px] uppercase tracking-[0.3em] text-[var(--accent)] mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="font-medium">JOIN THE ATELIER CIRCLE · ĐẶC QUYỀN THƯỢNG LƯU</span>
        </div>

        <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl tracking-tight mb-6 font-light leading-tight drop-shadow-md text-white" style={{ color: '#ffffff' }}>
          Nơi Vẻ Đẹp Vĩnh Cửu
          <br />
          <span className="italic font-normal text-white" style={{ color: '#ffffff' }}>Gặp Gỡ Bản Lĩnh Cá Nhân</span>
        </h2>

        <p className="max-w-2xl mx-auto text-sm sm:text-base font-light leading-relaxed mb-10 drop-shadow-sm text-white/90" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          Mỗi tác phẩm may đo là một tuyên ngôn tĩnh lặng về đẳng cấp. Khám phá toàn cảnh bộ sưu tập
          hoặc để Trợ lý Phong cách AI đồng hành cùng quý khách tạo tác phong thái riêng biệt.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/collections"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black text-xs uppercase tracking-[0.25em] font-semibold hover:bg-neutral-200 transition-all duration-300 shadow-xl"
          >
            <span>Chiêm Ngưỡng Bộ Sưu Tập</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={handleOpenAi}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 border border-[var(--accent)]/60 bg-black/60 text-white text-xs uppercase tracking-[0.25em] font-medium hover:bg-[var(--accent)]/20 hover:border-[var(--accent)] transition-all duration-300 backdrop-blur-sm shadow-xl cursor-pointer"
            style={{ color: '#ffffff' }}
          >
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <span>Trò Chuyện Cùng Stylist AI</span>
          </button>
        </div>

        <div className="mt-16 pt-8 border-t border-white/20 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-[11px] uppercase tracking-[0.22em] text-white/70" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          <span>Paris · Milan · Tokyo · Sài Gòn</span>
          <span className="opacity-40">·</span>
          <span>Thử đồ tại tư gia bảo an</span>
          <span className="opacity-40">·</span>
          <span>May đo thủ công độc bản</span>
        </div>
      </div>
    </section>
  );
};
