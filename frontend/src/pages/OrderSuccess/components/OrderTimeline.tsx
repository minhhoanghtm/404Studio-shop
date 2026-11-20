import React from 'react';
import { vi } from '@/shared/locales/vi/common';

export const OrderTimeline: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-left shadow-sm">
      <h4 className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-sans mb-6 text-center">
        {vi.orderSuccess.lifecycle}
      </h4>
      <div className="grid grid-cols-4 gap-2 text-center text-[10px] uppercase font-sans">
        <div className="space-y-2">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] font-bold mx-auto flex items-center justify-center">
            ✓
          </div>
          <span className="text-[var(--text)] font-medium block">{vi.orderSuccess.stepPlaced}</span>
          <span className="text-[var(--accent)] font-mono text-[9px]">Hoàn thành</span>
        </div>
        <div className="space-y-2">
          <div className="w-8 h-8 rounded-full border border-[var(--accent)] text-[var(--accent)] font-bold mx-auto flex items-center justify-center animate-pulse">
            2
          </div>
          <span className="text-[var(--text)] font-medium block">{vi.orderSuccess.stepInspecting}</span>
          <span className="text-[var(--text-muted)] text-[9px]">Đang thực hiện</span>
        </div>
        <div className="space-y-2 opacity-60">
          <div className="w-8 h-8 rounded-full border border-[var(--border)] text-[var(--text-muted)] mx-auto flex items-center justify-center">
            3
          </div>
          <span className="text-[var(--text-muted)] block">{vi.orderSuccess.stepDispatched}</span>
          <span className="text-[var(--text-muted)]/60 text-[9px]">Chờ xử lý</span>
        </div>
        <div className="space-y-2 opacity-60">
          <div className="w-8 h-8 rounded-full border border-[var(--border)] text-[var(--text-muted)] mx-auto flex items-center justify-center">
            4
          </div>
          <span className="text-[var(--text-muted)] block">{vi.orderSuccess.stepDelivered}</span>
          <span className="text-[var(--text-muted)]/60 text-[9px]">Chờ xử lý</span>
        </div>
      </div>
    </div>
  );
};
