import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../Admin/AdminLayout';
import { TrackingNav } from '../AdminTracking/components/TrackingNav';
import {
  adminTrackingApi,
  LivePresenceResponse,
  ActivityAnalyticsResponse,
} from '@/shared/api';
import {
  Users,
  Radio,
  Clock,
  Compass,
  Laptop,
  Smartphone,
  Globe,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';

export const AdminTrackingUsersPage: React.FC = () => {
  const [livePresence, setLivePresence] = useState<LivePresenceResponse | null>(null);
  const [activity, setActivity] = useState<ActivityAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [liveRes, activityRes] = await Promise.all([
        adminTrackingApi.getLiveSessions({ limit: 50 }),
        adminTrackingApi.getActivity(),
      ]);

      if (liveRes && liveRes.data) {
        setLivePresence(liveRes.data);
      }
      if (activityRes && activityRes.data) {
        setActivity(activityRes.data);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403 || err?.message?.toLowerCase().includes('refresh')) return;
      setError(err?.message || 'Không thể nạp dữ liệu phiên người dùng từ Backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh presence every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const counts = livePresence?.counts || {
    total: 0,
    active: 0,
    idle: 0,
    away: 0,
    background: 0,
    disconnected: 0,
    guestCount: 0,
    authenticatedCount: 0,
  };

  return (
    <AdminLayout
      title="Hành Vi Người Dùng & Quan Sát Trực Tuyến"
      subtitle="Giám sát phiên làm việc thời gian thực và thời gian tương tác trên từng trang"
    >
      <div className="space-y-6">
        <TrackingNav />

        {/* Header Controls */}
        <div className="flex items-center justify-between bg-noir-900/60 p-4 border border-white/10 rounded-sm">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs uppercase tracking-wider text-white font-medium">
              Quan sát trực tuyến thời gian thực (Redis Presence)
            </span>
            <span className="text-[11px] font-mono text-platinum-dark hidden sm:inline">
              (Tự động làm mới mỗi 15 giây)
            </span>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-2 border border-white/15 hover:border-champagne text-platinum-dark hover:text-champagne rounded-sm transition-colors"
            title="Làm mới ngay"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
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

        {/* Live Presence Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-sm bg-noir-900 border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-platinum-dark font-mono block">
              Tổng Phiên Đang Mở
            </span>
            <h4 className="font-display text-2xl text-white font-bold mt-1">{counts.total}</h4>
            <div className="text-[10px] text-platinum-dark mt-1 font-mono">
              {counts.authenticatedCount ?? 0} TV • {counts.guestCount ?? 0} Khách
            </div>
          </div>

          <div className="p-4 rounded-sm bg-noir-900 border border-emerald-500/20">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono block flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Đang Tương Tác
            </span>
            <h4 className="font-display text-2xl text-emerald-400 font-bold mt-1">{counts.active}</h4>
            <div className="text-[10px] text-platinum-dark mt-1">Active tabs</div>
          </div>

          <div className="p-4 rounded-sm bg-noir-900 border border-amber-500/20">
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-mono block">
              Đang Chờ (Idle)
            </span>
            <h4 className="font-display text-2xl text-amber-400 font-bold mt-1">{counts.idle}</h4>
            <div className="text-[10px] text-platinum-dark mt-1">Không cử động chuột</div>
          </div>

          <div className="p-4 rounded-sm bg-noir-900 border border-orange-500/20">
            <span className="text-[10px] uppercase tracking-wider text-orange-400 font-mono block">
              Rời Màn Hình (Away)
            </span>
            <h4 className="font-display text-2xl text-orange-400 font-bold mt-1">{counts.away}</h4>
            <div className="text-[10px] text-platinum-dark mt-1">Không tương tác &gt; 2p</div>
          </div>

          <div className="p-4 rounded-sm bg-noir-900 border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-purple-400 font-mono block">
              Chạy Ngầm
            </span>
            <h4 className="font-display text-2xl text-purple-400 font-bold mt-1">{counts.background}</h4>
            <div className="text-[10px] text-platinum-dark mt-1">Tab bị ẩn</div>
          </div>

          <div className="p-4 rounded-sm bg-noir-900 border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-platinum-dark font-mono block">
              Kết Nối Redis
            </span>
            <h4 className="font-display text-base text-emerald-400 font-bold mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Đang Hoạt Động
            </h4>
            <div className="text-[10px] text-platinum-dark mt-1">redis_local:6379</div>
          </div>
        </div>

        {/* Live Active Sessions Table */}
        <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-champagne" />
              <h3 className="text-xs uppercase tracking-wider text-white font-semibold">
                Danh Sách Phiên Đang Mở (Live Active Sessions)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-platinum-dark">
              {livePresence?.sessions?.length || 0} Phiên ghi nhận
            </span>
          </div>

          {livePresence?.sessions && livePresence.sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-noir-950 text-platinum-dark text-[11px] uppercase font-mono border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Mã Phiên (Session ID)</th>
                    <th className="px-4 py-3">Chủ Thể</th>
                    <th className="px-4 py-3">Trạng Thái</th>
                    <th className="px-4 py-3">Đường Dẫn Đang Xem</th>
                    <th className="px-4 py-3">Thiết Bị</th>
                    <th className="px-4 py-3 text-right">Cập Nhật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {livePresence.sessions.map((sess) => (
                    <tr key={sess.sessionId} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-champagne text-[11px]">
                        {sess.sessionId}
                      </td>
                      <td className="px-4 py-3">
                        {sess.isAnonymous ? (
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-platinum-dark text-[10px] font-mono">
                            Khách Ẩn Danh
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                            Thành Viên ({sess.userId?.substring(0, 8)}...)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                            sess.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : sess.status === 'idle'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-white/5 text-platinum-dark border border-white/10'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              sess.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                          {sess.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-white/90 text-xs">
                        {sess.currentRoute || '/'}
                      </td>
                      <td className="px-4 py-3 text-platinum-dark capitalize">
                        {sess.deviceType || 'Desktop'}
                      </td>
                      <td className="px-4 py-3 text-right text-platinum-dark font-mono text-[11px]">
                        {sess.lastSeen ? new Date(sess.lastSeen).toLocaleTimeString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-platinum-dark italic py-8 text-center">
              Hiện tại không có phiên nào trực tuyến trên Redis.
            </p>
          )}
        </div>

        {/* Page Dwell Time & Activity Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Page Engagement Table (2 cols) */}
          <div className="lg:col-span-2 p-6 bg-noir-900 border border-white/10 rounded-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-champagne" />
                <h3 className="text-xs uppercase tracking-wider text-white font-semibold">
                  Thời Gian Tương Tác Trên Từng Trang (Page Dwell Time)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-platinum-dark">7 Ngày Qua</span>
            </div>

            {activity?.pageAnalytics && activity.pageAnalytics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-noir-950 text-platinum-dark text-[11px] uppercase font-mono border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3">Đường Dẫn (Pathname)</th>
                      <th className="px-4 py-3">Lượt Xem</th>
                      <th className="px-4 py-3">Thời Gian Lưu Trung Bình</th>
                      <th className="px-4 py-3">Tương Tác Thực</th>
                      <th className="px-4 py-3 text-right">Chờ (Idle)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {activity.pageAnalytics.map((p) => (
                      <tr key={p.pathname} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-white font-sans">{p.pathname}</td>
                        <td className="px-4 py-3 text-champagne font-semibold">
                          {p.views?.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 text-white/90">{p.avgDwellSec}s</td>
                        <td className="px-4 py-3 text-emerald-400">{p.avgActiveSec}s</td>
                        <td className="px-4 py-3 text-right text-platinum-dark">{p.avgIdleSec}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-platinum-dark italic py-8 text-center">
                Chưa có dữ liệu thống kê thời gian lưu trang.
              </p>
            )}
          </div>

          {/* Traffic Sources Breakdown (1 col) */}
          <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-champagne" />
                <h3 className="text-xs uppercase tracking-wider text-white font-semibold">
                  Nguồn Lưu Lượng
                </h3>
              </div>
              <span className="text-[11px] font-mono text-platinum-dark">Acquisition</span>
            </div>

            {activity?.trafficSources && activity.trafficSources.length > 0 ? (
              <div className="space-y-3">
                {activity.trafficSources.map((s) => (
                  <div key={s.source} className="p-3 bg-noir-950 border border-white/10 rounded-sm flex items-center justify-between text-xs">
                    <span className="text-white font-medium truncate max-w-xs">{s.source}</span>
                    <span className="font-mono text-champagne font-semibold">{s.count?.toLocaleString('vi-VN')} lượt</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-platinum-dark italic py-8 text-center">
                Chưa ghi nhận nguồn lưu lượng.
              </p>
            )}
          </div>
        </div>

        {/* Privacy Compliance & Data Minimization Notice */}
        <div className="p-4 rounded-sm bg-noir-900 border border-white/10 flex items-start gap-3 text-xs text-platinum-dark">
          <ShieldCheck className="w-5 h-5 text-champagne shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Tuân Thủ Nguyên Tắc Data Minimization & Quyền Riêng Tư (Luật 91/2025/QH15)
            </h4>
            <p className="font-light">
              Hệ thống giám sát hành vi nhằm mục đích tối ưu hóa trải nghiệm mua sắm và hiệu năng máy chủ. Tuyệt đối không thu thập, hiển thị hoặc lưu trữ mật khẩu, mã OTP, session secret, token thanh toán ngân hàng hoặc nội dung tin nhắn riêng tư.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
