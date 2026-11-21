import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { authApi } from '../../shared/api';
import { useToastStore } from '../../shared/stores/useToastStore';

export const ResetPasswordTokenPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): boolean => {
    setError(null);
    if (!token) {
      setError('Mã token khôi phục không hợp lệ hoặc bị thiếu trong liên kết.');
      return false;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu mới.');
      return false;
    }
    if (password.length < 8) {
      setError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
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
      const res = await authApi.resetPasswordWithToken(token!, { password });
      setIsSuccess(true);
      addToast(
        res.data?.message || 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.',
        'success'
      );
    } catch (err: any) {
      setError(
        err?.message ||
          'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (15 phút). Vui lòng yêu cầu liên kết mới.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <h3 className="font-serif text-base font-medium">Liên Kết Không Hợp Lệ</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Không tìm thấy mã xác thực khôi phục mật khẩu trong liên kết này.
          </p>
        </div>
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-2 text-xs text-[var(--accent)] hover:underline font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Yêu cầu liên kết đặt lại mật khẩu mới</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-ultra text-[var(--accent)] font-semibold">
          THIẾT LẬP MẬT KHẨU MỚI
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl text-[var(--text)] tracking-wide font-medium">
          Đặt Lại Mật Khẩu
        </h1>
        <p className="text-xs text-[var(--text-muted)] font-sans font-light">
          Vui lòng nhập mật khẩu mới có tối thiểu 8 ký tự cho tài khoản của quý khách.
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-6 text-center">
          <div className="p-5 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-medium text-[var(--text)]">
              Cập Nhật Thành Công
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Mật khẩu mới đã được cập nhật thành công và các phiên đăng nhập cũ đã được vô hiệu hóa để bảo đảm an toàn.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-3.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 shadow-lg rounded-lg cursor-pointer"
          >
            <span>Tiến Hành Đăng Nhập</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div
              role="alert"
              className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-xs leading-relaxed space-y-1.5"
            >
              <p>{error}</p>
              {error.includes('hết hạn') && (
                <Link
                  to="/forgot-password"
                  className="text-xs text-[var(--accent)] underline block font-medium"
                >
                  Nhấn vào đây để nhận liên kết mới
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1 font-medium">
                Mật khẩu mới (≥ 8 ký tự) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] outline-none rounded-lg disabled:opacity-50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1 font-medium">
                Xác nhận mật khẩu mới *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  disabled={isLoading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
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
                    <span>Đang cập nhật mật khẩu...</span>
                  </>
                ) : (
                  <>
                    <span>Cập Nhật Mật Khẩu Mới</span>
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
              <span>Quay lại đăng nhập</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default ResetPasswordTokenPage;
