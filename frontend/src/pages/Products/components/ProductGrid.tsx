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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
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
            className="p-2 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded transition-colors ${
                  currentPage === page
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
