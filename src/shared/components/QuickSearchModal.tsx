import React, { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { useSearchStore } from '../stores/useSearchStore';
import { PRODUCTS } from '../data/products';
import { formatCurrency } from '../utils/formatters';
import { vi } from '../locales/vi/common';

export const QuickSearchModal: React.FC = () => {
  const {
    isOpen,
    query,
    recentSearches,
    closeSearch,
    setQuery,
    addRecentSearch,
    clearRecentSearches,
  } = useSearchStore();

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open & listen to Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useSearchStore.getState().openSearch();
      }
      if (e.key === 'Escape' && isOpen) {
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeSearch]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProducts = query.trim()
    ? PRODUCTS.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subCategory.toLowerCase().includes(q) ||
          p.composition.toLowerCase().includes(q)
        );
      }).slice(0, 6)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    addRecentSearch(query);
    closeSearch();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    addRecentSearch(term);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={closeSearch}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-noir-950 text-white rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-10">
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center px-6 py-4 border-b border-white/10">
          <Search className="w-5 h-5 text-champagne mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={vi.search.placeholder}
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-white/40 outline-none font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-white/40 hover:text-white mr-2"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={closeSearch}
            className="px-2.5 py-1 text-xs font-mono bg-white/10 text-white/60 hover:text-white rounded transition-colors"
          >
            ESC
          </button>
        </form>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Query Live Results */}
          {query.trim() ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase font-sans tracking-widest text-champagne">
                  {vi.search.curatedMatches} ({filteredProducts.length})
                </span>
                {filteredProducts.length > 0 && (
                  <button
                    onClick={handleSearchSubmit}
                    className="text-xs text-white/60 hover:text-white flex items-center gap-1 font-sans"
                  >
                    <span>Xem tất cả kết quả</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="font-display text-lg text-white">{vi.search.noResultsTitle}</p>
                  <p className="text-xs text-platinum-dark max-w-md mx-auto">
                    {vi.search.noResultsSubtitle}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.slug}`}
                      onClick={closeSearch}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group"
                    >
                      <img
                        src={product.featuredImage}
                        alt={product.name}
                        className="w-14 h-16 object-cover rounded bg-noir-900 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase tracking-wider text-champagne block">
                          {product.category}
                        </span>
                        <h5 className="font-display text-sm text-white group-hover:text-champagne transition-colors truncate">
                          {product.name}
                        </h5>
                        <span className="text-xs font-mono text-white/70 block mt-0.5">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-white/40 font-sans">
                      {vi.search.recent}
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[11px] text-white/40 hover:text-white underline transition-colors"
                    >
                      {vi.search.clearHistory}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleRecentClick(term)}
                        className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/80 hover:text-white transition-colors border border-white/5"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Spotlight Categories */}
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-widest text-champagne font-sans flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {vi.search.spotlights}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-sans">
                  <Link
                    to="/products?category=women"
                    onClick={closeSearch}
                    className="p-3 rounded-lg bg-white/5 hover:bg-champagne/10 border border-white/5 hover:border-champagne/30 text-white/80 hover:text-champagne transition-all"
                  >
                    Thời trang Nữ
                  </Link>
                  <Link
                    to="/products?category=men"
                    onClick={closeSearch}
                    className="p-3 rounded-lg bg-white/5 hover:bg-champagne/10 border border-white/5 hover:border-champagne/30 text-white/80 hover:text-champagne transition-all"
                  >
                    Thời trang Nam
                  </Link>
                  <Link
                    to="/products?category=outerwear"
                    onClick={closeSearch}
                    className="p-3 rounded-lg bg-white/5 hover:bg-champagne/10 border border-white/5 hover:border-champagne/30 text-white/80 hover:text-champagne transition-all"
                  >
                    Áo khoác dạ Tailored
                  </Link>
                  <Link
                    to="/products?category=silk"
                    onClick={closeSearch}
                    className="p-3 rounded-lg bg-white/5 hover:bg-champagne/10 border border-white/5 hover:border-champagne/30 text-white/80 hover:text-champagne transition-all"
                  >
                    Lụa & Dạ hội Couture
                  </Link>
                  <Link
                    to="/products?category=accessories"
                    onClick={closeSearch}
                    className="p-3 rounded-lg bg-white/5 hover:bg-champagne/10 border border-white/5 hover:border-champagne/30 text-white/80 hover:text-champagne transition-all"
                  >
                    Đồ da & Phụ kiện
                  </Link>
                  <Link
                    to="/collections/noir-absolu"
                    onClick={closeSearch}
                    className="p-3 rounded-lg bg-white/5 hover:bg-champagne/10 border border-white/5 hover:border-champagne/30 text-white/80 hover:text-champagne transition-all"
                  >
                    Bộ sưu tập Runway FW26
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
