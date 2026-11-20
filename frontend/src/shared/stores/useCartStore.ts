import { create } from 'zustand';
import { CartItem, Coupon } from '../types';
import { useToastStore } from './useToastStore';
import { productsApi } from '../api';

export const VALID_COUPONS: Record<string, Coupon> = {
  VANGUARD15: {
    code: 'VANGUARD15',
    discountPercentage: 15,
    description: 'Đặc quyền chào mừng Maison (Ưu đãi 15%)',
  },
  LUXE20: {
    code: 'LUXE20',
    discountPercentage: 20,
    description: 'Đặc quyền Haute Circle (Ưu đãi 20%)',
    minimumSpend: 25000000,
  },
  WELCOME10: {
    code: 'WELCOME10',
    discountPercentage: 10,
    description: 'Đặc quyền đơn hàng đầu tiên (Ưu đãi 10%)',
  },
};

export const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
export const CART_STORAGE_KEY = 'atelier_cart_items';
export const CART_STORAGE_VERSION = 2;

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  appliedCoupon: Coupon | null;
  couponError: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, selectedColor: string, selectedSize: string) => void;
  updateQuantity: (productId: string, selectedColor: string, selectedSize: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;

  // Real backend sync & cleanup
  removeInvalidItems: () => void;
  validateCartWithBackend: () => Promise<void>;

  // Computed values
  getItemsCount: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getShippingFee: () => number;
  getTax: () => number;
  getTotal: () => number;
}

const loadSavedCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);

    // Migration từ cấu trúc mảng cũ (Version 1 -> Version 2)
    if (Array.isArray(parsed)) {
      const validItems = parsed.filter(
        (it) => it && typeof it.productId === 'string' && OBJECT_ID_REGEX.test(it.productId)
      );
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({ version: CART_STORAGE_VERSION, items: validItems })
      );
      return validItems;
    }

    // Cấu trúc đối tượng phiên bản mới
    if (parsed && typeof parsed === 'object') {
      const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
      const validItems = rawItems.filter(
        (it: any) => it && typeof it.productId === 'string' && OBJECT_ID_REGEX.test(it.productId)
      );
      if (validItems.length !== rawItems.length || parsed.version !== CART_STORAGE_VERSION) {
        localStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify({ version: CART_STORAGE_VERSION, items: validItems })
        );
      }
      return validItems;
    }

    return [];
  } catch {
    return [];
  }
};

const saveCart = (items: CartItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({ version: CART_STORAGE_VERSION, items })
      );
    } catch {
      // ignore
    }
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: loadSavedCart(),
  isDrawerOpen: false,
  appliedCoupon: null,
  couponError: null,

  openDrawer: () => {
    set({ isDrawerOpen: true });
    // Tự động đối chiếu dữ liệu với Backend khi người dùng mở giỏ
    void get().validateCartWithBackend();
  },
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => {
    const nextState = !get().isDrawerOpen;
    set({ isDrawerOpen: nextState });
    if (nextState) {
      void get().validateCartWithBackend();
    }
  },

  addItem: (newItem) => {
    // 1. Kiểm tra nghiêm ngặt mã sản phẩm từ Backend
    if (!newItem.productId || !OBJECT_ID_REGEX.test(newItem.productId)) {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Không thể thêm vào giỏ',
        message: `Sản phẩm "${newItem.name || 'chưa xác định'}" chưa có mã định danh hợp lệ (_id) từ hệ thống. Vui lòng chọn sản phẩm từ danh mục chính thức.`,
      });
      return;
    }

    // 2. Bắt buộc có kích cỡ và màu sắc
    if (!newItem.selectedSize || !newItem.selectedColor) {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Chưa chọn phân loại',
        message: 'Quý khách vui lòng chọn màu sắc và kích cỡ trước khi thêm vào giỏ hàng.',
      });
      return;
    }

    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.selectedColor === newItem.selectedColor &&
          item.selectedSize === newItem.selectedSize
      );

      let updatedItems: CartItem[];
      if (existingIndex > -1) {
        updatedItems = [...state.items];
        updatedItems[existingIndex].quantity += newItem.quantity;
      } else {
        updatedItems = [...state.items, newItem];
      }

      saveCart(updatedItems);

      // Thông báo Toast thành công
      useToastStore.getState().addToast({
        type: 'bag',
        title: 'Đã thêm vào túi mua sắm',
        message: `${newItem.name} — ${newItem.selectedColor}, Cỡ ${newItem.selectedSize}`,
        productImage: newItem.image,
      });

      return { items: updatedItems, isDrawerOpen: true };
    });
  },

  removeItem: (productId, selectedColor, selectedSize) => {
    set((state) => {
      const updatedItems = state.items.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.selectedColor === selectedColor &&
            item.selectedSize === selectedSize
          )
      );
      saveCart(updatedItems);
      return { items: updatedItems };
    });
  },

  removeInvalidItems: () => {
    const current = get().items;
    const valid = current.filter((it) => it.productId && OBJECT_ID_REGEX.test(it.productId));
    const removedCount = current.length - valid.length;
    if (removedCount > 0) {
      saveCart(valid);
      set({ items: valid });
      useToastStore.getState().addToast({
        type: 'info',
        title: 'Đã dọn dẹp giỏ hàng',
        message: `Đã loại bỏ ${removedCount} sản phẩm không hợp lệ hoặc dữ liệu mẫu.`,
      });
    }
  },

  validateCartWithBackend: async () => {
    const current = get().items;
    if (current.length === 0) return;

    try {
      const validItems: CartItem[] = [];
      let hasChanges = false;

      for (const item of current) {
        if (!item.productId || !OBJECT_ID_REGEX.test(item.productId)) {
          hasChanges = true;
          continue;
        }

        try {
          const res = await productsApi.getProductDetail(item.productId);
          const productData = res?.data || (res as any);
          if (res?.success !== false && productData && productData._id) {
            const syncedPrice = Number(productData.price || productData.new_price || item.price);
            validItems.push({
              ...item,
              price: syncedPrice,
            });
            if (syncedPrice !== item.price) {
              hasChanges = true;
            }
          } else {
            // Sản phẩm không tồn tại hoặc đã ngừng kinh doanh
            hasChanges = true;
          }
        } catch {
          hasChanges = true;
        }
      }

      if (hasChanges || validItems.length !== current.length) {
        saveCart(validItems);
        set({ items: validItems });
        useToastStore.getState().addToast({
          type: 'info',
          title: 'Cập nhật giỏ hàng',
          message: 'Một số sản phẩm đã được cập nhật, vui lòng thêm lại.',
        });
      }
    } catch (err) {
      console.warn('Giỏ hàng: Không thể đồng bộ với máy chủ', err);
    }
  },

  updateQuantity: (productId, selectedColor, selectedSize, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId, selectedColor, selectedSize);
      return;
    }
    set((state) => {
      const updatedItems = state.items.map((item) => {
        if (
          item.productId === productId &&
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize
        ) {
          return { ...item, quantity };
        }
        return item;
      });
      saveCart(updatedItems);
      return { items: updatedItems };
    });
  },

  clearCart: () => {
    saveCart([]);
    set({ items: [], appliedCoupon: null });
  },

  applyCoupon: (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const coupon = VALID_COUPONS[cleanCode];

    if (!coupon) {
      const msg = 'Mã ưu đãi không hợp lệ. Quý khách vui lòng thử VANGUARD15 hoặc LUXE20';
      set({ couponError: msg });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Mã không hợp lệ',
        message: msg,
      });
      return false;
    }

    const subtotal = get().getSubtotal();
    if (coupon.minimumSpend && subtotal < coupon.minimumSpend) {
      const msg = `Yêu cầu đơn hàng tối thiểu 25.000.000 ₫ để áp dụng mã ${coupon.code}`;
      set({ couponError: msg });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Chưa đủ điều kiện',
        message: msg,
      });
      return false;
    }

    set({ appliedCoupon: coupon, couponError: null });
    useToastStore.getState().addToast({
      type: 'success',
      title: 'Đã kích hoạt ưu đãi',
      message: `${coupon.description} đã được áp dụng thành công.`,
    });
    return true;
  },

  removeCoupon: () => set({ appliedCoupon: null, couponError: null }),

  getItemsCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getDiscount: () => {
    const { appliedCoupon } = get();
    if (!appliedCoupon) return 0;
    const subtotal = get().getSubtotal();
    return Math.round((subtotal * appliedCoupon.discountPercentage) / 100);
  },

  getShippingFee: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    return subtotal >= 12000000 ? 0 : 850000;
  },

  getTax: () => {
    const taxableAmount = Math.max(0, get().getSubtotal() - get().getDiscount());
    return Math.round(taxableAmount * 0.08);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    const discount = get().getDiscount();
    const shipping = get().getShippingFee();
    const tax = get().getTax();
    return subtotal - discount + shipping + tax;
  },
}));
