import { create } from 'zustand';
import { authApi } from '../api';
import { Order, ShippingAddress, User } from '../types';
import { clearLocalBehaviorSignals } from '../tracking/useBehaviorTracking';

const toUser = (value: any): User => ({
  id: String(value?.id || value?._id || ''), name: value?.fullName || value?.name || '',
  email: value?.email || '', phone: value?.phone, vipTier: value?.vipTier || value?.tier || 'Thành viên',
  addresses: Array.isArray(value?.addresses) ? value.addresses : [],
});

const readAccessToken = () => {
  try {
    const state = JSON.parse(localStorage.getItem('atelier_patron_auth') || '{}');
    return state?.state?.accessToken || state?.state?.token || null;
  } catch { return null; }
};

const persistAccessToken = (accessToken: string) => {
  localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { accessToken, token: accessToken, isAuthenticated: true } }));
};

interface AuthState {
  isAuthenticated: boolean; user: User | null; orders: Order[];
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void; updateProfile: (profile: Partial<User>) => Promise<boolean>;
  addAddress: (address: ShippingAddress) => Promise<boolean>; removeAddress: (index: number) => Promise<boolean>;
  setDefaultAddress: (index: number) => Promise<boolean>;
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'date' | 'status'>) => never;
  hydrateSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: Boolean(readAccessToken()), user: null, orders: [],
  hydrateSession: async () => {
    if (!readAccessToken()) return;
    try { const response = await authApi.getMe(); set({ isAuthenticated: true, user: toUser(response.data) }); }
    catch { set({ isAuthenticated: false, user: null, orders: [] }); }
  },
  login: async (email, password) => {
    try {
      const response = await authApi.login({ email, passWord: password || '' });
      const data = response.data;
      if (!data?.accessToken || !data?.user) return false;
      persistAccessToken(data.accessToken); set({ isAuthenticated: true, user: toUser(data.user), orders: [] }); return true;
    } catch { return false; }
  },
  register: async (name, email, password) => {
    try {
      const response = await authApi.register({ fullName: name, email, passWord: password || '', termsAccepted: true, privacyAccepted: true, policyVersion: 'current' });
      const data = response.data;
      if (!data?.accessToken || !data?.user) return false;
      persistAccessToken(data.accessToken); set({ isAuthenticated: true, user: toUser(data.user), orders: [] }); return true;
    } catch { return false; }
  },
  logout: () => { void authApi.logout().catch(() => undefined); clearLocalBehaviorSignals(); localStorage.removeItem('atelier_patron_auth'); set({ isAuthenticated: false, user: null, orders: [] }); },
  updateProfile: async (profile) => {
    try {
      const response = await authApi.updateProfile({ fullName: profile.name, phone: profile.phone });
      set({ user: toUser(response.data?.user || response.data || { ...get().user, ...profile }) }); return true;
    } catch { return false; }
  },
  // Address CRUD is absent from the copied backend contract; never use a client-side substitute.
  addAddress: async () => false, removeAddress: async () => false, setDefaultAddress: async () => false,
  createOrder: () => { throw new Error('Đơn hàng phải được tạo qua ordersApi.createOrder.'); },
}));
