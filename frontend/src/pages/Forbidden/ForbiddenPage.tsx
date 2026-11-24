import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/useAuthStore';

interface ForbiddenPageProps {
  requiredPermission?: string;
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({ requiredPermission }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-6 selection:bg-[var(--accent)]/20">
      <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] p-8 sm:p-10 rounded-sm shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Subtle decorative gold line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-80" />

        {/* Shield Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Badge & Headings */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent)]/5 rounded-full font-semibold">
            TRUY CẬP BỊ TỪ CHỐI — MÃ LỖI 403
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-[var(--text)] tracking-wide font-normal">
            Không Đủ Quyền Hạn
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
            Tài khoản{' '}
            <strong className="text-[var(--text)] font-semibold">{user?.email || 'hiện tại'}</strong>{' '}
            với vai trò{' '}
            <span className="uppercase font-mono text-[var(--accent)] font-semibold">
              [{user?.role || 'customer'}]
            </span>{' '}
            chưa được phân quyền để truy cập khu vực điều hành này.
          </p>
          {requiredPermission && (
            <p className="text-[11px] font-mono text-[var(--text-muted)] pt-1">
              Quyền yêu cầu: <code className="text-[var(--accent)]">{requiredPermission}</code>
            </p>
          )}
        </div>

        {/* Help Note */}
        <div className="bg-[var(--bg-alt)] border border-[var(--border)] p-3.5 rounded-sm text-left text-xs text-[var(--text-muted)] space-y-1">
          <span className="font-semibold text-[var(--text)] block uppercase tracking-wider text-[10px]">
            HƯỚNG DẪN XỬ LÝ:
          </span>
          <p>
            Nếu quý khách là nhân sự vận hành được ủy nhiệm, vui lòng liên hệ Quản Trị Viên hệ
            thống để được phân bổ vai trò (Role) hoặc cấp quyền bổ sung (Permission Overrides).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--text)] text-xs font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2 rounded-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay Lại</span>
          </button>

          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--accent-contrast)] text-xs font-mono uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 rounded-sm shadow-md"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Về Cửa Hàng Khách</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full sm:w-auto px-4 py-2.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] text-xs font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 rounded-sm"
            title="Đăng xuất và đăng nhập tài khoản khác"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đổi Tài Khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
