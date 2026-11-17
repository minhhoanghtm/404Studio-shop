import React from 'react';
import { Link } from 'react-router-dom';
import { JOURNAL_ARTICLES } from '@/shared/data/journal';
import { JournalCard } from './components/JournalCard';
import { ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { vi } from '@/shared/locales/vi/common';

export const JournalPage: React.FC = () => {
  const featured = JOURNAL_ARTICLES[0];
  const others = JOURNAL_ARTICLES.slice(1);

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Editorial Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-champagne/30 text-champagne text-[10px] uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Tạp chí & Khảo luận Thời trang
          </div>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-wide">
            Tạp chí Atelier Vérité
          </h1>
          <p className="text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
            Những khảo cứu chuyên sâu về vật lý sợi dệt, hành trình viếng thăm các xưởng dệt bậc thầy khắp châu Âu và ghi chép giám tuyển từ Giám đốc Sáng tạo.
          </p>
        </div>

        {/* Featured First Article */}
        {featured && (
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-noir-900 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl">
            <div className="lg:col-span-7 aspect-[16/10] overflow-hidden">
              <Link to={`/journal/${featured.slug}`} className="block w-full h-full group">
                <img
                  src={featured.coverImage}
                  alt={featured.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </Link>
            </div>
            <div className="lg:col-span-5 p-8 sm:p-12 space-y-6">
              <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-champagne">
                <span>Khảo luận Tiêu điểm</span>
                <span>•</span>
                <span>{featured.readTime}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-white hover:text-champagne transition-colors leading-snug">
                <Link to={`/journal/${featured.slug}`}>
                  {featured.title}
                </Link>
              </h2>
              <p className="text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
                {featured.excerpt}
              </p>
              <div className="pt-2">
                <Link
                  to={`/journal/${featured.slug}`}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-champagne font-semibold hover:underline"
                >
                  <span>Đọc toàn văn khảo luận</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Other Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/10">
          {others.map((art) => (
            <JournalCard key={art.id} article={art} />
          ))}
        </div>
      </div>
    </div>
  );
};
