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
    <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-6 sticky top-28 text-[var(--text)] shadow-xl">
      <h3 className="font-serif text-xl tracking-wide border-b border-[var(--border)] pb-4 text-[var(--text)] font-medium uppercase">
        Tóm Tắt Đơn Hàng
      </h3>

      {/* Items Preview */}
      <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-[var(--border)] pr-2">
        {items.map((item) => (
          <div key={`${item.productId}-${item.selectedSize}`} className="flex gap-4 pt-3 first:pt-0">
            <img
              src={item.image}
              alt={item.name}
              className="w-12 h-16 object-cover rounded-lg border border-[var(--border)] bg-[var(--bg-alt)] shrink-0"
            />
            <div className="flex-1 min-w-0 text-xs">
              <h5 className="font-medium text-[var(--text)] truncate">{item.name}</h5>
              <p className="text-[var(--text-muted)] text-[11px]">
                {item.selectedColor} • Size {item.selectedSize} × {item.quantity}
              </p>
              <p className="font-mono text-[var(--accent)] text-[11px] font-semibold mt-0.5">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cost Ledger */}
      <div className="space-y-2.5 text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border)]">
        <div className="flex justify-between">
          <span>{vi.cart.subtotal}</span>
          <span className="font-mono text-[var(--text)]">{formatCurrency(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>{vi.cart.courtesyDiscount}</span>
            <span className="font-mono">-{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>{vi.cart.shipping}</span>
          <span className="font-mono text-[var(--text)]">
            {shipping === 0 ? vi.cart.complimentary : formatCurrency(shipping)}
          </span>
        </div>

        <div className="flex justify-between">
          <span>{vi.cart.tax}</span>
          <span className="font-mono text-[var(--text)]">{formatCurrency(tax)}</span>
        </div>

        <div className="flex justify-between text-base font-semibold text-[var(--text)] pt-3 border-t border-[var(--border)]">
          <span className="font-serif tracking-wide uppercase">{vi.cart.total}</span>
          <span className="font-mono text-[var(--accent)] font-bold">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Prior Notice Disclosure Box */}
      <div className="p-3 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] space-y-1 leading-relaxed font-light">
        <div className="flex items-center gap-1.5 font-medium text-xs text-[var(--accent)]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Thông Báo Xử Lý Dữ Liệu Thanh Toán</span>
        </div>
        <p>
          Dữ liệu: Tên, địa chỉ, SĐT, phương thức thanh toán. Mục đích: Giao nhận kiện hàng gỗ tuyết tùng và đối soát tài chính theo Luật 91/2025/QH15. Bên nhận: GHN Logistics, Cổng MoMo/VNPAY.
        </p>
      </div>

      {/* Unbundled Mandatory & Optional Consent Checkboxes */}
      <div className="space-y-2.5 pt-1 text-[11px] text-[var(--text-muted)] leading-relaxed">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => {
              setAgreeTerms(e.target.checked);
              if (e.target.checked) setConsentError('');
            }}
            className="w-4 h-4 rounded mt-0.5 accent-[var(--accent)] cursor-pointer"
          />
          <span>
            Tôi đã đọc và đồng ý với{' '}
            <Link to="/terms-of-service" target="_blank" className="text-[var(--accent)] underline hover:text-[#9E7B15]">
              Điều khoản sử dụng
            </Link>{' '}
            và{' '}
            <Link to="/returns-refunds" target="_blank" className="text-[var(--accent)] underline hover:text-[#9E7B15]">
              Chính sách đổi trả 07 ngày
            </Link>
            . <span className="text-[var(--accent)]">*</span>
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
            className="w-4 h-4 rounded mt-0.5 accent-[var(--accent)] cursor-pointer"
          />
          <span>
            Tôi đồng ý cho phép xử lý dữ liệu cá nhân (địa chỉ, số điện thoại) để giao vận đơn hàng. <span className="text-[var(--accent)]">*</span>
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeMarketing}
            onChange={(e) => setAgreeMarketing(e.target.checked)}
            className="w-4 h-4 rounded mt-0.5 accent-[var(--accent)] cursor-pointer"
          />
          <span>
            Tôi đồng ý nhận thông báo bộ sưu tập mới và ưu đãi thành viên qua email (Tùy chọn).
          </span>
        </label>

        {consentError && (
          <p className="text-[11px] text-rose-500 pt-1 font-medium">{consentError}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleValidatedSubmit}
        disabled={isProcessing}
        className="w-full py-4 px-6 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
      >
        <span>
          {isProcessing ? vi.checkout.authorizing : vi.checkout.confirmAndAuthorize}
        </span>
        {!isProcessing && <ArrowRight className="w-4 h-4" />}
      </button>

      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] justify-center pt-1">
        <Lock className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>Giao dịch bảo mật 256-bit TLS & Bảo chứng Maison</span>
      </div>
    </div>
  );
};
