import React, { useState } from 'react';
import { Phone, ShieldCheck, RotateCcw } from 'lucide-react';
import { authApi } from '@/shared/api';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useToastStore } from '@/shared/stores/useToastStore';
import { OtpInput } from './OtpInput';

export interface ChangePhoneFormProps {
  onSuccess: (message: string) => void;
  onCancel: () => void;
  currentPhone?: string;
}

export const ChangePhoneForm: React.FC<ChangePhoneFormProps> = ({
  onSuccess,
  onCancel,
  currentPhone,
}) => {
  const { updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<'input_phone' | 'verify_otp'>('input_phone');
  const [newPhone, setNewPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validate Vietnamese mobile phone
  const isValidPhone = /^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/.test(newPhone.replace(/\s+/g, ''));

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = newPhone.replace(/\s+/g, '');
    if (!isValidPhone) {
      setErrorMessage('Số điện thoại không đúng định dạng di động Việt Nam (10 số, đầu 03, 05, 07, 08, 09).');
      return;
    }

    setIsSending(true);
    try {
      await authApi.sendPhoneUpdateOtp({ phone: cleanPhone });
      setStep('verify_otp');
      setCountdown(60);
      addToast({
        title: 'Đã gửi mã OTP',
        message: `Mã OTP xác thực đã được gửi tới số điện thoại ${cleanPhone}.`,
        type: 'info',
      });
    } catch (err: any) {
      // Test/Demo fallback
      const msg = err?.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại số điện thoại.';
      setErrorMessage(msg);
      addToast({
        title: 'Thao tác thất bại',
        message: msg,
        type: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otp.length !== 6) {
      setErrorMessage('Vui lòng nhập đầy đủ mã OTP 6 chữ số.');
      return;
    }

    setIsVerifying(true);
    try {
      const cleanPhone = newPhone.replace(/\s+/g, '');
      await authApi.verifyAndUpdatePhone({
        phone: cleanPhone,
        otp,
      });

      updateProfile({ phone: cleanPhone });
      const successMsg = `Số điện thoại tài khoản đã được cập nhật sang ${cleanPhone} thành công.`;
      addToast({
        title: 'Cập nhật thành công',
        message: successMsg,
        type: 'success',
      });
      onSuccess(successMsg);
    } catch (err: any) {
      const msg = err?.message || 'Mã OTP không chính xác hoặc đã hết hạn.';
      setErrorMessage(msg);
      addToast({
        title: 'Xác thực thất bại',
        message: msg,
        type: 'error',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div data-testid="change-phone-form" className="space-y-5 text-left font-sans">
      <div className="space-y-1">
        <h3 className="font-serif text-base uppercase tracking-wider text-white font-medium flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#d4af37]" />
          <span>Thay Đổi Số Điện Thoại Tài Khoản</span>
        </h3>
        <p className="text-xs text-white/60 font-light">
          Số điện thoại mới bắt buộc phải được xác minh quyền sở hữu thông qua mã OTP SMS trước khi ghi nhận.
        </p>
      </div>

      {currentPhone && (
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-white/70">
          Số điện thoại hiện tại: <strong className="text-white font-mono">{currentPhone}</strong>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs">
          {errorMessage}
        </div>
      )}

      {step === 'input_phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider font-serif font-medium text-white/80">
              Số điện thoại mới <span className="text-[#d4af37]">*</span>
            </label>
            <input
              type="tel"
              required
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Ví dụ: 0912 345 678"
              className="w-full bg-[#14141a] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSending}
              className="px-5 py-3 rounded-xl border border-white/15 text-white/70 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSending || !isValidPhone}
              className="px-6 py-3 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-black text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shadow-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? 'Đang gửi mã...' : 'Gửi Mã OTP Xác Thực'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="text-center space-y-1">
            <p className="text-xs text-white/70">
              Mã OTP 6 chữ số đã được gửi tới số <strong className="text-white font-mono">{newPhone}</strong>
            </p>
          </div>

          <OtpInput
            value={otp}
            onChange={setOtp}
            disabled={isVerifying}
            hasError={Boolean(errorMessage)}
          />

          <div className="flex items-center justify-between text-xs text-white/60 pt-1">
            <span>Không nhận được mã?</span>
            <button
              type="button"
              disabled={countdown > 0 || isSending}
              onClick={handleSendOtp}
              className="text-[#d4af37] hover:underline disabled:opacity-40 disabled:no-underline font-medium inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('input_phone')}
              disabled={isVerifying}
              className="px-5 py-3 rounded-xl border border-white/15 text-white/70 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              Quay Lại
            </button>
            <button
              type="submit"
              disabled={isVerifying || otp.length !== 6}
              className="px-6 py-3 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-black text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shadow-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {isVerifying ? 'Đang xác thực...' : 'Xác Nhận Cập Nhật Số Điện Thoại'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
