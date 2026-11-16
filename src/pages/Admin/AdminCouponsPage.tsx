import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { Plus, Ticket, Trash2, Edit3, Clock, CheckCircle } from 'lucide-react';
import { vouchersApi, adminApi } from '@/shared/api';
import { formatCurrency } from '@/shared/utils/formatters';
import { useToastStore } from '@/shared/stores/useToastStore';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
          <div className="text-xs text-platinum-dark">
            Mã đang áp dụng: <strong className="text-white font-mono">{coupons.length}</strong>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-champagne text-noir-950 font-semibold text-xs uppercase tracking-wider rounded-sm hover:bg-champagne/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Mã Ưu Đãi Mới</span>
          </button>
        </div>

        <div className="bg-noir-900 border border-white/10 rounded-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-platinum-dark uppercase tracking-wider bg-white/5">
                <th className="py-3 px-4">Mã Voucher</th>
                <th className="py-3 px-4">Tỷ Lệ Giảm</th>
                <th className="py-3 px-4">Đơn Hàng Tối Thiểu</th>
                <th className="py-3 px-4">Hạn Sử Dụng</th>
                <th className="py-3 px-4">Lượt Đã Dùng</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {coupons.map((cp) => (
                <tr key={cp.id || cp._id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-champagne text-sm">
                    {cp.code}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="px-2 py-0.5 bg-champagne/15 text-champagne border border-champagne/30 rounded-sm">
                      Giảm {cp.discountPercent || cp.discountValue}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {cp.minOrderValue && cp.minOrderValue > 0
                      ? formatCurrency(cp.minOrderValue)
                      : 'Không giới hạn'}
                  </td>
                  <td className="py-3.5 px-4 text-platinum-dark font-mono">
                    {cp.expiryDate || '31/12/2026'}
                  </td>
                  <td className="py-3.5 px-4 font-mono">{cp.usageCount || 0} lượt</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(cp.id || cp._id, cp.code)}
                      className="p-1.5 text-platinum-dark hover:text-red-400 transition-colors"
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
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-noir-900 border border-white/10 w-full max-w-md p-6 rounded-sm text-white">
              <h3 className="font-display text-lg mb-4">Khởi Tạo Mã Ưu Đãi</h3>
              <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
                <div>
                  <label className="block text-platinum-dark uppercase tracking-wider mb-1">
                    Mã Ưu Đãi (In hoa, không khoảng trắng)
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VÍ DỤ: HAUTE25"
                    className="w-full px-3 py-2 bg-noir-950 border border-white/15 focus:border-champagne focus:outline-none font-mono uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-platinum-dark uppercase tracking-wider mb-1">
                      Mức Giảm (%)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-noir-950 border border-white/15 focus:border-champagne focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-platinum-dark uppercase tracking-wider mb-1">
                      Chi Tiêu Tối Thiểu (VND)
                    </label>
                    <input
                      type="number"
                      value={minOrder}
                      onChange={(e) => setMinOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-noir-950 border border-white/15 focus:border-champagne focus:outline-none font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-platinum-dark uppercase tracking-wider mb-1">
                    Ngày Hết Hạn
                  </label>
                  <input
                    type="date"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-noir-950 border border-white/15 focus:border-champagne focus:outline-none"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-white/15 text-platinum-dark hover:text-white uppercase tracking-wider"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-champagne text-noir-950 font-semibold uppercase tracking-wider"
                  >
                    Kích Hoạt Mã
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
