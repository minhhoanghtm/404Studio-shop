import React from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminLoyaltyNav } from './components/AdminLoyaltyNav';
import { useAdminLoyalty } from './hooks/useAdminLoyalty';
import { MEMBERSHIP_TIERS, TIER_FAMILY_NAMES, TierFamily } from '@/shared/loyalty';
import { formatDate } from '@/shared/utils/formatters';
import {
  Award,
  Users,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminLoyaltyPage: React.FC = () => {
  const { profiles, allTransactions, stats, isLoading, error, refetch, backendSyncMode } = useAdminLoyalty();

  const totalMembers = stats?.totalMembers || profiles.length;
  const totalPointsIssued = stats?.totalPointsIssued || 0;
  const totalPointsReversed = stats?.totalPointsReversed || 0;
  const activeBalance = stats?.activeBalance || 0;
  const tierDistribution = (stats?.tierDistribution || {}) as Record<string, number>;

  return (
    <AdminLayout
      title="Khách Hàng Thân Thiết & Điểm Thưởng"
      subtitle="Quản lý hệ thống 12 cấp hạng Patron, tỷ lệ tích điểm và sổ cái giao dịch"
    >
      <div className="space-y-8">
        <AdminLoyaltyNav />

        {/* Sync Mode Notification Banner */}
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Chế độ vận hành dữ liệu:</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {backendSyncMode === 'BACKEND_NATIVE' ? 'API CSDL Backend' : '100% Xác thực từ Đơn hàng Thật'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 font-sans">
                Tất cả điểm số và cấp hạng được tính toán tự động dựa trên các đơn hàng hoàn tất (`delivered`) và đã thanh toán (`paid`) từ Backend MongoDB.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-sm border border-[var(--border)] hover:border-[var(--accent)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0 bg-[var(--bg-card-muted)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--accent)] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Đồng bộ lại</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs text-red-600 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Cảnh báo đồng bộ:</p>
              <p className="text-red-600/90 dark:text-red-300/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-mono uppercase">
              <span>Tổng thành viên</span>
              <Users className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">
              {totalMembers.toLocaleString('vi-VN')}
            </p>
            <span className="text-[11px] text-[var(--text-muted)]">Đã ghi danh Patron</span>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-mono uppercase">
              <span>Tổng điểm đã cấp</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              +{totalPointsIssued.toLocaleString('vi-VN')}
            </p>
            <span className="text-[11px] text-[var(--text-muted)]">Tỷ lệ 10.000 ₫ = 1 pt</span>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-mono uppercase">
              <span>Điểm đã thu hồi</span>
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400">
              -{totalPointsReversed.toLocaleString('vi-VN')}
            </p>
            <span className="text-[11px] text-[var(--text-muted)]">Từ đơn hoàn tiền</span>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-mono uppercase">
              <span>Số dư điểm khả dụng</span>
              <Award className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">
              {activeBalance.toLocaleString('vi-VN')}
            </p>
            <span className="text-[11px] text-[var(--text-muted)]">Đang lưu thông</span>
          </div>
        </div>

        {/* 12-Tier Distribution Breakdown */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="font-display text-lg text-[var(--text-primary)]">Phân Bổ Khách Hàng Theo 12 Cấp Hạng</h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">
                Cấu hình ngưỡng tăng nghiêm ngặt: Đồng (0 - 250), Bạc (500 - 1400), Vàng (2000 - 4500), Kim Cương (6500 - 12000).
              </p>
            </div>
            <Link
              to="/admin/loyalty/customers"
              className="text-xs font-mono text-[var(--accent)] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Xem danh sách chi tiết</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {MEMBERSHIP_TIERS.map((tier) => {
              const count = tierDistribution[tier.id] || 0;
              const percentage = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
              return (
                <div
                  key={tier.id}
                  className="p-3.5 rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border)] space-y-2 hover:border-[var(--accent)] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${tier.badgeColor}`}>
                      {tier.nameVi}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{percentage}%</span>
                  </div>
                  <div>
                    <span className="text-xl font-mono font-bold text-[var(--text-primary)] block">
                      {count}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono block">
                      $\ge$ {tier.minPoints.toLocaleString('vi-VN')} pts
                    </span>
                  </div>
                  <div className="w-full bg-[var(--track-bar)] h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--accent)] h-full rounded-full transition-all"
                      style={{ width: `${Math.max(5, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-Column Lower Section: Top Patrons & Recent Ledger Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Top Patrons by Qualifying Points */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base text-[var(--text-primary)] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                  <span>Khách Hàng Patron Tiêu Biểu</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Xếp hạng theo điểm xét hạng tích lũy</p>
              </div>
              <Link
                to="/admin/loyalty/customers"
                className="text-xs font-mono text-[var(--accent)] hover:underline"
              >
                Tất cả ({profiles.length})
              </Link>
            </div>

            {profiles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[10px] uppercase font-mono">
                      <th className="pb-2.5 px-2">Khách hàng</th>
                      <th className="pb-2.5 px-2">Cấp Hạng</th>
                      <th className="pb-2.5 px-2 text-right">Đơn</th>
                      <th className="pb-2.5 px-2 text-right">Điểm Xét Hạng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {profiles.slice(0, 6).map((p, idx) => (
                      <tr key={p.customerId} className="hover:bg-[var(--table-row-hover)] transition-colors">
                        <td className="py-2.5 px-2 font-medium text-[var(--text-primary)] flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[var(--border)] text-[10px] font-mono flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate max-w-[160px]">
                            <p className="truncate text-[var(--text-primary)]">{p.customerName}</p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">{p.customerEmail || p.customerPhone}</p>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${p.currentTier.badgeColor}`}>
                            {p.currentTier.nameVi}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-[var(--text-secondary)]">
                          {p.eligibleOrdersCount}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-[var(--accent)] whitespace-nowrap">
                          {p.qualifyingPoints.toLocaleString('vi-VN')} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">Đang tải danh sách thành viên...</p>
            )}
          </div>

          {/* Recent Ledger Activity */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base text-[var(--text-primary)] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--accent)]" />
                  <span>Biến Động Điểm Gần Đây</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Sổ cái kiểm toán thời gian thực</p>
              </div>
              <Link
                to="/admin/loyalty/transactions"
                className="text-xs font-mono text-[var(--accent)] hover:underline"
              >
                Sổ cái
              </Link>
            </div>

            {allTransactions.length > 0 ? (
              <div className="space-y-3">
                {allTransactions.slice(0, 6).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            tx.eventType === 'EARN' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <span className="font-mono text-[11px] text-[var(--text-primary)] truncate font-medium">
                          {tx.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                        {tx.reason}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono text-xs font-bold block ${
                          tx.pointsDelta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {tx.pointsDelta > 0 ? `+${tx.pointsDelta}` : tx.pointsDelta} pts
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono block">
                        {formatDate(tx.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">Chưa có giao dịch điểm phát sinh.</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
