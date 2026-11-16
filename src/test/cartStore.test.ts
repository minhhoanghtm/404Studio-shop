import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore, VALID_COUPONS } from '../stores/useCartStore';

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.getState().removeCoupon();
  });

  it('should initialize with an empty cart', () => {
    const { items, getItemsCount, getSubtotal } = useCartStore.getState();
    expect(items).toEqual([]);
    expect(getItemsCount()).toBe(0);
    expect(getSubtotal()).toBe(0);
  });

  it('should add an item to the cart', () => {
    const { addItem } = useCartStore.getState();
    addItem({
      productId: 'test-coat',
      productSlug: 'test-coat',
      name: 'Architectural Overcoat',
      price: 2000,
      quantity: 1,
      selectedColor: 'Noir',
      selectedColorHex: '#000000',
      selectedSize: '38 FR',
      image: '/test.jpg',
    });

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.getItemsCount()).toBe(1);
    expect(state.getSubtotal()).toBe(2000);
  });

  it('should increment quantity when adding duplicate variant', () => {
    const { addItem } = useCartStore.getState();
    const item = {
      productId: 'test-coat',
      productSlug: 'test-coat',
      name: 'Architectural Overcoat',
      price: 2000,
      quantity: 1,
      selectedColor: 'Noir',
      selectedColorHex: '#000000',
      selectedSize: '38 FR',
      image: '/test.jpg',
    };

    addItem(item);
    addItem(item);

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0].quantity).toBe(2);
    expect(state.getSubtotal()).toBe(4000);
  });

  it('should update quantity and remove item if quantity is zero', () => {
    const { addItem, updateQuantity } = useCartStore.getState();
    addItem({
      productId: 'test-coat',
      productSlug: 'test-coat',
      name: 'Architectural Overcoat',
      price: 1500,
      quantity: 2,
      selectedColor: 'Noir',
      selectedColorHex: '#000000',
      selectedSize: '38 FR',
      image: '/test.jpg',
    });

    updateQuantity('test-coat', 'Noir', '38 FR', 3);
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    updateQuantity('test-coat', 'Noir', '38 FR', 0);
    expect(useCartStore.getState().items.length).toBe(0);
  });

  it('should apply valid coupon code and calculate discount', () => {
    const { addItem, applyCoupon } = useCartStore.getState();
    addItem({
      productId: 'test-dress',
      productSlug: 'test-dress',
      name: 'Silk Gown',
      price: 1000,
      quantity: 1,
      selectedColor: 'Gold',
      selectedColorHex: '#FFD700',
      selectedSize: '36 FR',
      image: '/test.jpg',
    });

    const success = applyCoupon('VANGUARD15');
    expect(success).toBe(true);

    const state = useCartStore.getState();
    expect(state.appliedCoupon?.code).toBe('VANGUARD15');
    expect(state.getDiscount()).toBe(150); // 15% of 1000
    expect(state.getTotal()).toBe(1000 - 150 + 0 + Math.round((1000 - 150) * 0.08));
  });

  it('should reject invalid coupon codes', () => {
    const { applyCoupon } = useCartStore.getState();
    const success = applyCoupon('INVALID_CODE_999');
    expect(success).toBe(false);
    expect(useCartStore.getState().couponError).toBeTruthy();
  });

  it('should calculate complimentary shipping for orders over $500', () => {
    const { addItem } = useCartStore.getState();
    addItem({
      productId: 'test-tote',
      productSlug: 'test-tote',
      name: 'Leather Bag',
      price: 600,
      quantity: 1,
      selectedColor: 'Noir',
      selectedColorHex: '#000',
      selectedSize: 'One Size',
      image: '/test.jpg',
    });

    expect(useCartStore.getState().getShippingFee()).toBe(0);
  });
});
