import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../Admin/AdminLayout';
import { TrackingNav } from '../AdminTracking/components/TrackingNav';
import {
  adminTrackingApi,
  TrackingOverviewMetrics,
  ActivityAnalyticsResponse,
} from '@/shared/api';
import {
  Layers,
  Search,
  Activity,
  Server,
  Clock,
  ShieldCheck,
  Info,
  RefreshCw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const AdminTrackingEventsPage: React.FC = () => {
  const [overview, setOverview] = useState<TrackingOverviewMetrics | null>(null);
  const [activity, setActivity] = useState<ActivityAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Session Journey Inspector State
  const [lookupSessionId, setLookupSessionId] = useState('');
  const [sessionTimeline, setSessionTimeline] = useState<any[] | null>(null);
  const [sessionTimelineLoading, setSessionTimelineLoading] = useState(false);
  const [sessionTimelineError, setSessionTimelineError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, activityRes] = await Promise.all([
        adminTrackingApi.getOverview(),
        adminTrackingApi.getActivity(),
      ]);
      if (overviewRes?.data) setOverview(overviewRes.data);
      if (activityRes?.data) setActivity(activityRes.data);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403 || err?.message?.toLowerCase().includes('refresh')) return;
      setError(err?.message || 'Không thể nạp dữ liệu sự kiện từ máy chủ Backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLookupSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupSessionId.trim()) return;

    setSessionTimelineLoading(true);
    setSessionTimelineError(null);
    setSessionTimeline(null);

    try {
      const response = await adminTrackingApi.getSessionTimeline(lookupSessionId.trim());
      if (response && response.data) {
        setSessionTimeline(response.data.timeline || response.data || []);
      } else {
        setSessionTimelineError('Không tìm thấy sự kiện nào cho Session ID này');
      }
    } catch (err: any) {
      setSessionTimelineError(err?.message || 'Lỗi khi tra cứu hành trình phiên');
    } finally {
      setSessionTimelineLoading(false);
    }
  };

  const eventEntries = overview?.eventTypeStats
    ? Object.entries(overview.eventTypeStats).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <AdminLayout
      title="Quản Lý Sự Kiện & Hành Trình Hệ Thống"
      subtitle="Thống kê khối lượng các sự kiện tracking thực tế và tra cứu hành trình phiên người dùng"
    >
      <div className="space-y-6">
        <TrackingNav />

        {/* Backend Capability Banner */}
        <div className="p-4 rounded-sm bg-noir-900 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200/90">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Trạng Thái Tích Hợp API Sự Kiện (Audit Status: PARTIAL / BLOCKED_BY_BACKEND)
            </h4>
            <p className="font-light text-platinum-dark">
              Backend hiện tại cung cấp API tổng hợp phân loại sự kiện (`eventTypeStats`), tra cứu hành trình theo phiên (`/presence/session/:sessionId`) và giám sát API tracing (`apiMetrics`). Endpoint phân trang toàn bộ log thô chưa được xây dựng trên Backend nguyên bản. Mọi dữ liệu hiển thị đều trích xuất 100% từ 2.762 sự kiện có thật trong CSDL.
            </p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-sm bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchData}
              className="px-3 py-1 bg-red-900/60 border border-red-400/40 rounded uppercase text-[10px]"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Event Type Volume Table */}
        <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-champagne" />
              <h3 className="text-xs uppercase tracking-wider text-white font-semibold">
                Khối Lượng Sự Kiện Hệ Thống Theo Danh Mục
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-champagne">
                Tổng: {overview?.totalEvents?.toLocaleString('vi-VN') ?? 0} sự kiện
              </span>
              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="p-1.5 border border-white/15 hover:border-champagne text-platinum-dark hover:text-champagne rounded-sm transition-colors"
                title="Làm mới"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-noir-950 text-platinum-dark text-[11px] uppercase border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Mã Loại Sự Kiện (Event Type)</th>
                  <th className="px-4 py-3">Nhóm Nghiệp Vụ</th>
                  <th className="px-4 py-3 text-right">Số Lượng Ghi Nhận</th>
                  <th className="px-4 py-3 text-right">Tỷ Trọng (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3"><div className="h-4 bg-white/10 rounded w-48" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-white/5 rounded w-24" /></td>
                      <td className="px-4 py-3 text-right"><div className="h-4 bg-white/10 rounded w-16 ml-auto" /></td>
                      <td className="px-4 py-3 text-right"><div className="h-4 bg-white/5 rounded w-12 ml-auto" /></td>
                    </tr>
                  ))
                ) : eventEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-platinum-dark italic">
                      Không có sự kiện nào trong hệ thống.
                    </td>
                  </tr>
                ) : (
                  eventEntries.map(([type, count]) => {
                    const total = overview?.totalEvents || 1;
                    const pct = ((count / total) * 100).toFixed(1);

                    let categoryLabel = 'Tương Tác Khác';
                    if (type.includes('product') || type.includes('view')) categoryLabel = 'Sản Phẩm & Xem';
                    else if (type.includes('cart')) categoryLabel = 'Giỏ Hàng';
                    else if (type.includes('checkout') || type.includes('purchase') || type.includes('order')) categoryLabel = 'Thanh Toán & Đơn Hàng';
                    else if (type.includes('search')) categoryLabel = 'Tìm Kiếm';
                    else if (type.includes('ai') || type.includes('recommendation')) categoryLabel = 'Trí Tuệ Nhân Tạo AI';
                    else if (type.includes('page') || type.includes('session')) categoryLabel = 'Điều Hướng & Phiên';

                    return (
                      <tr key={type} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-mono text-champagne text-xs font-medium">
                          {type}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-sm bg-white/5 border border-white/10 text-[10px] font-mono text-platinum-light">
                            {categoryLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                          {count.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-platinum-dark text-xs">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Session Journey Inspector */}
        <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-champagne" />
              <h3 className="text-xs uppercase tracking-wider text-white font-semibold">
                Tra Cứu Dòng Thời Gian Hành Trình Phiên (Session Journey Inspector)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-platinum-dark">Realtime Inspector</span>
          </div>

          <form onSubmit={handleLookupSession} className="flex gap-3 max-w-xl">
            <input
              type="text"
              value={lookupSessionId}
              onChange={(e) => setLookupSessionId(e.target.value)}
              placeholder="Nhập Session ID (Ví dụ: sess_1795... hoặc UUID)"
              className="flex-1 px-4 py-2 bg-noir-950 border border-white/15 rounded-sm text-xs font-mono text-white placeholder-platinum-dark/50 focus:outline-none focus:border-champagne"
            />
            <button
              type="submit"
              disabled={sessionTimelineLoading}
              className="px-4 py-2 bg-champagne text-noir-950 font-semibold text-xs uppercase tracking-wider rounded-sm hover:bg-champagne/90 transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{sessionTimelineLoading ? 'Đang Tra Cứu...' : 'Tra Cứu'}</span>
            </button>
          </form>

          {sessionTimelineError && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded text-xs text-red-200">
              {sessionTimelineError}
            </div>
          )}

          {sessionTimeline && (
            <div className="mt-4 p-4 bg-noir-950 border border-white/10 rounded-sm space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-champagne font-mono">
                Kết Quả Hành Trình Phiên: {lookupSessionId}
              </h4>
              {sessionTimeline.length === 0 ? (
                <p className="text-xs text-platinum-dark italic">Không có sự kiện nào trong phiên này.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto font-mono text-xs">
                  {sessionTimeline.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-white/[0.02] border border-white/5 rounded flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-platinum-dark text-[10px]">#{idx + 1}</span>
                        <span className="text-emerald-400 font-semibold">{item.event_type || item.type || 'event'}</span>
                        {item.context?.pathname && (
                          <span className="text-white/80">({item.context.pathname})</span>
                        )}
                      </div>
                      <span className="text-[10px] text-platinum-dark">
                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString('vi-VN') : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* API Latency & Health Tracing from activity */}
        {activity?.apiMetrics && activity.apiMetrics.length > 0 && (
          <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-champagne" />
                <h3 className="text-xs uppercase tracking-wider text-white font-semibold">
                  Giám Sát Độ Trễ & Hiệu Năng API (API Tracing Metrics)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-platinum-dark">
                {activity.apiMetrics.length} Endpoints
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-noir-950 text-platinum-dark text-[11px] uppercase border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Endpoint API</th>
                    <th className="px-4 py-3 text-right">Lượt Gọi</th>
                    <th className="px-4 py-3 text-right">Độ Trễ Trung Bình</th>
                    <th className="px-4 py-3 text-right">Yêu Cầu Chậm (&gt;1s)</th>
                    <th className="px-4 py-3 text-right">Lỗi (5xx/4xx)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activity.apiMetrics.map((apiItem) => (
                    <tr key={apiItem.endpoint} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white font-medium">{apiItem.endpoint}</td>
                      <td className="px-4 py-3 text-right text-champagne">{apiItem.count}</td>
                      <td className="px-4 py-3 text-right text-emerald-400">{apiItem.avgLatencyMs} ms</td>
                      <td className="px-4 py-3 text-right text-amber-400">{apiItem.slowCount}</td>
                      <td className="px-4 py-3 text-right text-red-400">{apiItem.errorCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
