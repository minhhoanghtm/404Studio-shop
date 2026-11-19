import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUpRight, Clock, PackageCheck, AlertCircle } from 'lucide-react';
import { adminApi } from '@/shared/api';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';
import { AnalyticsExportButton } from '@/shared/components/excel/AnalyticsExportButton';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0, conversionRate: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await adminApi.getStats();
        if (res?.data) {
          setStats((prev) => ({ ...prev, ...res.data }));
        }
      } catch {
        // Handled silently
      }

      try {
        const ordersRes = await adminApi.getAllOrders({ limit: 5 });
        const rawItems = Array.isArray(ordersRes?.data)
          ? ordersRes.data
          : (ordersRes?.data as any)?.items;
        if (Array.isArray(rawItems)) {
          setRecentOrders(rawItems);
        } else {
          setRecentOrders([]);
        }
      } catch {
        setRecentOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const metricCards = [
    {
      label: 'Tổng Doanh Thu Quý',
      value: formatCurrency(stats.totalRevenue),
      change: '+18.4% so với tháng trước',
      icon: DollarSign,
      color: 'text-champagne',
    },
    {
      label: 'Đơn Hàng Đã Khởi Tạo',
      value: `${stats.totalOrders} Đơn`,
      change: '+6 đơn hàng mới tuần này',
      icon: ShoppingBag,
      color: 'text-emerald-400',
    },
    {
      label: 'Thành Viên Haute Circle',
      value: `${stats.totalCustomers} Khách Quý`,
      change: '+12 đăng ký mới',
      icon: Users,
      color: 'text-blue-400',
    },
    {
      label: 'Tỷ Lệ Hoàn Tất Đơn',
      value: `${stats.conversionRate || 0}%`,
      change: 'Hiệu quả tư vấn may đo',
      icon: TrendingUp,
      color: 'text-amber-400',
    },
  ];

  return (
    <AdminLayout
      title="Tổng Quan Vận Hành"
      subtitle="Báo cáo số liệu doanh thu, đơn hàng và khách hàng thời gian thực"
    >
      <div className="space-y-8">
        {/* Action Header with Excel Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-platinum-dark">
              Dữ liệu tài chính, phân loại đơn và tồn kho được đồng bộ trực tiếp từ máy chủ CSDL.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <AnalyticsExportButton periodLabel="Báo cáo tổng hợp quý" />
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="p-5 bg-noir-900 border border-white/10 rounded-sm relative overflow-hidden group hover:border-champagne/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-platinum-dark">
                    {card.label}
                  </span>
                  <div className={`p-2 rounded-full bg-white/5 ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-2xl font-bold text-white mb-1">{card.value}</div>
                <div className="text-[11px] text-platinum-dark flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  <span>{card.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Orders Table */}
        <div className="bg-noir-900 border border-white/10 p-6 rounded-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg tracking-wide text-white">
                Đơn Hàng Thu Thập Gần Đây
              </h2>
              <p className="text-xs text-platinum-dark">
                Theo dõi tiến độ hoàn thiện và vận chuyển sản phẩm may đo
              </p>
            </div>
            <a
              href="/admin/orders"
              className="text-xs uppercase tracking-wider text-champagne hover:underline"
            >
              Xem tất cả đơn hàng →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-platinum-dark uppercase tracking-wider">
                  <th className="py-3 px-3">Mã Đơn</th>
                  <th className="py-3 px-3">Khách Quý Patron</th>
                  <th className="py-3 px-3">Thời Gian</th>
                  <th className="py-3 px-3">Số Lượng</th>
                  <th className="py-3 px-3">Tổng Tiền</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentOrders.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-platinum-dark text-xs font-mono">
                      Chưa có đơn hàng gần đây
                    </td>
                  </tr>
                )}
                {recentOrders.map((ord) => {
                  const orderCode =
                    ord.orderCode || ord.order_code || (ord._id ? `ORD-${ord._id.slice(-6).toUpperCase()}` : 'ORD-VERITE');
                  const customerName =
                    ord.customer || ord.customer_name || ord.shipping_address?.name || ord.user_id?.name || 'Khách Vãng Lai';
                  const orderDate = ord.createdAt || ord.created_at || new Date().toISOString();
                  const totalAmt = ord.total || ord.total_price || ord.total_amount || 0;
                  const count = ord.itemCount || (Array.isArray(ord.items) ? ord.items.length : 1);
                  const status = ord.status || 'pending';

                  return (
                    <tr key={ord._id || ord.id || orderCode} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-champagne">
                        {orderCode}
                      </td>
                      <td className="py-3.5 px-3 text-white font-medium">{customerName}</td>
                      <td className="py-3.5 px-3 text-platinum-dark">{formatDate(orderDate)}</td>
                      <td className="py-3.5 px-3">{count} sản phẩm</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-white">
                        {formatCurrency(totalAmt)}
                      </td>
                      <td className="py-3.5 px-3">
                        {status === 'delivered' && (
                          <span className="px-2.5 py-1 bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-[10px] uppercase tracking-wider rounded-sm flex items-center gap-1 w-max">
                            <PackageCheck className="w-3 h-3" /> Đã Giao
                          </span>
                        )}
                        {status === 'shipping' && (
                          <span className="px-2.5 py-1 bg-blue-950/60 text-blue-400 border border-blue-800 text-[10px] uppercase tracking-wider rounded-sm flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3" /> Đang Giao
                          </span>
                        )}
                        {(status === 'processing' || status === 'confirmed') && (
                          <span className="px-2.5 py-1 bg-amber-950/60 text-amber-400 border border-amber-800 text-[10px] uppercase tracking-wider rounded-sm flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3" /> Đã Xác Nhận
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="px-2.5 py-1 bg-yellow-950/60 text-yellow-400 border border-yellow-800 text-[10px] uppercase tracking-wider rounded-sm flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3" /> Chờ Xử Lý
                          </span>
                        )}
                        {status === 'cancelled' && (
                          <span className="px-2.5 py-1 bg-red-950/60 text-red-400 border border-red-800 text-[10px] uppercase tracking-wider rounded-sm flex items-center gap-1 w-max">
                            <AlertCircle className="w-3 h-3" /> Đã Hủy
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
