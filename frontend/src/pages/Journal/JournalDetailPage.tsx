import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { JOURNAL_ARTICLES } from '@/shared/data/journal';
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react';

export const JournalDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = JOURNAL_ARTICLES.find((a) => a.slug === slug) || JOURNAL_ARTICLES[0];

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Back Link */}
        <Link
          to="/journal"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-champagne hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Trở lại danh mục tạp chí
        </Link>

        {/* Article Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-xs font-mono uppercase text-champagne tracking-wider">
            <span>{article.category}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {article.readTime}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl text-white tracking-wide leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-xs font-sans text-platinum-dark pt-2 border-b border-white/10 pb-6">
            <span className="flex items-center gap-1.5 text-white">
              <User className="w-3.5 h-3.5 text-champagne" /> {article.author}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-champagne" /> {article.date}
            </span>
          </div>
        </div>

        {/* Cover Photo */}
        <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-noir-900 border border-white/10 shadow-2xl">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body */}
        <div className="space-y-10 text-platinum-dark text-sm sm:text-base leading-relaxed font-sans font-light">
          {article.sections.map((sec, idx) => (
            <div key={idx} className="space-y-4">
              {sec.heading && (
                <h3 className="font-display text-2xl text-white pt-4">
                  {sec.heading}
                </h3>
              )}
              <p>{sec.paragraph}</p>
              {sec.quote && (
                <blockquote className="my-6 p-6 rounded-xl bg-noir-900 border-l-2 border-champagne font-serif italic text-lg text-champagne-light">
                  {sec.quote}
                </blockquote>
              )}
              {sec.image && (
                <div className="my-6 aspect-[16/10] rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={sec.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="pt-12 border-t border-white/10 flex items-center justify-between">
          <Link
            to="/journal"
            className="text-xs uppercase tracking-widest text-champagne hover:underline"
          >
            ← Khám phá các khảo luận khác
          </Link>
          <Link
            to="/products"
            className="text-xs uppercase tracking-widest text-white/70 hover:text-white"
          >
            Xem các bộ sưu tập liên quan →
          </Link>
        </div>
      </div>
    </div>
  );
};
