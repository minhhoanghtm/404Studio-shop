import React from 'react';
import { Truck, ShieldCheck, Clock, Globe } from 'lucide-react';

export const ShippingPage: React.FC = () => {
  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            WHITE-GLOVE DISPATCH PROTOCOL
          </span>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-wide">
            Shipping & Delivery
          </h1>
          <p className="text-xs sm:text-sm text-platinum-dark max-w-xl mx-auto font-sans font-light">
            Every creation is shipped in custom French cedar packaging with prepaid customs clearance and full courier insurance worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans">
          <div className="p-6 rounded-2xl bg-noir-900 border border-white/10 space-y-3">
            <Truck className="w-6 h-6 text-champagne" />
            <h3 className="font-display text-lg text-white">Complimentary Delivery</h3>
            <p className="text-platinum-dark leading-relaxed">
              We provide complimentary white-glove international courier delivery on all orders over $500 / €500. Orders under this amount are delivered for a flat fee of $35.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-noir-900 border border-white/10 space-y-3">
            <Clock className="w-6 h-6 text-champagne" />
            <h3 className="font-display text-lg text-white">Transit Schedules</h3>
            <p className="text-platinum-dark leading-relaxed">
              Western Europe & UK: 2-3 business days.<br />
              North America: 2-4 business days.<br />
              Asia-Pacific & Middle East: 3-5 business days.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-noir-900 border border-white/10 space-y-3">
            <Globe className="w-6 h-6 text-champagne" />
            <h3 className="font-display text-lg text-white">Prepaid Duties & Customs</h3>
            <p className="text-platinum-dark leading-relaxed">
              All import duties, local luxury tariffs, and VAT are calculated and prepaid by Maison Vérité. No additional fees will be requested upon doorstep delivery.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-noir-900 border border-white/10 space-y-3">
            <ShieldCheck className="w-6 h-6 text-champagne" />
            <h3 className="font-display text-lg text-white">Diplomatic Insurance</h3>
            <p className="text-platinum-dark leading-relaxed">
              Shipments are fully insured against loss or damage in transit. A physical signature from the adult recipient is required upon handover.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
