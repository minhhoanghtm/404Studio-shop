import { create } from 'zustand';
import { authApi } from '../api';
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthSession,
} from '../api/client';
import { broadcastAuthLogout, isJwtExpired } from '../utils/authSync';
import { Order, ShippingAddress, User } from '../types';
import { clearLocalBehaviorSignals } from '../tracking/useBehaviorTracking';

const toUser = (value: any): User => ({
  id: String(value?.id || value?._id || ''),
  name: value?.fullName || value?.name || '',
  email: value?.email || '',
  phone: value?.phone,
  avatar: value?.avatar || value?.avatar_url,
  role: value?.role || (value?.vipTier === 'admin' ? 'admin' : 'customer'),
  vipTier: value?.vipTier || value?.tier || (value?.role === 'admin' ? 'admin' : 'Thành viên'),
  addresses: Array.isArray(value?.addresses) ? value.addresses : [],
});

const readInitialUser = (): User | null => {
  try {
    const raw = localStorage.getItem('atelier_patron_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const u = parsed?.state?.user;
    return u ? toUser(u) : null;
  } catch {
    return null;
  }
};

const readInitialPermissions = (): string[] => {
  try {
    const raw = localStorage.getItem('atelier_user_permissions');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  permissions: string[];
  isPermissionsLoaded: boolean;
  orders: Order[];
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profile: Partial<User>) => Promise<boolean>;
  addAddress: (address: ShippingAddress) => Promise<boolean>;
  removeAddress: (index: number) => Promise<boolean>;
  setDefaultAddress: (index: number) => Promise<boolean>;
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'date' | 'status'>) => never;
  hydrateSession: () => Promise<void>;
  fetchPermissions: () => Promise<string[]>;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: Boolean(getAccessToken()),
  user: readInitialUser(),
  permissions: readInitialPermissions(),
  isPermissionsLoaded: false,
  orders: [],

  fetchPermissions: async () => {
    try {
      const response = await authApi.getPermissions();
      const perms = Array.isArray(response.data?.permissions)
        ? response.data.permissions
        : [];
      set({ permissions: perms, isPermissionsLoaded: true });
      try {
        localStorage.setItem('atelier_user_permissions', JSON.stringify(perms));
      } catch {
        // Ignore localStorage quota errors
      }
      return perms;
    } catch {
      // If fetching fails or guest, fallback to empty
      set({ permissions: [], isPermissionsLoaded: true });
      return [];
    }
  },

  hasPermission: (permission: string) => {
    const user = get().user;
    if (user?.role === 'admin' || user?.vipTier === 'admin') return true;
    return get().permissions.includes(permission);
  },

  hydrateSession: async () => {
    const at = getAccessToken();
    const rt = getRefreshToken();
    if (!at) {
      set({ isPermissionsLoaded: true });
      return;
    }

    // Startup check: token is expired and refresh token is missing -> broken session
    if (!rt && isJwtExpired(at)) {
      clearAuthSession();
      set({ isAuthenticated: false, user: null, permissions: [], isPermissionsLoaded: true, orders: [] });
      return;
    }

    try {
      const [userRes, permRes] = await Promise.allSettled([
        authApi.getMe(),
        authApi.getPermissions(),
      ]);

      if (userRes.status === 'fulfilled') {
        const u = toUser(userRes.value.data);
        const perms =
          permRes.status === 'fulfilled' && Array.isArray(permRes.value.data?.permissions)
            ? permRes.value.data.permissions
            : [];

        set({
          isAuthenticated: true,
          user: u,
          permissions: perms,
          isPermissionsLoaded: true,
        });

        try {
          localStorage.setItem('atelier_user_permissions', JSON.stringify(perms));
        } catch {}
      } else {
        clearAuthSession();
        set({ isAuthenticated: false, user: null, permissions: [], isPermissionsLoaded: true, orders: [] });
      }
    } catch {
      clearAuthSession();
      set({ isAuthenticated: false, user: null, permissions: [], isPermissionsLoaded: true, orders: [] });
    }
  },

  login: async (email, password) => {
    try {
      const response = await authApi.login({ email, passWord: password || '' });
      const data = response.data;
      if (!data?.accessToken || !data?.user) return false;

      setAuthTokens(data.accessToken, data.refreshToken);
      const u = toUser(data.user);
      set({ isAuthenticated: true, user: u, orders: [] });

      // Fetch permissions right after login
      try {
        const permRes = await authApi.getPermissions();
        const perms = Array.isArray(permRes.data?.permissions) ? permRes.data.permissions : [];
        set({ permissions: perms, isPermissionsLoaded: true });
        localStorage.setItem('atelier_user_permissions', JSON.stringify(perms));
      } catch {
        set({ permissions: [], isPermissionsLoaded: true });
      }

      return true;
    } catch {
      return false;
    }
  },

  loginWithGoogle: async (credential: string) => {
    try {
      const response = await authApi.loginWithGoogle(credential);
      const data = response.data;
      if (!data?.accessToken || !data?.user) return false;

      setAuthTokens(data.accessToken, data.refreshToken);
      const u = toUser(data.user);
      set({ isAuthenticated: true, user: u, orders: [] });

      try {
        const permRes = await authApi.getPermissions();
        const perms = Array.isArray(permRes.data?.permissions) ? permRes.data.permissions : [];
        set({ permissions: perms, isPermissionsLoaded: true });
        localStorage.setItem('atelier_user_permissions', JSON.stringify(perms));
      } catch {
        set({ permissions: [], isPermissionsLoaded: true });
      }

      return true;
    } catch {
      return false;
    }
  },

  register: async (name, email, password) => {
    try {
      const response = await authApi.register({
        fullName: name,
        email,
        passWord: password || '',
        termsAccepted: true,
        privacyAccepted: true,
        policyVersion: 'current',
      });
      const data = response.data;
      if (!data?.accessToken || !data?.user) return false;

      setAuthTokens(data.accessToken, data.refreshToken);
      const u = toUser(data.user);
      set({ isAuthenticated: true, user: u, permissions: [], isPermissionsLoaded: true, orders: [] });
      return true;
    } catch {
      return false;
    }
  },

  logout: () => {
    void authApi.logout().catch(() => undefined);
    clearLocalBehaviorSignals();
    clearAuthSession();
    try {
      localStorage.removeItem('atelier_user_permissions');
    } catch {}
    broadcastAuthLogout();
    set({
      isAuthenticated: false,
      user: null,
      permissions: [],
      isPermissionsLoaded: true,
      orders: [],
    });
  },

  updateProfile: async (profile) => {
    try {
      const response = await authApi.updateProfile({ fullName: profile.name, phone: profile.phone });
      set({ user: toUser(response.data?.user || response.data || { ...get().user, ...profile }) });
      return true;
    } catch {
      return false;
    }
  },

  addAddress: async () => false,
  removeAddress: async () => false,
  setDefaultAddress: async () => false,
  createOrder: () => {
    throw new Error('Đơn hàng phải được tạo qua ordersApi.createOrder.');
  },
}));
