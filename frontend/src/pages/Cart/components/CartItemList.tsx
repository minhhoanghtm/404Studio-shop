import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import { CartItem } from '../../../shared/types';
import { formatCurrency } from '../../../shared/utils/formatters';

interface CartItemListProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, color: string, size: string, qty: number) => void;
  onRemoveItem: (productId: string, color: string, size: string) => void;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  return (
    <div className="divide-y divide-[var(--border)]">
      {items.map((item) => (
        <div
          key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
          className="py-6 first:pt-0 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between"
        >
          {/* Thumbnail & Title */}
          <div className="flex gap-4 items-center min-w-0">
            <Link
              to={`/products/${item.productSlug}`}
              className="w-24 h-32 rounded-xl overflow-hidden bg-[var(--bg-alt)] border border-[var(--border)] flex-shrink-0"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </Link>

            <div className="space-y-1">
              <Link
                to={`/products/${item.productSlug}`}
                className="font-display text-lg sm:text-xl text-[var(--text)] hover:text-[var(--accent)] transition-colors"
              >
                {item.name}
              </Link>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-sans">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-[var(--border)] inline-block"
                    style={{ backgroundColor: item.selectedColorHex }}
                  />
                  {item.selectedColor}
                </span>
                <span>•</span>
                <span>Cỡ: {item.selectedSize}</span>
              </div>
              <span className="font-mono text-sm text-[var(--accent)] font-semibold block sm:hidden pt-1">
                {formatCurrency(item.price)}
              </span>
            </div>
          </div>

          {/* Controls: Quantity, Line Price & Remove */}
          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            {/* Quantity Stepper */}
            <div className="flex items-center border border-[var(--border)] rounded-lg bg-[var(--bg-alt)]">
              <button
                onClick={() =>
                  onUpdateQuantity(
                    item.productId,
                    item.selectedColor,
                    item.selectedSize,
                    item.quantity - 1
                  )
                }
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                aria-label="Giảm số lượng"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 text-xs font-mono text-[var(--text)]">{item.quantity}</span>
              <button
                onClick={() =>
                  onUpdateQuantity(
                    item.productId,
                    item.selectedColor,
                    item.selectedSize,
                    item.quantity + 1
                  )
                }
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                aria-label="Tăng số lượng"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Line Price in VND */}
            <div className="text-right min-w-[120px] hidden sm:block">
              <span className="font-mono text-base text-[var(--accent)] font-semibold">
                {formatCurrency(item.price * item.quantity)}
              </span>
              {item.quantity > 1 && (
                <span className="block text-[11px] text-[var(--text-muted)] font-mono">
                  {formatCurrency(item.price)} / chiếc
                </span>
              )}
            </div>

            {/* Remove Action */}
            <button
              onClick={() => onRemoveItem(item.productId, item.selectedColor, item.selectedSize)}
              className="text-[var(--text-muted)] hover:text-red-500 p-2 transition-colors rounded-lg hover:bg-[var(--bg-alt)]"
              aria-label="Xóa sản phẩm khỏi túi"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
