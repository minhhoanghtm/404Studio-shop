import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { useToastStore } from '../../shared/stores/useToastStore';
import { ArrowRight, Loader2, Mail, Lock, User as UserIcon, ShieldCheck } from 'lucide-react';
import { GoogleAuthButton } from './GoogleAuthButton';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, loginWithGoogle, isAuthenticated } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    return (location.state as any)?.from?.pathname || '/';
  };

  const validate = (): boolean => {
    setError(null);
    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên của quý khách.');
      return false;
    }
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
      setError('Mật khẩu bảo mật phải có tối thiểu 8 ký tự.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      return false;
    }
    if (!agreeTerms) {
      setError('Quý khách vui lòng đồng ý với Điều khoản sử dụng để tiếp tục.');
      return false;
    }
    if (!agreePrivacy) {
      setError('Quý khách vui lòng đồng ý với Chính sách bảo mật dữ liệu.');
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError(null);

    try {
      const success = await register(name.trim(), email.trim(), password);
      if (success) {
        addToast('Đăng ký tài khoản Patron thành công! Chào mừng quý khách.', 'success');
        navigate(getRedirectDestination(), { replace: true });
      } else {
        setError('Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err: any) {
      setError(err?.message || 'Đăng ký thất bại. Email có thể đã tồn tại.');
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
        addToast('Đăng nhập Google thành công! Chào mừng quý khách.', 'success');
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
          ĐĂNG KÝ HỘI VIÊN MAISON
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl text-[var(--text)] tracking-wide font-medium">
          Tạo Hồ Sơ Patron
        </h1>
        <p className="text-xs text-[var(--text-muted)] font-sans font-light">
          Gia nhập danh bạ khách hàng danh dự để nhận đặc quyền may đo cao cấp.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-xs leading-relaxed"
        >
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-3.5 text-xs font-sans">
        <div>
          <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1 font-medium">
            Họ và tên quý khách *
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              disabled={isLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn An"
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-alt)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] outline-none rounded-lg disabled:opacity-50 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1 font-medium">
            Email đăng ký *
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
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-alt)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] outline-none rounded-lg disabled:opacity-50 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1 font-medium">
            Mật khẩu (≥ 8 ký tự) *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-alt)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] outline-none rounded-lg disabled:opacity-50 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1 font-medium">
            Xác nhận mật khẩu *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              required
              disabled={isLoading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-alt)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] outline-none rounded-lg disabled:opacity-50 transition-colors"
            />
          </div>
        </div>

        {/* Consents */}
        <div className="space-y-2 pt-2 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)] leading-relaxed">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              disabled={isLoading}
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 rounded mt-0.5 accent-[var(--accent)] cursor-pointer"
            />
            <span>
              Tôi đồng ý với{' '}
              <Link to="/terms-of-service" target="_blank" className="text-[var(--accent)] underline hover:text-[#9E7B15]">
                Điều khoản sử dụng
              </Link>{' '}
              của Atelier Vérité. <span className="text-[var(--accent)]">*</span>
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              disabled={isLoading}
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              className="w-4 h-4 rounded mt-0.5 accent-[var(--accent)] cursor-pointer"
            />
            <span>
              Tôi đồng ý với{' '}
              <Link to="/privacy-policy" target="_blank" className="text-[var(--accent)] underline hover:text-[#9E7B15]">
                Chính sách bảo mật
              </Link>{' '}
              dữ liệu cá nhân. <span className="text-[var(--accent)]">*</span>
            </span>
          </label>
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
                <span>Đang khởi tạo tài khoản...</span>
              </>
            ) : (
              <>
                <span>Đăng Ký Tài Khoản</span>
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

      {/* Footer link to Login */}
      <div className="text-center text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border)]">
        <p>
          Đã có tài khoản thành viên?{' '}
          <Link to="/login" className="text-[var(--accent)] font-semibold hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
