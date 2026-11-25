import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminLayout } from '../Admin/AdminLayout';
import { TrackingNav } from '../AdminTracking/components/TrackingNav';
import { TablePagination } from '@/shared/components/TablePagination';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';
import { useToastStore } from '@/shared/stores/useToastStore';
import {
  AdminActionGroup,
  ViewActionButton,
  AdminActionButton,
} from '@/shared/components/AdminActionButton';
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
  LogOut,
  UserX,
  Activity,
  X,
} from 'lucide-react';

export const getPresenceStatusBadge = (status: string | undefined) => {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'online') {
    return {
      text: 'Hoạt động',
      variant: 'success' as const,
      className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      dotClass: 'bg-emerald-400 animate-pulse',
    };
  }
  if (s === 'idle' || s === 'away') {
    return {
      text: 'Treo',
      variant: 'warning' as const,
      className: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      dotClass: 'bg-amber-400',
    };
  }
  if (s === 'background') {
    return {
      text: 'Ẩn tab',
      variant: 'purple' as const,
      className: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
      dotClass: 'bg-purple-400',
    };
  }
  return {
    text: 'Ngoại tuyến',
    variant: 'neutral' as const,
    className: 'bg-white/5 text-platinum-dark border border-white/10',
    dotClass: 'bg-white/40',
  };
};

export function formatDurationSec(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return 'Dưới 1 giây';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s} giây`;
  if (s === 0) return `${m} phút`;
  return `${m} phút ${s} giây`;
}

/**
 * Định dạng thời gian tương đối theo chuẩn tiếng Việt:
 * - Vừa xong (dưới 45 giây)
 * - X phút trước
 * - X giờ trước
 * - X ngày trước
 * - X tuần trước
 * - X tháng trước
 * - X năm trước
 */
export function formatRelativeTime(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '—';
  const timestamp = typeof dateInput === 'number'
    ? dateInput
    : new Date(dateInput).getTime();

  if (isNaN(timestamp) || timestamp <= 0) {
    return '—';
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSec < 45) {
    return 'Vừa xong';
  }
  if (diffMin < 60) {
    return `${diffMin} phút trước`;
  }
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }
  if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  }
  if (diffWeeks < 4) {
    return `${diffWeeks} tuần trước`;
  }
  if (diffMonths < 12) {
    return `${diffMonths} tháng trước`;
  }
  return `${diffYears} năm trước`;
}

export const AdminTrackingUsersPage: React.FC = () => {
  const { addToast } = useToastStore();
  const [livePresence, setLivePresence] = useState<LivePresenceResponse | null>(null);
  const [activity, setActivity] = useState<ActivityAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for Journey Detail Modal
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any | null>(null);

  // States for Force Logout / Terminate Confirmation Modal
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [terminating, setTerminating] = useState(false);

  const { overlayZIndex: detailOverlayZ, contentZIndex: detailContentZ } = useModal({
    id: 'presence-detail-journey-modal',
    isOpen: isDetailModalOpen,
    onClose: () => setIsDetailModalOpen(false),
  });

  const { overlayZIndex: terminateOverlayZ, contentZIndex: terminateContentZ } = useModal({
    id: 'presence-terminate-modal',
    isOpen: isTerminateModalOpen,
    onClose: () => !terminating && setIsTerminateModalOpen(false),
  });

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

  // Pagination states (Max 10 rows per page)
  const [pageSessions, setPageSessions] = useState(1);
  const [pagePages, setPagePages] = useState(1);

  const paginatedSessions = useMemo(() => {
    const list = livePresence?.sessions || [];
    const start = (pageSessions - 1) * 10;
    return list.slice(start, start + 10);
  }, [livePresence?.sessions, pageSessions]);

  const paginatedPageAnalytics = useMemo(() => {
    const list = activity?.pageAnalytics || [];
    const start = (pagePages - 1) * 10;
    return list.slice(start, start + 10);
  }, [activity?.pageAnalytics, pagePages]);

  const handleViewJourney = async (sess: any) => {
    setSelectedSession(sess);
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await adminTrackingApi.getSessionTimeline(sess.visitorId || sess.sessionId);
      if (res?.data) {
        setDetailData(res.data);
      }
    } catch {
      // Ignored
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePromptTerminate = (sess: any) => {
    setSelectedSession(sess);
    setIsTerminateModalOpen(true);
  };

  const handleConfirmTerminate = async () => {
    if (!selectedSession) return;
    setTerminating(true);
    const sid = selectedSession.visitorId || selectedSession.sessionId;
    try {
      await adminTrackingApi.terminateSession(sid, 'Quản trị viên kết thúc phiên');
      addToast('Đã kết thúc phiên làm việc thành công!', 'success');
      setIsTerminateModalOpen(false);
      setIsDetailModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast(err?.message || 'Không thể kết thúc phiên làm việc', 'error');
    } finally {
      setTerminating(false);
    }
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
            className="p-2 border border-white/15 hover:border-champagne text-platinum-dark hover:text-champagne rounded-lg shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95 active:shadow-inner transition-all duration-200 cursor-pointer"
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
              className="px-3 py-1 bg-red-900/60 border border-red-400/40 rounded-lg uppercase text-[10px] font-mono font-bold shadow-xs hover:shadow-sm active:scale-95 transition-all duration-150 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Live Presence Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-sm bg-noir-900 border border-white/10 hover:border-white/25 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 cursor-default">
            <span className="text-[10px] uppercase tracking-wider text-platinum-dark font-mono block">
              Tổng Phiên Đang Mở
            </span>
            <h4 className="font-display text-2xl text-white font-bold mt-1">{counts.total}</h4>
            <div className="text-[10px] text-platinum-dark mt-1 font-mono">
              {counts.authenticatedCount ?? 0} TV • {counts.guestCount ?? 0} Khách
            </div>
          </div>

          <div className="p-4 rounded-sm bg-noir-900 border border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 cursor-default">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono block flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Đang Hoạt Động
            </span>
            <h4 className="font-display text-2xl text-emerald-400 font-bold mt-1">{counts.active}</h4>
            <div className="text-[10px] text-platinum-dark mt-1">Đang tương tác</div>
          </div>

          <div className="p-4 rounded-sm bg-noir-900 border border-amber-500/20 hover:border-amber-500/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 cursor-default">
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-mono block">
              Đang Treo
            </span>
            <h4 className="font-display text-2xl text-amber-400 font-bold mt-1">
              {(counts.idle || 0) + (counts.away || 0)}
            </h4>
            <div className="text-[10px] text-platinum-dark mt-1">Không thao tác &gt; 3p</div>
          </div>

          <div className="p-4 rounded-sm bg-noir-900 border border-white/10 hover:border-purple-400/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 cursor-default">
            <span className="text-[10px] uppercase tracking-wider text-purple-400 font-mono block">
              Ẩn Tab / Chạy Ngầm
            </span>
            <h4 className="font-display text-2xl text-purple-400 font-bold mt-1">{counts.background}</h4>
            <div className="text-[10px] text-platinum-dark mt-1">Tab đang bị ẩn</div>
          </div>

          <div className="p-4 rounded-sm bg-noir-900 border border-white/10 hover:border-blue-400/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 cursor-default">
            <span className="text-[10px] uppercase tracking-wider text-blue-400 font-mono block">
              Thành Viên Đăng Nhập
            </span>
            <h4 className="font-display text-2xl text-blue-400 font-bold mt-1">{counts.authenticatedCount ?? 0}</h4>
            <div className="text-[10px] text-platinum-dark mt-1">Tài khoản thành viên</div>
          </div>

          <div className="p-4 rounded-sm bg-noir-900 border border-white/10 hover:border-emerald-400/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 cursor-default">
            <span className="text-[10px] uppercase tracking-wider text-platinum-dark font-mono block">
              Kết Nối Redis
            </span>
            <h4 className="font-display text-base text-emerald-400 font-bold mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Đang Hoạt Động
            </h4>
            <div className="text-[10px] text-platinum-dark mt-1">Redis Active Store</div>
          </div>
        </div>

        {/* Live Active Sessions Table */}
        <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-4 hover:border-white/20 hover:shadow-md transition-all duration-200">
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

          {loading && !livePresence ? (
            <div className="flex items-center justify-center py-12 gap-3 text-platinum-dark text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-champagne" />
              <span>Đang tải dữ liệu...</span>
            </div>
          ) : livePresence?.sessions && livePresence.sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-noir-950 text-platinum-dark text-[11px] uppercase font-mono border-b border-white/10">
                  <tr>
                    <th className="px-3 py-3 w-12 text-center">STT</th>
                    <th className="px-4 py-3">Mã Phiên (Session ID)</th>
                    <th className="px-4 py-3">Chủ Thể</th>
                    <th className="px-4 py-3">Trạng Thái</th>
                    <th className="px-4 py-3">Đường Dẫn Đang Xem</th>
                    <th className="px-4 py-3">Thiết Bị</th>
                    <th className="px-4 py-3">Cập Nhật</th>
                    <th className="px-4 py-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {paginatedSessions.map((sess, idx) => {
                    const isUser = sess.type === 'user' || (!sess.isAnonymous && Boolean(sess.userId));
                    const displayName = sess.displayName || sess.userDisplay || (isUser ? 'Thành Viên' : 'Khách vãng lai');
                    const badge = getPresenceStatusBadge(sess.status);

                    return (
                      <tr key={sess.sessionId} className="hover:bg-white/[0.02]">
                        <td className="px-3 py-3 text-center font-mono text-platinum-dark text-[11px]">
                          {(pageSessions - 1) * 10 + idx + 1}
                        </td>
                        <td className="px-4 py-3 font-mono text-champagne text-[11px]">
                          {sess.visitorId || sess.sessionId}
                        </td>
                        <td className="px-4 py-3">
                          {isUser ? (
                            <StatusBadge variant="success">
                              {displayName}
                            </StatusBadge>
                          ) : (
                            <StatusBadge variant="neutral">
                              Khách vãng lai
                            </StatusBadge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            variant={badge.variant}
                            dot={true}
                            pulse={badge.variant === 'success'}
                          >
                            {badge.text}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 font-mono text-white/90 text-xs">
                          {sess.page || sess.currentRoute || '/'}
                        </td>
                        <td className="px-4 py-3 text-platinum-dark capitalize">
                          {sess.deviceType || 'Desktop'}
                        </td>
                        <td className="px-4 py-3 text-platinum-dark font-mono text-[11px]">
                          {(() => {
                            const rawTime = sess.lastSeen || sess.lastHeartbeatAt;
                            if (!rawTime) return '—';
                            const d = new Date(rawTime);
                            const fullTimeStr = `${d.toLocaleTimeString('vi-VN')} ${d.toLocaleDateString('vi-VN')}`;
                            return (
                              <span title={fullTimeStr} className="cursor-help hover:text-champagne transition-colors">
                                {formatRelativeTime(rawTime)}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <AdminActionGroup>
                            <ViewActionButton
                              onClick={() => handleViewJourney(sess)}
                              title="Xem quá trình hoạt động của phiên này"
                            />
                            <AdminActionButton
                              variant="terminate"
                              onClick={() => handlePromptTerminate(sess)}
                              title={isUser ? `Buộc đăng xuất ${displayName}` : 'Kết thúc phiên của khách vãng lai này'}
                            />
                          </AdminActionGroup>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <TablePagination
                currentPage={pageSessions}
                totalItems={livePresence.sessions.length}
                pageSize={10}
                onPageChange={setPageSessions}
                itemName="phiên trực tuyến"
              />
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

            {loading && !activity ? (
              <div className="flex items-center justify-center py-12 gap-3 text-platinum-dark text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-champagne" />
                <span>Đang tải dữ liệu...</span>
              </div>
            ) : activity?.pageAnalytics && activity.pageAnalytics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-noir-950 text-platinum-dark text-[11px] uppercase font-mono border-b border-white/10">
                    <tr>
                      <th className="px-3 py-3 w-12 text-center">STT</th>
                      <th className="px-4 py-3">Đường Dẫn (Pathname)</th>
                      <th className="px-4 py-3">Lượt Xem</th>
                      <th className="px-4 py-3">Thời Gian Lưu Trung Bình</th>
                      <th className="px-4 py-3">Tương Tác Thực</th>
                      <th className="px-4 py-3 text-right">Chờ (Idle)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {paginatedPageAnalytics.map((p, idx) => (
                      <tr key={p.pathname} className="hover:bg-white/[0.02]">
                        <td className="px-3 py-3 text-center font-mono text-platinum-dark text-[11px]">
                          {(pagePages - 1) * 10 + idx + 1}
                        </td>
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

                <TablePagination
                  currentPage={pagePages}
                  totalItems={activity.pageAnalytics.length}
                  pageSize={10}
                  onPageChange={setPagePages}
                  itemName="trang"
                />
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

            {loading && !activity ? (
              <div className="flex items-center justify-center py-8 gap-3 text-platinum-dark text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-champagne" />
                <span>Đang tải dữ liệu...</span>
              </div>
            ) : activity?.trafficSources && activity.trafficSources.length > 0 ? (
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

        {/* ========================================================================= */}
        {/* MODAL CHI TIẾT HÀNH TRÌNH PHIÊN (Session Journey Detail Modal)            */}
        {/* ========================================================================= */}
        {isDetailModalOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 bg-[rgba(26,26,23,0.55)] backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
              style={{ zIndex: detailOverlayZ }}
              onClick={() => setIsDetailModalOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Hành Trình Hoạt Động Của Phiên"
            >
              <div
                className="bg-[var(--surface)] border border-[var(--border)] rounded-sm w-full max-w-3xl max-h-[calc(100dvh-32px)] flex flex-col shadow-2xl overflow-hidden text-[var(--text)]"
                style={{ zIndex: detailContentZ }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-5 h-5 text-[var(--accent)]" />
                    <div>
                      <h3 className="text-base uppercase tracking-wider text-[var(--text)] font-semibold font-display">
                        Hành Trình Hoạt Động Của Phiên
                      </h3>
                      <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                        Mã phiên: <span className="text-[var(--accent)] font-semibold">{selectedSession?.visitorId || selectedSession?.sessionId}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded transition-colors"
                    aria-label="Đóng"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 admin-content-scrollbar">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm">
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Chủ Thể</span>
                      <div className="text-xs font-semibold text-[var(--text)] mt-1 truncate">
                        {detailData?.displayName || detailData?.userDisplay || selectedSession?.displayName || (selectedSession?.type === 'user' ? 'Thành Viên' : 'Khách vãng lai')}
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        {detailData?.userType === 'authenticated' || selectedSession?.type === 'user' ? 'Đã đăng nhập' : 'Khách chưa đăng nhập'}
                      </span>
                    </div>

                    <div className="p-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm">
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Trạng Thái</span>
                      <div className="mt-1">
                        {(() => {
                          const badge = getPresenceStatusBadge(detailData?.currentStatus || selectedSession?.status);
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${badge.className}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                              {badge.text}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="p-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm">
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Bắt Đầu Từ (Khi Nào)</span>
                      <div className="text-xs font-mono text-[var(--accent)] mt-1 font-semibold">
                        {(() => {
                          const t = detailData?.sessionStartedAt || selectedSession?.lastSeen;
                          if (!t) return '—';
                          return formatRelativeTime(t);
                        })()}
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {(() => {
                          const t = detailData?.sessionStartedAt || selectedSession?.lastSeen;
                          if (!t) return '';
                          const d = new Date(t);
                          return `${d.toLocaleTimeString('vi-VN')} ${d.toLocaleDateString('vi-VN')}`;
                        })()}
                      </span>
                    </div>

                    <div className="p-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm">
                      <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Tổng Thời Gian Phiên</span>
                      <div className="text-xs font-mono text-[var(--text)] mt-1 font-semibold">
                        {formatDurationSec(detailData?.totalDurationSec || 0)}
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {detailData?.pageHistory?.length || 1} trang đã xem
                      </span>
                    </div>
                  </div>

                  {/* Quá trình hoạt động theo từng trang */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <h4 className="text-xs uppercase tracking-wider text-[var(--text)] font-semibold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[var(--accent)]" />
                        <span>Quá Trình Hoạt Động Trong Phiên (Hoạt động ở trang nào bao lâu)</span>
                      </h4>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        {detailData?.pageHistory?.length || 0} mốc ghi nhận
                      </span>
                    </div>

                    {detailLoading ? (
                      <div className="py-12 flex items-center justify-center gap-2 text-[var(--text-muted)] text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent)]" />
                        <span>Đang tải hành trình chi tiết...</span>
                      </div>
                    ) : detailData?.pageHistory && detailData.pageHistory.length > 0 ? (
                      <div className="border border-[var(--border)] rounded-sm overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[var(--bg-alt)] text-[var(--text-muted)] text-[11px] uppercase font-mono border-b border-[var(--border)]">
                            <tr>
                              <th className="px-3 py-2.5 w-12 text-center">STT</th>
                              <th className="px-4 py-2.5">Trang Đã Xem</th>
                              <th className="px-4 py-2.5">Từ Khi Nào</th>
                              <th className="px-4 py-2.5">Lưu Lại Bao Lâu</th>
                              <th className="px-4 py-2.5">Trạng Thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)] font-sans">
                            {detailData.pageHistory.map((item: any, idx: number) => {
                              const badge = getPresenceStatusBadge(item.status);
                              return (
                                <tr key={idx} className="hover:bg-[var(--bg-alt)]/50 transition-colors">
                                  <td className="px-3 py-2.5 text-center font-mono text-[var(--text-muted)] text-[11px]">
                                    {idx + 1}
                                  </td>
                                  <td className="px-4 py-2.5 font-mono text-[var(--text)]">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[var(--accent)]">›</span>
                                      <span>{item.page || '/'}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 font-mono text-[var(--text-muted)] text-[11px]" title={item.enteredAt ? `${new Date(item.enteredAt).toLocaleTimeString('vi-VN')} ${new Date(item.enteredAt).toLocaleDateString('vi-VN')}` : ''}>
                                    {item.enteredAt
                                      ? formatRelativeTime(item.enteredAt)
                                      : '—'}
                                  </td>
                                  <td className="px-4 py-2.5 font-mono text-[var(--text)] font-medium">
                                    {formatDurationSec(item.durationSec)}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono ${badge.className}`}>
                                      <span className={`w-1 h-1 rounded-full ${badge.dotClass}`} />
                                      {badge.text}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm text-xs text-[var(--text-muted)]">
                        <p>Đang xem trang hiện tại: <span className="text-[var(--accent)] font-mono font-semibold">{selectedSession?.page || '/'}</span></p>
                        <p className="mt-1 text-[11px]">
                          Cập nhật lần cuối:{' '}
                          {selectedSession?.lastSeen ? (
                            <span
                              title={`${new Date(selectedSession.lastSeen).toLocaleTimeString('vi-VN')} ${new Date(selectedSession.lastSeen).toLocaleDateString('vi-VN')}`}
                              className="text-[var(--accent)] font-mono"
                            >
                              {formatRelativeTime(selectedSession.lastSeen)} ({new Date(selectedSession.lastSeen).toLocaleTimeString('vi-VN')})
                            </span>
                          ) : (
                            '—'
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-[var(--border)] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setIsTerminateModalOpen(true);
                    }}
                    className="px-4 py-2 bg-red-600/90 hover:bg-red-600 text-white border border-red-500 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Buộc Đăng Xuất / Kết Thúc Phiên</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-4 py-2 border border-[var(--border)] text-[var(--text)] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[var(--bg-alt)] shadow-xs hover:shadow-sm transition-all cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* ========================================================================= */}
        {/* MODAL XÁC NHẬN BUỘC ĐĂNG XUẤT (Terminate Confirmation Modal)              */}
        {/* ========================================================================= */}
        {isTerminateModalOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 bg-[rgba(26,26,23,0.55)] backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
              style={{ zIndex: terminateOverlayZ }}
              onClick={() => !terminating && setIsTerminateModalOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Xác Nhận Kết Thúc Phiên"
            >
              <div
                className="bg-[var(--surface)] border border-red-500/40 rounded-sm w-full max-w-md p-6 space-y-4 shadow-2xl text-[var(--text)]"
                style={{ zIndex: terminateContentZ }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 text-red-500">
                  <div className="p-2.5 rounded-full bg-red-500/10 border border-red-500/30">
                    <UserX className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text)] font-display">
                      Xác Nhận Kết Thúc Phiên
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">
                      Phiên: {selectedSession?.visitorId || selectedSession?.sessionId}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm text-xs text-[var(--text-secondary)] space-y-2 leading-relaxed">
                  {selectedSession?.type === 'user' ? (
                    <p>
                      Quý khách có chắc chắn muốn <strong className="text-red-500">buộc đăng xuất</strong> người dùng{' '}
                      <strong className="text-[var(--accent)] font-mono">{selectedSession?.displayName || 'Thành Viên'}</strong>? Phiên
                      này sẽ bị thu hồi và tài khoản sẽ bị đăng xuất ngay lập tức.
                    </p>
                  ) : (
                    <p>
                      Quý khách có chắc chắn muốn <strong className="text-red-500">ngắt kết nối</strong> phiên làm việc của{' '}
                      <strong className="text-[var(--text)]">Khách vãng lai</strong> này khỏi hệ thống?
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    disabled={terminating}
                    onClick={() => setIsTerminateModalOpen(false)}
                    className="px-4 py-2 border border-[var(--border)] text-[var(--text)] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[var(--bg-alt)] shadow-xs hover:shadow-sm transition-all cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="button"
                    disabled={terminating}
                    onClick={handleConfirmTerminate}
                    className="px-4 py-2 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg font-mono uppercase tracking-wider border border-red-500 transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {terminating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang Xử Lý...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Xác Nhận Ngắt Phiên</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    </AdminLayout>
  );
};
