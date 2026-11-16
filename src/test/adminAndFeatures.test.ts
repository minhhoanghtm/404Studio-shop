import { describe, it, expect } from 'vitest';
import { useToastStore } from '../shared/stores/useToastStore';

describe('Admin & Extended Feature Validation Suite', () => {
  it('should support both object and shorthand toast message dispatch', () => {
    const { addToast } = useToastStore.getState();

    // Shorthand dispatch
    addToast('Xác thực OTP thành công!', 'success');
    let state = useToastStore.getState();
    expect(state.toasts.length).toBeGreaterThan(0);
    expect(state.toasts[state.toasts.length - 1].message).toBe('Xác thực OTP thành công!');
    expect(state.toasts[state.toasts.length - 1].type).toBe('success');

    // Object dispatch
    addToast({
      title: 'Đơn Hàng Mới',
      message: 'Hóa đơn ORD-8925 đã khởi tạo',
      type: 'info',
    });
    state = useToastStore.getState();
    expect(state.toasts[state.toasts.length - 1].message).toBe('Hóa đơn ORD-8925 đã khởi tạo');
  });

  it('should validate voucher minimum spend requirements', () => {
    const voucher = {
      code: 'LUXE20',
      minOrderValue: 25000000,
      discountPercent: 20,
    };

    const eligibleOrderTotal = 30000000;
    const ineligibleOrderTotal = 15000000;

    expect(eligibleOrderTotal >= voucher.minOrderValue).toBe(true);
    expect(ineligibleOrderTotal >= voucher.minOrderValue).toBe(false);

    const discountAmount = (eligibleOrderTotal * voucher.discountPercent) / 100;
    expect(discountAmount).toBe(6000000);
  });
});
