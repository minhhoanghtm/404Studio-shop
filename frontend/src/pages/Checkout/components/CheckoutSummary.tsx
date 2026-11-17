import React, { useState } from 'react';
import { CartItem } from '../../../shared/types';
import { formatCurrency } from '../../../shared/utils/formatters';
import { vi } from '../../../shared/locales/vi/common';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CheckoutSummaryProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  isProcessing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  items,
  subtotal,
  discount,
  shipping,
  tax,
  total,
  isProcessing,
  onSubmit,
}) => {
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeDelivery, setAgreeDelivery] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [consentError, setConsentError] = useState('');

  const handleValidatedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setConsentError('Quý khách vui lòng đồng ý với Điều khoản sử dụng và Chính sách đổi trả.');
      return;
    }
    if (!agreeDelivery) {
      setConsentError('Quý khách vui lòng xác nhận đồng ý cho phép xử lý thông tin giao vận.');
      return;
    }
    setConsentError('');
    onSubmit(e);
  };

  return (
    <div className="p-8 rounded-2xl bg-[#0f0f14] border border-white/10 space-y-6 sticky top-28 text-white">
      <h3 className="font-serif text-xl tracking-wide border-b border-white/10 pb-4 text-white font-medium uppercase">
        Tóm Tắt Đơn Hàng
      </h3>

      {/* Items Preview */}
      <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-white/5 pr-2">
        {items.map((item) => (
          <div key={`${item.productId}-${item.selectedSize}`} className="flex gap-4 pt-3 first:pt-0">
            <img
              src={item.image}
              alt={item.name}
              className="w-12 h-16 object-cover rounded-lg border border-white/10 bg-black/40 shrink-0"
            />
            <div className="flex-1 min-w-0 text-xs">
              <h5 className="font-medium text-white truncate">{item.name}</h5>
              <p className="text-white/50 text-[11px]">
                {item.selectedColor} • Size {item.selectedSize} × {item.quantity}
              </p>
              <p className="font-mono text-[#d4af37] text-[11px] mt-0.5">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cost Ledger */}
      <div className="space-y-2.5 text-xs text-white/70 pt-4 border-t border-white/10">
        <div className="flex justify-between">
          <span>{vi.cart.subtotal}</span>
          <span className="font-mono text-white">{formatCurrency(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>{vi.cart.courtesyDiscount}</span>
            <span className="font-mono">-{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>{vi.cart.shipping}</span>
          <span className="font-mono text-white">
            {shipping === 0 ? vi.cart.complimentary : formatCurrency(shipping)}
          </span>
        </div>

        <div className="flex justify-between">
          <span>{vi.cart.tax}</span>
          <span className="font-mono text-white">{formatCurrency(tax)}</span>
        </div>

        <div className="flex justify-between text-base font-semibold text-white pt-3 border-t border-white/10">
          <span className="font-serif tracking-wide">{vi.cart.total}</span>
          <span className="font-mono text-[#d4af37]">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Prior Notice Disclosure Box */}
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-[11px] text-white/60 space-y-1 leading-relaxed font-light">
        <div className="flex items-center gap-1.5 text-white font-medium text-xs text-[#d4af37]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Thông Báo Xử Lý Dữ Liệu Thanh Toán</span>
        </div>
        <p>
          Dữ liệu: Tên, địa chỉ, SĐT, phương thức thanh toán. Mục đích: Giao nhận kiện hàng gỗ tuyết tùng và đối soát tài chính theo Luật 91/2025/QH15. Bên nhận: GHN Logistics, Cổng MoMo/VNPAY.
        </p>
      </div>

      {/* Unbundled Mandatory & Optional Consent Checkboxes */}
      <div className="space-y-2.5 pt-1 text-[11px] text-white/70 leading-relaxed">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => {
              setAgreeTerms(e.target.checked);
              if (e.target.checked) setConsentError('');
            }}
            className="w-4 h-4 rounded mt-0.5 accent-[#d4af37] cursor-pointer"
          />
          <span>
            Tôi đã đọc và đồng ý với{' '}
            <Link to="/terms-of-service" target="_blank" className="text-[#d4af37] underline hover:text-[#e5c158]">
              Điều khoản sử dụng
            </Link>{' '}
            và{' '}
            <Link to="/returns-refunds" target="_blank" className="text-[#d4af37] underline hover:text-[#e5c158]">
              Chính sách đổi trả 07 ngày
            </Link>
            . <span className="text-[#d4af37]">*</span>
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeDelivery}
            onChange={(e) => {
              setAgreeDelivery(e.target.checked);
              if (e.target.checked) setConsentError('');
            }}
            className="w-4 h-4 rounded mt-0.5 accent-[#d4af37] cursor-pointer"
          />
          <span>
            Tôi đồng ý cho phép xử lý dữ liệu cá nhân (địa chỉ, số điện thoại) để giao vận đơn hàng. <span className="text-[#d4af37]">*</span>
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeMarketing}
            onChange={(e) => setAgreeMarketing(e.target.checked)}
            className="w-4 h-4 rounded mt-0.5 accent-[#d4af37] cursor-pointer"
          />
          <span>
            Tôi đồng ý nhận thông báo bộ sưu tập mới và ưu đãi thành viên qua email (Tùy chọn).
          </span>
        </label>

        {consentError && (
          <p className="text-[11px] text-rose-400 pt-1 font-medium">{consentError}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleValidatedSubmit}
        disabled={isProcessing}
        className="w-full py-4 px-6 bg-[#d4af37] hover:bg-[#e5c158] text-black font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
      >
        <span>
          {isProcessing ? vi.checkout.authorizing : vi.checkout.confirmAndAuthorize}
        </span>
        {!isProcessing && <ArrowRight className="w-4 h-4" />}
      </button>

      <div className="flex items-center gap-2 text-[11px] text-white/50 justify-center pt-1">
        <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
        <span>Giao dịch bảo mật 256-bit TLS & Bảo chứng Maison</span>
      </div>
    </div>
  );
};
