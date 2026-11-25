import React from 'react';
import { Truck } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatters';
import { vi } from '../../../shared/locales/vi/common';

export const DeliveryMethodSelector: React.FC<{ baseShipping: number }> = ({ baseShipping }) => (
  <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4 shadow-sm">
    <h3 className="font-display text-xl text-[var(--text)] tracking-wide border-b border-[var(--border)] pb-4 font-medium uppercase">{vi.checkout.step2}</h3>
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-[var(--accent)]" />Giao hàng tiêu chuẩn</span>
      <span className="font-mono text-xs text-[var(--accent)] font-semibold">{baseShipping === 0 ? vi.cart.complimentary : formatCurrency(baseShipping)}</span>
    </div>
  </div>
);
