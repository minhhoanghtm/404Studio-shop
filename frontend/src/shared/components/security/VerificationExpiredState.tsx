import React from 'react';
import { Clock, RotateCcw } from 'lucide-react';

export interface VerificationExpiredStateProps {
  onRestart: () => void;
  message?: string;
  isRestarting?: boolean;
}

export const VerificationExpiredState: React.FC<VerificationExpiredStateProps> = ({
  onRestart,
  message = 'Mã OTP hoặc phiên xác minh đã hết hiệu lực bảo mật (vượt quá thời hạn 5 phút quy định). Vui lòng yêu cầu mã xác minh mới để bảo vệ tài khoản của bạn.',
  isRestarting = false,
}) => {
  return (
    <div
      role="region"
      aria-label="Thông báo phiên xác minh hết hạn"
      className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-4"
    >
      <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
        <Clock className="w-6 h-6 animate-pulse" />
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h4 className="font-serif uppercase tracking-wider font-semibold text-sm text-amber-200">
          Phiên Xác Minh Đã Hết Hiệu Lực
        </h4>
        <p className="text-xs text-amber-100/80 leading-relaxed font-light">
          {message}
        </p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onRestart}
          disabled={isRestarting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-[#d4af37]/20 disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isRestarting ? 'animate-spin' : ''}`} />
          <span>Yêu Cầu Mã Xác Minh Mới</span>
        </button>
      </div>
    </div>
  );
};
