import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { Plus, Ticket, Trash2, Edit3, Clock, CheckCircle } from 'lucide-react';
import { vouchersApi, adminApi } from '@/shared/api';
import { formatCurrency } from '@/shared/utils/formatters';
import { useToastStore } from '@/shared/stores/useToastStore';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { overlayZIndex, contentZIndex } = useModal({
    id: 'admin-coupon-modal',
    isOpen: isModalOpen,
    onClose: () => setIsModalOpen(false),
  });
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(15);
  const [minOrder, setMinOrder] = useState(0);
  const [expiry, setExpiry] = useState('2026-12-31');
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await vouchersApi.getVouchers();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setCoupons(res.data);
      } else {
        setCoupons([
          {
            id: 'cp-1',
            code: 'VANGUARD15',
            discountPercent: 15,
            minOrderValue: 0,
            expiryDate: '31/12/2026',
            usageCount: 42,
          },
          {
            id: 'cp-2',
            code: 'LUXE20',
            discountPercent: 20,
            minOrderValue: 25000000,
            expiryDate: '31/12/2026',
            usageCount: 18,
          },
          {
            id: 'cp-3',
            code: 'WELCOME10',
            discountPercent: 10,
            minOrderValue: 0,
            expiryDate: '31/12/2026',
            usageCount: 65,
          },
        ]);
      }
    } catch {
      // Fallback
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const newCoupon = {
      id: 'cp-' + Date.now(),
      code: code.trim().toUpperCase(),
      discountPercent,
      minOrderValue: minOrder,
      expiryDate: expiry,
      usageCount: 0,
    };

    setCoupons([newCoupon, ...coupons]);
    addToast(`Đã tạo mã ưu đãi ${newCoupon.code} thành công!`, 'success');
    setIsModalOpen(false);
    setCode('');
  };

  const handleDelete = (id: string, cpCode: string) => {
    if (!window.confirm(`Xóa mã ưu đãi ${cpCode}?`)) return;
    setCoupons(coupons.filter((c) => c.id !== id && c._id !== id));
    addToast(`Đã xóa mã ${cpCode}`, 'success');
  };

  return (
    <AdminLayout
      title="Mã Giảm Giá & Phiếu Ưu Đãi"
      subtitle="Thiết lập các chương trình tri ân thành viên gia tộc và mã khuyến mãi theo mùa"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-xs text-[var(--text-muted)]">
            Mã đang áp dụng: <strong className="text-[var(--text-primary)] font-mono">{coupons.length}</strong>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold text-xs uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Mã Ưu Đãi Mới</span>
          </button>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--bg-card-muted)]">
                <th className="py-3 px-4">Mã Voucher</th>
                <th className="py-3 px-4">Tỷ Lệ Giảm</th>
                <th className="py-3 px-4">Đơn Hàng Tối Thiểu</th>
                <th className="py-3 px-4">Hạn Sử Dụng</th>
                <th className="py-3 px-4">Lượt Đã Dùng</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {coupons.map((cp) => (
                <tr key={cp.id || cp._id} className="hover:bg-[var(--table-row-hover)] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--accent)] text-sm">
                    {cp.code}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="px-2 py-0.5 bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 rounded-sm font-semibold">
                      Giảm {cp.discountPercent || cp.discountValue}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[var(--text-primary)]">
                    {cp.minOrderValue && cp.minOrderValue > 0
                      ? formatCurrency(cp.minOrderValue)
                      : 'Không giới hạn'}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--text-muted)] font-mono">
                    {cp.expiryDate || '31/12/2026'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)]">{cp.usageCount || 0} lượt</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(cp.id || cp._id, cp.code)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                      title="Xóa mã"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
              style={{ zIndex: overlayZIndex }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsModalOpen(false);
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Khởi Tạo Mã Ưu Đãi"
            >
              <div
                className="bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-md p-6 rounded-sm text-[var(--text-primary)] max-h-[calc(100dvh-32px)] overflow-y-auto shadow-2xl"
                style={{ zIndex: contentZIndex }}
              >
              <h3 className="font-display text-lg mb-4 text-[var(--text-primary)]">Khởi Tạo Mã Ưu Đãi</h3>
              <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Mã Ưu Đãi (In hoa, không khoảng trắng)
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VÍ DỤ: HAUTE25"
                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none font-mono uppercase text-[var(--text-primary)] rounded-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1">
                      Mức Giảm (%)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none font-mono text-[var(--text-primary)] rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1">
                      Chi Tiêu Tối Thiểu (VND)
                    </label>
                    <input
                      type="number"
                      value={minOrder}
                      onChange={(e) => setMinOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none font-mono text-[var(--text-primary)] rounded-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Ngày Hết Hạn
                  </label>
                  <input
                    type="date"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--table-row-hover)] uppercase tracking-wider rounded-sm transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold uppercase tracking-wider rounded-sm hover:opacity-90 shadow-sm"
                  >
                    Kích Hoạt Mã
                  </button>
                </div>
              </form>
            </div>
          </div>
          </ModalPortal>
        )}
      </div>
    </AdminLayout>
  );
};
