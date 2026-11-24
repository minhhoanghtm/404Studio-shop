import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, ShieldCheck, Sparkles } from 'lucide-react';

export const BrandManifestoSection: React.FC = () => {
  return (
    <section
      data-testid="section-brand-manifesto"
      className="relative w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header Meta */}
        <div className="flex items-center justify-between pb-6 mb-16 border-b border-[var(--border)] text-[11px] font-mono tracking-[0.25em] text-[var(--accent)] uppercase font-semibold">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30">01</span>
            <span>TÔN CHỈ THƯƠNG HIỆU · BRAND MANIFESTO</span>
          </div>
          <span className="hidden sm:inline-block text-[var(--text-muted)]">EST. 2026 · ATELIER VÉRITÉ PARIS</span>
        </div>

        {/* Asymmetric Split Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Bold Editorial Typography */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <span className="text-xs uppercase font-mono tracking-[0.3em] text-[var(--accent)] block font-medium">
                PHILOSOPHY OF ARCHITECTURAL SILHOUETTES
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[var(--text-primary)] leading-[1.12] tracking-tight font-normal">
                Chúng tôi không theo đuổi xu hướng tạm thời. Chúng tôi điêu khắc{' '}
                <span className="italic font-light text-[var(--accent)]">phom dáng kiến trúc</span> tồn tại vượt thời gian.
              </h2>
            </div>

            <p className="text-sm sm:text-base text-[var(--text-secondary)] font-sans font-light leading-relaxed max-w-2xl">
              Tại Atelier Vérité, mỗi nếp gấp của vải wool hai mặt và từng đường cắt canh xéo của lụa tơ tằm 30-momme đều được tính toán theo chuyển động cơ học tự nhiên của cơ thể. Tối giản trong cảm nhận thị giác, nhưng đạt độ chính xác của kỹ nghệ may đo thủ công Savile Row kết hợp Haute Couture Pháp.
            </p>

            {/* Atelier Key Pillars */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[var(--border)]">
              <div>
                <p className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)] font-medium">100%</p>
                <p className="text-[11px] font-mono tracking-wider text-[var(--text-muted)] uppercase mt-1">Sợi tự nhiên</p>
              </div>
              <div>
                <p className="font-serif text-2xl sm:text-3xl text-[var(--accent)] font-medium">30M</p>
                <p className="text-[11px] font-mono tracking-wider text-[var(--text-muted)] uppercase mt-1">Lụa Mulberry cao cấp</p>
              </div>
              <div>
                <p className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)] font-medium">0%</p>
                <p className="text-[11px] font-mono tracking-wider text-[var(--text-muted)] uppercase mt-1">Sợi nhựa Polyester</p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-6">
              <Link
                to="/about"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs uppercase tracking-widest font-mono font-semibold bg-[var(--text-primary)] text-[var(--inverse-text)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-md group"
              >
                <span>Khám phá triết lý may đo</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/journal"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                <span>Đọc bản thảo khảo luận</span>
                <span className="text-sm">→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Frame with Tailoring Details */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden border border-[var(--border)] shadow-xl group">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85"
                alt="Người mẫu diện âu phục kiến trúc Atelier Vérité"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#D4AF37] mb-1">
                  ATELIER ARCHIVES · LOOK 01
                </span>
                <p className="font-serif text-xl sm:text-2xl text-white font-normal mb-1">
                  Đầm Lụa Charmeuse Canh Xéo
                </p>
                <p className="text-xs text-white/70 font-sans font-light">
                  Phom dáng rủ tự nhiên với cấu trúc nếp gấp kép, may đo thủ công tại xưởng Paris.
                </p>
              </div>
            </div>

            {/* Floating Luxury Stamp Pill */}
            <div className="absolute -bottom-6 -left-4 sm:-left-6 p-4 rounded-xl bg-[var(--bg-card)]/95 border border-[var(--border)] shadow-2xl backdrop-blur-md hidden sm:flex items-center gap-3 max-w-xs">
              <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-serif font-medium text-[var(--text-primary)]">Quy chuẩn May đo Độc bản</p>
                <p className="text-[10px] font-mono text-[var(--text-muted)]">Chỉ 50 sản phẩm mỗi đợt cắt</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
