import React from 'react';
import { Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatters';
import { vi } from '../../../shared/locales/vi/common';

interface DeliveryMethodSelectorProps {
  method: 'white-glove' | 'express';
  onSelectMethod: (method: 'white-glove' | 'express') => void;
  baseShipping: number;
}

export const DeliveryMethodSelector: React.FC<DeliveryMethodSelectorProps> = ({
  method,
  onSelectMethod,
  baseShipping,
}) => {
  return (
    <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-6 shadow-sm">
      <h3 className="font-display text-xl text-[var(--text)] tracking-wide border-b border-[var(--border)] pb-4 font-medium uppercase">
        {vi.checkout.step2}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* White-Glove Standard */}
        <div
          onClick={() => onSelectMethod('white-glove')}
          className={`p-5 rounded-xl border cursor-pointer transition-all ${
            method === 'white-glove'
              ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-md'
              : 'border-[var(--border)] bg-[var(--bg-alt)] hover:border-[var(--accent)]/50'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[var(--accent)]" />
              <h5 className="font-display text-sm text-[var(--text)] font-semibold">
                {vi.checkout.whiteGloveCourier}
              </h5>
            </div>
            {method === 'white-glove' && (
              <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans mb-3 font-light">
            {vi.checkout.whiteGloveDesc}
          </p>
          <span className="font-mono text-xs text-[var(--accent)] font-semibold">
            {baseShipping === 0 ? vi.cart.complimentary : formatCurrency(baseShipping)}
          </span>
        </div>

        {/* Express Air Courier */}
        <div
          onClick={() => onSelectMethod('express')}
          className={`p-5 rounded-xl border cursor-pointer transition-all ${
            method === 'express'
              ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-md'
              : 'border-[var(--border)] bg-[var(--bg-alt)] hover:border-[var(--accent)]/50'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <h5 className="font-display text-sm text-[var(--text)] font-semibold">
                {vi.checkout.expressAir}
              </h5>
            </div>
            {method === 'express' && (
              <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans mb-3 font-light">
            {vi.checkout.expressAirDesc}
          </p>
          <span className="font-mono text-xs text-[var(--accent)] font-semibold">
            +{formatCurrency(500000)} phụ phí
          </span>
        </div>
      </div>
    </div>
  );
};
