import React from 'react';
import { vi } from '../../../shared/locales/vi/common';

export const ManifestoSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 px-6 sm:px-8 border-y border-black/5 dark:border-white/10 bg-ivory-100/80 dark:bg-noir-900/40">
      <div className="max-w-5xl mx-auto text-center">
        <span className="text-xs uppercase tracking-widest text-champagne font-semibold block mb-4">
          Tuyên ngôn sáng tạo Maison
        </span>
        <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl text-white tracking-wide leading-tight mb-8">
          &ldquo;{vi.brand.slogan}&rdquo;
        </h2>
        <p className="text-sm sm:text-base text-platinum-dark max-w-2xl mx-auto font-sans font-light leading-relaxed mb-10">
          Atelier Vérité vận hành tại giao lộ giữa kỷ luật kiến trúc nghiêm cẩn và nét uyển chuyển tự nhiên của cơ thể người. Mỗi sản phẩm được dựng mẫu trực tiếp trên manocanh tại xưởng Paris, cắt theo canh xéo hoàn hảo và dệt may giới hạn bởi các khung cửi trăm năm châu Âu.
        </p>
        <div className="flex items-center justify-center gap-8 text-xs uppercase tracking-widest text-white/50">
          <span>Len lông cừu Virgin</span>
          <span className="w-1.5 h-1.5 rounded-full bg-champagne" />
          <span>Lụa Tơ Tằm 30-Momme</span>
          <span className="w-1.5 h-1.5 rounded-full bg-champagne" />
          <span>Da Thảo Mộc Pháp</span>
        </div>
      </div>
    </section>
  );
};
