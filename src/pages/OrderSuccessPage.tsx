import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, PackageCheck, Truck, ShieldCheck, ArrowRight, Printer } from 'lucide-react';

export const OrderSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || 'AV-2026-84920';

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
            ACQUISITION PROTOCOL SECURED
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wide">
            Your Order Has Been Confirmed
          </h1>
          <p className="font-mono text-sm text-champagne pt-1">
            Order Reference: <span className="font-bold underline">{orderId}</span>
          </p>
          <p className="text-xs sm:text-sm text-platinum-dark max-w-md mx-auto font-sans font-light pt-2">
            A confirmation notice and private dispatch tracking certificate have been delivered to your email address.
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="p-6 rounded-2xl bg-noir-900 border border-white/10 text-left">
          <h4 className="text-xs uppercase tracking-widest text-platinum-dark font-sans mb-6 text-center">
            Atelier Fulfillment Lifecycle
          </h4>
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] uppercase font-sans">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-champagne text-noir-950 font-bold mx-auto flex items-center justify-center">
                ✓
              </div>
              <span className="text-white font-medium block">Order Placed</span>
              <span className="text-champagne font-mono text-[9px]">Completed</span>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full border border-champagne text-champagne font-bold mx-auto flex items-center justify-center animate-pulse">
                2
              </div>
              <span className="text-white font-medium block">Garment Inspection</span>
              <span className="text-white/40 text-[9px]">In Progress</span>
            </div>
            <div className="space-y-2 opacity-50">
              <div className="w-8 h-8 rounded-full border border-white/20 text-white/50 mx-auto flex items-center justify-center">
                3
              </div>
              <span className="text-white/60 block">Courier Dispatch</span>
              <span className="text-white/30 text-[9px]">Pending</span>
            </div>
            <div className="space-y-2 opacity-50">
              <div className="w-8 h-8 rounded-full border border-white/20 text-white/50 mx-auto flex items-center justify-center">
                4
              </div>
              <span className="text-white/60 block">White-Glove Delivery</span>
              <span className="text-white/30 text-[9px]">Pending</span>
            </div>
          </div>
        </div>

        {/* Packaging Assurance Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-xs font-sans">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex gap-3 items-start">
            <PackageCheck className="w-5 h-5 text-champagne flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-white">Signature Cedar Presentation</h5>
              <p className="text-platinum-dark text-[11px] mt-0.5">
                Garments are packaged in natural French cedar boxes with embossed wax seals and brass hangers.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex gap-3 items-start">
            <Truck className="w-5 h-5 text-champagne flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-white">Estimated Delivery</h5>
              <p className="text-platinum-dark text-[11px] mt-0.5">
                Delivery anticipated within 3-5 business days via DHL Express Diplomatic Courier.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/account/orders"
            className="w-full sm:w-auto px-8 py-4 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <span>View Patron Order Ledger</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/shop"
            className="w-full sm:w-auto px-8 py-4 border border-white/20 hover:border-champagne text-white text-xs uppercase tracking-widest font-medium transition-colors text-center"
          >
            Continue Exploring
          </Link>
        </div>
      </div>
    </div>
  );
};
