import React from 'react';
import { ProductVariant } from '../../../shared/types';
import { Check } from 'lucide-react';

interface ColorVariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantIndex: number;
  onSelectVariant: (index: number) => void;
}

export const ColorVariantSelector: React.FC<ColorVariantSelectorProps> = ({
  variants,
  selectedVariantIndex,
  onSelectVariant,
}) => {
  const active = variants[selectedVariantIndex] || variants[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-sans">
        <span className="text-[var(--text-muted)] font-medium">Sắc độ màu:</span>
        <span className="text-[var(--text-primary)] font-semibold uppercase tracking-wider font-mono">
          {active.colorName}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {variants.map((v, idx) => {
          const isSelected = selectedVariantIndex === idx;
          const isLight =
            v.colorHex.toLowerCase() === '#ffffff' ||
            v.colorHex.toLowerCase() === '#f4f1ea' ||
            v.colorHex.toLowerCase() === '#f5f5f5';

          return (
            <button
              key={v.colorName}
              type="button"
              onClick={() => onSelectVariant(idx)}
              className={`relative w-8 h-8 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                isSelected
                  ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/50 scale-110 shadow-sm'
                  : 'border-[var(--border)] hover:border-[var(--accent)]/60'
              }`}
              style={{ backgroundColor: v.colorHex }}
              title={v.colorName}
              aria-label={`Chọn sắc độ ${v.colorName}`}
            >
              {isSelected && (
                <Check className={`w-3.5 h-3.5 ${isLight ? 'text-black' : 'text-white'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
