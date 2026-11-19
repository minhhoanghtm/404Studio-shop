import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ThreeRibbonOrbs } from '../../../shared/threeui/ThreeRibbonOrbs';
import { COLLECTIONS } from '../../../shared/data/collections';

export const FeaturedCollections: React.FC = () => {
  const collection = COLLECTIONS[0]; // Noir Absolu

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Visual Stage with 3D Orbit Mesh */}
        <div className="lg:col-span-7 relative h-[420px] sm:h-[540px] rounded-2xl overflow-hidden bg-noir-900 border border-white/10">
          <ThreeRibbonOrbs />
          <div className="absolute inset-0 bg-gradient-to-t from-noir-950 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
            <span className="text-[10px] font-mono tracking-widest text-champagne uppercase block mb-1">
              Phòng trưng bày 3D Tương tác
            </span>
            <p className="text-xs text-white/70 font-sans">
              Trường hạt & dải ribbon điêu khắc ảo biểu trưng cho cấu trúc sợi dệt hữu cơ.
            </p>
          </div>
        </div>

        {/* Narrative */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-champagne animate-pulse" />
            <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase">
              Bộ sưu tập Runway Tiêu điểm
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl text-white tracking-wide leading-tight">
            {collection.title}
          </h2>

          <p className="font-serif italic text-lg text-champagne-light">
            {collection.subtitle}
          </p>

          <p className="text-sm font-sans text-platinum-dark leading-relaxed font-light">
            {collection.description}
          </p>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/10 text-xs font-sans">
            <div>
              <span className="text-white/40 uppercase tracking-widest block text-[10px]">Mùa trình diễn</span>
              <span className="text-white font-medium mt-0.5 block">{collection.season}</span>
            </div>
            <div>
              <span className="text-white/40 uppercase tracking-widest block text-[10px]">Số lượng giới hạn</span>
              <span className="text-white font-medium mt-0.5 block">{collection.itemCount} sản phẩm độc bản</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              to={`/collections/${collection.slug}`}
              className="px-6 py-3.5 bg-champagne hover:bg-champagne-hover text-noir-950 text-xs font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <span>Xem toàn bộ Runway</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/collections"
              className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold uppercase tracking-widest transition-colors flex items-center justify-center border border-white/10"
            >
              <span>Tất cả các mùa</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
