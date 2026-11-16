import React from 'react';
import { CartItem } from '../../../shared/types';
import { formatCurrency } from '../../../shared/utils/formatters';
import { vi } from '../../../shared/locales/vi/common';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface CheckoutSummaryProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  isProcessing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  items,
  subtotal,
  discount,
  shipping,
  tax,
  total,
  isProcessing,
  onSubmit,
}) => {
  return (
    <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-6 shadow-xl sticky top-28">
      <h3 className="font-display text-xl text-white tracking-wide border-b border-white/10 pb-4">
        Tóm tắt đơn hàng ({items.length})
      </h3>

      {/* Mini Items List */}
      <div className="divide-y divide-white/5 max-h-60 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
            className="py-3 first:pt-0 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={item.image}
                alt=""
                className="w-10 h-12 rounded object-cover bg-noir-950 flex-shrink-0 border border-white/10"
              />
              <div className="min-w-0">
                <p className="text-white truncate font-medium">{item.name}</p>
                <p className="text-[11px] text-white/50 font-sans">
                  {item.selectedColor} • {item.selectedSize} × {item.quantity}
                </p>
              </div>
            </div>
            <span className="font-mono text-champagne font-medium flex-shrink-0">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-2.5 text-xs font-sans text-white/70 border-t border-white/10 pt-4">
        <div className="flex justify-between">
          <span>{vi.cart.subtotal}</span>
          <span className="font-mono text-white">{formatCurrency(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-champagne">
            <span>{vi.cart.courtesyDiscount}</span>
            <span className="font-mono">-{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>{vi.cart.shipping}</span>
          <span className="font-mono text-white">
            {shipping === 0 ? vi.cart.complimentary : formatCurrency(shipping)}
          </span>
        </div>

        <div className="flex justify-between">
          <span>{vi.cart.tax}</span>
          <span className="font-mono text-white">{formatCurrency(tax)}</span>
        </div>

        <div className="flex justify-between text-base font-semibold text-white pt-3 border-t border-white/10">
          <span className="font-display tracking-wide">{vi.cart.total}</span>
          <span className="font-mono text-champagne">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={isProcessing}
        className="w-full py-4 px-6 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
      >
        <span>
          {isProcessing ? vi.checkout.authorizing : vi.checkout.confirmAndAuthorize}
        </span>
        {!isProcessing && <ArrowRight className="w-4 h-4" />}
      </button>

      <div className="flex items-center gap-2 text-[11px] text-white/50 justify-center pt-2">
        <ShieldCheck className="w-4 h-4 text-champagne" />
        <span>{vi.checkout.guarantee}</span>
      </div>
    </div>
  );
};
