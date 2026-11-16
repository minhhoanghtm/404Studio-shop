import React from 'react';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { Category } from '../../types';

export type SortOption = 'curated' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

interface FilterBarProps {
  selectedCategory: Category | 'all';
  onSelectCategory: (category: Category | 'all') => void;
  selectedSubCategory: string | null;
  onSelectSubCategory: (sub: string | null) => void;
  availableSubCategories: string[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onlyInStock: boolean;
  onToggleInStock: (val: boolean) => void;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedSubCategory,
  onSelectSubCategory,
  availableSubCategories,
  sortBy,
  onSortChange,
  onlyInStock,
  onToggleInStock,
  totalCount,
}) => {
  const categories: { label: string; value: Category | 'all' }[] = [
    { label: 'All Curations', value: 'all' },
    { label: 'Women', value: 'women' },
    { label: 'Men', value: 'men' },
    { label: 'Accessories', value: 'accessories' },
    { label: 'Haute Couture', value: 'couture' },
  ];

  return (
    <div className="w-full bg-noir-950 border-y border-white/10 py-4 mb-8">
      {/* Top Filter Level: Category Tabs & Sorting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center overflow-x-auto no-scrollbar gap-2 pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                onSelectCategory(cat.value);
                onSelectSubCategory(null);
              }}
              className={`px-4 py-2 rounded-full text-xs uppercase font-sans tracking-widest font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat.value
                  ? 'bg-white text-noir-950 shadow-md font-semibold'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sorting & In-Stock Controls */}
        <div className="flex items-center justify-between md:justify-end gap-4 text-xs">
          {/* In-Stock Filter Toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-white/80 hover:text-white select-none">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => onToggleInStock(e.target.checked)}
              className="accent-champagne w-3.5 h-3.5 rounded"
            />
            <span className="text-[11px] tracking-wider uppercase font-sans">In-Stock Only</span>
          </label>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-champagne hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-noir-900 border border-white/15 text-white text-xs px-3 py-2 rounded-none outline-none focus:border-champagne"
            >
              <option value="curated">Curated Runway Order</option>
              <option value="newest">Newest Editions</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subcategories Chips & Total Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-platinum-dark mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Silhouettes:
          </span>
          {availableSubCategories.map((sub) => (
            <button
              key={sub}
              onClick={() =>
                onSelectSubCategory(selectedSubCategory === sub ? null : sub)
              }
              className={`px-3 py-1 text-[11px] rounded-full border transition-colors ${
                selectedSubCategory === sub
                  ? 'border-champagne bg-champagne/10 text-champagne font-medium'
                  : 'border-white/10 text-white/60 hover:text-white hover:border-white/25'
              }`}
            >
              {sub}
              {selectedSubCategory === sub && (
                <X className="w-3 h-3 inline-block ml-1 -mr-0.5" />
              )}
            </button>
          ))}
          {selectedSubCategory && (
            <button
              onClick={() => onSelectSubCategory(null)}
              className="text-[11px] text-white/40 hover:text-white underline ml-2"
            >
              Reset Silhouette
            </button>
          )}
        </div>

        <span className="text-xs font-mono text-platinum-dark">
          Showing {totalCount} archival items
        </span>
      </div>
    </div>
  );
};
