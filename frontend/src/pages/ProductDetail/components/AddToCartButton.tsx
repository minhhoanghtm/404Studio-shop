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
        <div className="flex items-center border border-[var(--border)] rounded-xl bg-[var(--bg-alt)] px-2 text-[var(--text)]">
          <button
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            aria-label="Giảm số lượng"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-xs font-mono font-medium">{quantity}</span>
          <button
            onClick={() => onQuantityChange(quantity + 1)}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
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
              ? 'bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] scale-100 hover:scale-[1.01]'
              : 'bg-[var(--bg-alt)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed'
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
              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)] shadow-md'
              : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg-alt)] text-[var(--text)]'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Share Button */}
        <button
          onClick={onShare}
          aria-label={vi.catalog.share}
          className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg-alt)] text-[var(--text)] transition-colors flex items-center justify-center"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
