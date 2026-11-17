import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { JOURNAL_ARTICLES } from '../../../shared/data/journal';
import { formatDate } from '../../../shared/utils/formatters';

export const JournalPreviewSection: React.FC = () => {
  const articles = JOURNAL_ARTICLES.slice(0, 3);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
            Khảo luận & Lý thuyết Thời trang
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
            Tạp chí Atelier Vérité
          </h2>
        </div>
        <Link
          to="/journal"
          className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white hover:text-champagne transition-colors"
        >
          <span>Đọc tất cả bài khảo luận</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {articles.map((article) => (
          <article
            key={article.id}
            className="group flex flex-col space-y-4 rounded-xl overflow-hidden"
          >
            <Link
              to={`/journal/${article.slug}`}
              className="relative aspect-[16/10] overflow-hidden rounded-xl bg-noir-900 border border-white/10 block"
            >
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded bg-noir-950/80 backdrop-blur-md text-[10px] font-mono uppercase tracking-widest text-champagne border border-white/10">
                  {article.category}
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3 text-[11px] font-mono text-white/40">
              <span>{article.date}</span>
              <span>•</span>
              <span>{article.readTime}</span>
            </div>

            <Link
              to={`/journal/${article.slug}`}
              className="font-display text-xl text-white group-hover:text-champagne transition-colors line-clamp-2 leading-snug"
            >
              {article.title}
            </Link>

            <p className="text-xs text-platinum-dark font-sans line-clamp-3 font-light leading-relaxed">
              {article.excerpt}
            </p>

            <div className="pt-2">
              <Link
                to={`/journal/${article.slug}`}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-champagne group-hover:text-white transition-colors"
              >
                <span>Đọc toàn văn khảo luận</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
