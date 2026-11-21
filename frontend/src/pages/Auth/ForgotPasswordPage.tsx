import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../shared/api';
import { useToastStore } from '../../shared/stores/useToastStore';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const addToast = useToastStore((s) => s.addToast);

  const validate = (): boolean => {
    setError(null);
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setError('Vui lòng nhập địa chỉ email đã đăng ký.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError('Định dạng email không hợp lệ.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await authApi.forgotPassword({ email: email.trim() });
      setIsSubmitted(true);
      addToast(
        res.data?.message || 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.',
        'success'
      );
    } catch (err: any) {
      setError(
        err?.message || 'Không thể xử lý yêu cầu. Vui lòng kiểm tra lại email hoặc thử lại sau.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-ultra text-[var(--accent)] font-semibold">
          KHÔI PHỤC TÀI KHOẢN
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl text-[var(--text)] tracking-wide font-medium">
          Quên Mật Khẩu
        </h1>
        <p className="text-xs text-[var(--text-muted)] font-sans font-light">
          Nhập email của quý khách để nhận liên kết đặt lại mật khẩu (hiệu lực trong 15 phút).
        </p>
      </div>

      {isSubmitted ? (
        <div className="space-y-6 text-center">
          <div className="p-5 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-medium text-[var(--text)]">
              Kiểm Tra Hộp Thư Đến
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến:
              <br />
              <strong className="text-[var(--text)] font-mono">{email}</strong>
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Liên kết có hiệu lực trong <strong>15 phút</strong>. Quý khách vui lòng kiểm tra cả hòm thư Spam (Thư rác) nếu không thấy thư.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              className="text-[var(--accent)] hover:underline font-medium text-xs block mx-auto cursor-pointer"
            >
              Gửi lại với email khác
            </button>

            <Link
              to="/login"
              className="w-full py-3 bg-[var(--surface)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text)] font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại đăng nhập</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div
              role="alert"
              className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-xs leading-relaxed"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1 font-medium">
                Email tài khoản đã đăng ký *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patron@domain.com"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] outline-none rounded-lg disabled:opacity-50 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 shadow-lg rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi email...</span>
                  </>
                ) : (
                  <>
                    <span>Gửi Liên Kết Đặt Lại Mật Khẩu</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Back Link */}
          <div className="text-center text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border)]">
            <Link
              to="/login"
              className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang đăng nhập</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
