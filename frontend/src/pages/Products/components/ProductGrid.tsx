import React from 'react';
import { Product } from '../../../shared/types';
import { ProductCard } from '../../../shared/components/ProductCard';
import { ChevronLeft, ChevronRight, PackageOpen } from 'lucide-react';
import { vi } from '../../../shared/locales/vi/common';

interface ProductGridProps {
  products: Product[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  currentPage,
  totalPages,
  onPageChange,
  onResetFilters,
}) => {
  if (products.length === 0) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full border border-dashed border-[var(--accent)]/40 flex items-center justify-center mx-auto text-[var(--accent)]">
          <PackageOpen className="w-8 h-8" />
        </div>
        <h3 className="font-display text-2xl text-[var(--text)]">
          {vi.catalog.emptyTitle}
        </h3>
        <p className="text-xs text-[var(--text-muted)] font-sans leading-relaxed">
          {vi.catalog.emptySubtitle}
        </p>
        <button
          onClick={onResetFilters}
          className="px-6 py-2.5 rounded bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold uppercase tracking-widest hover:bg-[#9E7B15] transition-colors shadow-md"
        >
          {vi.catalog.resetFilters}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="product-card-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-8 border-t border-[var(--border)]">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn-nav p-2 rounded-lg border border-[#e3ded2] dark:border-white/15 bg-white dark:bg-zinc-800 text-[#1a1a17] dark:text-zinc-200 hover:text-[#8a6d1a] dark:hover:text-[#fef08a] hover:border-[#8a6d1a] dark:hover:border-[#d4af37] hover:bg-[#f7f5ef] dark:hover:bg-zinc-700/80 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-lg font-mono text-xs border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  currentPage === page
                    ? 'pagination-btn-active bg-[#8a6d1a] text-white border-[#8a6d1a] dark:bg-[#d4af37] dark:text-[#121217] dark:border-[#d4af37] font-bold shadow-md shadow-amber-900/25 dark:shadow-[0_0_16px_rgba(212,175,55,0.45)]'
                    : 'pagination-btn-inactive border border-[#e3ded2] dark:border-white/15 bg-white dark:bg-zinc-800 text-[#1a1a17] dark:text-zinc-200 hover:border-[#8a6d1a] dark:hover:border-[#d4af37] hover:text-[#8a6d1a] dark:hover:text-[#fef08a] hover:bg-[#f7f5ef] dark:hover:bg-zinc-700/80 shadow-xs'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn-nav p-2 rounded-lg border border-[#e3ded2] dark:border-white/15 bg-white dark:bg-zinc-800 text-[#1a1a17] dark:text-zinc-200 hover:text-[#8a6d1a] dark:hover:text-[#fef08a] hover:border-[#8a6d1a] dark:hover:border-[#d4af37] hover:bg-[#f7f5ef] dark:hover:bg-zinc-700/80 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
