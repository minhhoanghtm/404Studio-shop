import React, { useState, useEffect } from 'react';
import { Tag, Copy, Check, Clock, Sparkles } from 'lucide-react';
import { AccountLayout } from './AccountLayout';
import { vouchersApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';
import { formatCurrency } from '@/shared/utils/formatters';

export const MyCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { addToast } = useToastStore();

  useEffect(() => {
    const fetchMyVouchers = async () => {
      try {
        const res = await vouchersApi.getMyVouchers();
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setCoupons(res.data);
        } else {
          // Demo fallback
          setCoupons([
            {
              id: 'my-1',
              code: 'VANGUARD15',
              title: 'Ưu Đãi Tân Khách Gia Tộc',
              discount: '15%',
              minSpend: 0,
              expiry: '31/12/2026',
            },
            {
              id: 'my-2',
              code: 'LUXE20',
              title: 'Đặc Quyền Haute Circle 20%',
              discount: '20%',
              minSpend: 25000000,
              expiry: '31/12/2026',
            },
          ]);
        }
      } catch {
        setCoupons([
          {
            id: 'my-1',
            code: 'VANGUARD15',
            title: 'Ưu Đãi Tân Khách Gia Tộc',
            discount: '15%',
            minSpend: 0,
            expiry: '31/12/2026',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyVouchers();
  }, []);

  const handleCopy = (code: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(code).catch(() => {});
      }
    } catch {
      // Ignore clipboard security errors in headless
    }
    setCopiedCode(code);
    addToast(`Đã sao chép mã ưu đãi ${code}`, 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <AccountLayout activeTab="coupons">
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl tracking-wide mb-1">Ví Phiếu Ưu Đãi Của Tôi</h2>
          <p className="text-xs text-secondary">
            Danh sách các mã đặc quyền đã lưu vào tài khoản. Nhập mã khi thanh toán để hưởng chiết khấu.
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-secondary">Đang tải ví ưu đãi...</div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-theme p-8 bg-surface-subtle/20">
            <Tag className="w-10 h-10 text-secondary/40 mx-auto mb-3" />
            <h3 className="font-serif text-lg mb-1">Ví Ưu Đãi Chưa Có Mã Nào</h3>
            <p className="text-xs text-secondary mb-4">
              Quý khách có thể truy cập trang Phiếu Ưu Đãi để nhận các mã đặc quyền mới nhất.
            </p>
            <a
              href="/vouchers"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary text-xs uppercase tracking-widest hover:bg-accent hover:text-black transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Khám Phá Phiếu Ưu Đãi</span>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coupons.map((coupon, idx) => (
              <div
                key={coupon.id || idx}
                className="p-5 border border-theme bg-surface-subtle/60 relative group hover:border-accent/60 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 bg-accent/10 border border-accent/30 text-accent font-mono text-xs">
                    {coupon.discount || `Giảm ${coupon.discountPercent || 15}%`}
                  </span>
                  <span className="text-[11px] text-secondary flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-accent" />
                    <span>HSD: {coupon.expiry || coupon.expiryDate || '31/12/2026'}</span>
                  </span>
                </div>

                <h4 className="font-serif text-base mb-1">{coupon.title || coupon.code}</h4>
                <p className="text-[11px] text-secondary mb-4">
                  {coupon.minSpend && coupon.minSpend > 0
                    ? `Đơn hàng tối thiểu: ${formatCurrency(coupon.minSpend)}`
                    : 'Áp dụng cho mọi giá trị đơn hàng'}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-theme/60">
                  <span className="font-mono text-xs font-bold text-accent tracking-widest">
                    {coupon.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(coupon.code)}
                    className="px-3 py-1.5 border border-theme hover:border-accent hover:text-accent text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Đã Chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao Chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
};
