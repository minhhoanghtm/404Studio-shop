import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { getAccessToken, getRefreshToken } from '../api/client';
import { isJwtExpired } from '../utils/authSync';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const location = useLocation();
  const { isAuthenticated, user, hydrateSession } = useAuthStore();
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const at = getAccessToken();
    const rt = getRefreshToken();

    // Startup check: if token is expired and no refresh token exists, reject immediately
    if (at && !rt && isJwtExpired(at)) {
      useAuthStore.getState().logout();
      setIsHydrating(false);
      return;
    }

    if (at && !user) {
      hydrateSession().finally(() => setIsHydrating(false));
    } else {
      setIsHydrating(false);
    }
  }, [hydrateSession, user]);

  const token = getAccessToken();
  if (!token || !isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />;
  }

  if (isHydrating) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text)] p-8">
        <div className="w-8 h-8 rounded-full border border-[var(--accent)]/40 border-t-[var(--accent)] animate-spin mb-3" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)]">
          XÁC THỰC QUYỀN TRUY CẬP...
        </span>
      </div>
    );
  }

  if (requireAdmin && user && user.vipTier !== 'admin' && (user as any).role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
