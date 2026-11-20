/**
 * WCAG AA Contrast Checker Component
 * Verifies color contrast between text and background for accessibility compliance.
 */

import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { calculateContrastRatio } from './contrastUtils';

interface ContrastIndicatorProps {
  textColor?: string;
  bgColor?: string;
}

export const ContrastIndicator: React.FC<ContrastIndicatorProps> = ({
  textColor = '#ffffff',
  bgColor = '#0b0b0e',
}) => {
  const ratio = calculateContrastRatio(textColor, bgColor);
  const isPassAA = ratio >= 4.5;
  const isPassAAA = ratio >= 7.0;

  return (
    <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/10 text-xs">
      <div className="flex items-center gap-1.5">
        {isPassAA ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        )}
        <span className="text-white/80">
          Độ tương phản: <strong className="font-mono">{ratio.toFixed(2)}:1</strong>
        </span>
      </div>
      <div className="flex items-center gap-1 font-mono text-[10px]">
        <span
          className={`px-1.5 py-0.5 rounded ${
            isPassAA ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
          }`}
        >
          WCAG AA {isPassAA ? 'ĐẠT' : 'CHƯA ĐẠT'}
        </span>
        {isPassAAA && (
          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
            AAA
          </span>
        )}
      </div>
    </div>
  );
};
