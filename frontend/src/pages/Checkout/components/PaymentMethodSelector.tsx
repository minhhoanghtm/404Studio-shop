import React from 'react';
import { Banknote, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { vi } from '../../../shared/locales/vi/common';

export type PaymentMethod = 'cod' | 'momo' | 'vnpay';

interface PaymentMethodSelectorProps {
  method: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

const methods: Array<{ id: PaymentMethod; label: string; detail: string; icon: typeof CreditCard }> = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng', detail: 'Xác nhận đơn trước, thanh toán khi nhận hàng.', icon: Banknote },
  { id: 'momo', label: 'MoMo', detail: 'Chuyển tới cổng MoMo do máy chủ tạo.', icon: CreditCard },
  { id: 'vnpay', label: 'VNPAY', detail: 'Chuyển tới cổng VNPAY do máy chủ tạo.', icon: CreditCard },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ method, onSelectMethod }) => (
  <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-6 shadow-sm">
    <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
      <h3 className="font-display text-xl text-[var(--text)] tracking-wide font-medium uppercase">
        {vi.checkout.step3}
      </h3>
      <div className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-medium">
        <Lock className="w-3.5 h-3.5" />
        <span>Kết nối bảo mật</span>
      </div>
    </div>

    <div className="space-y-3">
      {methods.map(({ id, label, detail, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelectMethod(id)}
          className={`w-full p-4 rounded-xl border flex items-start text-left gap-3 text-xs font-sans transition-all ${
            method === id
              ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)] shadow-sm'
              : 'border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)]/50'
          }`}
        >
          <Icon className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
          <span>
            <strong className="block uppercase tracking-wider mb-1 text-[var(--text)]">{label}</strong>
            {detail}
          </span>
        </button>
      ))}
    </div>

    <div className="p-3.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-start gap-2.5 text-[11px] text-[var(--accent)] font-sans">
      <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--accent)]" />
      <span>Không nhập số thẻ, OTP hoặc mật khẩu tại đây. Trạng thái thanh toán chỉ được cập nhật sau khi máy chủ xác minh phản hồi của nhà cung cấp.</span>
    </div>
  </div>
);
