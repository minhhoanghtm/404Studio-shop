import React from 'react';
import { ArrowRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatters';
import { vi } from '../../../shared/locales/vi/common';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  onProceedToCheckout: () => void;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  discount,
  shipping,
  tax,
  total,
  onProceedToCheckout,
}) => {
  return (
    <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-6 shadow-xl sticky top-28">
      <h3 className="font-display text-xl text-white tracking-wide border-b border-white/10 pb-4">
        Tóm tắt danh mục sở hữu
      </h3>

      <div className="space-y-3 text-xs font-sans text-white/70">
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
          <span className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-champagne" />
            {vi.cart.shipping}
          </span>
          <span className="font-mono text-white">
            {shipping === 0 ? vi.cart.complimentary : formatCurrency(shipping)}
          </span>
        </div>

        <div className="flex justify-between">
          <span>{vi.cart.tax}</span>
          <span className="font-mono text-white">{formatCurrency(tax)}</span>
        </div>

        <div className="flex justify-between text-base font-semibold text-white pt-4 border-t border-white/10">
          <span className="font-display tracking-wide">{vi.cart.total}</span>
          <span className="font-mono text-champagne">{formatCurrency(total)}</span>
        </div>
      </div>

      <button
        onClick={onProceedToCheckout}
        className="w-full py-4 px-6 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01]"
      >
        <span>{vi.cart.checkoutCta}</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <div className="space-y-2 pt-2 border-t border-white/5 text-[11px] text-white/50 font-sans">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-champagne" />
          <span>Giao thức mã hóa an toàn 256-bit chuẩn Maison</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-champagne" />
          <span>Bảo hiểm vận chuyển ngoại giao 100% giá trị tác phẩm</span>
        </div>
      </div>
    </div>
  );
};
