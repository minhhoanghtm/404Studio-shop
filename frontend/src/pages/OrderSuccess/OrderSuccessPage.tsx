import React from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, PackageCheck, Truck, ArrowRight, Printer } from 'lucide-react';
import { OrderTimeline } from './components/OrderTimeline';
import { vi } from '@/shared/locales/vi/common';

export const OrderSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const stateOrder = (location.state as any)?.order;

  const orderId = stateOrder?.orderNumber || searchParams.get('orderId') || 'AV-2026-84920';

  return (
    <div className="w-full bg-noir-950 text-white min-h-[85vh] py-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full text-center space-y-10">
        {/* Emblem */}
        <div className="w-20 h-20 rounded-full border-2 border-champagne bg-champagne/10 flex items-center justify-center mx-auto text-champagne">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            {vi.orderSuccess.badge}
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wide">
            {vi.orderSuccess.title}
          </h1>
          <p className="font-mono text-sm text-champagne pt-1">
            {vi.orderSuccess.orderNumber} <span className="font-bold underline">{orderId}</span>
          </p>
          <p className="text-xs sm:text-sm text-platinum-dark max-w-md mx-auto font-sans font-light pt-2">
            {vi.orderSuccess.emailNotice}
          </p>
        </div>

        {/* Progress Stepper */}
        <OrderTimeline />

        {/* Packaging Assurance Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-xs font-sans">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex gap-3 items-start">
            <PackageCheck className="w-5 h-5 text-champagne flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-white">{vi.orderSuccess.cedarBoxTitle}</h5>
              <p className="text-platinum-dark text-[11px] mt-0.5">
                {vi.orderSuccess.cedarBoxDesc}
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex gap-3 items-start">
            <Truck className="w-5 h-5 text-champagne flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-white">{vi.orderSuccess.deliveryTimelineTitle}</h5>
              <p className="text-platinum-dark text-[11px] mt-0.5">
                {vi.orderSuccess.deliveryTimelineDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/orders"
            className="w-full sm:w-auto px-8 py-4 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 rounded-lg"
          >
            <span>{vi.orderSuccess.viewOrders}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/products"
            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs uppercase tracking-widest transition-colors border border-white/10 rounded-lg"
          >
            <span>{vi.orderSuccess.continueShopping}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
