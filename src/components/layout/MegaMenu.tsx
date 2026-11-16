import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onMouseLeave={onClose}
      className="absolute top-full left-0 w-full bg-noir-950/95 dark:bg-noir-950/95 light:bg-ivory-50/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl py-10 px-8 transition-all duration-300 z-40 animate-fade-in"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Column 1: Featured Runway Spotlight */}
        <div className="space-y-4">
          <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Runway Presentation
          </span>
          <Link
            to="/collections/noir-absolu"
            onClick={onClose}
            className="group block relative aspect-[4/5] overflow-hidden rounded-lg bg-noir-900"
          >
            <img
              src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=85"
              alt="Noir Absolu Runway Collection"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
              <h4 className="font-display text-xl text-white tracking-wide">Noir Absolu</h4>
              <p className="text-[11px] text-white/70 uppercase tracking-widest mt-1">Autumn / Winter 2026</p>
            </div>
          </Link>
        </div>

        {/* Column 2: Ready-to-Wear */}
        <div>
          <h5 className="text-xs uppercase tracking-widest font-semibold text-white/50 mb-5">
            Ready-to-Wear
          </h5>
          <ul className="space-y-3.5 text-sm font-sans">
            <li>
              <Link
                to="/shop/women"
                onClick={onClose}
                className="text-white/80 hover:text-champagne transition-colors flex items-center justify-between group"
              >
                <span>Women’s Collection</span>
                <span className="text-[10px] text-platinum-dark opacity-0 group-hover:opacity-100 transition-opacity">Explore</span>
              </Link>
            </li>
            <li>
              <Link
                to="/shop/men"
                onClick={onClose}
                className="text-white/80 hover:text-champagne transition-colors flex items-center justify-between group"
              >
                <span>Men’s Tailoring</span>
                <span className="text-[10px] text-platinum-dark opacity-0 group-hover:opacity-100 transition-opacity">Explore</span>
              </Link>
            </li>
            <li>
              <Link
                to="/shop/accessories"
                onClick={onClose}
                className="text-white/80 hover:text-champagne transition-colors flex items-center justify-between group"
              >
                <span>Leather Goods & Accessories</span>
                <span className="text-[10px] text-platinum-dark opacity-0 group-hover:opacity-100 transition-opacity">Explore</span>
              </Link>
            </li>
            <li>
              <Link
                to="/shop"
                onClick={onClose}
                className="text-champagne hover:text-champagne-light transition-colors font-medium flex items-center gap-2 pt-2"
              >
                <span>View All 30+ Garments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Curated Collections */}
        <div>
          <h5 className="text-xs uppercase tracking-widest font-semibold text-white/50 mb-5">
            Curated Collections
          </h5>
          <ul className="space-y-3.5 text-sm font-sans">
            <li>
              <Link
                to="/collections/noir-absolu"
                onClick={onClose}
                className="text-white/80 hover:text-champagne transition-colors block"
              >
                <div className="font-medium">Noir Absolu</div>
                <div className="text-[11px] text-platinum-dark">Monochrome double-faced wools</div>
              </Link>
            </li>
            <li>
              <Link
                to="/collections/sculptural-wardrobe"
                onClick={onClose}
                className="text-white/80 hover:text-champagne transition-colors block"
              >
                <div className="font-medium">The Sculptural Wardrobe</div>
                <div className="text-[11px] text-platinum-dark">Corseted tailoring & deep pleats</div>
              </Link>
            </li>
            <li>
              <Link
                to="/collections/chroma-silk"
                onClick={onClose}
                className="text-white/80 hover:text-champagne transition-colors block"
              >
                <div className="font-medium">Chroma & Liquid Silk</div>
                <div className="text-[11px] text-platinum-dark">Bias-cut 30-momme gowns</div>
              </Link>
            </li>
            <li>
              <Link
                to="/collections"
                onClick={onClose}
                className="text-champagne hover:text-champagne-light transition-colors font-medium flex items-center gap-2 pt-2"
              >
                <span>All Runway Archives</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: The Maison & Concierge */}
        <div className="border-l border-white/5 pl-8 hidden md:block">
          <h5 className="text-xs uppercase tracking-widest font-semibold text-white/50 mb-5">
            The Maison
          </h5>
          <ul className="space-y-3 text-sm font-sans text-white/70">
            <li>
              <Link to="/about" onClick={onClose} className="hover:text-champagne transition-colors block">
                Atelier Philosophy & History
              </Link>
            </li>
            <li>
              <Link to="/journal" onClick={onClose} className="hover:text-champagne transition-colors block">
                Editorial Journal & Studies
              </Link>
            </li>
            <li>
              <Link to="/size-guide" onClick={onClose} className="hover:text-champagne transition-colors block">
                Tailoring & Size Guide
              </Link>
            </li>
            <li>
              <Link to="/contact" onClick={onClose} className="hover:text-champagne transition-colors block">
                Private Concierge & Salons
              </Link>
            </li>
          </ul>

          <div className="mt-8 p-4 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase tracking-widest text-champagne block font-semibold mb-1">
              Sur Mesure Service
            </span>
            <p className="text-xs text-platinum-dark font-sans">
              Schedule a bespoke fitting at our Place Vendôme atelier.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
