import React from 'react';
import { Banknote, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { vi } from '../../../shared/locales/vi/common';

export type PaymentMethod = 'cod' | 'momo' | 'vnpay';

interface PaymentMethodSelectorProps { method: PaymentMethod; onSelectMethod: (method: PaymentMethod) => void; }

const methods: Array<{ id: PaymentMethod; label: string; detail: string; icon: typeof CreditCard }> = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng', detail: 'Xác nhận đơn trước, thanh toán khi nhận hàng.', icon: Banknote },
  { id: 'momo', label: 'MoMo', detail: 'Chuyển tới cổng MoMo do máy chủ tạo.', icon: CreditCard },
  { id: 'vnpay', label: 'VNPAY', detail: 'Chuyển tới cổng VNPAY do máy chủ tạo.', icon: CreditCard },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ method, onSelectMethod }) => <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-6">
  <div className="flex items-center justify-between border-b border-white/10 pb-4"><h3 className="font-display text-xl text-white tracking-wide">{vi.checkout.step3}</h3><div className="flex items-center gap-1.5 text-xs text-champagne"><Lock className="w-3.5 h-3.5" /><span>Kết nối bảo mật</span></div></div>
  <div className="space-y-3">{methods.map(({ id, label, detail, icon: Icon }) => <button key={id} type="button" onClick={() => onSelectMethod(id)} className={`w-full p-4 rounded-xl border flex items-start text-left gap-3 text-xs font-sans transition-all ${method === id ? 'border-champagne bg-champagne/10 text-white' : 'border-white/10 bg-noir-950/60 text-white/60 hover:text-white'}`}><Icon className="w-4 h-4 text-champagne shrink-0 mt-0.5" /><span><strong className="block uppercase tracking-wider mb-1">{label}</strong>{detail}</span></button>)}</div>
  <div className="p-3.5 rounded-lg bg-champagne/10 border border-champagne/20 flex items-start gap-2.5 text-[11px] text-champagne font-sans"><ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>Không nhập số thẻ, OTP hoặc mật khẩu tại đây. Trạng thái thanh toán chỉ được cập nhật sau khi máy chủ xác minh phản hồi của nhà cung cấp.</span></div>
</div>;
