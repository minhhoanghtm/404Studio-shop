import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Calendar, Compass } from 'lucide-react';
import { JOURNAL_ARTICLES } from '../../../shared/data/journal';

export const FashionJournalSection: React.FC = () => {
  const articles = JOURNAL_ARTICLES.slice(0, 3);
  const featuredArticle = articles[0];
  const sideArticles = articles.slice(1);

  if (!featuredArticle) return null;

  return (
    <section
      aria-label="Tạp chí thời trang Atelier Journal"
      className="py-24 border-t border-[var(--border)] bg-[var(--bg-page)] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--accent)] font-medium mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <span>THE ATELIER JOURNAL · GHI CHÉP THỜI TRANG</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[var(--text-primary)]">
              Giai Thoại Nghệ Thuật & Triết Lý Sáng Tạo
            </h2>
          </div>
          <Link
            to="/journal"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors group self-start md:self-end pb-1 border-b border-[var(--text-primary)] hover:border-[var(--accent)]"
          >
            <span>Đọc Toàn Bộ Tạp Chí</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Editorial Layout: Asymmetric Lead + Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Main Lead Editorial (7 cols) */}
          <article className="lg:col-span-7 group flex flex-col justify-between border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8 hover:border-[var(--accent)] transition-colors duration-300">
            <div>
              <div className="relative aspect-[16/10] overflow-hidden mb-6 bg-black/5">
                <img
                  src={featuredArticle.coverImage}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-black/70 backdrop-blur-md text-[10px] uppercase tracking-widest text-white border border-white/20">
                    {featuredArticle.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mb-3">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[var(--accent)]" />
                  {featuredArticle.date}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[var(--accent)]" />
                  {featuredArticle.readTime}
                </span>
                <span>·</span>
                <span>Bởi {featuredArticle.author}</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)] mb-4 leading-snug group-hover:text-[var(--accent)] transition-colors">
                <Link to={`/journal/${featuredArticle.slug}`}>
                  {featuredArticle.title}
                </Link>
              </h3>

              <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed line-clamp-3 mb-6">
                {featuredArticle.excerpt}
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <Link
                to={`/journal/${featuredArticle.slug}`}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors"
              >
                <span>Đọc Bài Luận</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] tracking-wider">
                FEATURED ESSAY
              </span>
            </div>
          </article>

          {/* Secondary Stack (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {sideArticles.map((article, idx) => (
              <article
                key={article.id}
                className="group flex-1 flex flex-col justify-between border border-[var(--border)] bg-[var(--bg-card)] p-6 hover:border-[var(--accent)] transition-colors duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-semibold">
                      {article.category}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      0{idx + 2} / CHUYÊN ĐỀ
                    </span>
                  </div>

                  <div className="flex gap-4 items-start mb-4">
                    <div className="w-24 h-24 shrink-0 overflow-hidden bg-black/5">
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <h4 className="font-serif text-lg text-[var(--text-primary)] leading-snug mb-2 group-hover:text-[var(--accent)] transition-colors">
                        <Link to={`/journal/${article.slug}`}>{article.title}</Link>
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] font-light line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-3">
                    <span>{article.date}</span>
                    <span>·</span>
                    <span>{article.readTime}</span>
                  </div>
                  <Link
                    to={`/journal/${article.slug}`}
                    className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors font-medium"
                  >
                    <span>Chi Tiết</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
