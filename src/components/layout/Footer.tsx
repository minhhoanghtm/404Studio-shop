import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useToastStore } from '../../stores/useToastStore';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currency, setCurrency] = useState('USD ($)');
  const { addToast } = useToastStore();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      addToast({
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address to receive private notices.',
      });
      return;
    }

    setIsSubscribed(true);
    addToast({
      type: 'success',
      title: 'Privileged Access Granted',
      message: 'You have been enrolled in the Atelier Vérité Gazette and Private Salons.',
    });
  };

  return (
    <footer className="w-full bg-noir-950 text-white/80 border-t border-white/10 pt-20 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Newsletter & Brand Ethos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block">
              The Atelier Gazette
            </span>
            <h3 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
              Receive Private Runway Invitations
            </h3>
            <p className="text-sm font-sans text-platinum-dark max-w-lg leading-relaxed font-light">
              Subscribers receive early access to limited edition drops, invitations to private showroom presentations in Paris and Tokyo, and quarterly monograph journals.
            </p>

            {isSubscribed ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-champagne/10 border border-champagne/30 text-champagne text-xs uppercase tracking-widest font-medium">
                <CheckCircle2 className="w-4 h-4 text-champagne" />
                <span>Enrolled in Private Salon Gazette • Thank you</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md pt-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your patron email"
                  className="flex-1 px-4 py-3.5 bg-noir-900 border border-white/15 focus:border-champagne text-white placeholder-white/30 text-xs tracking-wider outline-none rounded-none transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-champagne hover:bg-champagne-hover text-noir-950 text-xs font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
            <p className="text-[10px] text-white/40 tracking-wider">
              By subscribing, you agree to receive editorial dispatches. Unsubscribe anytime.
            </p>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-12 pt-8 lg:pt-0">
            <div>
              <span className="font-display text-4xl sm:text-5xl text-white tracking-widest block font-medium">
                ATELIER VÉRITÉ
              </span>
              <p className="font-serif italic text-base text-champagne-light/90 mt-2">
                Maison de Haute Couture & Prêt-à-Porter
              </p>
              <p className="text-xs text-platinum-dark mt-4 leading-relaxed font-light">
                Founded in Paris, Maison Vérité unites architectural minimalism, mathematical bias draping, and artisanal European craftsmanship. Each garment is hand-numbered and produced in strictly limited runs.
              </p>
            </div>

            <div className="flex items-center gap-6 mt-8 text-xs font-sans tracking-widest uppercase text-white/50">
              <span>Paris</span>
              <span className="w-1 h-1 rounded-full bg-champagne" />
              <span>Milan</span>
              <span className="w-1 h-1 rounded-full bg-champagne" />
              <span>Tokyo</span>
              <span className="w-1 h-1 rounded-full bg-champagne" />
              <span>New York</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-b border-white/10 text-xs font-sans">
          {/* Column 1: Collections */}
          <div>
            <h4 className="uppercase tracking-widest text-white font-semibold mb-5 text-[11px]">
              Collections
            </h4>
            <ul className="space-y-3 text-white/60">
              <li>
                <Link to="/collections/noir-absolu" className="hover:text-champagne transition-colors">
                  Noir Absolu (FW26)
                </Link>
              </li>
              <li>
                <Link to="/collections/sculptural-wardrobe" className="hover:text-champagne transition-colors">
                  The Sculptural Wardrobe
                </Link>
              </li>
              <li>
                <Link to="/collections/chroma-silk" className="hover:text-champagne transition-colors">
                  Chroma & Liquid Silk
                </Link>
              </li>
              <li>
                <Link to="/collections/metamorphic-leather" className="hover:text-champagne transition-colors">
                  Metamorphic Leather
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-champagne transition-colors">
                  All Runway Archives
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Ready-to-Wear */}
          <div>
            <h4 className="uppercase tracking-widest text-white font-semibold mb-5 text-[11px]">
              Ready-to-Wear
            </h4>
            <ul className="space-y-3 text-white/60">
              <li>
                <Link to="/shop/women" className="hover:text-champagne transition-colors">
                  Women’s Outerwear & Gowns
                </Link>
              </li>
              <li>
                <Link to="/shop/men" className="hover:text-champagne transition-colors">
                  Men’s Deconstructed Suits
                </Link>
              </li>
              <li>
                <Link to="/shop/accessories" className="hover:text-champagne transition-colors">
                  Full-Grain Leather Goods
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-champagne transition-colors">
                  Full Atelier Catalog
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Concierge & Client Service */}
          <div>
            <h4 className="uppercase tracking-widest text-white font-semibold mb-5 text-[11px]">
              Client Concierge
            </h4>
            <ul className="space-y-3 text-white/60">
              <li>
                <Link to="/shipping" className="hover:text-champagne transition-colors">
                  White-Glove Shipping
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-champagne transition-colors">
                  Complimentary Returns
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="hover:text-champagne transition-colors">
                  Tailoring & Size Guide
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-champagne transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-champagne transition-colors">
                  Contact Private Concierge
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: The Maison & Legal */}
          <div>
            <h4 className="uppercase tracking-widest text-white font-semibold mb-5 text-[11px]">
              The Maison
            </h4>
            <ul className="space-y-3 text-white/60">
              <li>
                <Link to="/about" className="hover:text-champagne transition-colors">
                  Atelier Heritage
                </Link>
              </li>
              <li>
                <Link to="/journal" className="hover:text-champagne transition-colors">
                  Editorial Journal
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-champagne transition-colors">
                  Patron Portal
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-champagne transition-colors">
                  Curated Wishlist
                </Link>
              </li>
            </ul>

            <div className="mt-6">
              <label htmlFor="currency-select" className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">
                Currency & Region
              </label>
              <select
                id="currency-select"
                aria-label="Currency and Region"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-noir-900 border border-white/15 text-white/80 text-xs px-2.5 py-1.5 rounded-none outline-none focus:border-champagne"
              >
                <option value="USD ($)">USD ($) United States</option>
                <option value="EUR (€)">EUR (€) European Union</option>
                <option value="GBP (£)">GBP (£) United Kingdom</option>
                <option value="JPY (¥)">JPY (¥) Japan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimers & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-white/40 font-sans gap-4">
          <p>
            © {new Date().getFullYear()} ATELIER VÉRITÉ PARIS. ALL RIGHTS RESERVED.
          </p>
          <p className="text-champagne/70 font-mono text-[10px] text-center md:text-right">
            [Client-Side Simulation • Independent Greenfield Fashion E-Commerce Architecture with ThreeUI]
          </p>
        </div>
      </div>
    </footer>
  );
};
