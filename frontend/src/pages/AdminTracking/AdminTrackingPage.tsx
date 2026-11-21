import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../Admin/AdminLayout';
import { TrackingNav } from './components/TrackingNav';
import { AnalyticsExportButton } from '@/shared/components/excel/AnalyticsExportButton';
import {
  adminTrackingApi,
  TrackingOverviewMetrics,
  FunnelAnalyticsResponse,
} from '@/shared/api';
import {
  Activity,
  Users,
  Eye,
  ShoppingBag,
  TrendingUp,
  Sparkles,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export const AdminTrackingPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');
  const [overview, setOverview] = useState<TrackingOverviewMetrics | null>(null);
  const [funnel, setFunnel] = useState<FunnelAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateFilterParams = useCallback(() => {
    const now = new Date();
    if (dateRange === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      return { startDate: start, endDate: now.toISOString() };
    }
    if (dateRange === '7days') {
      const start = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
      return { startDate: start, endDate: now.toISOString() };
    }
    if (dateRange === '30days') {
      const start = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
      return { startDate: start, endDate: now.toISOString() };
    }
    return {};
  }, [dateRange]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = getDateFilterParams();
      const [overviewRes, funnelRes] = await Promise.all([
        adminTrackingApi.getOverview(params),
        adminTrackingApi.getFunnel(params),
      ]);

      if (overviewRes && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (funnelRes && funnelRes.data) {
        setFunnel(funnelRes.data);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403 || err?.message?.toLowerCase().includes('refresh')) return;
      setError(err?.message || 'Không thể nạp dữ liệu thống kê hành vi từ Backend');
    } finally {
      setLoading(false);
    }
  }, [getDateFilterParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format currency VND
  const formatPrice = (amount?: number) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Process event stats for charting
  const eventStatsList = overview?.eventTypeStats
    ? Object.entries(overview.eventTypeStats)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
    : [];

  const maxEventCount = eventStatsList.length > 0 ? Math.max(...eventStatsList.map((e) => e.count)) : 1;

  return (
    <AdminLayout
      title="Bảng Phân Tích Hành Vi & Tracking Người Dùng"
      subtitle="Giám sát lưu lượng, hành vi chuyển đổi và tương tác thời gian thực từ Backend CSDL"
    >
      <div className="space-y-6">
        {/* Sub-Navigation */}
        <TrackingNav />

        {/* Date Filter & Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-card)] p-4 border border-[var(--border)] rounded-sm shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">Khoảng thời gian:</span>
            <div className="flex items-center p-1 bg-[var(--bg-card-muted)] border border-[var(--border)] rounded-sm text-xs">
              <button
                type="button"
                onClick={() => setDateRange('today')}
                className={`px-3 py-1 rounded-sm uppercase tracking-wider text-[11px] font-medium transition-colors ${
                  dateRange === 'today'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Hôm Nay
              </button>
              <button
                type="button"
                onClick={() => setDateRange('7days')}
                className={`px-3 py-1 rounded-sm uppercase tracking-wider text-[11px] font-medium transition-colors ${
                  dateRange === '7days'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                7 Ngày Qua
              </button>
              <button
                type="button"
                onClick={() => setDateRange('30days')}
                className={`px-3 py-1 rounded-sm uppercase tracking-wider text-[11px] font-medium transition-colors ${
                  dateRange === '30days'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                30 Ngày Qua
              </button>
              <button
                type="button"
                onClick={() => setDateRange('all')}
                className={`px-3 py-1 rounded-sm uppercase tracking-wider text-[11px] font-medium transition-colors ${
                  dateRange === 'all'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Toàn Bộ
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 hidden md:flex">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              100% Real API Data
            </span>
            <button
              type="button"
              onClick={() => fetchData()}
              disabled={loading}
              className="p-2 border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--accent)] rounded-sm transition-colors bg-[var(--bg-card-muted)]"
              title="Cập nhật lại số liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <AnalyticsExportButton
              periodLabel={`Thống kê hành vi: ${
                dateRange === 'today'
                  ? 'Hôm nay'
                  : dateRange === '7days'
                  ? '7 ngày qua'
                  : dateRange === '30days'
                  ? '30 ngày qua'
                  : 'Toàn bộ thời gian'
              }`}
            />
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-sm bg-red-500/10 border border-red-500/40 text-xs text-red-600 dark:text-red-200 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => fetchData()}
              className="px-3 py-1 bg-red-500/20 border border-red-500/40 rounded uppercase text-[10px]"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Key KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-sm bg-[var(--bg-card)] border border-[var(--border)] flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
              Tổng Sự Kiện Thu Thập
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <h3 className="font-display text-2xl text-[var(--text-primary)] font-bold">
                {overview?.totalEvents?.toLocaleString('vi-VN') ?? 0}
              </h3>
              <span className="text-xs text-[var(--accent)] font-mono">Events</span>
            </div>
            <div className="mt-2 text-[10px] text-[var(--text-muted)] border-t border-[var(--border)] pt-1.5">
              Dữ liệu thực từ CSDL MongoDB
            </div>
          </div>

          <div className="p-5 rounded-sm bg-[var(--bg-card)] border border-[var(--border)] flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
              Người Dùng Tương Tác
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <h3 className="font-display text-2xl text-emerald-600 dark:text-emerald-400 font-bold">
                {overview?.activeUsersCount?.toLocaleString('vi-VN') ?? 0}
              </h3>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">Users</span>
            </div>
            <div className="mt-2 text-[10px] text-[var(--text-muted)] border-t border-[var(--border)] pt-1.5">
              Tài khoản thành viên hoạt động
            </div>
          </div>

          <div className="p-5 rounded-sm bg-[var(--bg-card)] border border-[var(--border)] flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
              Phiên Truy Cập Hệ Thống
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <h3 className="font-display text-2xl text-[var(--text-primary)] font-bold">
                {overview?.activeSessionsCount?.toLocaleString('vi-VN') ?? 0}
              </h3>
              <span className="text-xs text-[var(--accent)] font-mono">Sessions</span>
            </div>
            <div className="mt-2 text-[10px] text-[var(--text-muted)] border-t border-[var(--border)] pt-1.5">
              Bao gồm khách vãng lai & thành viên
            </div>
          </div>

          <div className="p-5 rounded-sm bg-[var(--bg-card)] border border-[var(--border)] flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
              Tỷ Lệ Nhấp Gợi Ý (CTR)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <h3 className="font-display text-2xl text-[var(--accent)] font-bold">
                {overview?.recommendationMetrics?.ctrPercentage ?? 0}%
              </h3>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {overview?.recommendationMetrics?.clicks ?? 0} Clicks
              </span>
            </div>
            <div className="mt-2 text-[10px] text-[var(--text-muted)] border-t border-[var(--border)] pt-1.5">
              Trên {overview?.recommendationMetrics?.impressions ?? 0} lượt hiển thị
            </div>
          </div>

          <div className="p-5 rounded-sm bg-[var(--bg-card)] border border-[var(--border)] flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
              Stylist AI Tương Tác
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <h3 className="font-display text-2xl text-purple-600 dark:text-purple-400 font-bold">
                {overview?.aiMetrics?.recommendedCount ?? 0}
              </h3>
              <span className="text-xs text-purple-600 dark:text-purple-300 font-mono">
                {overview?.aiMetrics?.cartActionConfirmedCount ?? 0} Giỏ hàng
              </span>
            </div>
            <div className="mt-2 text-[10px] text-[var(--text-muted)] border-t border-[var(--border)] pt-1.5">
              CTR AI: {overview?.aiMetrics?.ctrPercentage ?? 0}%
            </div>
          </div>
        </div>

        {/* Charts & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Event Volume by Type */}
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-sm space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-xs uppercase tracking-wider text-[var(--text-primary)] font-semibold">
                  Phân Bổ Khối Lượng Sự Kiện Hệ Thống
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {eventStatsList.length} Loại sự kiện
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-[var(--text-muted)]">Đang tổng hợp dữ liệu sự kiện...</div>
            ) : eventStatsList.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-muted)]">Không có sự kiện nào trong khoảng thời gian này.</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {eventStatsList.map((item) => {
                  const percentage = Math.round((item.count / (overview?.totalEvents || 1)) * 100);
                  const barWidth = Math.round((item.count / maxEventCount) * 100);
                  return (
                    <div key={item.type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[var(--text-primary)] truncate max-w-xs">{item.type}</span>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-[var(--accent)] font-semibold">{item.count.toLocaleString('vi-VN')}</span>
                          <span className="text-[var(--text-muted)]">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-[var(--track-bar)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(barWidth, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chart 2: Sequential Cohort Conversion Funnel */}
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-sm space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs uppercase tracking-wider text-[var(--text-primary)] font-semibold">
                  Phễu Chuyển Đổi Mua Hàng Tuần Tự (Funnel)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">Cohort Sequential</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-[var(--text-muted)]">Đang nạp dữ liệu phễu chuyển đổi...</div>
            ) : !funnel || !funnel.sessionFunnel || funnel.sessionFunnel.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-muted)]">Chưa có đủ dữ liệu chuỗi hành trình.</div>
            ) : (
              <div className="space-y-4">
                {funnel.sessionFunnel.map((step, idx) => {
                  const firstCount = funnel.sessionFunnel[0]?.count || 1;
                  const relativePercentage = Math.round((step.count / firstCount) * 100);

                  const stageLabels: Record<string, string> = {
                    view_product: '1. Xem sản phẩm',
                    add_to_cart: '2. Thêm vào túi đồ Maison',
                    checkout_started: '3. Khởi tạo thanh toán',
                    reservation_created: '4. Giữ hàng tồn kho an toàn',
                    purchase_completed: '5. Hoàn tất đặt hàng thành công',
                  };

                  return (
                    <div key={step.stage} className="space-y-1.5 p-3 rounded bg-[var(--bg-card-muted)] border border-[var(--border)]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[var(--text-primary)]">{stageLabels[step.stage] || step.stage}</span>
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{step.count.toLocaleString('vi-VN')}</span>
                          <span className="text-[var(--text-muted)] text-[11px]">({relativePercentage}%)</span>
                        </div>
                      </div>

                      <div className="w-full h-2.5 bg-[var(--track-bar)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(relativePercentage, 1)}%` }}
                        />
                      </div>

                      {step.dropOffRate !== undefined && idx > 0 && (
                        <div className="text-[10px] text-[var(--text-muted)] font-mono flex justify-between pt-0.5">
                          <span>Tỷ lệ rời bỏ giai đoạn này:</span>
                          <span className="text-amber-600 dark:text-amber-400">{step.dropOffRate}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tables: Top Viewed Products & Top Searches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Viewed Products */}
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-sm space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-xs uppercase tracking-wider text-[var(--text-primary)] font-semibold">
                  Sản Phẩm Được Quan Tâm Nhất
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">Top 10 theo lượt xem</span>
            </div>

            {overview?.topViewedProducts && overview.topViewedProducts.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {overview.topViewedProducts.map((p, idx) => (
                  <div key={p._id || idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-[var(--text-muted)] text-xs w-4">#{idx + 1}</span>
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-sm border border-[var(--border)] shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[var(--bg-card-muted)] rounded-sm border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-[var(--text-primary)] font-medium truncate">{p.name || 'Sản phẩm Atelier'}</h4>
                        <p className="text-[11px] font-mono text-[var(--accent)]">{formatPrice(p.price)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm text-[var(--text-primary)] font-semibold">
                        {p.views?.toLocaleString('vi-VN')}
                      </span>
                      <span className="block text-[10px] text-[var(--text-muted)] font-mono">lượt xem</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic py-8 text-center">
                Chưa ghi nhận sự kiện xem sản phẩm nào.
              </p>
            )}
          </div>

          {/* Top Searches */}
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-sm space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-xs uppercase tracking-wider text-[var(--text-primary)] font-semibold">
                  Xu Hướng Tìm Kiếm Phổ Biến
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">Từ khóa thực tế</span>
            </div>

            {overview?.topSearches && overview.topSearches.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {overview.topSearches.map((s, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[var(--text-muted)] text-xs w-4">#{idx + 1}</span>
                      <span className="font-medium text-[var(--text-primary)]">"{s.query}"</span>
                    </div>
                    <span className="font-mono text-[var(--accent)] font-semibold">
                      {s.count?.toLocaleString('vi-VN')} lượt
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic py-8 text-center">
                Chưa ghi nhận lượt tìm kiếm nào trong khoảng thời gian này.
              </p>
            )}
          </div>
        </div>

        {/* Privacy & Legal Compliance Banner */}
        <div className="p-4 rounded-sm bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)] shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <span>
              Mọi dữ liệu phân tích đều được tổng hợp và xử lý tuân thủ Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15.
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] hidden md:inline-block">
            Maison Atelier Privacy Standard
          </span>
        </div>
      </div>
    </AdminLayout>
  );
};
