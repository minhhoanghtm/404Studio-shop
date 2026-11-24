import React, { useState } from 'react';
import { Ruler } from 'lucide-react';
import { ProductSize } from '../../../shared/types';
import { vi } from '../../../shared/locales/vi/common';
import { SizeGuideModal } from './SizeGuideModal';

interface SizeSelectorProps {
  sizes: ProductSize[];
  selectedSize: string;
  onSelectSize: (size: string) => void;
  category?: string;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes,
  selectedSize,
  onSelectSize,
  category,
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="text-[var(--text-muted)] font-medium">Kích cỡ may đo:</span>
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="text-[var(--accent)] hover:underline flex items-center gap-1 transition-colors font-medium cursor-pointer"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>{vi.catalog.sizeGuide}</span>
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {sizes.map((s) => (
            <button
              key={s.size}
              onClick={() => s.inStock && onSelectSize(s.size)}
              disabled={!s.inStock}
              className={`py-3 px-2 rounded-none text-xs font-mono transition-all border text-center ${
                selectedSize === s.size
                  ? 'bg-[var(--text-primary)] text-[var(--bg-page)] font-bold border-[var(--text-primary)] shadow-sm'
                  : s.inStock
                  ? 'bg-[var(--bg-page)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                  : 'opacity-40 cursor-not-allowed line-through bg-[var(--bg-page)] text-[var(--text-muted)] border-[var(--border)]'
              }`}
              aria-label={`Kích cỡ ${s.size} ${s.inStock ? '' : '(Hết hàng)'}`}
            >
              {s.size}
            </button>
          ))}
        </div>
      </div>

      <SizeGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        category={category}
      />
    </>
  );
};
