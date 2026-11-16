import React from 'react';
import { RefreshCw, ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';

export const ReturnsPage: React.FC = () => {
  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            30-DAY COMPLIMENTARY TRIAL
          </span>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-wide">
            Returns & Restoration
          </h1>
          <p className="text-xs sm:text-sm text-platinum-dark max-w-xl mx-auto font-sans font-light">
            We invite you to inspect the drape, fit, and touch of our garments with complete peace of mind.
          </p>
        </div>

        <div className="p-8 sm:p-10 rounded-2xl bg-noir-900 border border-white/10 space-y-8 text-xs font-sans text-platinum-dark leading-relaxed">
          <div className="space-y-4">
            <h3 className="font-display text-2xl text-white flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-champagne" />
              <span>30-Day Return Window</span>
            </h3>
            <p>
              Patrons have 30 days from the day of package delivery to request a complimentary return or exchange. All return courier shipments are prepaid by Atelier Vérité.
            </p>
          </div>

          <div className="space-y-4 border-t border-white/10 pt-6">
            <h3 className="font-display text-xl text-white">Eligibility Conditions</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Garments must remain in unworn, unwashed, unaltered pristine condition.</li>
              <li>The internal security seal tag and numbered edition label must remain intact.</li>
              <li>Garments must be returned in their original French cedar presentation box with brass hangers and protective dust bags.</li>
            </ul>
          </div>

          <div className="space-y-4 border-t border-white/10 pt-6">
            <h3 className="font-display text-xl text-white">Lifetime Restoration Privilège</h3>
            <p>
              All Atelier Vérité garments include complimentary lifetime seam maintenance, button replacement, and leather conditioning at our Paris and Tokyo salon workshops.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
