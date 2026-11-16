import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PRODUCTS } from '../data/products';
import { ProductCard } from '../components/product/ProductCard';
import { Search, X, SlidersHorizontal } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc'>('relevance');

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return PRODUCTS;

    let list = PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.composition.toLowerCase().includes(q)
    );

    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [query, selectedCategory, sortBy]);

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header & Search Bar */}
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            ARCHIVAL SEARCH PROTOCOL
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-white tracking-wide">
            Catalogue Search
          </h1>

          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-5 h-5 text-champagne absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search garments, textiles, silhouettes, coats..."
              className="w-full pl-12 pr-12 py-4 bg-noir-900 border border-white/15 focus:border-champagne text-white text-sm sm:text-base outline-none rounded-xl"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSearchParams({});
                }}
                className="absolute right-4 text-white/40 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-y border-white/10 py-4 gap-4 text-xs font-sans">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {['all', 'women', 'men', 'accessories', 'couture'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full uppercase tracking-wider transition-colors ${
                  selectedCategory === cat
                    ? 'bg-champagne text-noir-950 font-bold'
                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-platinum-dark">
              {results.length} archival matches
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-noir-900 border border-white/15 text-white px-3 py-1.5 rounded outline-none"
            >
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results Grid */}
        {results.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="font-serif italic text-2xl text-white">No archival pieces found</p>
            <p className="text-xs text-platinum-dark max-w-sm mx-auto">
              Please refine your search query or explore our recommended collections: Wool Coat, Silk Gown, Box Calfskin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
