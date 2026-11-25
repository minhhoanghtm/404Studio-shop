import { create } from 'zustand';
import { CartItem, Coupon } from '../types';
import { useToastStore } from './useToastStore';
import { cartApi, productsApi } from '../api';
import { getAccessToken } from '../api/client';

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

const customerScope = (): string | null => {
  if (typeof window === 'undefined' || !getAccessToken()) return null;
  try {
    const user = JSON.parse(localStorage.getItem('atelier_patron_auth') || '{}')?.state?.user;
    const id = String(user?.id || user?._id || '');
    return user?.role !== 'admin' && OBJECT_ID_REGEX.test(id) ? id : null;
  } catch { return null; }
};
const cartKey = (scope: string | null) => scope ? `${CART_STORAGE_KEY}:user:${scope}` : CART_STORAGE_KEY;
let activeCartScope = customerScope();
let cartMutationQueue: Promise<void> = Promise.resolve();
let cartReadRevision = 0;

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  appliedCoupon: Coupon | null;
  couponError: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (item: CartItem) => Promise<boolean>;
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

const loadSavedCart = (scope = customerScope()): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const key = cartKey(scope);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);

    // Migration từ cấu trúc mảng cũ (Version 1 -> Version 2)
    if (Array.isArray(parsed)) {
      const validItems = parsed.filter(
        (it) => it && typeof it.productId === 'string' && OBJECT_ID_REGEX.test(it.productId)
      );
      localStorage.setItem(
        key,
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
          key,
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

const saveCart = (items: CartItem[], scope = customerScope()) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        cartKey(scope),
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

  addItem: async (newItem) => {
    // 1. Kiểm tra nghiêm ngặt mã sản phẩm từ Backend
    if (!newItem.productId || !OBJECT_ID_REGEX.test(newItem.productId)) {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Không thể thêm vào giỏ',
        message: `Sản phẩm "${newItem.name || 'chưa xác định'}" chưa có mã định danh hợp lệ (_id) từ hệ thống. Vui lòng chọn sản phẩm từ danh mục chính thức.`,
      });
      return false;
    }

    // 2. Bắt buộc có kích cỡ và màu sắc
    if (!newItem.selectedSize || !newItem.selectedColor) {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Chưa chọn phân loại',
        message: 'Quý khách vui lòng chọn màu sắc và kích cỡ trước khi thêm vào giỏ hàng.',
      });
      return false;
    }

    const scope = customerScope();
    if (scope) {
      set({ isDrawerOpen: true });
      const operation = cartMutationQueue.catch(() => undefined).then(async () => {
        if (customerScope() !== scope) return false;
        try {
          await cartApi.addItem({ product_id: newItem.productId, ...(newItem.variantId && OBJECT_ID_REGEX.test(newItem.variantId) ? { variant_id: newItem.variantId } : {}), color: newItem.selectedColor, size: newItem.selectedSize, quantity: newItem.quantity });
          if (customerScope() === scope) await get().validateCartWithBackend();
          return customerScope() === scope;
        } catch (error) {
          if (customerScope() === scope) useToastStore.getState().addToast({ type: 'error', title: 'Không thể thêm vào giỏ', message: error instanceof Error ? error.message : 'Vui lòng thử lại.' });
          return false;
        }
      });
      cartMutationQueue = operation.then(() => undefined);
      return operation;
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
    return true;
  },

  removeItem: (productId, selectedColor, selectedSize) => {
    const scope = customerScope();
    if (scope) {
      cartMutationQueue = cartMutationQueue.catch(() => undefined).then(async () => {
        if (customerScope() !== scope) return;
        const item = get().items.find((entry) => entry.productId === productId && entry.selectedColor === selectedColor && entry.selectedSize === selectedSize);
        if (!item?.cartItemId) return;
        try { await cartApi.removeItem(item.cartItemId); if (customerScope() === scope) await get().validateCartWithBackend(); }
        catch (error) { if (customerScope() === scope) useToastStore.getState().addToast({ type: 'error', title: 'Không thể xóa sản phẩm', message: error instanceof Error ? error.message : 'Vui lòng thử lại.' }); }
      });
      return;
    }
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
    const scope = customerScope();
    if (activeCartScope !== scope) { activeCartScope = scope; set({ items: loadSavedCart(scope), appliedCoupon: null }); }
    const revision = ++cartReadRevision;
    if (scope) {
      try {
        const cart = await cartApi.getCart();
        const serverItems = cart.data?._id ? (await cartApi.getItems(String(cart.data._id))).data || [] : [];
        if (customerScope() !== scope || revision !== cartReadRevision) return;
        const items: CartItem[] = serverItems.filter((entry: any) => entry.product_id?._id).map((entry: any) => {
          const product = entry.product_id; const variant = entry.variant_id;
          return { cartItemId: String(entry._id), productId: String(product._id), variantId: variant?._id ? String(variant._id) : undefined, productSlug: String(product.slug || ''), name: String(product.name || ''), price: Number(entry.current_price ?? entry.price ?? 0), quantity: Number(entry.quantity), selectedColor: String(variant?.color || 'Mặc định'), selectedColorHex: String(variant?.color_code || '#1E1E24'), selectedSize: String(variant?.size || 'Freesize'), image: String(variant?.image_url || product.displayProduct?.[0] || '') };
        });
        saveCart(items, scope); set({ items });
      } catch (error) {
        if (customerScope() === scope && revision === cartReadRevision) useToastStore.getState().addToast({ type: 'error', title: 'Không thể tải giỏ hàng', message: error instanceof Error ? error.message : 'Vui lòng thử lại.' });
      }
      return;
    }
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

      if (customerScope() !== scope || revision !== cartReadRevision) return;
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
    const scope = customerScope();
    if (scope) {
      cartMutationQueue = cartMutationQueue.catch(() => undefined).then(async () => {
        if (customerScope() !== scope) return;
        const item = get().items.find((entry) => entry.productId === productId && entry.selectedColor === selectedColor && entry.selectedSize === selectedSize);
        if (!item?.cartItemId) return;
        try { await cartApi.updateItem(item.cartItemId, quantity); if (customerScope() === scope) await get().validateCartWithBackend(); }
        catch (error) { if (customerScope() === scope) useToastStore.getState().addToast({ type: 'error', title: 'Không thể cập nhật số lượng', message: error instanceof Error ? error.message : 'Vui lòng thử lại.' }); }
      });
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
    if (customerScope()) { void get().validateCartWithBackend(); return; }
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
