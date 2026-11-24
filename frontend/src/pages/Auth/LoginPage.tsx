import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { useToastStore } from '../../shared/stores/useToastStore';
import { ArrowRight, Lock, Loader2, Mail } from 'lucide-react';
import { GoogleAuthButton } from './GoogleAuthButton';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);

  const { login, loginWithGoogle, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(getRedirectDestination(), { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    try {
      const expiredMsg = sessionStorage.getItem('atelier_session_expired');
      if (expiredMsg) {
        sessionStorage.removeItem('atelier_session_expired');
        const notice = 'Phiên đăng nhập đã hết hạn';
        setSessionExpiredNotice(notice);
        addToast(notice, 'error', 'Phiên Đăng Nhập');
      }
    } catch {
      // Ignore
    }
  }, [addToast]);

  const getRedirectDestination = () => {
    const searchParams = new URLSearchParams(location.search);
    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      try {
        return decodeURIComponent(redirectUrl);
      } catch {
        return redirectUrl;
      }
    }
    const stateFrom = (location.state as any)?.from;
    if (typeof stateFrom === 'string' && stateFrom) return stateFrom;
    if (stateFrom?.pathname) return stateFrom.pathname + (stateFrom.search || '');
    return '/';
  };

  const validate = (): boolean => {
    setError(null);
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setError('Vui lòng nhập địa chỉ email.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError('Định dạng email không hợp lệ.');
      return false;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return false;
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có tối thiểu 8 ký tự.');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError(null);

    try {
      const success = await login(email.trim(), password);
      if (success) {
        addToast('Đăng nhập thành công! Chào mừng quý khách.', 'success');
        navigate(getRedirectDestination(), { replace: true });
      } else {
        setError('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể đăng nhập. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await loginWithGoogle(credential);
      if (success) {
        addToast('Đăng nhập Google thành công!', 'success');
        navigate(getRedirectDestination(), { replace: true });
      } else {
        setError('Đăng nhập Google không thành công. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setError(err?.message || 'Xác thực Google thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (err?: any) => {
    setError(err?.message || 'Đăng nhập Google thất bại hoặc người dùng đã hủy.');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-ultra text-[var(--accent)] font-semibold">
          CỔNG ĐĂNG NHẬP PATRON
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl text-[var(--text)] tracking-wide font-medium">
          Đăng Nhập Atelier
        </h1>
        <p className="text-xs text-[var(--text-muted)] font-sans font-light">
          Truy cập hồ sơ may đo và thư mời Runway độc quyền.
        </p>
      </div>

      {sessionExpiredNotice && (
        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-200 text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-red-400 shrink-0" />
          <span>{sessionExpiredNotice}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-xs leading-relaxed"
        >
          {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4 text-xs font-sans">
        <div>
          <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1 font-medium">
            Email tài khoản
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

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] font-medium">
              Mật khẩu
            </label>
            <Link
              to="/forgot-password"
              className="text-[10px] text-[var(--accent)] hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
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
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <span>Đăng Nhập</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="flex items-center my-4">
        <div className="flex-1 border-t border-[var(--border)]" />
        <span className="px-3 text-[10px] uppercase font-mono text-[var(--text-muted)] tracking-wider">
          hoặc
        </span>
        <div className="flex-1 border-t border-[var(--border)]" />
      </div>

      {/* Google Sign-In */}
      <GoogleAuthButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        text="continue_with"
      />

      {/* Footer link to Register */}
      <div className="text-center text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border)]">
        <p>
          Chưa có tài khoản hội viên?{' '}
          <Link to="/register" className="text-[var(--accent)] font-semibold hover:underline">
            Đăng ký tài khoản Patron
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
