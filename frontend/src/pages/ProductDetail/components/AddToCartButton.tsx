import React, { useState } from 'react';
import { ShoppingBag, Heart, Share2, Plus, Minus, Check } from 'lucide-react';
import { vi } from '../../../shared/locales/vi/common';

interface AddToCartButtonProps {
  quantity: number;
  onQuantityChange: (qty: number) => void;
  isAvailable: boolean;
  onAddToCart: () => Promise<boolean>;
  isWishlisted: boolean;
  wishlistPending: boolean;
  onToggleWishlist: () => void;
  onShare: () => void;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  quantity,
  onQuantityChange,
  isAvailable,
  onAddToCart,
  isWishlisted,
  wishlistPending,
  onToggleWishlist,
  onShare,
}) => {
  const [justAdded, setJustAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleClickAdd = async () => {
    if (!isAvailable || isAdding) return;
    setIsAdding(true);
    try {
      if (await onAddToCart()) { setJustAdded(true); setTimeout(() => setJustAdded(false), 2000); }
    } finally { setIsAdding(false); }
  };

  return (
    <div className="space-y-4 pt-3">
      <div className="flex gap-3 items-stretch">
        {/* Quantity Controls */}
        <div className="flex items-center border border-[var(--border)] bg-[var(--bg-card)] px-1 text-[var(--text-primary)]">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="p-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            aria-label="Giảm số lượng"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-xs font-mono font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(quantity + 1)}
            className="p-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            aria-label="Tăng số lượng"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Primary Action Button (Thêm Vào Túi) */}
        <button
          type="button"
          onClick={handleClickAdd}
          disabled={!isAvailable || isAdding}
          className={`flex-1 py-4 px-6 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            isAvailable
              ? justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-page)] shadow-sm'
              : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed opacity-60'
          }`}
        >
          {justAdded ? (
            <>
              <Check className="w-4 h-4 animate-scale-in" />
              <span>Đã Thêm Vào Túi</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>{isAvailable ? 'Thêm Vào Túi May Đo' : vi.catalog.soldOut}</span>
            </>
          )}
        </button>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={onToggleWishlist}
          disabled={wishlistPending}
          title={isWishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
          aria-label={isWishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
          className={`p-4 border transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-wait ${
            isWishlisted
              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
              : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--text-primary)] text-[var(--text-primary)]'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={onShare}
          title="Chia sẻ tác phẩm"
          aria-label={vi.catalog.share}
          className="p-4 border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--text-primary)] text-[var(--text-primary)] transition-colors flex items-center justify-center cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
