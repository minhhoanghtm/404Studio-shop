import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '@/shared/api';
import { adaptBackendProduct } from '@/shared/utils/productAdapter';
import { ProductCard } from '@/shared/components/ProductCard';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { vi } from '@/shared/locales/vi/common';
import { Product } from '@/shared/types';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc'>('relevance');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await productsApi.getProducts({ limit: 100 });
        if (cancelled) return;
        const rawList = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.products)
          ? (res.data as any).products
          : Array.isArray(res)
          ? res
          : [];
        if (rawList.length > 0) {
          setAllProducts(rawList.map(adaptBackendProduct));
        }
      } catch {}
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allProducts;

    let list = allProducts.filter(
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
  }, [allProducts, query, selectedCategory, sortBy]);

  const categoryOptions = [
    { label: vi.catalog.all, value: 'all' },
    { label: vi.nav.women, value: 'women' },
    { label: vi.nav.men, value: 'men' },
    { label: vi.nav.accessories, value: 'accessories' },
    { label: vi.nav.couture, value: 'couture' },
  ];

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header & Search Bar */}
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <span className="text-[10px] font-mono uppercase tracking-ultra text-[var(--accent)]">
            {vi.search.badge}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-[var(--text)] tracking-wide">
            {vi.search.title}
          </h1>

          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-5 h-5 text-[var(--accent)] absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={vi.search.placeholder}
              className="w-full pl-12 pr-12 py-4 bg-[var(--bg-alt)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm sm:text-base outline-none rounded-xl shadow-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSearchParams({});
                }}
                className="absolute right-4 text-[var(--text-muted)] hover:text-[var(--text)] p-1"
                aria-label="Xóa nội dung tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-y border-[var(--border)] py-4 gap-4 text-xs font-sans">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categoryOptions.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3.5 py-1.5 rounded-full uppercase tracking-wider transition-colors whitespace-nowrap ${
                  selectedCategory === cat.value
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold'
                    : 'bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[var(--text-muted)] font-mono">
              {vi.catalog.showing} {results.length} {vi.catalog.items}
            </span>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent)]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[var(--accent)]"
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
            <h3 className="font-display text-2xl text-[var(--text)]">
              {vi.search.noResultsTitle}
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-sans leading-relaxed">
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
