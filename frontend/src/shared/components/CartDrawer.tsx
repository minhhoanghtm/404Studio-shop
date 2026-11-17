import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';
import { formatCurrency } from '../utils/formatters';
import { vi } from '../locales/vi/common';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    removeItem,
    updateQuantity,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getDiscount,
    getShippingFee,
    getTax,
    getTotal,
    getItemsCount,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');

  if (!isDrawerOpen) return null;

  const count = getItemsCount();
  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShippingFee();
  const tax = getTax();
  const total = getTotal();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const success = applyCoupon(couponInput);
    if (success) {
      setCouponInput('');
    }
  };

  const handleProceedToCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-noir-950 text-white border-l border-white/10 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-champagne" />
              <h3 className="font-display text-xl tracking-wider text-white">{vi.cart.title}</h3>
              <span className="text-xs font-mono text-champagne">({count})</span>
            </div>
            <button
              onClick={closeDrawer}
              className="p-1.5 text-white/60 hover:text-white rounded-full hover:bg-white/5 transition-colors"
              aria-label="Đóng túi mua sắm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body / Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-white/5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 rounded-full border border-dashed border-champagne/30 flex items-center justify-center mb-4 text-champagne">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h4 className="font-display text-xl text-white mb-2">{vi.cart.emptyTitle}</h4>
                <p className="text-xs text-platinum-dark max-w-xs mb-6 font-sans">
                  {vi.cart.emptySubtitle}
                </p>
                <Link
                  to="/products"
                  onClick={closeDrawer}
                  className="px-6 py-3 bg-champagne text-noir-950 text-xs font-semibold uppercase tracking-widest hover:bg-champagne-hover transition-colors"
                >
                  {vi.cart.discoverCta}
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
                  className="pt-4 first:pt-0 flex gap-4"
                >
                  {/* Thumbnail */}
                  <Link
                    to={`/products/${item.productSlug}`}
                    onClick={closeDrawer}
                    className="w-20 h-24 rounded bg-noir-900 overflow-hidden flex-shrink-0 border border-white/10"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/products/${item.productSlug}`}
                          onClick={closeDrawer}
                          className="font-display text-sm text-white hover:text-champagne transition-colors truncate"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.productId, item.selectedColor, item.selectedSize)}
                          className="text-white/40 hover:text-red-400 p-1 transition-colors"
                          aria-label="Xóa tác phẩm khỏi túi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-white/50 font-sans">
                        <span>Màu: {item.selectedColor}</span>
                        <span>•</span>
                        <span>Cỡ: {item.selectedSize}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-white/15 rounded">
                        <button
                          onClick={() => updateQuantity(item.productId, item.selectedColor, item.selectedSize, item.quantity - 1)}
                          className="p-1 text-white/60 hover:text-white transition-colors"
                          aria-label="Giảm số lượng"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-mono">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.selectedColor, item.selectedSize, item.quantity + 1)}
                          className="p-1 text-white/60 hover:text-white transition-colors"
                          aria-label="Tăng số lượng"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Price in VND */}
                      <span className="font-mono text-sm text-champagne font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer / Summary Area */}
          {items.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-noir-900/60 space-y-4">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder={vi.cart.couponPlaceholder}
                      className="w-full pl-9 pr-3 py-2 bg-noir-950 border border-white/15 rounded text-xs text-white placeholder-white/40 focus:border-champagne outline-none font-mono uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs uppercase tracking-wider font-semibold rounded transition-colors"
                  >
                    {vi.cart.apply}
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs text-champagne pt-1">
                    <span>Đặc quyền kích hoạt: {appliedCoupon.code} (-{appliedCoupon.discountPercentage}%)</span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-white/40 hover:text-white underline text-[11px]"
                    >
                      {vi.cart.removeCoupon}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-[11px] text-red-400">{couponError}</p>
                )}
              </form>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs font-sans text-white/70 border-t border-white/5 pt-3">
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
                <div className="flex justify-between text-base font-semibold text-white pt-2 border-t border-white/10">
                  <span className="font-display tracking-wide">{vi.cart.total}</span>
                  <span className="font-mono text-champagne">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-3.5 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>{vi.cart.checkoutCta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center justify-between text-[11px]">
                  <Link
                    to="/cart"
                    onClick={closeDrawer}
                    className="text-white/60 hover:text-champagne transition-colors underline"
                  >
                    {vi.cart.viewCart}
                  </Link>

                  <div className="flex items-center gap-1.5 text-white/40">
                    <ShieldCheck className="w-3.5 h-3.5 text-champagne" />
                    <span>{vi.cart.secureEncrypted}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
