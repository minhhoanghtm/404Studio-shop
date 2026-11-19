import React from 'react';
import { Category } from '../../../shared/types';
import { SortOption } from '../hooks/useProductFilters';
import { SlidersHorizontal, Check } from 'lucide-react';
import { vi } from '../../../shared/locales/vi/common';

interface ProductFilterBarProps {
  selectedCategory: Category | 'all';
  onSelectCategory: (category: Category | 'all') => void;
  selectedSubCategory: string | null;
  onSelectSubCategory: (subCategory: string | null) => void;
  availableSubCategories: string[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onlyInStock: boolean;
  onToggleInStock: (val: boolean) => void;
  totalCount: number;
}

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
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
    { label: vi.catalog.all, value: 'all' },
    { label: vi.nav.women, value: 'women' },
    { label: vi.nav.men, value: 'men' },
    { label: vi.nav.accessories, value: 'accessories' },
    { label: vi.nav.couture, value: 'couture' },
  ];

  return (
    <div className="w-full space-y-6 pb-8 border-b border-white/10">
      {/* Category Tabs */}
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-2 sm:gap-4 py-2 border-b border-white/5">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onSelectCategory(cat.value)}
            className={`px-5 py-2.5 rounded-full text-xs font-sans tracking-editorial uppercase transition-all whitespace-nowrap ${
              selectedCategory === cat.value
                ? 'bg-champagne text-noir-950 font-semibold shadow-lg scale-105'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Subcategory Pills */}
      {availableSubCategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] uppercase tracking-widest text-white/40 font-mono mr-1">
            {vi.catalog.silhouettes}
          </span>
          <button
            onClick={() => onSelectSubCategory(null)}
            className={`px-3 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              selectedSubCategory === null
                ? 'bg-white/15 text-white font-medium'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Tất cả
          </button>
          {availableSubCategories.map((sub) => (
            <button
              key={sub}
              onClick={() => onSelectSubCategory(sub)}
              className={`px-3 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                selectedSubCategory === sub
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Controls: Count, In-Stock Toggle, Sort Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3 text-xs font-sans text-white/60">
          <span className="font-mono text-champagne">{vi.catalog.showing} {totalCount} {vi.catalog.items}</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* In Stock Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white/70 hover:text-white transition-colors">
            <div
              onClick={() => onToggleInStock(!onlyInStock)}
              className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                onlyInStock
                  ? 'bg-champagne border-champagne text-noir-950'
                  : 'border-white/30 bg-transparent'
              }`}
            >
              {onlyInStock && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span>{vi.catalog.inStockOnly}</span>
          </label>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-champagne hidden sm:inline-block" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-noir-900 border border-white/15 text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-champagne cursor-pointer font-sans"
              aria-label="Sắp xếp sản phẩm"
            >
              <option value="curated">{vi.catalog.curatedRunway}</option>
              <option value="price-asc">{vi.catalog.priceAsc}</option>
              <option value="price-desc">{vi.catalog.priceDesc}</option>
              <option value="rating">{vi.catalog.highestRated}</option>
              <option value="newest">{vi.catalog.newest}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
