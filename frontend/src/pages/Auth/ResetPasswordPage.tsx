import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowRight, RotateCw, ArrowLeft, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast('Vui lòng nhập địa chỉ email hợp lệ', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      addToast('Mã xác thực khôi phục mật khẩu đã được gửi qua email.', 'success');
      setStep(2);
    } catch (err: any) {
      addToast(err?.message || 'Không tìm thấy tài khoản tương ứng với email này.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      addToast('Vui lòng nhập mã OTP', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Xác nhận mật khẩu không trùng khớp', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email,
        otp,
        newPassword,
      });
      addToast('Khôi phục mật khẩu thành công! Quý khách có thể đăng nhập ngay.', 'success');
      navigate('/login');
    } catch (err: any) {
      addToast(err?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center px-4 bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
            <KeyRound className="w-7 h-7" />
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--accent)] block mb-1 font-semibold">
            Đặc Quyền Thành Viên
          </span>
          <h1 className="font-serif text-2xl tracking-wide text-[var(--text)]">
            {step === 1 ? 'Quên Mật Khẩu' : 'Đặt Lại Mật Khẩu'}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            {step === 1
              ? 'Nhập email đã đăng ký để nhận mã OTP khôi phục quyền truy cập.'
              : `Nhập mã OTP đã gửi đến ${email} và mật khẩu mới.`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Địa Chỉ Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patron@atelierverite.com"
                  className="w-full pl-10 pr-4 py-3 text-xs bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] rounded-lg focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] uppercase text-xs tracking-[0.2em] font-medium transition-all duration-300 flex items-center justify-center gap-2 rounded-lg shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Gửi Mã Khôi Phục</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Mã OTP (6 Chữ Số)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 text-center tracking-[0.3em] font-mono text-base bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] rounded-lg focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Mật Khẩu Mới
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-10 pr-4 py-3 text-xs bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] rounded-lg focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Xác Nhận Mật Khẩu Mới
              </label>
              <div className="relative">
                <CheckCircle2 className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-10 pr-4 py-3 text-xs bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] rounded-lg focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] uppercase text-xs tracking-[0.2em] font-medium transition-all duration-300 flex items-center justify-center gap-2 rounded-lg shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Xác Nhận Đổi Mật Khẩu</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
