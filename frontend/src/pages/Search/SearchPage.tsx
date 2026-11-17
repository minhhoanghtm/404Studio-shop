import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PRODUCTS } from '@/shared/data/products';
import { ProductCard } from '@/shared/components/ProductCard';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { vi } from '@/shared/locales/vi/common';
import { Product } from '@/shared/types';

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
      (p: Product) =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.composition.toLowerCase().includes(q)
    );

    if (selectedCategory !== 'all') {
      list = list.filter((p: Product) => p.category === selectedCategory);
    }

    if (sortBy === 'price-asc') {
      list.sort((a: Product, b: Product) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a: Product, b: Product) => b.price - a.price);
    }

    return list;
  }, [query, selectedCategory, sortBy]);

  const categoryOptions = [
    { label: vi.catalog.all, value: 'all' },
    { label: vi.nav.women, value: 'women' },
    { label: vi.nav.men, value: 'men' },
    { label: vi.nav.accessories, value: 'accessories' },
    { label: vi.nav.couture, value: 'couture' },
  ];

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header & Search Bar */}
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            {vi.search.badge}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-white tracking-wide">
            {vi.search.title}
          </h1>

          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-5 h-5 text-champagne absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={vi.search.placeholder}
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
                aria-label="Xóa nội dung tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-y border-white/10 py-4 gap-4 text-xs font-sans">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categoryOptions.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3.5 py-1.5 rounded-full uppercase tracking-wider transition-colors whitespace-nowrap ${
                  selectedCategory === cat.value
                    ? 'bg-champagne text-noir-950 font-bold'
                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-white/40 font-mono">
              {vi.catalog.showing} {results.length} {vi.catalog.items}
            </span>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-champagne" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-noir-900 border border-white/15 text-white text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-champagne"
                aria-label="Sắp xếp kết quả tìm kiếm"
              >
                <option value="relevance">Độ phù hợp cao nhất</option>
                <option value="price-asc">{vi.catalog.priceAsc}</option>
                <option value="price-desc">{vi.catalog.priceDesc}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {results.length === 0 ? (
          <div className="py-20 text-center space-y-3 max-w-md mx-auto">
            <h3 className="font-display text-2xl text-white">
              {vi.search.noResultsTitle}
            </h3>
            <p className="text-xs text-platinum-dark font-sans leading-relaxed">
              {vi.search.noResultsSubtitle}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {results.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
