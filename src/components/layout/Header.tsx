import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Sun, Moon, Menu, X, ChevronDown } from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore';
import { useWishlistStore } from '../../stores/useWishlistStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useSearchStore } from '../../stores/useSearchStore';
import { MegaMenu } from './MegaMenu';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const location = useLocation();
  const { getItemsCount, toggleDrawer } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { theme, toggleTheme } = useThemeStore();
  const { openSearch } = useSearchStore();

  const cartCount = getItemsCount();
  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMegaMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';

  return (
    <>
      <header
        className={`sticky top-0 w-full z-40 transition-all duration-500 ${
          isScrolled || !isHome
            ? 'bg-noir-950/90 dark:bg-noir-950/90 backdrop-blur-xl border-b border-white/10 shadow-lg py-3.5'
            : 'bg-gradient-to-b from-noir-950/80 via-noir-950/40 to-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white/90 hover:text-white focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <button
              onClick={openSearch}
              className="p-2 text-white/90 hover:text-white ml-1"
              aria-label="Search catalog"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7 text-xs font-sans tracking-editorial uppercase font-medium">
            <div
              className="relative py-2"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
            >
              <button
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                className="flex items-center gap-1 text-white/90 hover:text-champagne transition-colors focus:outline-none"
              >
                <span>Collections</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <Link
              to="/shop/women"
              className={`transition-colors py-2 ${
                location.pathname === '/shop/women' ? 'text-champagne' : 'text-white/80 hover:text-white'
              }`}
            >
              Women
            </Link>

            <Link
              to="/shop/men"
              className={`transition-colors py-2 ${
                location.pathname === '/shop/men' ? 'text-champagne' : 'text-white/80 hover:text-white'
              }`}
            >
              Men
            </Link>

            <Link
              to="/shop/accessories"
              className={`transition-colors py-2 ${
                location.pathname === '/shop/accessories' ? 'text-champagne' : 'text-white/80 hover:text-white'
              }`}
            >
              Accessories
            </Link>

            <Link
              to="/journal"
              className={`transition-colors py-2 ${
                location.pathname.startsWith('/journal') ? 'text-champagne' : 'text-white/80 hover:text-white'
              }`}
            >
              Journal
            </Link>
          </nav>

          {/* Brand Logo / Wordmark */}
          <Link
            to="/"
            className="flex flex-col items-center text-center group py-1"
            aria-label="Atelier Vérité Home"
          >
            <span className="font-display text-2xl sm:text-3xl lg:text-3xl tracking-widest text-white group-hover:text-champagne-light transition-colors select-none font-medium">
              VÉRITÉ
            </span>
            <span className="text-[8px] uppercase tracking-ultra text-champagne/90 -mt-1 font-sans">
              ATELIER PARIS
            </span>
          </Link>

          {/* Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Desktop Search Button */}
            <button
              onClick={openSearch}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-champagne/40 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs transition-all"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5 text-champagne" />
              <span className="text-[11px] tracking-widest uppercase">Search</span>
              <kbd className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/50">⌘K</kbd>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-white/80 hover:text-champagne transition-colors rounded-full hover:bg-white/5 focus:outline-none"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-champagne" /> : <Moon className="w-4 h-4 text-white" />}
            </button>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="relative p-2 text-white/80 hover:text-champagne transition-colors rounded-full hover:bg-white/5"
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-champagne text-noir-950 text-[9px] font-bold flex items-center justify-center animate-fade-in">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag Trigger */}
            <button
              onClick={toggleDrawer}
              className="relative p-2 text-white/80 hover:text-champagne transition-colors rounded-full hover:bg-white/5 focus:outline-none"
              aria-label={`Shopping bag with ${cartCount} items`}
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-champagne text-noir-950 text-[9px] font-bold flex items-center justify-center animate-fade-in">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Account Link */}
            <Link
              to="/account"
              className="p-2 text-white/80 hover:text-champagne transition-colors rounded-full hover:bg-white/5 hidden sm:inline-block"
              aria-label="Patron Account"
            >
              <User className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <MegaMenu
          isOpen={isMegaMenuOpen}
          onClose={() => setIsMegaMenuOpen(false)}
        />
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-noir-950 text-white animate-fade-in">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <span className="font-display text-2xl tracking-widest text-white">VÉRITÉ</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-white/80 hover:text-white"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <nav className="space-y-4 text-base font-sans tracking-editorial uppercase">
              <Link
                to="/collections"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-xl font-display text-white hover:text-champagne py-2 border-b border-white/5"
              >
                Runway Collections
              </Link>
              <Link
                to="/shop/women"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-white/80 hover:text-white"
              >
                Women&apos;s Collection
              </Link>
              <Link
                to="/shop/men"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-white/80 hover:text-white"
              >
                Men&apos;s Tailoring
              </Link>
              <Link
                to="/shop/accessories"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-white/80 hover:text-white"
              >
                Accessories & Bags
              </Link>
              <Link
                to="/shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-champagne font-medium"
              >
                View Full Catalog
              </Link>
              <Link
                to="/journal"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-white/80 hover:text-white"
              >
                Editorial Journal
              </Link>
              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-white/80 hover:text-white"
              >
                About Maison
              </Link>
            </nav>

            <div className="pt-6 border-t border-white/10 space-y-3">
              <Link
                to="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 text-sm text-white/80 hover:text-champagne"
              >
                <User className="w-4 h-4" />
                <span>Patron Account & Orders</span>
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 text-sm text-white/80 hover:text-champagne"
              >
                <Heart className="w-4 h-4" />
                <span>Curated Wishlist ({wishlistCount})</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
