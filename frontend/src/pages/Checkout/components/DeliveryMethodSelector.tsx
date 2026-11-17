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
    <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-6">
      <h3 className="font-display text-xl text-white tracking-wide border-b border-white/10 pb-4">
        {vi.checkout.step2}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* White-Glove Standard */}
        <div
          onClick={() => onSelectMethod('white-glove')}
          className={`p-5 rounded-xl border cursor-pointer transition-all ${
            method === 'white-glove'
              ? 'border-champagne bg-champagne/10 shadow-lg'
              : 'border-white/10 bg-noir-950/60 hover:border-white/30'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-champagne" />
              <h5 className="font-display text-sm text-white">
                {vi.checkout.whiteGloveCourier}
              </h5>
            </div>
            {method === 'white-glove' && (
              <CheckCircle2 className="w-4 h-4 text-champagne" />
            )}
          </div>
          <p className="text-xs text-platinum-dark leading-relaxed font-sans mb-3">
            {vi.checkout.whiteGloveDesc}
          </p>
          <span className="font-mono text-xs text-champagne font-medium">
            {baseShipping === 0 ? vi.cart.complimentary : formatCurrency(baseShipping)}
          </span>
        </div>

        {/* Express Air Courier */}
        <div
          onClick={() => onSelectMethod('express')}
          className={`p-5 rounded-xl border cursor-pointer transition-all ${
            method === 'express'
              ? 'border-champagne bg-champagne/10 shadow-lg'
              : 'border-white/10 bg-noir-950/60 hover:border-white/30'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-champagne" />
              <h5 className="font-display text-sm text-white">
                {vi.checkout.expressAir}
              </h5>
            </div>
            {method === 'express' && (
              <CheckCircle2 className="w-4 h-4 text-champagne" />
            )}
          </div>
          <p className="text-xs text-platinum-dark leading-relaxed font-sans mb-3">
            {vi.checkout.expressAirDesc}
          </p>
          <span className="font-mono text-xs text-champagne font-medium">
            +{formatCurrency(500000)} phụ phí
          </span>
        </div>
      </div>
    </div>
  );
};
