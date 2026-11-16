import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="w-full bg-noir-950 text-white min-h-[80vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
          ARCHIVAL VOID 404
        </span>
        <h1 className="font-display text-7xl sm:text-9xl text-white font-normal">
          404
        </h1>
        <h2 className="font-serif italic text-2xl text-champagne-light">
          The Requested Silhouette Does Not Exist
        </h2>
        <p className="text-xs sm:text-sm text-platinum-dark font-sans font-light leading-relaxed">
          The archive coordinates you have accessed could not be mapped to any current garment, runway presentation, or editorial study.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="w-full sm:w-auto px-8 py-3.5 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <span>Return to Maison Home</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/shop"
            className="w-full sm:w-auto px-8 py-3.5 border border-white/20 text-white hover:border-champagne text-xs uppercase tracking-widest font-medium transition-colors"
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    </div>
  );
};
