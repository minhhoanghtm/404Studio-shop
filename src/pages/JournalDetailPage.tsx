import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { JOURNAL_ARTICLES } from '../data/journal';
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
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Journal Index
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
              <p className="leading-loose">{sec.paragraph}</p>

              {sec.quote && (
                <blockquote className="my-8 p-6 rounded-xl border-l-2 border-champagne bg-white/5 font-serif italic text-xl text-white">
                  {sec.quote}
                </blockquote>
              )}

              {sec.image && (
                <div className="my-8 aspect-[16/10] rounded-xl overflow-hidden bg-noir-900 border border-white/10">
                  <img src={sec.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Author Card */}
        <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-champagne/10 border border-champagne/30 flex items-center justify-center font-display text-xl text-champagne">
            {article.author.charAt(0)}
          </div>
          <div>
            <h4 className="font-serif text-lg text-white font-medium">{article.author}</h4>
            <p className="text-xs text-platinum-dark font-sans">
              Curator and Editorial Contributor at Maison Vérité Paris.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
