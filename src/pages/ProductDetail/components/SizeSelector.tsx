import React from 'react';
import { Link } from 'react-router-dom';
import { Ruler } from 'lucide-react';
import { ProductSize } from '../../../shared/types';
import { vi } from '../../../shared/locales/vi/common';

interface SizeSelectorProps {
  sizes: ProductSize[];
  selectedSize: string;
  onSelectSize: (size: string) => void;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes,
  selectedSize,
  onSelectSize,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-sans">
        <span className="text-white/60">Kích cỡ may đo:</span>
        <Link
          to="/support#size-guide"
          className="text-champagne hover:text-champagne-hover flex items-center gap-1 transition-colors"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>{vi.catalog.sizeGuide}</span>
        </Link>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {sizes.map((s) => (
          <button
            key={s.size}
            onClick={() => s.inStock && onSelectSize(s.size)}
            disabled={!s.inStock}
            className={`py-3 px-2 rounded-lg text-xs font-mono transition-all border text-center ${
              selectedSize === s.size
                ? 'bg-champagne text-noir-950 font-bold border-champagne shadow-md'
                : s.inStock
                ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                : 'bg-noir-950/40 text-white/20 border-white/5 cursor-not-allowed line-through'
            }`}
            aria-label={`Kích cỡ ${s.size} ${s.inStock ? '' : '(Hết hàng)'}`}
          >
            {s.size}
          </button>
        ))}
      </div>
    </div>
  );
};
