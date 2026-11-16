import React from 'react';
import { COLLECTIONS } from '@/shared/data/collections';
import { CollectionCard } from './components/CollectionCard';
import { Sparkles } from 'lucide-react';
import { vi } from '@/shared/locales/vi/common';

export const CollectionsPage: React.FC = () => {
  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-20">
        {/* Editorial Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-champagne/30 text-champagne text-[10px] uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Hồ sơ lưu trữ Runway
          </div>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-wide">
            Bộ sưu tập & Trình diễn Runway
          </h1>
          <p className="text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
            Mỗi bộ sưu tập là một công trình nghiên cứu thực nghiệm về hình học cấu trúc, nguồn gốc nguyên liệu thô và khoảng trống không gian. Khám phá các sổ phối đồ lưu trữ và sàn diễn thời trang qua từng mùa.
          </p>
        </div>

        {/* Collections Stack */}
        <div className="space-y-24">
          {COLLECTIONS.map((col, index) => (
            <CollectionCard key={col.id} collection={col} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};
