import React from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, PackageCheck, Truck, ArrowRight } from 'lucide-react';
import { OrderTimeline } from './components/OrderTimeline';
import { vi } from '@/shared/locales/vi/common';

export const OrderSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const stateOrder = (location.state as any)?.order;

  const orderId = stateOrder?.orderNumber || searchParams.get('orderId') || 'AV-2026-84920';

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-[85vh] py-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full text-center space-y-10">
        {/* Emblem */}
        <div className="w-20 h-20 rounded-full border-2 border-[var(--accent)] bg-[var(--accent)]/10 flex items-center justify-center mx-auto text-[var(--accent)]">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-ultra text-[var(--accent)]">
            {vi.orderSuccess.badge}
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-[var(--text)] tracking-wide">
            {vi.orderSuccess.title}
          </h1>
          <p className="font-mono text-sm text-[var(--accent)] pt-1">
            {vi.orderSuccess.orderNumber} <span className="font-bold underline">{orderId}</span>
          </p>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto font-sans font-light pt-2">
            {vi.orderSuccess.emailNotice}
          </p>
        </div>

        {/* Progress Stepper */}
        <OrderTimeline />

        {/* Packaging Assurance Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-xs font-sans">
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex gap-3 items-start">
            <PackageCheck className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-[var(--text)]">{vi.orderSuccess.cedarBoxTitle}</h5>
              <p className="text-[var(--text-muted)] text-[11px] mt-0.5">
                {vi.orderSuccess.cedarBoxDesc}
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex gap-3 items-start">
            <Truck className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-[var(--text)]">{vi.orderSuccess.deliveryTimelineTitle}</h5>
              <p className="text-[var(--text-muted)] text-[11px] mt-0.5">
                {vi.orderSuccess.deliveryTimelineDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/orders"
            className="w-full sm:w-auto px-8 py-4 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 rounded-lg"
          >
            <span>{vi.orderSuccess.viewOrders}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/products"
            className="w-full sm:w-auto px-8 py-4 bg-[var(--surface)] hover:bg-[var(--bg-alt)] text-[var(--text)] font-semibold text-xs uppercase tracking-widest transition-colors border border-[var(--border)] rounded-lg shadow-sm"
          >
            <span>{vi.orderSuccess.continueShopping}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
