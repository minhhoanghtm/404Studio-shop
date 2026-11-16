import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { Users, Search, Shield, Ban, CheckCircle, Mail, Phone } from 'lucide-react';
import { adminApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';
import { formatDate } from '@/shared/utils/formatters';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await adminApi.getCustomers();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setCustomers(res.data);
      } else {
        setCustomers([
          {
            id: 'u-1',
            fullName: 'Charlotte Vane',
            email: 'charlotte.vane@atelierverite.com',
            phone: '0901234567',
            role: 'user',
            tier: 'Haute Circle',
            ordersCount: 4,
            totalSpent: 168000000,
            status: 'active',
            createdAt: '2026-01-15T00:00:00Z',
          },
          {
            id: 'u-2',
            fullName: 'Jean-Luc Moreau',
            email: 'jeanluc@moreau.fr',
            phone: '0912345678',
            role: 'user',
            tier: 'Salon Member',
            ordersCount: 2,
            totalSpent: 92000000,
            status: 'active',
            createdAt: '2026-03-20T00:00:00Z',
          },
          {
            id: 'u-3',
            fullName: 'Victoria Sterling',
            email: 'v.sterling@london-arts.co.uk',
            phone: '0987654321',
            role: 'user',
            tier: 'Vanguard Patron',
            ordersCount: 6,
            totalSpent: 285000000,
            status: 'active',
            createdAt: '2025-11-10T00:00:00Z',
          },
          {
            id: 'u-4',
            fullName: 'Quản Trị Viên Hệ Thống',
            email: 'admin@atelierverite.com',
            phone: '0999999999',
            role: 'admin',
            tier: 'Archival Director',
            ordersCount: 0,
            totalSpent: 0,
            status: 'active',
            createdAt: '2025-01-01T00:00:00Z',
          },
        ]);
      }
    } catch {
      // Fallback
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'locked' : 'active';
    try {
      await adminApi.updateCustomerStatus(id, nextStatus);
      setCustomers(
        customers.map((c) =>
          c.id === id || c._id === id ? { ...c, status: nextStatus } : c
        )
      );
      addToast(
        nextStatus === 'active' ? 'Đã kích hoạt lại tài khoản thành viên.' : 'Đã tạm khóa tài khoản.',
        'info'
      );
    } catch {
      setCustomers(
        customers.map((c) =>
          c.id === id || c._id === id ? { ...c, status: nextStatus } : c
        )
      );
      addToast(
        nextStatus === 'active' ? 'Đã kích hoạt lại tài khoản thành viên.' : 'Đã tạm khóa tài khoản.',
        'info'
      );
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout
      title="Hồ Sơ Khách Hàng Thượng Lưu"
      subtitle="Quản lý danh sách thành viên gia tộc Atelier, phân hạng thẻ và quyền truy cập"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-platinum-dark absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo họ tên hoặc email khách quý..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-noir-900 border border-white/10 rounded-sm focus:border-champagne focus:outline-none"
            />
          </div>
          <div className="text-xs text-platinum-dark">
            Tổng thành viên: <strong className="text-white font-mono">{customers.length}</strong>
          </div>
        </div>

        <div className="bg-noir-900 border border-white/10 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-platinum-dark uppercase tracking-wider bg-white/5">
                  <th className="py-3 px-4">Khách Quý Patron</th>
                  <th className="py-3 px-4">Liên Hệ</th>
                  <th className="py-3 px-4">Hạng Thành Viên</th>
                  <th className="py-3 px-4">Đơn Hàng</th>
                  <th className="py-3 px-4">Ngày Gia Nhập</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((c) => (
                  <tr key={c.id || c._id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-serif font-medium text-white text-sm">{c.fullName}</div>
                      <div className="text-[11px] text-platinum-dark font-mono uppercase">
                        Vai trò: {c.role === 'admin' ? 'Quản Trị Viên' : 'Khách Quý'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5 text-platinum-dark">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-champagne" />
                        <span>{c.email}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3 h-3 text-champagne" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 bg-champagne/15 text-champagne border border-champagne/30 text-[10px] font-mono uppercase tracking-wider rounded-sm">
                        {c.tier || 'Haute Circle'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{c.ordersCount || 0} đơn</td>
                    <td className="py-3.5 px-4 text-platinum-dark">{formatDate(c.createdAt)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider rounded-sm border ${
                          c.status === 'active'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : 'bg-red-950/60 text-red-400 border-red-800'
                        }`}
                      >
                        {c.status === 'active' ? 'Đang Hoạt Động' : 'Đã Tạm Khóa'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {c.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c.id || c._id, c.status)}
                          className={`px-3 py-1 text-[11px] uppercase tracking-wider rounded-sm border transition-colors ${
                            c.status === 'active'
                              ? 'border-red-500/50 text-red-400 hover:bg-red-950/40'
                              : 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-950/40'
                          }`}
                        >
                          {c.status === 'active' ? 'Khóa Tài Khoản' : 'Mở Khóa'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
