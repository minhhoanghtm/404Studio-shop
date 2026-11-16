import React from 'react';
import { vi } from '@/shared/locales/vi/common';

export const OrderTimeline: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-noir-900 border border-white/10 text-left">
      <h4 className="text-xs uppercase tracking-widest text-platinum-dark font-sans mb-6 text-center">
        {vi.orderSuccess.lifecycle}
      </h4>
      <div className="grid grid-cols-4 gap-2 text-center text-[10px] uppercase font-sans">
        <div className="space-y-2">
          <div className="w-8 h-8 rounded-full bg-champagne text-noir-950 font-bold mx-auto flex items-center justify-center">
            ✓
          </div>
          <span className="text-white font-medium block">{vi.orderSuccess.stepPlaced}</span>
          <span className="text-champagne font-mono text-[9px]">Hoàn thành</span>
        </div>
        <div className="space-y-2">
          <div className="w-8 h-8 rounded-full border border-champagne text-champagne font-bold mx-auto flex items-center justify-center animate-pulse">
            2
          </div>
          <span className="text-white font-medium block">{vi.orderSuccess.stepInspecting}</span>
          <span className="text-white/40 text-[9px]">Đang thực hiện</span>
        </div>
        <div className="space-y-2 opacity-50">
          <div className="w-8 h-8 rounded-full border border-white/20 text-white/50 mx-auto flex items-center justify-center">
            3
          </div>
          <span className="text-white/60 block">{vi.orderSuccess.stepDispatched}</span>
          <span className="text-white/30 text-[9px]">Chờ xử lý</span>
        </div>
        <div className="space-y-2 opacity-50">
          <div className="w-8 h-8 rounded-full border border-white/20 text-white/50 mx-auto flex items-center justify-center">
            4
          </div>
          <span className="text-white/60 block">{vi.orderSuccess.stepDelivered}</span>
          <span className="text-white/30 text-[9px]">Chờ xử lý</span>
        </div>
      </div>
    </div>
  );
};
