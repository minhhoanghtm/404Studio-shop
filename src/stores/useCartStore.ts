import { create } from 'zustand';
import { CartItem, Coupon } from '../types';
import { useToastStore } from './useToastStore';

export const VALID_COUPONS: Record<string, Coupon> = {
  VANGUARD15: {
    code: 'VANGUARD15',
    discountPercentage: 15,
    description: '15% Atelier Welcome Courtesy',
  },
  LUXE20: {
    code: 'LUXE20',
    discountPercentage: 20,
    description: '20% Haute Circle Exclusive',
    minimumSpend: 1000,
  },
  WELCOME10: {
    code: 'WELCOME10',
    discountPercentage: 10,
    description: '10% First Order Privilège',
  },
};

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
    const saved = localStorage.getItem('atelier_cart_items');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveCart = (items: CartItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('atelier_cart_items', JSON.stringify(items));
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

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  addItem: (newItem) => {
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

      // Trigger Luxury Toast
      useToastStore.getState().addToast({
        type: 'bag',
        title: 'Added to Shopping Bag',
        message: `${newItem.name} — ${newItem.selectedColor}, Size ${newItem.selectedSize}`,
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
      set({ couponError: 'Invalid courtesy code. Try VANGUARD15 or LUXE20' });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Invalid Code',
        message: 'The promotion code entered is not valid for this curation.',
      });
      return false;
    }

    const subtotal = get().getSubtotal();
    if (coupon.minimumSpend && subtotal < coupon.minimumSpend) {
      const msg = `Requires minimum curation of $${coupon.minimumSpend}`;
      set({ couponError: msg });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Threshold Unmet',
        message: msg,
      });
      return false;
    }

    set({ appliedCoupon: coupon, couponError: null });
    useToastStore.getState().addToast({
      type: 'success',
      title: 'Courtesy Applied',
      message: `${coupon.description} (${coupon.discountPercentage}% Off)`,
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
    // Complimentary White-Glove Shipping over $500
    return subtotal >= 500 ? 0 : 35;
  },

  getTax: () => {
    const taxableAmount = Math.max(0, get().getSubtotal() - get().getDiscount());
    return Math.round(taxableAmount * 0.08); // 8% luxury sales tax
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
