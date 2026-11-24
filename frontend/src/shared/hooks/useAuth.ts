import { useAuthStore } from '../stores/useAuthStore';
import { getAccessToken, getRefreshToken } from '../api/client';
import { isJwtExpired } from '../utils/authSync';

/**
 * useAuth Hook
 * Centralized authentication hook providing reactive access to:
 * - isAuthenticated: boolean (validates store status + localStorage token viability)
 * - user: User | null
 * - token: string | null
 * - login, loginWithGoogle, register, logout, hydrateSession
 */
export const useAuth = () => {
  const store = useAuthStore();
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  const isTokenExpired = token ? isJwtExpired(token) : true;
  const isAuthenticated = Boolean(store.isAuthenticated && token && (!isTokenExpired || refreshToken));

  return {
    ...store,
    token,
    refreshToken,
    isAuthenticated,
  };
};

export default useAuth;
