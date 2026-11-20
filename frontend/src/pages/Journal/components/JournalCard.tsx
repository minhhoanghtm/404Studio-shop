import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { JournalArticle } from '../../../shared/types';

interface JournalCardProps {
  article: JournalArticle;
}

export const JournalCard: React.FC<JournalCardProps> = ({ article }) => {
  return (
    <article className="group flex flex-col space-y-4">
      <Link
        to={`/journal/${article.slug}`}
        className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] block shadow-sm"
      >
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded bg-[var(--surface)]/90 backdrop-blur-md text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] border border-[var(--border)] shadow-sm">
            {article.category}
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-muted)]">
        <span>{article.date}</span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-[var(--accent)]" /> {article.readTime}
        </span>
      </div>

      <Link
        to={`/journal/${article.slug}`}
        className="font-display text-xl text-[var(--text)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug"
      >
        {article.title}
      </Link>

      <p className="text-xs text-[var(--text-muted)] font-sans line-clamp-3 font-light leading-relaxed">
        {article.excerpt}
      </p>

      <div className="pt-2">
        <Link
          to={`/journal/${article.slug}`}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--accent)] group-hover:underline transition-colors font-medium"
        >
          <span>Đọc bài khảo luận</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
};
