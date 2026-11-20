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
  role: value?.role || (value?.vipTier === 'admin' ? 'admin' : 'user'),
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

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  orders: Order[];
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profile: Partial<User>) => Promise<boolean>;
  addAddress: (address: ShippingAddress) => Promise<boolean>;
  removeAddress: (index: number) => Promise<boolean>;
  setDefaultAddress: (index: number) => Promise<boolean>;
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'date' | 'status'>) => never;
  hydrateSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: Boolean(getAccessToken()),
  user: readInitialUser(),
  orders: [],
  hydrateSession: async () => {
    const at = getAccessToken();
    const rt = getRefreshToken();
    if (!at) return;

    // Startup check: token is expired and refresh token is missing -> broken session
    if (!rt && isJwtExpired(at)) {
      clearAuthSession();
      set({ isAuthenticated: false, user: null, orders: [] });
      return;
    }

    try {
      const response = await authApi.getMe();
      set({ isAuthenticated: true, user: toUser(response.data) });
    } catch {
      clearAuthSession();
      set({ isAuthenticated: false, user: null, orders: [] });
    }
  },
  login: async (email, password) => {
    try {
      const response = await authApi.login({ email, passWord: password || '' });
      const data = response.data;
      if (!data?.accessToken || !data?.user) return false;
      setAuthTokens(data.accessToken, data.refreshToken);
      set({ isAuthenticated: true, user: toUser(data.user), orders: [] });
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
      set({ isAuthenticated: true, user: toUser(data.user), orders: [] });
      return true;
    } catch {
      return false;
    }
  },
  logout: () => {
    void authApi.logout().catch(() => undefined);
    clearLocalBehaviorSignals();
    clearAuthSession();
    broadcastAuthLogout();
    set({ isAuthenticated: false, user: null, orders: [] });
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
