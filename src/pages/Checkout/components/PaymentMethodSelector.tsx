import React from 'react';
import { CreditCard, Building2, Lock, ShieldCheck } from 'lucide-react';
import { vi } from '../../../shared/locales/vi/common';

interface PaymentMethodSelectorProps {
  method: 'card' | 'wire';
  onSelectMethod: (method: 'card' | 'wire') => void;
  cardNumber: string;
  onCardNumberChange: (v: string) => void;
  cardExpiry: string;
  onCardExpiryChange: (v: string) => void;
  cardCvc: string;
  onCardCvcChange: (v: string) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  method,
  onSelectMethod,
  cardNumber,
  onCardNumberChange,
  cardExpiry,
  onCardExpiryChange,
  cardCvc,
  onCardCvcChange,
}) => {
  return (
    <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h3 className="font-display text-xl text-white tracking-wide">
          {vi.checkout.step3}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-champagne font-sans">
          <Lock className="w-3.5 h-3.5" />
          <span>SSL 256-Bit</span>
        </div>
      </div>

      {/* Methods Tabs */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onSelectMethod('card')}
          className={`p-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-sans uppercase tracking-wider transition-all ${
            method === 'card'
              ? 'border-champagne bg-champagne/10 text-white font-semibold'
              : 'border-white/10 bg-noir-950/60 text-white/60 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4 text-champagne" />
          <span>{vi.checkout.creditCard}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMethod('wire')}
          className={`p-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-sans uppercase tracking-wider transition-all ${
            method === 'wire'
              ? 'border-champagne bg-champagne/10 text-white font-semibold'
              : 'border-white/10 bg-noir-950/60 text-white/60 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4 text-champagne" />
          <span>{vi.checkout.bankWire}</span>
        </button>
      </div>

      {method === 'card' ? (
        <div className="space-y-4 text-xs font-sans pt-2">
          <div>
            <label className="block text-white/60 mb-1.5">Số thẻ thanh toán quốc tế</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => onCardNumberChange(e.target.value)}
              className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white font-mono focus:border-champagne outline-none"
              placeholder="4242 •••• •••• 8842"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 mb-1.5">Hạn thẻ (MM/YY)</label>
              <input
                type="text"
                value={cardExpiry}
                onChange={(e) => onCardExpiryChange(e.target.value)}
                className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white font-mono focus:border-champagne outline-none"
                placeholder="11/29"
              />
            </div>
            <div>
              <label className="block text-white/60 mb-1.5">Mã bảo mật (CVC)</label>
              <input
                type="password"
                maxLength={4}
                value={cardCvc}
                onChange={(e) => onCardCvcChange(e.target.value)}
                className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white font-mono focus:border-champagne outline-none"
                placeholder="•••"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-noir-950 border border-white/10 text-xs text-platinum-dark space-y-2 font-sans">
          <p className="text-white font-medium">Quy trình Chuyển khoản Ngoại giao Concierge:</p>
          <p>
            Sau khi hoàn tất xác nhận, bộ phận Concierge riêng của Maison sẽ liên hệ trực tiếp tới quý khách cùng văn bản bảo lãnh và mã tài khoản ủy thác Banque de France.
          </p>
        </div>
      )}

      {/* Simulation Banner */}
      <div className="p-3.5 rounded-lg bg-champagne/10 border border-champagne/20 flex items-start gap-2.5 text-[11px] text-champagne font-sans">
        <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{vi.checkout.simulationNotice}</span>
      </div>
    </div>
  );
};
