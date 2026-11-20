import React, { useState } from 'react';
import { AccountLayout } from './AccountLayout';
import { useLoyalty } from '@/shared/hooks/useLoyalty';
import { MEMBERSHIP_TIERS, TIER_FAMILY_NAMES, TierFamily } from '@/shared/loyalty';
import { formatDate } from '@/shared/utils/formatters';
import {
  Award,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AccountLoyaltyPage: React.FC = () => {
  const { profile, isLoading, error, refetch, backendSyncMode } = useLoyalty();
  const [filterType, setFilterType] = useState<'ALL' | 'EARN' | 'REFUND_REVERSAL'>('ALL');
  const [activeFamilyTab, setActiveFamilyTab] = useState<TierFamily>('bronze');

  const transactions = profile?.transactions || [];
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.eventType === filterType;
  });

  const currentTier = profile?.currentTier || MEMBERSHIP_TIERS[0];
  const nextTier = profile?.nextTier;
  const qualifyingPoints = profile?.qualifyingPoints || 0;
  const progressPercentage = profile?.progressPercentage || 0;
  const pointsToNextTier = profile?.pointsToNextTier || 0;

  return (
    <AccountLayout>
      <div className="space-y-10 text-[var(--text)]">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-ultra text-[var(--accent)]">
                PATRON PRIVILEGE CLUB
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text-muted)]">
                {backendSyncMode === 'BACKEND_NATIVE' ? 'Đồng bộ API CSDL' : 'Xác thực Đơn hàng Thật'}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-[var(--text)] tracking-wide mt-1">
              Hạng Thành Viên & Điểm Thưởng Patron
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Hệ thống 12 cấp hạng vinh danh sự đồng hành của quý khách cùng Maison Atelier Vérité.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors self-start sm:self-auto bg-[var(--surface)] shadow-sm"
            title="Làm mới số dư điểm từ đơn hàng mới nhất"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--accent)] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Cập nhật số dư</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Lưu ý kiểm tra dữ liệu đơn hàng:</p>
              <p className="text-red-500/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Top Section: Membership Card + Tier Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Virtual Patron Membership Card */}
          <div className="lg:col-span-5 flex flex-col">
            <div
              className={`p-7 rounded-2xl border border-white/20 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[240px] bg-gradient-to-br ${currentTier.gradient}`}
              style={{ backdropFilter: 'blur(16px)' }}
            >
              {/* Luxury Accent Ornaments */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-white/10 to-transparent pointer-events-none rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-champagne/15 to-transparent pointer-events-none rounded-tr-full" />

              {/* Card Header */}
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <span className="font-serif text-sm tracking-widest text-[#d4af37] font-bold uppercase">
                    ATELIER VÉRITÉ
                  </span>
                  <p className="text-[10px] font-mono tracking-widest text-stone-200">
                    PARIS • MILAN • TOKYO
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-[11px] font-mono uppercase font-bold border tracking-wider flex items-center gap-1.5 shadow-sm bg-black/40 border-white/30 text-white">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>{currentTier.nameVi}</span>
                </div>
              </div>

              {/* Card Chip / Number Placeholder */}
              <div className="my-6 relative z-10">
                <div className="w-11 h-8 rounded-sm bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/60 shadow-inner flex items-center justify-center">
                  <div className="w-8 h-5 border border-amber-800/40 rounded-xs grid grid-cols-2 gap-0.5 opacity-60">
                    <div className="border-r border-amber-900/30" />
                    <div />
                  </div>
                </div>
                <p className="font-mono text-sm tracking-widest text-white/90 mt-3">
                  PATRON • {profile?.customerId ? profile.customerId.slice(-8).toUpperCase() : '0000-0000'}
                </p>
              </div>

              {/* Card Footer */}
              <div className="flex items-end justify-between relative z-10 border-t border-white/10 pt-3 text-xs">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-stone-300 font-mono">
                    CHỦ THẺ PATRON
                  </p>
                  <p className="font-serif text-white tracking-wide font-medium mt-0.5">
                    {profile?.customerName || 'Quý Khách Hàng'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-stone-300 font-mono">
                    ĐIỂM XÉT HẠNG
                  </p>
                  <p className="font-mono text-base font-bold text-[#d4af37]">
                    {qualifyingPoints.toLocaleString('vi-VN')} <span className="text-xs font-normal">pts</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Card Metadata */}
            <div className="mt-3 px-3 flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
              <span>Chuẩn thẻ: ISO/IEC 7810 ID-1</span>
              <span>Quy tắc: 10.000 ₫ = 1 điểm</span>
            </div>
          </div>

          {/* Tier Status & Progress to Next Tier */}
          <div className="lg:col-span-7 p-7 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-display text-xl text-[var(--text)]">
                  Bạn đang ở hạng <span className="text-[var(--accent)] font-bold">{currentTier.nameVi}</span>
                </h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">
                {nextTier ? (
                  <span>
                    Bạn cần thêm <strong className="text-[var(--text)] font-mono">{pointsToNextTier.toLocaleString('vi-VN')} điểm</strong> hợp lệ nữa để thăng hạng lên{' '}
                    <strong className="text-[var(--accent)]">{nextTier.nameVi}</strong>.
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Chúc mừng quý khách đã đạt cấp hạng vinh dự tối thượng Kim Cương III của Maison!
                  </span>
                )}
              </p>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                  {currentTier.nameVi} ({currentTier.minPoints.toLocaleString('vi-VN')} pts)
                </span>
                <span className="text-[var(--text)] font-bold">{progressPercentage}%</span>
                {nextTier && (
                  <span className="text-[var(--text-muted)]">
                    {nextTier.nameVi} ({nextTier.minPoints.toLocaleString('vi-VN')} pts)
                  </span>
                )}
              </div>

              <div className="w-full h-3 rounded-full bg-[var(--bg-alt)] overflow-hidden p-0.5 border border-[var(--border)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-[var(--accent)] to-emerald-500 transition-all duration-700 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)] font-sans pt-1">
                <span>Điểm xét hạng hiện tại: <strong className="text-[var(--text)] font-mono">{qualifyingPoints.toLocaleString('vi-VN')}</strong></span>
                {nextTier && <span>Còn thiếu: <strong className="text-[var(--accent)] font-mono">{pointsToNextTier.toLocaleString('vi-VN')}</strong> điểm</span>}
              </div>
            </div>

            {/* Points Summary KPI Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--border)]">
              <div className="p-3 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)]">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-mono block">
                  Điểm xét hạng
                </span>
                <span className="text-base sm:text-lg font-mono font-bold text-[var(--text)] block mt-0.5">
                  {qualifyingPoints.toLocaleString('vi-VN')}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">Xác định cấp hạng</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)]">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-mono block">
                  Đã tích lũy
                </span>
                <span className="text-base sm:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  +{(profile?.earnedPoints || 0).toLocaleString('vi-VN')}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">Từ đơn hoàn tất</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)]">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-mono block">
                  Đã thu hồi
                </span>
                <span className="text-base sm:text-lg font-mono font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                  -{(profile?.reversedPoints || 0).toLocaleString('vi-VN')}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">Do hoàn tiền</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)]">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-mono block">
                  Đơn đủ điều kiện
                </span>
                <span className="text-base sm:text-lg font-mono font-bold text-[var(--accent)] block mt-0.5">
                  {profile?.eligibleOrdersCount || 0}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">Đã giao & thanh toán</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Points Ledger / Transaction History */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="font-display text-xl text-[var(--text)]">Sổ Cái Biến Động Điểm (Point Ledger)</h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">
                Mọi giao dịch điểm thưởng đều được ghi nhận độc lập, bảo đảm tính toàn vẹn và chống trùng lặp.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--bg-alt)] border border-[var(--border)] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filterType === 'ALL'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Tất cả ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('EARN')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filterType === 'EARN'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Cộng điểm ({transactions.filter((t) => t.eventType === 'EARN').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('REFUND_REVERSAL')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filterType === 'REFUND_REVERSAL'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Thu hồi hoàn tiền ({transactions.filter((t) => t.eventType === 'REFUND_REVERSAL').length})
              </button>
            </div>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[10px] uppercase font-mono tracking-wider bg-[var(--bg-alt)]">
                    <th className="py-3 px-3">Thời gian</th>
                    <th className="py-3 px-3">Mã Giao Dịch</th>
                    <th className="py-3 px-3">Loại Biến Động</th>
                    <th className="py-3 px-3">Đơn Hàng</th>
                    <th className="py-3 px-3">Lý Do Chi Tiết</th>
                    <th className="py-3 px-3 text-right">Biến Động</th>
                    <th className="py-3 px-3 text-right">Số Dư Sau GD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[var(--bg-alt)]/60 transition-colors">
                      <td className="py-3 px-3 text-[var(--text-muted)] font-mono text-[11px] whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[var(--accent)] whitespace-nowrap">
                        {tx.id}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {tx.eventType === 'EARN' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Tích Điểm
                          </span>
                        ) : tx.eventType === 'REFUND_REVERSAL' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Thu Hồi Hoàn Tiền
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                            Điều Chỉnh Admin
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[var(--text)] whitespace-nowrap">
                        {tx.orderId ? (
                          <Link
                            to={`/orders/${tx.orderId}`}
                            className="hover:text-[var(--accent)] underline flex items-center gap-1"
                          >
                            <span>#{String(tx.orderCode || tx.orderId).slice(-8)}</span>
                            <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)]" />
                          </Link>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[var(--text-muted)] max-w-xs truncate">
                        {tx.reason}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                        {tx.pointsDelta > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">+{tx.pointsDelta.toLocaleString('vi-VN')}</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">{tx.pointsDelta.toLocaleString('vi-VN')}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-[var(--text)] whitespace-nowrap">
                        {tx.newBalance.toLocaleString('vi-VN')} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] text-center space-y-2">
              <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto stroke-1" />
              <p className="font-serif text-sm text-[var(--text)]">Chưa có giao dịch điểm nào trong danh mục này</p>
              <p className="text-xs text-[var(--text-muted)]">
                Điểm thưởng sẽ tự động được cộng vào sổ cái ngay khi đơn hàng mua sắm của quý khách hoàn tất giao hàng và xác nhận thanh toán thành công.
              </p>
            </div>
          )}
        </div>

        {/* Section 3: 12-Tier Hierarchy & Privileges */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="font-display text-xl text-[var(--text)]">Hệ Thống 12 Cấp Hạng Thành Viên & Đặc Quyền</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">
              Các cấp hạng được chia thành 4 nhóm kim loại & đá quý: Đồng, Bạc, Vàng, Kim Cương. Mỗi nhóm gồm 3 cấp bậc (I, II, III).
            </p>
          </div>

          {/* Family Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
            {(['bronze', 'silver', 'gold', 'diamond'] as TierFamily[]).map((family) => {
              const familyTiers = MEMBERSHIP_TIERS.filter((t) => t.family === family);
              const isCurrentFamily = currentTier.family === family;
              return (
                <button
                  key={family}
                  type="button"
                  onClick={() => setActiveFamilyTab(family)}
                  className={`px-4 py-2 rounded-xl text-xs font-serif transition-all flex items-center gap-2 ${
                    activeFamilyTab === family
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold shadow-md'
                      : 'bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] border border-[var(--border)]'
                  }`}
                >
                  <span>{TIER_FAMILY_NAMES[family].vi}</span>
                  {isCurrentFamily && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Cấp hạng hiện tại của bạn" />
                  )}
                  <span className="text-[10px] font-mono opacity-80">
                    ({familyTiers[0].minPoints} - {familyTiers[2].minPoints} pts)
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tier Cards in Selected Family */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {MEMBERSHIP_TIERS.filter((t) => t.family === activeFamilyTab).map((tier) => {
              const isCurrent = currentTier.id === tier.id;
              const isPassed = qualifyingPoints >= tier.minPoints;
              return (
                <div
                  key={tier.id}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                    isCurrent
                      ? 'bg-[var(--accent)]/10 border-[var(--accent)] shadow-md ring-1 ring-[var(--accent)]/40'
                      : isPassed
                      ? 'bg-[var(--surface)] border-[var(--border)]'
                      : 'bg-[var(--bg-alt)]/60 border-[var(--border)] opacity-80'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase border ${tier.badgeColor}`}>
                        {tier.nameVi}
                      </span>
                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40">
                          Đang sở hữu
                        </span>
                      ) : isPassed ? (
                        <span className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã đạt
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          Cần {tier.minPoints.toLocaleString('vi-VN')} pts
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-serif text-lg text-[var(--text)] font-medium">{tier.nameEn}</h4>
                      <p className="text-[11px] font-mono text-[var(--accent)] mt-0.5 font-semibold">
                        Ngưỡng tích lũy: {tier.minPoints.toLocaleString('vi-VN')} điểm
                      </p>
                    </div>

                    <ul className="space-y-2 pt-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)] font-sans">
                      {tier.benefits.map((benefit, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-[var(--border)] text-[11px] font-mono text-[var(--text-muted)]">
                    Tương đương chi tiêu:{' '}
                    <span className="text-[var(--text)] font-semibold">
                      {(tier.minPoints * 10000).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Loyalty Program Terms & Compliance */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3 text-xs text-[var(--text-muted)] font-sans leading-relaxed">
          <div className="flex items-center gap-2 text-[var(--text)] font-serif text-sm font-medium">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            <span>Điều Khoản & Quy Định Chương Trình Thành Viên Patron</span>
          </div>
          <p>
            1. <strong>Tỷ lệ quy đổi:</strong> Cứ mỗi 10.000 VND giá trị hàng hóa hợp lệ (đã trừ chiết khấu voucher/khuyến mãi, không bao gồm cước phí vận chuyển), tài khoản thành viên sẽ được tích lũy 01 điểm thưởng Patron.
          </p>
          <p>
            2. <strong>Điều kiện ghi nhận:</strong> Điểm chỉ được cộng chính thức vào sổ cái khi đơn hàng đạt trạng thái <em>Đã giao thành công (Delivered)</em> và <em>Đã xác nhận thanh toán (Paid)</em>. Với hình thức giao hàng thu tiền (COD), điểm được cộng sau khi bưu tá hoàn tất thu hộ và đối soát hoàn tất.
          </p>
          <p>
            3. <strong>Chính sách hoàn tiền & Thu hồi:</strong> Trường hợp đơn hàng được hoàn trả toàn phần hoặc một phần, hệ thống sẽ tự động thực hiện giao dịch thu hồi (Reversal) số điểm tương ứng với giá trị hàng hóa đã hoàn. Nếu số điểm còn lại giảm xuống dưới ngưỡng quy định của cấp hạng hiện tại, cấp hạng tài khoản sẽ tự động được điều chỉnh về cấp hạng tương ứng với số điểm thực tế.
          </p>
          <p>
            4. <strong>Bảo mật thông tin:</strong> Dữ liệu điểm thưởng và lịch sử mua sắm được bảo vệ tuân thủ nghiêm ngặt Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 và Nghị định 13/2023/NĐ-CP của Chính phủ. Mọi biến động điểm đều được lưu trữ kiểm toán vĩnh viễn trên sổ cái hệ thống.
          </p>
        </div>
      </div>
    </AccountLayout>
  );
};
