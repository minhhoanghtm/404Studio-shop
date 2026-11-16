import React from 'react';
import { ShoppingBag, Heart, Share2, Plus, Minus } from 'lucide-react';
import { vi } from '../../../shared/locales/vi/common';

interface AddToCartButtonProps {
  quantity: number;
  onQuantityChange: (qty: number) => void;
  isAvailable: boolean;
  onAddToCart: () => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onShare: () => void;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  quantity,
  onQuantityChange,
  isAvailable,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  onShare,
}) => {
  return (
    <div className="space-y-4 pt-4">
      <div className="flex gap-4 items-stretch">
        {/* Quantity Controls */}
        <div className="flex items-center border border-white/15 rounded-xl bg-noir-900 px-2">
          <button
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="p-2 text-white/60 hover:text-white transition-colors"
            aria-label="Giảm số lượng"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-xs font-mono">{quantity}</span>
          <button
            onClick={() => onQuantityChange(quantity + 1)}
            className="p-2 text-white/60 hover:text-white transition-colors"
            aria-label="Tăng số lượng"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onAddToCart}
          disabled={!isAvailable}
          className={`flex-1 py-4 px-6 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl ${
            isAvailable
              ? 'bg-champagne hover:bg-champagne-hover text-noir-950 scale-100 hover:scale-[1.01]'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{isAvailable ? vi.catalog.addToCart : vi.catalog.soldOut}</span>
        </button>

        {/* Wishlist Button */}
        <button
          onClick={onToggleWishlist}
          aria-label={isWishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
          className={`p-4 rounded-xl border transition-colors flex items-center justify-center ${
            isWishlisted
              ? 'bg-champagne text-noir-950 border-champagne'
              : 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Share Button */}
        <button
          onClick={onShare}
          aria-label={vi.catalog.share}
          className="p-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center justify-center"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
