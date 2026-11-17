import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Sun, Moon, Menu, X, ChevronDown } from 'lucide-react';
import { vi } from '../locales/vi/common';
import { useCartStore } from '../stores/useCartStore';
import { useWishlistStore } from '../stores/useWishlistStore';
import { useThemeStore } from '../stores/useThemeStore';
import { useSearchStore } from '../stores/useSearchStore';
import { MegaMenu } from './MegaMenu';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  const location = useLocation();
  const cartItemsCount = useCartStore((state) => state.getItemsCount());
  const openCart = useCartStore((state) => state.openDrawer);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const { theme, toggleTheme } = useThemeStore();
  const openSearch = useSearchStore((state) => state.openSearch);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';

  return (
    <>
      <header
        className={`sticky top-0 w-full z-40 transition-all duration-500 ${isScrolled || !isHome
            ? 'bg-ivory-50/95 dark:bg-noir-950/90 backdrop-blur-xl border-b border-black/10 dark:border-white/10 shadow-sm dark:shadow-lg py-3.5'
            : 'bg-gradient-to-b from-ivory-100/90 via-ivory-100/30 to-transparent dark:from-noir-950/80 dark:via-noir-950/40 dark:to-transparent py-5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-noir-800 hover:text-black dark:text-white/90 dark:hover:text-white focus:outline-none"
              aria-label="Mở bảng điều hướng"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <button
              onClick={openSearch}
              className="p-2 text-noir-800 hover:text-black dark:text-white/90 dark:hover:text-white ml-1"
              aria-label="Tìm kiếm bộ sưu tập"
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
                className="flex items-center gap-1 text-noir-800 hover:text-champagne dark:text-white/90 dark:hover:text-champagne transition-colors focus:outline-none"
              >
                <span>{vi.nav.collections}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <Link
              to="/products?category=women"
              className={`transition-colors py-2 ${location.pathname === '/products' && location.search.includes('women')
                  ? 'text-champagne font-semibold'
                  : 'text-noir-700 hover:text-noir-950 dark:text-white/80 dark:hover:text-white'
                }`}
            >
              {vi.nav.women}
            </Link>

            <Link
              to="/products?category=men"
              className={`transition-colors py-2 ${location.pathname === '/products' && location.search.includes('men')
                  ? 'text-champagne font-semibold'
                  : 'text-noir-700 hover:text-noir-950 dark:text-white/80 dark:hover:text-white'
                }`}
            >
              {vi.nav.men}
            </Link>

            <Link
              to="/products?category=accessories"
              className={`transition-colors py-2 ${location.pathname === '/products' && location.search.includes('accessories')
                  ? 'text-champagne font-semibold'
                  : 'text-noir-700 hover:text-noir-950 dark:text-white/80 dark:hover:text-white'
                }`}
            >
              {vi.nav.accessories}
            </Link>

            <Link
              to="/journal"
              className={`transition-colors py-2 ${location.pathname.startsWith('/journal')
                  ? 'text-champagne font-semibold'
                  : 'text-noir-700 hover:text-noir-950 dark:text-white/80 dark:hover:text-white'
                }`}
            >
              {vi.nav.journal}
            </Link>

            <Link
              to="/about"
              className={`transition-colors py-2 ${location.pathname === '/about'
                  ? 'text-champagne font-semibold'
                  : 'text-noir-700 hover:text-noir-950 dark:text-white/80 dark:hover:text-white'
                }`}
            >
              {vi.nav.about}
            </Link>
          </nav>

          {/* Brand Logo */}
          <div className="text-center">
            <Link to="/" className="inline-block group">
              <span className="font-display text-2xl sm:text-3xl tracking-widest text-noir-950 dark:text-white block group-hover:text-champagne transition-colors font-medium">
                {vi.brand.name}
              </span>
              <span className="text-[9px] font-sans font-medium tracking-[0.3em] text-champagne dark:text-champagne/90 uppercase block -mt-0.5">
                {vi.brand.subName}
              </span>
            </Link>
          </div>

          {/* Actions: Search Pill, Theme, Wishlist, Bag, Account */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Pill (Desktop) */}
            <button
              onClick={openSearch}
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/5 hover:bg-black/10 border border-black/10 text-noir-700 hover:text-noir-950 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white/70 dark:hover:text-white transition-all text-xs"
              aria-label="Tìm kiếm tác phẩm"
            >
              <Search className="w-3.5 h-3.5 text-champagne" />
              <span className="font-sans font-light text-noir-500 dark:text-white/50">{vi.nav.search}...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-black/10 dark:bg-white/10 text-noir-600 dark:text-white/40 rounded border border-black/5 dark:border-white/5">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              data-testid="theme-toggle-button"
              className="p-2 text-noir-800 hover:text-black dark:text-white/80 dark:hover:text-white transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
              aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              aria-pressed={theme === 'dark'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-champagne hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-champagne hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="relative p-2 text-noir-800 hover:text-black dark:text-white/80 dark:hover:text-white transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5"
              aria-label={`Danh sách yêu thích (${wishlistCount})`}
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-champagne text-noir-950 text-[9px] font-bold flex items-center justify-center animate-scale-in font-mono">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag Drawer Toggle */}
            <button
              onClick={openCart}
              className="relative p-2 text-noir-800 hover:text-black dark:text-white/80 dark:hover:text-white transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5"
              aria-label={`Giỏ hàng (${cartItemsCount})`}
            >
              <ShoppingBag className="w-4 h-4" />
              {cartItemsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-champagne text-noir-950 text-[9px] font-bold flex items-center justify-center animate-scale-in font-mono">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Account Profile Link */}
            <Link
              to="/account"
              className="p-2 text-noir-800 hover:text-black dark:text-white/80 dark:hover:text-white transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5"
              aria-label={vi.nav.account}
            >
              <User className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Full-width Mega Menu Dropdown */}
      <MegaMenu
        isOpen={isMegaMenuOpen}
        onClose={() => setIsMegaMenuOpen(false)}
      />

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-ivory-50 text-noir-900 dark:bg-noir-950 dark:text-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto border-r border-black/10 dark:border-white/10 animate-fade-in transition-colors duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
                <span className="font-display text-lg tracking-widest text-champagne">
                  {vi.brand.name}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleTheme}
                    className="p-1.5 text-noir-700 hover:text-black dark:text-white/70 dark:hover:text-white rounded-full"
                    aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-champagne" /> : <Moon className="w-4 h-4 text-champagne" />}
                  </button>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 text-noir-600 hover:text-black dark:text-white/60 dark:hover:text-white"
                    aria-label="Đóng menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <nav className="flex flex-col space-y-4 text-sm font-sans uppercase tracking-wider">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-champagne transition-colors py-1"
                >
                  {vi.nav.home}
                </Link>
                <Link
                  to="/collections"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-champagne transition-colors py-1"
                >
                  {vi.nav.collections}
                </Link>
                <Link
                  to="/products?category=women"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-champagne transition-colors py-1"
                >
                  {vi.nav.women}
                </Link>
                <Link
                  to="/products?category=men"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-champagne transition-colors py-1"
                >
                  {vi.nav.men}
                </Link>
                <Link
                  to="/products?category=accessories"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-champagne transition-colors py-1"
                >
                  {vi.nav.accessories}
                </Link>
                <Link
                  to="/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-champagne transition-colors py-1"
                >
                  {vi.nav.products}
                </Link>
                <Link
                  to="/journal"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-champagne transition-colors py-1"
                >
                  {vi.nav.journal}
                </Link>
                <Link
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-champagne transition-colors py-1"
                >
                  {vi.nav.about}
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-champagne transition-colors py-1"
                >
                  {vi.nav.contact}
                </Link>
                <Link
                  to="/support"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-champagne transition-colors py-1"
                >
                  {vi.nav.support}
                </Link>
              </nav>
            </div>

            <div className="pt-6 border-t border-black/10 dark:border-white/10 space-y-3">
              <Link
                to="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 text-xs uppercase tracking-widest text-noir-700 dark:text-white/70 hover:text-champagne"
              >
                <User className="w-4 h-4" />
                <span>{vi.nav.account}</span>
              </Link>
              <p className="text-[10px] text-noir-500 dark:text-white/40 tracking-wider">
                {vi.brand.subName}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
