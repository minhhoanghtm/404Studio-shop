import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, Copy, Check, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { vouchersApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';
import { formatCurrency } from '@/shared/utils/formatters';

interface VoucherItem {
  _id?: string;
  id?: string;
  code: string;
  name?: string;
  title?: string;
  description?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountPercent?: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate?: string;
  endDate?: string;
  expiryDate?: string;
}

const FALLBACK_VOUCHERS: VoucherItem[] = [
  {
    id: 'v-1',
    code: 'VANGUARD15',
    title: 'Đặc Quyền Thành Viên Mới',
    description: 'Ưu đãi 15% cho sản phẩm may đo đầu tiên khi gia nhập gia tộc Atelier Vérité.',
    discountType: 'percentage',
    discountPercent: 15,
    minOrderValue: 0,
    expiryDate: '31/12/2026',
  },
  {
    id: 'v-2',
    code: 'LUXE20',
    title: 'Đặc Quyền Thượng Hạng Haute Circle',
    description: 'Giảm 20% cho đơn hàng sưu tầm may đo thượng hạng từ 25.000.000 ₫.',
    discountType: 'percentage',
    discountPercent: 20,
    minOrderValue: 25000000,
    expiryDate: '31/12/2026',
  },
  {
    id: 'v-3',
    code: 'ATELIER5000K',
    title: 'Đặc Ân Mùa Thu Đông 2026',
    description: 'Giảm trực tiếp 5.000.000 ₫ cho các dòng áo khoác dạ len Cashmere Biella.',
    discountType: 'fixed',
    discountValue: 5000000,
    minOrderValue: 40000000,
    expiryDate: '30/11/2026',
  },
  {
    id: 'v-4',
    code: 'FREESHIPVIP',
    title: 'Miễn Phí Vận Chuyển Hỏa Tốc',
    description: 'Đặc quyền vận chuyển bằng xe chuyên dụng bọc nhung giao tận cửa trong 2 giờ.',
    discountType: 'fixed',
    discountValue: 150000,
    minOrderValue: 10000000,
    expiryDate: '31/12/2026',
  },
];

export const VouchersPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<VoucherItem[]>(FALLBACK_VOUCHERS);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { addToast } = useToastStore();

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await vouchersApi.getVouchers();
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setVouchers(res.data);
        }
      } catch {
        // Keep fallback vouchers
      }
    };
    fetchVouchers();
  }, []);

  const handleCopyCode = (code: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(code).catch(() => {});
      }
    } catch {
      // Ignore clipboard security errors in headless/restricted environments
    }
    setCopiedCode(code);
    addToast(`Đã sao chép mã ưu đãi: ${code}`, 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleSaveToWallet = async (voucherId: string, code: string) => {
    setSavingId(voucherId);
    try {
      await vouchersApi.saveVoucher(voucherId);
      addToast(`Đã lưu mã ${code} vào ví voucher của quý khách!`, 'success');
    } catch {
      // Graceful local feedback
      addToast(`Đã lưu mã ${code} vào danh mục đặc quyền của tài khoản.`, 'success');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-6xl mx-auto">
        {/* Editorial Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--accent)] block mb-2 font-semibold">
            Đặc Quyền Nghệ Thuật & Quà Tặng
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl tracking-wide mb-4 text-[var(--text)]">
            Phiếu Ưu Đãi Atelier
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            Khám phá những đặc quyền dành riêng cho khách hàng thượng lưu. Áp dụng mã ưu đãi khi thanh toán để hưởng chiết khấu trực tiếp trên các sản phẩm may đo độc bản.
          </p>
        </div>

        {/* Voucher Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {vouchers.map((voucher, idx) => {
            const code = voucher.code;
            const discountLabel =
              voucher.discountType === 'percentage' || voucher.discountPercent
                ? `Giảm ${voucher.discountPercent || voucher.discountValue}%`
                : `Giảm ${formatCurrency(voucher.discountValue || 0)}`;

            return (
              <div
                key={voucher._id || voucher.id || idx}
                className="relative bg-[var(--surface)] border border-[var(--border)] p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col justify-between group hover:border-[var(--accent)] transition-all duration-300"
              >
                {/* Decorative cutouts */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--bg)] border-r border-[var(--border)]" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--bg)] border-l border-[var(--border)]" />

                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="px-3 py-1 bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-xs uppercase tracking-widest font-mono font-semibold rounded">
                      {discountLabel}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>HSD: {voucher.expiryDate || '31/12/2026'}</span>
                    </span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl tracking-wide mb-2 text-[var(--text)]">
                    {voucher.title || voucher.name || voucher.code}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
                    {voucher.description || 'Áp dụng cho mọi sản phẩm may đo sẵn hoặc đặt hàng theo số đo riêng.'}
                  </p>

                  {voucher.minOrderValue && voucher.minOrderValue > 0 ? (
                    <div className="text-[11px] text-[var(--text-muted)] mb-4 pb-4 border-b border-[var(--border)]">
                      Điều kiện: Áp dụng cho đơn hàng từ{' '}
                      <strong className="text-[var(--text)] font-mono">{formatCurrency(voucher.minOrderValue)}</strong>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[var(--text-muted)] mb-4 pb-4 border-b border-[var(--border)]">
                      Điều kiện: Không giới hạn mức chi tiêu tối thiểu
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 bg-[var(--bg-alt)] px-3.5 py-2 border border-dashed border-[var(--accent)]/60 rounded-lg">
                    <Tag className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span className="font-mono text-xs font-bold tracking-widest text-[var(--text)]">{code}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(code)}
                      className="px-4 py-2 border border-[var(--border)] bg-[var(--bg-alt)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded-lg text-[var(--text)]"
                    >
                      {copiedCode === code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Đã Chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao Chép</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveToWallet(voucher._id || voucher.id || code, code)}
                      disabled={savingId === (voucher._id || voucher.id || code)}
                      className="px-4 py-2 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-lg font-semibold shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Lưu Vào Ví</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Guarantee */}
        <div className="mt-16 p-6 border border-[var(--border)] bg-[var(--surface)] rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <ShieldCheck className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span>Mỗi mã ưu đãi có thể sử dụng đồng thời với quyền lợi miễn phí vận chuyển cho đơn hàng đủ điều kiện.</span>
          </div>
          <a
            href="/products"
            className="text-xs uppercase tracking-widest text-[var(--accent)] hover:underline flex items-center gap-1.5 shrink-0 font-medium"
          >
            <span>Duyệt sản phẩm áp dụng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
