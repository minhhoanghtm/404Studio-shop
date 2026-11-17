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
        <span className="text-white/60">Màu sắc:</span>
        <span className="text-white font-medium">{active.colorName}</span>
      </div>

      <div className="flex items-center gap-3">
        {variants.map((v, idx) => (
          <button
            key={v.colorName}
            onClick={() => onSelectVariant(idx)}
            className={`relative w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
              selectedVariantIndex === idx
                ? 'border-champagne scale-110 shadow-lg'
                : 'border-white/20 hover:border-white/50'
            }`}
            style={{ backgroundColor: v.colorHex }}
            title={v.colorName}
            aria-label={`Chọn sắc độ ${v.colorName}`}
          >
            {selectedVariantIndex === idx && (
              <Check className={`w-4 h-4 ${v.colorHex.toLowerCase() === '#ffffff' || v.colorHex.toLowerCase() === '#f4f1ea' ? 'text-noir-950' : 'text-white'}`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
