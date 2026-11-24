import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/shared/stores/useCartStore';
import { CartItemList } from './components/CartItemList';
import { CouponBox } from './components/CouponBox';
import { CartSummary } from './components/CartSummary';
import { ArrowRight, ShoppingBag, AlertTriangle, Trash2 } from 'lucide-react';
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
    removeInvalidItems,
  } = useCartStore();

  const objectId = /^[a-f\d]{24}$/i;
  const invalidItems = items.filter((item) => !objectId.test(item.productId));

  const count = getItemsCount();
  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShippingFee();
  const tax = getTax();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-[75vh] flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md space-y-6">
          <div className="w-20 h-20 rounded-full border border-[var(--accent)]/40 flex items-center justify-center mx-auto text-[var(--accent)]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-[var(--text)]">
            {vi.cart.emptyTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-sans font-light">
            {vi.cart.emptySubtitle}
          </p>
          <div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold text-xs uppercase tracking-widest transition-colors shadow-lg"
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
    <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[var(--border)] pb-6 gap-4">
          <div>
            <span className="text-[10px] font-sans font-semibold tracking-widest text-[var(--accent)] uppercase block mb-1">
              Danh mục sản phẩm tuyển chọn
            </span>
            <h1 className="font-display text-3xl sm:text-5xl text-[var(--text)] tracking-wide">
              {vi.cart.title}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="font-mono text-[var(--text-muted)]">
              {count} sản phẩm
            </span>
            <button
              onClick={clearCart}
              className="text-[var(--text-muted)] hover:text-red-500 underline transition-colors"
            >
              {vi.cart.clearBag}
            </button>
          </div>
        </div>

        {/* Cảnh báo sản phẩm dữ liệu mẫu kèm nút Xóa sản phẩm lỗi */}
        {invalidItems.length > 0 && (
          <div className="bg-red-950/20 dark:bg-red-950/40 border border-red-500/40 rounded-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Phát hiện {invalidItems.length} sản phẩm dữ liệu mẫu chưa có mã Backend</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Sản phẩm lỗi: <strong className="text-[var(--text)]">{invalidItems.map((it) => it.name).join(', ')}</strong>. Vui lòng xóa các mục này để tiếp tục mua hàng an toàn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeInvalidItems()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-600 dark:text-red-200 border border-red-500/40 rounded text-xs font-mono font-medium transition-colors shrink-0 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa sản phẩm lỗi ({invalidItems.length})
            </button>
          </div>
        )}

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Items & Coupon */}
          <div className="lg:col-span-8 space-y-8">
            <CartItemList
              items={items}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
            />

            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--accent)] block font-semibold">
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
