import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore';

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
              <h3 className="font-display text-xl tracking-wider text-white">Shopping Bag</h3>
              <span className="text-xs font-mono text-champagne">({count})</span>
            </div>
            <button
              onClick={closeDrawer}
              className="p-1.5 text-white/60 hover:text-white rounded-full hover:bg-white/5 transition-colors"
              aria-label="Close bag drawer"
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
                <h4 className="font-display text-xl text-white mb-2">Your Bag is Empty</h4>
                <p className="text-xs text-platinum-dark max-w-xs mb-6 font-sans">
                  Explore our Autumn/Winter 2026 runway presentations and limited edition artisanal curations.
                </p>
                <Link
                  to="/shop"
                  onClick={closeDrawer}
                  className="px-6 py-3 bg-champagne text-noir-950 text-xs font-semibold uppercase tracking-widest hover:bg-champagne-hover transition-colors"
                >
                  Discover Collections
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
                  className="pt-4 first:pt-0 flex gap-4"
                >
                  {/* Item Image */}
                  <Link
                    to={`/products/${item.productSlug}`}
                    onClick={closeDrawer}
                    className="w-20 h-24 rounded overflow-hidden bg-noir-900 flex-shrink-0"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  {/* Item Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/products/${item.productSlug}`}
                          onClick={closeDrawer}
                          className="font-serif text-sm font-medium text-white hover:text-champagne transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.productId, item.selectedColor, item.selectedSize)}
                          className="text-white/40 hover:text-red-400 transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-platinum-dark mt-1 space-x-2">
                        <span>Color: {item.selectedColor}</span>
                        <span>•</span>
                        <span>Size: {item.selectedSize}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-white/15 rounded bg-noir-900">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.selectedColor,
                              item.selectedSize,
                              item.quantity - 1
                            )
                          }
                          className="p-1 px-2 text-white/70 hover:text-white transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono font-medium text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.selectedColor,
                              item.selectedSize,
                              item.quantity + 1
                            )
                          }
                          className="p-1 px-2 text-white/70 hover:text-white transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Price */}
                      <span className="font-mono text-sm font-semibold text-white">
                        ${(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Calculations */}
          {items.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-noir-950 space-y-4">
              {/* Courtesy Coupon Box */}
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded bg-champagne/10 border border-champagne/30 text-xs">
                    <div className="flex items-center gap-2 text-champagne">
                      <Tag className="w-3.5 h-3.5" />
                      <span className="font-mono font-bold">{appliedCoupon.code}</span>
                      <span className="text-[10px] text-champagne-light">(-{appliedCoupon.discountPercentage}%)</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-white/40 hover:text-white text-[10px] uppercase underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Courtesy code (e.g. VANGUARD15)"
                      className="flex-1 px-3 py-2 bg-noir-900 border border-white/15 focus:border-champagne text-xs uppercase tracking-wider text-white placeholder-white/30 outline-none rounded"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-white/10 hover:bg-champagne hover:text-noir-950 text-xs uppercase font-medium tracking-wider transition-colors rounded"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && (
                  <p className="text-[11px] text-red-400 mt-1">{couponError}</p>
                )}
              </div>

              {/* Order Calculations */}
              <div className="space-y-1.5 text-xs text-platinum-dark font-sans">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white font-mono">${subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-champagne">
                    <span>Privilège Courtesy</span>
                    <span className="font-mono">-${discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>White-Glove Shipping</span>
                  <span className="text-white font-mono">
                    {shipping === 0 ? 'Complimentary' : `$${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Taxes (8%)</span>
                  <span className="text-white font-mono">${tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-semibold text-white">
                  <span>Estimated Total</span>
                  <span className="text-champagne font-mono text-base">${total.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-4 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between text-[11px] text-platinum-dark pt-1">
                  <Link
                    to="/cart"
                    onClick={closeDrawer}
                    className="underline hover:text-champagne transition-colors"
                  >
                    View Bag Details
                  </Link>
                  <span className="flex items-center gap-1 text-[10px]">
                    <ShieldCheck className="w-3 h-3 text-champagne" /> Secure Concierge Encrypted
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
