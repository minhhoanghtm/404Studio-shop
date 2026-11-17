import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { ArrowRight, Lock } from 'lucide-react';
import { vi } from '../../shared/locales/vi/common';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (await login(email, password)) navigate('/account');
    else setError('Không thể đăng nhập. Vui lòng kiểm tra thông tin hoặc thử lại sau.');
  };

  return (
    <div className="w-full bg-noir-950 text-white min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 sm:p-10 rounded-2xl bg-noir-900 border border-white/10 shadow-2xl space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            CỔNG ĐĂNG NHẬP PATRON
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
            Đăng Nhập Atelier Privé
          </h1>
          <p className="text-xs text-platinum-dark font-sans font-light">
            Truy cập sổ đơn hàng cá nhân, lịch hẹn thử đồ may đo và thư mời Runway độc quyền.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">
              Email thành viên Patron
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-noir-950 border border-white/15 focus:border-champagne text-white outline-none rounded-lg"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-platinum-dark uppercase tracking-wider text-[10px]">
                Mật khẩu
              </label>
              <a
                href="#reset"
                onClick={(e) => e.preventDefault()}
                className="text-[10px] text-champagne hover:underline"
              >
                Quên mật khẩu?
              </a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-noir-950 border border-white/15 focus:border-champagne text-white outline-none rounded-lg"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 shadow-lg rounded-lg"
            >
              <span>Xác thực & Vào không gian Patron</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
        </form>

        <div className="text-center text-xs text-platinum-dark pt-4 border-t border-white/10 space-y-2">
          <p>
            Chưa có tài khoản đăng ký thành viên?{' '}
            <Link to="/register" className="text-champagne font-medium hover:underline">
              Đăng ký tài khoản Patron
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
