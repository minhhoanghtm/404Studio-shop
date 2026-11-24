import React, { Suspense } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { ToastContainer } from '../components';
import { useWebsiteSettingsStore } from '../stores/useWebsiteSettingsStore';
import { useAuthStore } from '../stores/useAuthStore';

const AuthLoadingFallback: React.FC = () => (
  <div className="w-full min-h-[300px] flex flex-col items-center justify-center">
    <div className="w-8 h-8 rounded-full border border-[var(--accent)]/40 border-t-[var(--accent)] animate-spin mb-3" />
    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)]">
      Đang tải...
    </span>
  </div>
);

export const AuthLayout: React.FC = () => {
  const { maintenanceMode } = useWebsiteSettingsStore();
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = isAuthenticated && user?.role === 'admin';
  const location = useLocation();

  // In maintenance mode, only /login is accessible for non-admin users
  if (maintenanceMode && !isAdmin && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg)] text-[var(--text)] relative overflow-x-hidden p-4 sm:p-6 transition-colors duration-300">
      {/* Ambient background glow for luxury feel */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40 dark:opacity-20 transition-opacity"
        style={{
          background:
            'radial-gradient(circle at 50% 25%, var(--accent) 0%, transparent 55%), radial-gradient(circle at 80% 80%, rgba(180, 140, 54, 0.15) 0%, transparent 50%)',
          filter: 'blur(100px)',
        }}
      />

      {/* Main Form Card */}
      <div className="relative z-10 w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 sm:p-10 backdrop-blur-md">
        {/* Maintenance Notice Banner */}
        {maintenanceMode && !isAdmin && (
          <div className="mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-mono flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <strong className="block font-semibold">Chế độ bảo trì đang bật</strong>
              <span>Chỉ tài khoản Quản trị viên (Admin) mới có quyền đăng nhập vào hệ thống lúc này.</span>
            </div>
          </div>
        )}

        {/* Top Header inside Card: Small Logo & Back to Home Link */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-[var(--border)]">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors group font-sans"
            title="Quay lại trang chủ Atelier Vérité"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span className="text-[11px] font-medium">Về trang chủ</span>
          </Link>

          <Link
            to="/"
            className="font-serif tracking-widest text-xs uppercase font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors"
          >
            Atelier Vérité
          </Link>
        </div>

        {/* Page Content */}
        <Suspense fallback={<AuthLoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
};

export default AuthLayout;
