import React, { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { useSearchStore } from '../../stores/useSearchStore';
import { PRODUCTS } from '../../data/products';

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
            placeholder="Search haute couture, outerwear, silk, cashmere..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-white/40 outline-none font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-white/40 hover:text-white mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={closeSearch}
            className="p-1 text-white/50 hover:text-white"
            aria-label="Close search modal"
          >
            <kbd className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/60">ESC</kbd>
          </button>
        </form>

        {/* Content Body */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6">
          {/* Live Search Results */}
          {query.trim() && (
            <div>
              <div className="flex items-center justify-between text-xs text-platinum-dark mb-3">
                <span className="uppercase tracking-widest text-[10px]">
                  Curated Matches ({filteredProducts.length})
                </span>
                {filteredProducts.length > 0 && (
                  <button
                    onClick={handleSearchSubmit}
                    className="text-champagne hover:underline text-[11px] flex items-center gap-1"
                  >
                    <span>View all matching</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-10">
                  <p className="font-serif italic text-lg text-platinum-light">
                    No archival pieces found for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-xs text-platinum-dark mt-1 font-sans">
                    Try searching for &ldquo;Wool&rdquo;, &ldquo;Silk&rdquo;, &ldquo;Coat&rdquo;, or &ldquo;Tote&rdquo;.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.slug}`}
                      onClick={() => {
                        addRecentSearch(product.name);
                        closeSearch();
                      }}
                      className="group flex items-center gap-4 p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                    >
                      <img
                        src={product.featuredImage}
                        alt={product.name}
                        className="w-12 h-14 object-cover rounded bg-noir-900"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-sm text-white group-hover:text-champagne transition-colors truncate">
                            {product.name}
                          </h4>
                          {product.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-champagne/20 text-champagne uppercase font-sans">
                              {product.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-platinum-dark truncate mt-0.5 font-sans">
                          {product.subtitle}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-semibold text-white">
                          ${product.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-platinum-dark block uppercase">
                          {product.category}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Searches */}
          {!query.trim() && recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs text-platinum-dark mb-3">
                <span className="uppercase tracking-widest text-[10px]">Recent Explorations</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-[10px] text-white/40 hover:text-white underline"
                >
                  Clear History
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => handleRecentClick(term)}
                    className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white/80 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Categories & Seasonal Spotlights */}
          {!query.trim() && (
            <div className="pt-2 border-t border-white/5">
              <span className="uppercase tracking-widest text-[10px] text-platinum-dark block mb-3">
                Seasonal Spotlights
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <Link
                  to="/collections/noir-absolu"
                  onClick={closeSearch}
                  className="p-3 rounded-lg bg-noir-900 border border-white/5 hover:border-champagne/30 text-xs transition-colors flex items-center gap-2 group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-champagne" />
                  <span className="group-hover:text-champagne transition-colors">Noir Absolu FW26</span>
                </Link>
                <Link
                  to="/shop/women"
                  onClick={closeSearch}
                  className="p-3 rounded-lg bg-noir-900 border border-white/5 hover:border-champagne/30 text-xs transition-colors flex items-center gap-2 group"
                >
                  <span className="group-hover:text-champagne transition-colors">Women&apos;s Gowns & Coats</span>
                </Link>
                <Link
                  to="/shop/accessories"
                  onClick={closeSearch}
                  className="p-3 rounded-lg bg-noir-900 border border-white/5 hover:border-champagne/30 text-xs transition-colors flex items-center gap-2 group"
                >
                  <span className="group-hover:text-champagne transition-colors">Box Calfskin Bags</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
