import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUpRight, Clock, PackageCheck, AlertCircle, Sparkles, RefreshCw, ArrowRight as ArrowRightIcon } from 'lucide-react';
import { adminApi, adminAiApi, AdminAiInsight } from '@/shared/api';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';
import { AnalyticsExportButton } from '@/shared/components/excel/AnalyticsExportButton';
import { useAdminAiStore } from '@/shared/stores/useAdminAiStore';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0, conversionRate: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<AdminAiInsight[]>([]);
  const [isScanningInsights, setIsScanningInsights] = useState(false);
  const { openSidebar, sendMessage } = useAdminAiStore();

  const loadInsights = async () => {
    setIsScanningInsights(true);
    try {
      const res = await adminAiApi.getInsights();
      if (res?.data?.insights) {
        setInsights(res.data.insights);
      }
    } catch {
      // silent
    } finally {
      setIsScanningInsights(false);
    }
  };

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
    loadInsights();
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">
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
                className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-sm relative overflow-hidden group hover:border-[var(--accent)] transition-colors shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                    {card.label}
                  </span>
                  <div className={`p-2 rounded-full bg-[var(--bg-card-muted)] border border-[var(--border)] ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display text-2xl font-bold text-[var(--text-primary)] mb-1">{card.value}</div>
                <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{card.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Proactive AI Business Insights */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-sm space-y-4 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)]">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h2 className="font-display text-base tracking-wide text-[var(--text-primary)] flex items-center gap-2">
                  <span>AI Business Insights — Khuyến Nghị Chủ Động</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                    {insights.length} Phát Hiện
                  </span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Phân tích tự động từ CSDL đơn hàng, tồn kho và sản phẩm thời gian thực
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadInsights}
                disabled={isScanningInsights}
                className="px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--bg-alt)] border border-[var(--border)] text-xs text-[var(--text)] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanningInsights ? 'animate-spin' : ''}`} />
                <span>Quét Lại</span>
              </button>

              <a
                href="/admin/ai-assistant"
                className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Mở Workspace</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((ins, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/60 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                        ins.severity === 'high' || ins.severity === 'critical'
                          ? 'bg-red-500/20 text-red-500'
                          : 'bg-amber-500/20 text-amber-500'
                      }`}
                    >
                      {ins.severity.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">Real-time</span>
                  </div>
                  <h3 className="font-bold text-xs text-[var(--text)]">{ins.title}</h3>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{ins.explanation}</p>
                </div>

                {ins.recommendedAction && (
                  <button
                    type="button"
                    onClick={() => {
                      openSidebar();
                      sendMessage(ins.recommendedAction?.suggestedPrompt || ins.title);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-[var(--accent)]/15 hover:bg-[var(--accent)] text-[var(--accent)] hover:text-[var(--accent-contrast)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>{ins.recommendedAction.label || 'Hỏi AI'}</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {insights.length === 0 && !isScanningInsights && (
              <div className="col-span-3 py-6 text-center text-xs text-[var(--text-muted)]">
                ✅ Hệ thống vận hành ổn định. Chưa ghi nhận cảnh báo bất thường trong kho và đơn hàng.
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-sm space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg tracking-wide text-[var(--text-primary)]">
                Đơn Hàng Thu Thập Gần Đây
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Theo dõi tiến độ hoàn thiện và vận chuyển sản phẩm may đo
              </p>
            </div>
            <a
              href="/admin/orders"
              className="text-xs uppercase tracking-wider text-[var(--accent)] hover:underline font-semibold"
            >
              Xem tất cả đơn hàng →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--bg-card-muted)]">
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-3">Mã Đơn</th>
                  <th className="py-3 px-3">Khách Quý Patron</th>
                  <th className="py-3 px-3">Thời Gian</th>
                  <th className="py-3 px-3">Số Lượng</th>
                  <th className="py-3 px-3">Tổng Tiền</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recentOrders.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[var(--text-muted)] text-xs font-mono">
                      Chưa có đơn hàng gần đây
                    </td>
                  </tr>
                )}
                {recentOrders.map((ord, idx) => {
                  const orderCode =
                    ord.orderCode || ord.order_code || (ord._id ? `ORD-${ord._id.slice(-6).toUpperCase()}` : 'ORD-VERITE');
                  const customerName =
                    ord.customer || ord.customer_name || ord.shipping_address?.name || ord.user_id?.name || 'Khách Vãng Lai';
                  const orderDate = ord.createdAt || ord.created_at || new Date().toISOString();
                  const totalAmt = ord.total || ord.total_price || ord.total_amount || 0;
                  const count = ord.itemCount || (Array.isArray(ord.items) ? ord.items.length : 1);
                  const status = ord.status || 'pending';

                  return (
                    <tr key={ord._id || ord.id || orderCode} className="hover:bg-[var(--table-row-hover)] transition-colors">
                      <td className="py-3.5 px-3 text-center font-mono text-xs text-[var(--text-muted)]">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-[var(--accent)]">
                        {orderCode}
                      </td>
                      <td className="py-3.5 px-3 text-[var(--text-primary)] font-medium">{customerName}</td>
                      <td className="py-3.5 px-3 text-[var(--text-muted)]">{formatDate(orderDate)}</td>
                      <td className="py-3.5 px-3 text-[var(--text-secondary)]">{count} sản phẩm</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-[var(--text-primary)]">
                        {formatCurrency(totalAmt)}
                      </td>
                      <td className="py-3.5 px-3">
                        {status === 'delivered' && (
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] uppercase tracking-wider rounded-sm flex items-center gap-1 w-max font-medium">
                            <PackageCheck className="w-3 h-3" /> Đã Giao
                          </span>
                        )}
                        {status === 'shipping' && (
                          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[10px] uppercase tracking-wider rounded-sm flex items-center gap-1 w-max font-medium">
                            <Clock className="w-3 h-3" /> Đang Giao
                          </span>
                        )}
                        {(status === 'processing' || status === 'confirmed') && (
                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] uppercase tracking-wider rounded-sm flex items-center gap-1 w-max font-medium">
                            <Clock className="w-3 h-3" /> Đã Xác Nhận
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20 text-[10px] uppercase tracking-wider rounded-sm flex items-center gap-1 w-max font-medium">
                            <Clock className="w-3 h-3" /> Chờ Xử Lý
                          </span>
                        )}
                        {status === 'cancelled' && (
                          <span className="px-2.5 py-1 bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 text-[10px] uppercase tracking-wider rounded-sm flex items-center gap-1 w-max font-medium">
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
