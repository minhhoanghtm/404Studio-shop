import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/shared/stores/useCartStore';
import { CartItemList } from './components/CartItemList';
import { CouponBox } from './components/CouponBox';
import { CartSummary } from './components/CartSummary';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { vi } from '@/shared/locales/vi/common';

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

  const count = getItemsCount();
  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShippingFee();
  const tax = getTax();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="w-full bg-noir-950 text-white min-h-[75vh] flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md space-y-6">
          <div className="w-20 h-20 rounded-full border border-champagne/30 flex items-center justify-center mx-auto text-champagne">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-white">
            {vi.cart.emptyTitle}
          </h1>
          <p className="text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
            {vi.cart.emptySubtitle}
          </p>
          <div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest transition-colors shadow-lg"
            >
              <span>{vi.cart.discoverCta}</span>
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
              Danh mục sản phẩm tuyển chọn
            </span>
            <h1 className="font-display text-3xl sm:text-5xl text-white tracking-wide">
              {vi.cart.title}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="font-mono text-platinum-dark">
              {count} sản phẩm
            </span>
            <button
              onClick={clearCart}
              className="text-white/40 hover:text-red-400 underline transition-colors"
            >
              {vi.cart.clearBag}
            </button>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Items & Coupon */}
          <div className="lg:col-span-8 space-y-8">
            <CartItemList
              items={items}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
            />

            <div className="p-6 rounded-2xl bg-noir-900/60 border border-white/10 space-y-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-champagne block">
                Mã ưu đãi đặc quyền Patron
              </span>
              <CouponBox
                appliedCoupon={appliedCoupon}
                couponError={couponError}
                onApplyCoupon={applyCoupon}
                onRemoveCoupon={removeCoupon}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <CartSummary
              subtotal={subtotal}
              discount={discount}
              shipping={shipping}
              tax={tax}
              total={total}
              onProceedToCheckout={() => navigate('/checkout')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
