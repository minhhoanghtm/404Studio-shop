import { create } from 'zustand';
import { User, Order, ShippingAddress } from '../types';
import { useToastStore } from './useToastStore';
import { clearLocalBehaviorSignals } from '../tracking/useBehaviorTracking';

const INITIAL_MOCK_USER: User = {
  id: 'usr_77491',
  name: 'Geneviève Laurent',
  email: 'g.laurent@verite-atelier.com',
  phone: '+84 90 123 4567',
  vipTier: 'Haute Circle',
  savedCardLast4: '8842',
  addresses: [
    {
      firstName: 'Geneviève',
      lastName: 'Laurent',
      email: 'g.laurent@verite-atelier.com',
      phone: '+84 90 123 4567',
      addressLine1: '14 Quảng trường Lam Sơn, Bến Nghé, Quận 1',
      addressLine2: 'Căn hộ Penthouse 18A',
      city: 'Hồ Chí Minh',
      state: 'TP. Hồ Chí Minh',
      postalCode: '700000',
      country: 'Việt Nam',
      isDefault: true,
    },
    {
      firstName: 'Geneviève',
      lastName: 'Laurent',
      email: 'g.laurent@verite-atelier.com',
      phone: '+33 1 42 68 55 00',
      addressLine1: '14 Place Vendôme',
      city: 'Paris',
      state: 'Île-de-France',
      postalCode: '75001',
      country: 'Pháp',
      isDefault: false,
    },
  ],
};

const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'ord_99014',
    orderNumber: 'AV-2026-99014',
    date: '24/10/2026',
    status: 'Đã giao hàng',
    trackingNumber: 'VN-DHL-789421098',
    estimatedDelivery: 'Đã bàn giao ngày 28/10/2026',
    items: [
      {
        id: 'oi_1',
        productId: 'sculpted-wool-coat',
        name: 'Áo Khoác Dạ Kiến Trúc Len Nguyên Chất',
        price: 58500000,
        quantity: 1,
        size: '38 FR (M)',
        color: 'Đen Mã Não (Onyx Noir)',
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'oi_2',
        productId: 'obsidian-leather-tote',
        name: 'Túi Xách Da Bê Điêu Khắc Obsidian',
        price: 44500000,
        quantity: 1,
        size: 'Kích cỡ tiêu chuẩn (One Size)',
        color: 'Đen Mờ (Noir Mat)',
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
      },
    ],
    subtotal: 103000000,
    discount: 15450000,
    shipping: 0,
    tax: 7004000,
    total: 94554000,
    paymentMethod: 'Thẻ tín dụng Mastercard đuôi 8842',
    shippingAddress: INITIAL_MOCK_USER.addresses[0],
  },
  {
    id: 'ord_98452',
    orderNumber: 'AV-2026-98452',
    date: '12/09/2026',
    status: 'Đã giao hàng',
    trackingNumber: 'VN-DHL-554219011',
    estimatedDelivery: 'Đã bàn giao ngày 15/09/2026',
    items: [
      {
        id: 'oi_3',
        productId: 'liquid-silk-evening-dress',
        name: 'Đầm Dạ Hội Lụa Tơ Tằm Cắt Xéo Chảy Chảy Dáng Cột',
        price: 74000000,
        quantity: 1,
        size: '36 FR (S)',
        color: 'Kem Champagne (Champagne Crème)',
        image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
      },
    ],
    subtotal: 74000000,
    discount: 0,
    shipping: 0,
    tax: 5920000,
    total: 79920000,
    paymentMethod: 'Thẻ tín dụng Mastercard đuôi 8842',
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
      isAuth: !!savedUser || true,
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
        title: 'Chào mừng quý khách quay lại',
        message: `Đã xác thực quyền ưu tiên dành cho ${mockUser.name}`,
      });
      return true;
    },

    register: async (name: string, email: string) => {
      const newUser: User = {
        id: `usr_${Math.floor(10000 + Math.random() * 90000)}`,
        name,
        email,
        vipTier: 'Thành viên',
        addresses: [],
      };
      set({ isAuthenticated: true, user: newUser });
      localStorage.setItem('atelier_user', JSON.stringify(newUser));
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Chào mừng quý khách đến với Maison Vérité',
        message: `Hồ sơ thành viên của quý khách đã được khởi tạo thành công.`,
      });
      return true;
    },

    logout: () => {
      clearLocalBehaviorSignals();
      set({ isAuthenticated: false, user: null });
      localStorage.removeItem('atelier_user');
      useToastStore.getState().addToast({
        type: 'info',
        title: 'Đã kết thúc phiên',
        message: 'Phiên làm việc của quý khách đã được đăng xuất an toàn.',
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
        title: 'Đã cập nhật hồ sơ',
        message: 'Các thông tin cá nhân của quý khách đã được ghi nhận.',
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
        title: 'Đã thêm địa chỉ giao hàng',
        message: `${address.city}, ${address.country} đã được lưu vào sổ địa chỉ.`,
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
      const now = new Date();
      const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      const newOrder: Order = {
        ...orderData,
        id: `ord_${Math.floor(10000 + Math.random() * 90000)}`,
        orderNumber,
        date: formattedDate,
        status: 'Đang xử lý',
        trackingNumber: `VN-DHL-${Math.floor(100000000 + Math.random() * 900000000)}`,
        estimatedDelivery: '3-5 ngày làm việc qua chuyển phát ngoại giao',
      };

      const updatedOrders = [newOrder, ...get().orders];
      set({ orders: updatedOrders });
      localStorage.setItem('atelier_orders', JSON.stringify(updatedOrders));
      return newOrder;
    },
  };
});
