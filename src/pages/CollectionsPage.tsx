import React from 'react';
import { Link } from 'react-router-dom';
import { COLLECTIONS } from '../data/collections';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-20">
        {/* Editorial Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-champagne/30 text-champagne text-[10px] uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Runway Catalogues
          </div>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-wide">
            Runway Archives & Collections
          </h1>
          <p className="text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
            Every collection is an experimental study in structural geometry, raw material provenance, and negative space. Explore the archived lookbooks and seasonal presentations.
          </p>
        </div>

        {/* Collections Stack */}
        <div className="space-y-24">
          {COLLECTIONS.map((col, index) => {
            const isReversed = index % 2 === 1;

            return (
              <div
                key={col.id}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ${
                  isReversed ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Visual Image Stage */}
                <div className={`lg:col-span-7 ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
                  <Link
                    to={`/collections/${col.slug}`}
                    className="group relative block aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-noir-900 border border-white/10 shadow-2xl"
                  >
                    <img
                      src={col.heroImage}
                      alt={col.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6 sm:p-8">
                      <span className="text-xs font-mono uppercase tracking-widest text-champagne">
                        {col.season} • {col.year}
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Text Metadata */}
                <div className={`lg:col-span-5 space-y-6 ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne block mb-2">
                      Vol. 0{index + 1} • {col.season}
                    </span>
                    <h2 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
                      {col.title}
                    </h2>
                    <p className="text-xs text-platinum-dark mt-1 font-sans uppercase tracking-widest">
                      {col.subtitle}
                    </p>
                  </div>

                  <p className="font-serif italic text-base text-champagne-light/90 border-l border-champagne/40 pl-4">
                    {col.editorialQuote}
                  </p>

                  <p className="text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
                    {col.description}
                  </p>

                  <div className="pt-2">
                    <Link
                      to={`/collections/${col.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest transition-colors shadow-lg"
                    >
                      <span>Explore Lookbook & Pieces</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
