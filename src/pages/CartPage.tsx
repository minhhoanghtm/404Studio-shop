import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/useCartStore';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag, ShoppingBag } from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
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

  const [couponCode, setCouponCode] = useState('');

  const count = getItemsCount();
  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShippingFee();
  const tax = getTax();
  const total = getTotal();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    if (applyCoupon(couponCode)) {
      setCouponCode('');
    }
  };

  if (items.length === 0) {
    return (
      <div className="w-full bg-noir-950 text-white min-h-[75vh] flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md space-y-6">
          <div className="w-20 h-20 rounded-full border border-champagne/30 flex items-center justify-center mx-auto text-champagne">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-white">Your Bag is Empty</h1>
          <p className="text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
            You currently have no curated archival items in your shopping portfolio. Explore our seasonal runway collections or ready-to-wear curations.
          </p>
          <div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest transition-colors shadow-lg"
            >
              <span>Explore The Collections</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
              Curated Portfolio
            </span>
            <h1 className="font-display text-3xl sm:text-5xl text-white tracking-wide">
              Shopping Bag
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="font-mono text-platinum-dark">
              {count} {count === 1 ? 'Garment' : 'Garments'}
            </span>
            <button
              onClick={clearCart}
              className="text-white/40 hover:text-red-400 underline transition-colors"
            >
              Clear Bag
            </button>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Items Table */}
          <div className="lg:col-span-8 space-y-6">
            <div className="divide-y divide-white/10">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
                  className="py-6 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-5">
                    <Link
                      to={`/products/${item.productSlug}`}
                      className="w-24 h-32 rounded-lg overflow-hidden bg-noir-900 border border-white/10 flex-shrink-0"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="space-y-1">
                      <Link
                        to={`/products/${item.productSlug}`}
                        className="font-serif text-lg text-white hover:text-champagne transition-colors font-medium block"
                      >
                        {item.name}
                      </Link>
                      <div className="text-xs text-platinum-dark font-sans space-x-2">
                        <span>Color: {item.selectedColor}</span>
                        <span>•</span>
                        <span>Size: {item.selectedSize}</span>
                      </div>
                      <span className="font-mono text-sm text-champagne block pt-1">
                        ${item.price.toLocaleString()} each
                      </span>
                    </div>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-8">
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
                        className="p-2 text-white/70 hover:text-white"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-mono font-medium text-white">
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
                        className="p-2 text-white/70 hover:text-white"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-mono text-base font-semibold text-white min-w-[80px] text-right">
                      ${(item.price * item.quantity).toLocaleString()}
                    </span>

                    <button
                      onClick={() =>
                        removeItem(item.productId, item.selectedColor, item.selectedSize)
                      }
                      className="p-2 text-white/40 hover:text-red-400 transition-colors"
                      aria-label="Remove garment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Courtesy Code Input */}
            <div className="pt-6 border-t border-white/10">
              <span className="text-xs uppercase tracking-widest text-platinum-dark block mb-2 font-sans font-medium">
                Privilège Courtesy Code
              </span>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-champagne/10 border border-champagne/30 text-xs">
                  <div className="flex items-center gap-2 text-champagne">
                    <Tag className="w-4 h-4" />
                    <span className="font-mono font-bold">{appliedCoupon.code}</span>
                    <span>— {appliedCoupon.description}</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-white/40 hover:text-white text-[11px] uppercase underline"
                  >
                    Remove Code
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-3 max-w-md">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter VANGUARD15 or LUXE20"
                    className="flex-1 px-4 py-3 bg-noir-900 border border-white/15 focus:border-champagne text-xs uppercase tracking-wider text-white placeholder-white/30 outline-none rounded"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-white/10 hover:bg-champagne hover:text-noir-950 text-xs font-semibold uppercase tracking-widest transition-colors rounded"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponError && (
                <p className="text-xs text-red-400 mt-2 font-sans">{couponError}</p>
              )}
            </div>
          </div>

          {/* Right Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-6 shadow-2xl sticky top-28">
              <h3 className="font-display text-2xl text-white">Summary</h3>

              <div className="space-y-3 text-xs text-platinum-dark font-sans border-b border-white/10 pb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white font-mono">${subtotal.toLocaleString()}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-champagne">
                    <span>Courtesy Discount</span>
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

                <div className="flex justify-between pt-3 border-t border-white/10 text-base font-semibold text-white">
                  <span>Estimated Total</span>
                  <span className="text-champagne font-mono text-xl">
                    ${total.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="space-y-2 pt-2 text-[11px] text-platinum-dark font-sans text-center">
                <p className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-champagne" />
                  White-glove courier insurance included
                </p>
                <p className="text-[10px] text-white/40">
                  Transactions processed via high-security 256-bit protocol
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
