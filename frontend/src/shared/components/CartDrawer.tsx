import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';
import { formatCurrency } from '../utils/formatters';
import { vi } from '../locales/vi/common';
import { useModal } from '../context/ModalContext';
import { Z_INDEX } from '../config/zIndex';

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
    removeInvalidItems,
  } = useCartStore();

  const objectId = /^[a-f\d]{24}$/i;
  const invalidItems = items.filter((item) => !objectId.test(item.productId));

  const [couponInput, setCouponInput] = useState('');
  const [couponSuccessMessage, setCouponSuccessMessage] = useState<string | null>(null);

  // Animation & mounting states for smooth 350ms easeOutExpo entrance/exit
  const [isRendered, setIsRendered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize with Central Modal Stack
  const { overlayZIndex, contentZIndex, isTop } = useModal({
    id: 'cart-drawer',
    isOpen: isRendered && isOpen,
    onClose: closeDrawer,
  });

  // Manage mounting & animation states
  useEffect(() => {
    if (isDrawerOpen) {
      setIsRendered(true);
      const frame = requestAnimationFrame(() => {
        setIsOpen(true);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setIsOpen(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isDrawerOpen]);

  // Lock body scroll & stop Lenis (if present) when drawer is open
  useEffect(() => {
    if (isRendered && isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      if ((window as any).lenis?.stop) {
        (window as any).lenis.stop();
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        if ((window as any).lenis?.start) {
          (window as any).lenis.start();
        }
      };
    }
  }, [isRendered, isOpen]);

  // Focus trap: Only active when top modal in stack
  useEffect(() => {
    if (!isOpen || !isTop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDrawer]);

  // Initial focus inside drawer
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      const closeBtn = drawerRef.current.querySelector<HTMLElement>('button[aria-label="Đóng giỏ hàng"]');
      closeBtn?.focus();
    }
  }, [isOpen]);

  if (!isRendered || typeof document === 'undefined') return null;

  const count = getItemsCount();
  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShippingFee();
  const tax = getTax();
  const total = getTotal();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const success = applyCoupon(couponInput.trim());
    if (success) {
      setCouponSuccessMessage('Áp dụng mã ưu đãi thành công!');
      setCouponInput('');
    } else {
      setCouponSuccessMessage(null);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponSuccessMessage(null);
  };

  const handleProceedToCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  return createPortal(
    <div className="fixed inset-0 pointer-events-auto" style={{ zIndex: overlayZIndex }}>
      {/* 1. Backdrop Overlay */}
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        style={{ zIndex: overlayZIndex }}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-[350ms] ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 2. Drawer Panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Giỏ hàng"
        style={{ zIndex: contentZIndex }}
        className={`fixed top-0 right-0 h-[100dvh] w-full sm:w-[440px] max-w-full bg-[var(--surface)] text-[var(--text)] border-l border-[var(--border)] shadow-2xl flex flex-col justify-between transition-transform duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ========================================================================= */}
        {/* VÙNG 1: HEADER CỐ ĐỊNH */}
        {/* ========================================================================= */}
        <div className="h-16 px-6 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="font-display font-serif text-lg tracking-wider text-[var(--text)] uppercase font-semibold">
              GIỎ HÀNG <span className="font-mono text-sm text-[var(--accent)] font-normal">({count})</span>
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] rounded-full hover:bg-[var(--bg-alt)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            aria-label="Đóng giỏ hàng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VÙNG 2: DANH SÁCH SẢN PHẨM */}
        {/* ========================================================================= */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {/* Cảnh báo sản phẩm mẫu / chưa đồng bộ Backend */}
          {invalidItems.length > 0 && (
            <div className="p-3 bg-red-950/20 dark:bg-red-950/60 border-b border-red-500/30 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-300 font-medium truncate">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="truncate">{invalidItems.length} sản phẩm mẫu chưa có mã Backend</span>
              </div>
              <button
                type="button"
                onClick={() => removeInvalidItems()}
                className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-200 border border-red-500/30 rounded text-[11px] font-mono transition-colors shrink-0"
              >
                Xóa sản phẩm lỗi
              </button>
            </div>
          )}

          {items.length === 0 ? (
            /* Trạng thái giỏ hàng rỗng */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 py-12">
              <div className="w-16 h-16 rounded-full border border-dashed border-[var(--accent)]/40 flex items-center justify-center mb-4 text-[var(--accent)]">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="font-display font-serif text-lg text-[var(--text)] mb-1.5 font-medium">
                {vi.cart.emptyTitle}
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-xs mb-6 font-sans leading-relaxed">
                {vi.cart.emptySubtitle}
              </p>
              <Link
                to="/products"
                onClick={closeDrawer}
                className="px-6 py-3 bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-sans font-semibold uppercase tracking-widest hover:bg-[#9E7B15] rounded-sm transition-colors shadow-md"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          ) : (
            /* Danh sách thẻ sản phẩm */
            <div className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
                  className="p-4 sm:px-6 flex gap-3.5 items-start"
                >
                  {/* Ảnh 72×96px bên trái */}
                  <Link
                    to={`/products/${item.productSlug}`}
                    onClick={closeDrawer}
                    style={{ width: '72px', height: '96px' }}
                    className="w-[72px] h-[96px] shrink-0 rounded-sm bg-[var(--bg-alt)] overflow-hidden block ring-1 ring-[var(--border)]"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '72px', height: '96px' }}
                      className="w-[72px] h-[96px] object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </Link>

                  {/* Nội dung bên phải */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-[96px]">
                    {/* Hàng trên: Tên sản phẩm & Nút xóa */}
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/products/${item.productSlug}`}
                        onClick={closeDrawer}
                        className="font-sans text-xs sm:text-sm font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug flex-1 min-w-0"
                        title={item.name}
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.selectedColor, item.selectedSize)}
                        className="text-[var(--text-muted)] hover:text-red-500 p-1 rounded hover:bg-[var(--bg-alt)] transition-colors shrink-0 -mt-0.5 -mr-1"
                        aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Dòng giữa: Màu · Cỡ */}
                    <div className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5 truncate">
                      {item.selectedColor} · {item.selectedSize}
                    </div>

                    {/* Hàng dưới: Bộ chỉnh số lượng & Giá căn phải */}
                    <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                      {/* Bộ chỉnh số lượng */}
                      <div className="flex items-center border border-[var(--border)] rounded-sm bg-[var(--bg-alt)]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.selectedColor, item.selectedSize, item.quantity - 1)}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                          aria-label="Giảm số lượng"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono text-[var(--text)] min-w-[24px] text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.selectedColor, item.selectedSize, item.quantity + 1)}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                          aria-label="Tăng số lượng"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Giá tiền căn phải */}
                      <span className="font-mono text-xs sm:text-sm text-[var(--accent)] font-semibold text-right truncate">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* VÙNG 3: FOOTER CỐ ĐỊNH Ở ĐÁY */}
        {/* ========================================================================= */}
        <div
          className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] p-6 space-y-4"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
        >
          {/* Ô mã ưu đãi */}
          <form onSubmit={handleApplyCoupon} className="space-y-1.5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={inputRef}
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    if (couponSuccessMessage) setCouponSuccessMessage(null);
                  }}
                  placeholder={vi.cart.couponPlaceholder}
                  className="w-full pl-9 pr-3 py-2 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-mono uppercase focus:ring-1 focus:ring-[var(--accent)]/40"
                />
              </div>
              <button
                type="submit"
                disabled={!couponInput.trim()}
                className="px-4 py-2 bg-[var(--bg-alt)] hover:bg-[var(--border)] text-[var(--text)] text-xs uppercase tracking-wider font-semibold rounded-sm border border-[var(--border)] transition-colors disabled:opacity-40 font-sans"
              >
                {vi.cart.apply}
              </button>
            </div>

            {/* Trạng thái mã ưu đãi */}
            {appliedCoupon && (
              <div className="flex items-center justify-between text-xs font-sans text-[var(--accent)] pt-0.5">
                <span>Đặc quyền kích hoạt: {appliedCoupon.code} (-{appliedCoupon.discountPercentage}%)</span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-[var(--text-muted)] hover:text-[var(--text)] underline text-[11px] font-sans transition-colors"
                >
                  {vi.cart.removeCoupon}
                </button>
              </div>
            )}
            {couponSuccessMessage && !couponError && !appliedCoupon && (
              <p className="text-[11px] font-sans text-emerald-600 dark:text-emerald-400">{couponSuccessMessage}</p>
            )}
            {couponError && (
              <p className="text-[11px] font-sans text-red-600 dark:text-red-400">{couponError}</p>
            )}
          </form>

          {/* Bảng giá (Price Breakdown) */}
          <div className="space-y-2 text-xs font-sans text-[var(--text-muted)] border-t border-[var(--border)] pt-3">
            <div className="flex justify-between items-center">
              <span>{vi.cart.subtotal}</span>
              <span className="font-mono text-[var(--text)]">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-[var(--accent)]">
                <span>{vi.cart.courtesyDiscount}</span>
                <span className="font-mono">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>{vi.cart.shipping}</span>
              <span className="font-mono text-[var(--text)]">
                {shipping === 0 ? vi.cart.complimentary : formatCurrency(shipping)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>{vi.cart.tax}</span>
              <span className="font-mono text-[var(--text)]">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between items-center text-sm sm:text-base font-semibold text-[var(--text)] pt-2.5 border-t border-[var(--border)]">
              <span className="font-display font-serif tracking-wide uppercase">{vi.cart.total}</span>
              <span className="font-mono text-base text-[var(--accent)] font-bold text-right">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Nút hành động (CTA Buttons) */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleProceedToCheckout}
              disabled={items.length === 0}
              className="w-full py-3.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-sans font-semibold text-xs uppercase tracking-widest rounded-sm transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{vi.cart.checkoutCta}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center justify-between text-[11px]">
              <Link
                to="/cart"
                onClick={closeDrawer}
                className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors underline font-sans"
              >
                {vi.cart.viewCart}
              </Link>

              <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-sans">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>{vi.cart.secureEncrypted}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
