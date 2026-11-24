import React from 'react';
import { Link } from 'react-router-dom';
import { Collection } from '../../../shared/types';
import { ArrowRight } from 'lucide-react';

interface CollectionCardProps {
  collection: Collection;
  index: number;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({ collection, index }) => {
  const isReversed = index % 2 === 1;

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ${
        isReversed ? 'lg:flex-row-reverse' : ''
      }`}
    >
      {/* Visual Image Stage */}
      <div className={`lg:col-span-7 ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
        <Link
          to={`/collections/${collection.slug}`}
          className="group relative block aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-[var(--bg-alt)] border border-[var(--border)] shadow-xl"
        >
          <img
            src={collection.heroImage}
            alt={collection.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6 sm:p-8">
            <span className="text-xs font-mono uppercase tracking-widest text-[#d4af37]">
              {collection.season} • {collection.year}
            </span>
          </div>
        </Link>
      </div>

      {/* Text Metadata */}
      <div className={`lg:col-span-5 space-y-6 ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] block mb-2">
            Ấn bản số 0{index + 1} • {collection.season}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--text)] tracking-wide">
            {collection.title}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-sans uppercase tracking-widest">
            {collection.subtitle}
          </p>
        </div>

        <p className="font-serif italic text-base text-[var(--accent)] border-l-2 border-[var(--accent)] pl-4">
          &ldquo;{collection.editorialQuote}&rdquo;
        </p>

        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-sans font-light">
          {collection.description}
        </p>

        <div className="pt-2">
          <Link
            to={`/collections/${collection.slug}`}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold text-xs uppercase tracking-widest transition-colors shadow-lg rounded-lg"
          >
            <span>Khám phá toàn bộ Runway</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
