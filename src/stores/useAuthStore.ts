import { create } from 'zustand';
import { User, Order, ShippingAddress } from '../types';
import { useToastStore } from './useToastStore';

const INITIAL_MOCK_USER: User = {
  id: 'usr_77491',
  name: 'Geneviève Laurent',
  email: 'g.laurent@verite-atelier.com',
  phone: '+33 1 42 68 55 00',
  vipTier: 'Haute Circle',
  savedCardLast4: '8842',
  addresses: [
    {
      firstName: 'Geneviève',
      lastName: 'Laurent',
      email: 'g.laurent@verite-atelier.com',
      phone: '+33 1 42 68 55 00',
      addressLine1: '14 Place Vendôme',
      addressLine2: 'Appartement 4B',
      city: 'Paris',
      state: 'Île-de-France',
      postalCode: '75001',
      country: 'France',
      isDefault: true,
    },
    {
      firstName: 'Geneviève',
      lastName: 'Laurent',
      email: 'g.laurent@verite-atelier.com',
      phone: '+1 212 555 0198',
      addressLine1: '740 Park Avenue',
      city: 'New York',
      state: 'NY',
      postalCode: '10021',
      country: 'United States',
      isDefault: false,
    },
  ],
};

const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'ord_99014',
    orderNumber: 'AV-2026-99014',
    date: '2026-10-24',
    status: 'Delivered',
    trackingNumber: 'FR-DHL-789421098',
    estimatedDelivery: 'Delivered Oct 28, 2026',
    items: [
      {
        id: 'oi_1',
        productId: 'sculpted-wool-coat',
        name: 'The Architectural Wool Overcoat',
        price: 2450,
        quantity: 1,
        size: '38 FR (M)',
        color: 'Onyx Noir',
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'oi_2',
        productId: 'obsidian-leather-tote',
        name: 'Obsidian Sculpted Calfskin Tote',
        price: 1850,
        quantity: 1,
        size: 'One Size',
        color: 'Saddle Umber',
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
      },
    ],
    subtotal: 4300,
    discount: 645,
    shipping: 0,
    tax: 292,
    total: 3947,
    paymentMethod: 'Mastercard ending in 8842',
    shippingAddress: INITIAL_MOCK_USER.addresses[0],
  },
  {
    id: 'ord_98452',
    orderNumber: 'AV-2026-98452',
    date: '2026-09-12',
    status: 'Delivered',
    trackingNumber: 'FR-DHL-554219011',
    estimatedDelivery: 'Delivered Sep 15, 2026',
    items: [
      {
        id: 'oi_3',
        productId: 'liquid-silk-evening-dress',
        name: 'Liquid Silk Draped Column Gown',
        price: 3100,
        quantity: 1,
        size: '36 FR (S)',
        color: 'Champagne Crème',
        image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
      },
    ],
    subtotal: 3100,
    discount: 0,
    shipping: 0,
    tax: 248,
    total: 3348,
    paymentMethod: 'Mastercard ending in 8842',
    shippingAddress: INITIAL_MOCK_USER.addresses[0],
  },
];

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  orders: Order[];
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profile: Partial<User>) => void;
  addAddress: (address: ShippingAddress) => void;
  removeAddress: (index: number) => void;
  setDefaultAddress: (index: number) => void;
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'date' | 'status'>) => Order;
}

const loadSession = (): { isAuth: boolean; user: User | null; orders: Order[] } => {
  if (typeof window === 'undefined') {
    return { isAuth: true, user: INITIAL_MOCK_USER, orders: INITIAL_MOCK_ORDERS };
  }
  try {
    const savedUser = localStorage.getItem('atelier_user');
    const savedOrders = localStorage.getItem('atelier_orders');
    return {
      isAuth: !!savedUser || true, // default to signed-in simulated luxury patron
      user: savedUser ? JSON.parse(savedUser) : INITIAL_MOCK_USER,
      orders: savedOrders ? JSON.parse(savedOrders) : INITIAL_MOCK_ORDERS,
    };
  } catch {
    return { isAuth: true, user: INITIAL_MOCK_USER, orders: INITIAL_MOCK_ORDERS };
  }
};

export const useAuthStore = create<AuthState>((set, get) => {
  const initial = loadSession();

  return {
    isAuthenticated: initial.isAuth,
    user: initial.user,
    orders: initial.orders,

    login: async (email: string) => {
      const mockUser: User = {
        ...INITIAL_MOCK_USER,
        email,
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      };
      set({ isAuthenticated: true, user: mockUser });
      localStorage.setItem('atelier_user', JSON.stringify(mockUser));
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Welcome Back',
        message: `Privileged access granted to ${mockUser.name}`,
      });
      return true;
    },

    register: async (name: string, email: string) => {
      const newUser: User = {
        id: `usr_${Math.floor(10000 + Math.random() * 90000)}`,
        name,
        email,
        vipTier: 'Member',
        addresses: [],
      };
      set({ isAuthenticated: true, user: newUser });
      localStorage.setItem('atelier_user', JSON.stringify(newUser));
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Welcome to Maison Vérité',
        message: `Your patron portfolio has been initialized.`,
      });
      return true;
    },

    logout: () => {
      set({ isAuthenticated: false, user: null });
      localStorage.removeItem('atelier_user');
      useToastStore.getState().addToast({
        type: 'info',
        title: 'Signed Out',
        message: 'Your session has been securely ended.',
      });
    },

    updateProfile: (profile) => {
      const current = get().user;
      if (!current) return;
      const updated = { ...current, ...profile };
      set({ user: updated });
      localStorage.setItem('atelier_user', JSON.stringify(updated));
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your personal preferences have been saved.',
      });
    },

    addAddress: (address) => {
      const current = get().user;
      if (!current) return;
      const updatedAddresses = [...current.addresses, address];
      const updated = { ...current, addresses: updatedAddresses };
      set({ user: updated });
      localStorage.setItem('atelier_user', JSON.stringify(updated));
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Address Registered',
        message: `${address.city}, ${address.country} added to delivery ledger.`,
      });
    },

    removeAddress: (index) => {
      const current = get().user;
      if (!current) return;
      const updatedAddresses = current.addresses.filter((_, i) => i !== index);
      const updated = { ...current, addresses: updatedAddresses };
      set({ user: updated });
      localStorage.setItem('atelier_user', JSON.stringify(updated));
    },

    setDefaultAddress: (index) => {
      const current = get().user;
      if (!current) return;
      const updatedAddresses = current.addresses.map((addr, i) => ({
        ...addr,
        isDefault: i === index,
      }));
      const updated = { ...current, addresses: updatedAddresses };
      set({ user: updated });
      localStorage.setItem('atelier_user', JSON.stringify(updated));
    },

    createOrder: (orderData) => {
      const orderNumber = `AV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const newOrder: Order = {
        ...orderData,
        id: `ord_${Math.floor(10000 + Math.random() * 90000)}`,
        orderNumber,
        date: new Date().toISOString().split('T')[0],
        status: 'Processing',
        trackingNumber: `FR-DHL-${Math.floor(100000000 + Math.random() * 900000000)}`,
        estimatedDelivery: '3-5 business days via Courier Express',
      };

      const updatedOrders = [newOrder, ...get().orders];
      set({ orders: updatedOrders });
      localStorage.setItem('atelier_orders', JSON.stringify(updatedOrders));
      return newOrder;
    },
  };
});
