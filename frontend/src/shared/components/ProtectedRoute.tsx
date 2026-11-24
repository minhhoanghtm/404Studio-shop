import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { getAccessToken, getRefreshToken } from '../api/client';
import { isJwtExpired } from '../utils/authSync';
import { canAccessRoute, hasPermission, ROUTE_PERMISSIONS } from '../config/routePermissions';
import { ForbiddenPage } from '@/pages/Forbidden/ForbiddenPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: string[];
  permission?: string;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  allowedRoles,
  permission,
  requireAuth = true,
}) => {
  const location = useLocation();
  const {
    isAuthenticated,
    user,
    permissions,
    isPermissionsLoaded,
    hydrateSession,
    fetchPermissions,
  } = useAuthStore();
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

    if (at && (!user || !isPermissionsLoaded)) {
      hydrateSession().finally(() => setIsHydrating(false));
    } else {
      setIsHydrating(false);
    }
  }, [hydrateSession, user, isPermissionsLoaded]);

  // 1. Authentication Check
  const token = getAccessToken();
  if (requireAuth && (!token || !isAuthenticated)) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />;
  }

  // 2. Loading State Skeleton (prevents content flashing before permission checks)
  if (isHydrating || (token && !isPermissionsLoaded)) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text)] p-8">
        <div className="w-8 h-8 rounded-full border border-[var(--accent)]/40 border-t-[var(--accent)] animate-spin mb-3" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)]">
          ĐANG XÁC THỰC QUYỀN TRUY CẬP ATELIER VÉRITÉ...
        </span>
      </div>
    );
  }

  // 3. Admin Area Access Check
  if (requireAdmin) {
    const isAdmin = user?.role === 'admin' || user?.vipTier === 'admin';
    const hasAnyAdminAccess =
      isAdmin ||
      ['manager', 'staff'].includes(user?.role || '') ||
      permissions.length > 0;

    if (!hasAnyAdminAccess) {
      return <ForbiddenPage requiredPermission="dashboard:view" />;
    }
  }

  // 3.5 Specific Allowed Roles Check
  if (allowedRoles && allowedRoles.length > 0) {
    const isAdmin = user?.role === 'admin' || user?.vipTier === 'admin';
    const isAllowed = isAdmin || (user?.role && allowedRoles.includes(user.role));
    if (!isAllowed) {
      return <ForbiddenPage requiredPermission={allowedRoles.join(' / ')} />;
    }
  }

  // 4. Specific Explicit Permission Prop Check
  if (permission && !hasPermission(permission, permissions, user?.role)) {
    return <ForbiddenPage requiredPermission={permission} />;
  }

  // 5. Route-level Dynamic Permission Check
  if (location.pathname.startsWith('/admin')) {
    const allowed = canAccessRoute(location.pathname, permissions, user?.role);
    if (!allowed) {
      const required = ROUTE_PERMISSIONS[location.pathname]?.[0] || 'admin:access';
      return <ForbiddenPage requiredPermission={required} />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
