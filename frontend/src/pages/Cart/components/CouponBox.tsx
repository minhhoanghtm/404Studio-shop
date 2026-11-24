import React, { useState } from 'react';
import { Tag } from 'lucide-react';
import { Coupon } from '../../../shared/types';
import { vi } from '../../../shared/locales/vi/common';

interface CouponBoxProps {
  appliedCoupon: Coupon | null;
  couponError: string | null;
  onApplyCoupon: (code: string) => boolean;
  onRemoveCoupon: () => void;
}

export const CouponBox: React.FC<CouponBoxProps> = ({
  appliedCoupon,
  couponError,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    if (onApplyCoupon(code)) {
      setCode('');
    }
  };

  return (
    <div className="space-y-2 pt-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={vi.cart.couponPlaceholder}
            className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg-alt)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-mono uppercase"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors"
        >
          {vi.cart.apply}
        </button>
      </form>

      {appliedCoupon && (
        <div className="flex items-center justify-between text-xs text-[var(--accent)] pt-1 px-1">
          <span>
            Đặc quyền áp dụng: <strong>{appliedCoupon.code}</strong> (-{appliedCoupon.discountPercentage}%)
          </span>
          <button
            type="button"
            onClick={onRemoveCoupon}
            className="text-[var(--text-muted)] hover:text-[var(--text)] underline text-[11px]"
          >
            {vi.cart.removeCoupon}
          </button>
        </div>
      )}

      {couponError && (
        <p className="text-xs text-[var(--status-error)] px-1">{couponError}</p>
      )}
    </div>
  );
};
