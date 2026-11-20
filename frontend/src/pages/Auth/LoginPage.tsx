import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { useToastStore } from '../../shared/stores/useToastStore';
import { ArrowRight, Lock } from 'lucide-react';
import { vi } from '../../shared/locales/vi/common';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      const expiredMsg = sessionStorage.getItem('atelier_session_expired');
      if (expiredMsg) {
        sessionStorage.removeItem('atelier_session_expired');
        const notice = 'Phiên đăng nhập đã hết hạn';
        setSessionExpiredNotice(notice);
        useToastStore.getState().addToast(notice, 'error', 'Phiên Đăng Nhập');
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const searchParams = new URLSearchParams(location.search);
    const redirectUrl = searchParams.get('redirect');
    if (await login(email, password)) {
      navigate(redirectUrl ? decodeURIComponent(redirectUrl) : '/account');
    } else {
      setError('Không thể đăng nhập. Vui lòng kiểm tra thông tin hoặc thử lại sau.');
    }
  };

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 sm:p-10 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-ultra text-[var(--accent)] font-semibold">
            CỔNG ĐĂNG NHẬP PATRON
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-[var(--text)] tracking-wide">
            Đăng Nhập Atelier Privé
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-sans font-light">
            Truy cập sổ đơn hàng cá nhân, lịch hẹn thử đồ may đo và thư mời Runway độc quyền.
          </p>
        </div>

        {sessionExpiredNotice && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-200 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-400 shrink-0" />
            <span>{sessionExpiredNotice}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1 font-medium">
              Email thành viên Patron
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] outline-none rounded-lg"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] font-medium">
                Mật khẩu
              </label>
              <a
                href="#reset"
                onClick={(e) => e.preventDefault()}
                className="text-[10px] text-[var(--accent)] hover:underline"
              >
                Quên mật khẩu?
              </a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] outline-none rounded-lg"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 shadow-lg rounded-lg"
            >
              <span>Xác thực & Vào không gian Patron</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </form>

        <div className="text-center text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border)] space-y-2">
          <p>
            Chưa có tài khoản đăng ký thành viên?{' '}
            <Link to="/register" className="text-[var(--accent)] font-semibold hover:underline">
              Đăng ký tài khoản Patron
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
