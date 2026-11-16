import React from 'react';
import { Link } from 'react-router-dom';
import { JOURNAL_ARTICLES } from '../data/journal';
import { ArrowRight, Sparkles } from 'lucide-react';

export const JournalPage: React.FC = () => {
  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Editorial Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-champagne/30 text-champagne text-[10px] uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Gazette & Monograph
          </div>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-wide">
            The Atelier Journal
          </h1>
          <p className="text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
            In-depth studies into textile physics, visits to master weaving ateliers across Europe, and curatorial notes from our creative director.
          </p>
        </div>

        {/* Featured First Article */}
        {JOURNAL_ARTICLES[0] && (
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-noir-900 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl">
            <div className="lg:col-span-7 aspect-[16/10] overflow-hidden">
              <Link to={`/journal/${JOURNAL_ARTICLES[0].slug}`} className="block w-full h-full group">
                <img
                  src={JOURNAL_ARTICLES[0].coverImage}
                  alt={JOURNAL_ARTICLES[0].title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </Link>
            </div>
            <div className="lg:col-span-5 p-8 sm:p-12 space-y-6">
              <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-champagne">
                <span>Featured Monograph</span>
                <span>•</span>
                <span>{JOURNAL_ARTICLES[0].readTime}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-white hover:text-champagne transition-colors">
                <Link to={`/journal/${JOURNAL_ARTICLES[0].slug}`}>
                  {JOURNAL_ARTICLES[0].title}
                </Link>
              </h2>
              <p className="text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
                {JOURNAL_ARTICLES[0].excerpt}
              </p>
              <div className="pt-2">
                <Link
                  to={`/journal/${JOURNAL_ARTICLES[0].slug}`}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-champagne font-semibold hover:underline"
                >
                  <span>Read Monograph</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Other Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
          {JOURNAL_ARTICLES.slice(1).map((article) => (
            <Link
              key={article.id}
              to={`/journal/${article.slug}`}
              className="group flex flex-col p-6 rounded-2xl bg-noir-900 border border-white/10 hover:border-champagne/30 transition-all space-y-4"
            >
              <div className="aspect-[16/10] rounded-xl overflow-hidden bg-noir-950">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-champagne">
                  <span>{article.category}</span>
                  <span>{article.readTime}</span>
                </div>
                <h3 className="font-serif text-xl text-white group-hover:text-champagne transition-colors font-medium">
                  {article.title}
                </h3>
                <p className="text-xs text-platinum-dark line-clamp-2 font-sans font-light leading-relaxed">
                  {article.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
