import { create } from 'zustand';
import { Product } from '../types';
import { useToastStore } from './useToastStore';

interface WishlistState {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
}

const loadSavedWishlist = (): Product[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('atelier_wishlist');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveWishlist = (items: Product[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('atelier_wishlist', JSON.stringify(items));
    } catch {
      // ignore
    }
  }
};

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: loadSavedWishlist(),

  isInWishlist: (productId: string) => {
    return get().items.some((item) => item.id === productId);
  },

  toggleWishlist: (product: Product) => {
    set((state) => {
      const exists = state.items.some((item) => item.id === product.id);
      let updated: Product[];

      if (exists) {
        updated = state.items.filter((item) => item.id !== product.id);
        useToastStore.getState().addToast({
          type: 'info',
          title: 'Đã bỏ khỏi danh sách yêu thích',
          message: `${product.name} đã được xóa khỏi danh sách tuyển chọn của quý khách.`,
        });
      } else {
        updated = [...state.items, product];
        useToastStore.getState().addToast({
          type: 'success',
          title: 'Đã lưu vào danh sách yêu thích',
          message: `${product.name} đã được lưu vào danh sách tuyển chọn riêng.`,
          productImage: product.featuredImage,
        });
      }

      saveWishlist(updated);
      return { items: updated };
    });
  },

  removeItem: (productId: string) => {
    set((state) => {
      const updated = state.items.filter((item) => item.id !== productId);
      saveWishlist(updated);
      return { items: updated };
    });
  },

  clearWishlist: () => {
    saveWishlist([]);
    set({ items: [] });
  },
}));
