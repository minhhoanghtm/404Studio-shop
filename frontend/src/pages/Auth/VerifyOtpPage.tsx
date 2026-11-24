import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowRight, RotateCw, ArrowLeft } from 'lucide-react';
import { authApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';

export const VerifyOtpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const emailParam = searchParams.get('email') || '';
  const phoneParam = searchParams.get('phone') || '';
  const purpose = searchParams.get('purpose') || 'register';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      addToast('Vui lòng nhập đầy đủ mã OTP 6 chữ số', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.verifyOtp({
        email: emailParam || undefined,
        phone: phoneParam || undefined,
        otp: fullOtp,
        purpose,
      });
      addToast('Xác thực tài khoản thành công! Chào mừng quý khách.', 'success');
      navigate('/login');
    } catch (err: any) {
      // In demo/test mode fallback
      addToast(err?.message || 'Mã xác thực không chính xác hoặc đã hết hạn', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await authApi.sendOtp({
        email: emailParam || undefined,
        phone: phoneParam || undefined,
        purpose,
      });
      addToast('Mã OTP mới đã được gửi tới hòm thư của quý khách.', 'success');
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      addToast(err?.message || 'Đã gửi lại mã xác nhận thành công.', 'info');
      setCountdown(60);
      setCanResend(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center px-4 bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--accent)] block mb-1 font-semibold">
            Bảo Mật Atelier Vérité
          </span>
          <h1 className="font-serif text-2xl tracking-wide text-[var(--text)]">Xác Thực Mã OTP</h1>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Mã 6 chữ số vừa được gửi tới{' '}
            <strong className="text-[var(--text)] font-medium">{emailParam || phoneParam || 'quý khách'}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 text-center text-xl font-mono border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors rounded-lg"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full py-3.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] uppercase text-xs tracking-[0.2em] font-medium transition-all duration-300 flex items-center justify-center gap-2 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Xác Nhận Kích Hoạt</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[var(--text-muted)] space-y-3">
          <div>
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="text-[var(--accent)] underline hover:opacity-80 transition-opacity font-medium"
              >
                Gửi lại mã xác thực OTP
              </button>
            ) : (
              <span>Gửi lại mã sau <strong className="text-[var(--text)]">{countdown}s</strong></span>
            )}
          </div>

          <div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang Đăng nhập</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
