import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminLoyaltyNav } from './components/AdminLoyaltyNav';
import { useAdminLoyalty } from './hooks/useAdminLoyalty';
import { MEMBERSHIP_TIERS, TierDefinition, TierFamily } from '@/shared/loyalty';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';
import { TablePagination } from '@/shared/components/TablePagination';
import {
  Users,
  Search,
  Filter,
  Award,
  Eye,
  X,
  FileText,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';
import { AdminActionGroup, ViewActionButton } from '@/shared/components/AdminActionButton';

export const AdminLoyaltyCustomersPage: React.FC = () => {
  const { profiles, isLoading, error, refetch } = useAdminLoyalty();
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState<'ALL' | TierFamily>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const { overlayZIndex, contentZIndex } = useModal({
    id: 'admin-loyalty-ledger-modal',
    isOpen: Boolean(selectedCustomer),
    onClose: () => setSelectedCustomer(null),
  });

  const filteredProfiles = profiles.filter((p) => {
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (p.customerName || '').toLowerCase().includes(q);
      const matchEmail = (p.customerEmail || '').toLowerCase().includes(q);
      const matchPhone = (p.customerPhone || '').toLowerCase().includes(q);
      const matchId = (p.customerId || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchId) return false;
    }

    // Family filter
    if (familyFilter !== 'ALL' && p.currentTier.family !== familyFilter) {
      return false;
    }

    // Specific tier filter
    if (tierFilter !== 'ALL' && p.currentTier.id !== tierFilter) {
      return false;
    }

    return true;
  });

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, familyFilter, tierFilter]);

  const paginatedProfiles = useMemo(() => {
    const start = (page - 1) * 10;
    return filteredProfiles.slice(start, start + 10);
  }, [filteredProfiles, page]);

  return (
    <AdminLayout
      title="Hồ Sơ Điểm & Hạng Thành Viên"
      subtitle="Danh sách khách hàng thành viên, cấp hạng 12 bậc và tổng hợp điểm thưởng"
    >
      <div className="space-y-6">
        <AdminLoyaltyNav />

        {/* Security & Integrity Alert */}
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-start gap-3 text-xs text-[var(--text-secondary)] font-sans shadow-sm">
          <ShieldAlert className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-[var(--text-primary)]">Chính sách bảo mật & toàn vẹn dữ liệu điểm thưởng:</p>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Theo quy định của Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15, quản trị viên không được phép tự ý sửa đổi số dư điểm của khách hàng trực tiếp qua trình duyệt. Mọi điều chỉnh điểm thủ công đòi hỏi API máy chủ có xác thực RBAC hai lớp, ghi nhận lý do điều chỉnh và lưu trữ nhật ký kiểm toán vĩnh viễn (Audit Trail).
            </p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên, email, số điện thoại hoặc mã thành viên..."
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-sm pl-10 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Family Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] font-mono">Nhóm:</span>
              <select
                value={familyFilter}
                onChange={(e) => {
                  setFamilyFilter(e.target.value as any);
                  setTierFilter('ALL');
                }}
                className="bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-sm px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value="ALL">Tất cả nhóm</option>
                <option value="bronze">Nhóm Đồng (I, II, III)</option>
                <option value="silver">Nhóm Bạc (I, II, III)</option>
                <option value="gold">Nhóm Vàng (I, II, III)</option>
                <option value="diamond">Nhóm Kim Cương (I, II, III)</option>
              </select>
            </div>

            {/* Specific Tier Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] font-mono">Cấp hạng:</span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-sm px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value="ALL">Tất cả 12 cấp</option>
                {MEMBERSHIP_TIERS.filter((t) => familyFilter === 'ALL' || t.family === familyFilter).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameVi} ({t.minPoints.toLocaleString('vi-VN')} điểm)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-card-muted)] text-[var(--text-muted)] text-[10px] uppercase font-mono tracking-wider">
                  <th className="py-3.5 px-3 w-12 text-center">STT</th>
                  <th className="py-3.5 px-4">Thành Viên</th>
                  <th className="py-3.5 px-4">Cấp Hạng</th>
                  <th className="py-3.5 px-4 text-right">Điểm Xét Hạng</th>
                  <th className="py-3.5 px-4 text-right">Tích Lũy</th>
                  <th className="py-3.5 px-4 text-right">Thu Hồi</th>
                  <th className="py-3.5 px-4 text-right">Số Dư Khả Dụng</th>
                  <th className="py-3.5 px-4 text-right">Đơn Hàng</th>
                  <th className="py-3.5 px-4 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[var(--text-muted)]">
                      Đang xử lý dữ liệu đơn hàng và điểm thưởng...
                    </td>
                  </tr>
                ) : filteredProfiles.length > 0 ? (
                  paginatedProfiles.map((p, idx) => (
                    <tr key={p.customerId} className="hover:bg-[var(--table-row-hover)] transition-colors">
                      <td className="py-3.5 px-3 text-center font-mono text-xs text-[var(--text-muted)]">
                        {(page - 1) * 10 + idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] font-serif text-sm flex items-center justify-center font-bold shrink-0">
                            {p.customerName ? p.customerName.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-medium text-[var(--text-primary)] truncate">{p.customerName}</p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate font-mono">
                              {p.customerEmail || p.customerPhone || p.customerId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold border ${p.currentTier.badgeColor}`}>
                          {p.currentTier.nameVi}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[var(--accent)] whitespace-nowrap">
                        {p.qualifyingPoints.toLocaleString('vi-VN')} điểm
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        +{p.earnedPoints.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        {p.reversedPoints > 0 ? `-${p.reversedPoints.toLocaleString('vi-VN')}` : '0'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[var(--text-primary)] whitespace-nowrap">
                        {p.currentBalance.toLocaleString('vi-VN')} điểm
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[var(--text-secondary)] whitespace-nowrap">
                        {p.eligibleOrdersCount} đơn
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <AdminActionGroup className="justify-center">
                          <ViewActionButton
                            onClick={() => setSelectedCustomer(p)}
                            title="Xem sổ cái chi tiết của thành viên này"
                            label="Chi tiết"
                          />
                        </AdminActionGroup>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--text-muted)]">
                      Không tìm thấy thành viên nào phù hợp bộ lọc tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={page}
            totalItems={filteredProfiles.length}
            pageSize={10}
            onPageChange={setPage}
            itemName="thành viên"
          />
        </div>

        {/* Modal: Customer Ledger History */}
        {selectedCustomer && (
          <ModalPortal>
            <div
              className="fixed inset-0 bg-[rgba(26,26,23,0.55)] backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
              style={{ zIndex: overlayZIndex }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedCustomer(null);
              }}
              role="dialog"
              aria-modal="true"
              aria-label={`Sổ Cái Điểm: ${selectedCustomer.customerName}`}
            >
              <div
                className="bg-[var(--surface)] border border-[var(--border)] rounded-sm w-full max-w-3xl max-h-[calc(100dvh-32px)] flex flex-col overflow-hidden shadow-2xl text-[var(--text)] admin-content-scrollbar"
                style={{ zIndex: contentZIndex }}
              >
              {/* Modal Header */}
              <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] font-bold font-serif">
                    {selectedCustomer.customerName ? selectedCustomer.customerName.charAt(0) : 'P'}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text)] font-sans uppercase tracking-wider">
                      Sổ Cái Điểm: {selectedCustomer.customerName}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">
                      Cấp hạng: <strong className="text-[var(--accent)]">{selectedCustomer.currentTier.nameVi}</strong> • Điểm xét hạng: {selectedCustomer.qualifyingPoints.toLocaleString('vi-VN')} điểm
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] rounded transition-colors"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: Transaction Ledger */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {selectedCustomer.transactions && selectedCustomer.transactions.length > 0 ? (
                  <div className="overflow-x-auto border border-[var(--border)] rounded-sm">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-[var(--bg-alt)] border-b border-[var(--border)] text-[var(--text-muted)] text-[10px] uppercase font-mono">
                        <tr>
                          <th className="py-2.5 px-2 w-10 text-center">STT</th>
                          <th className="py-2.5 px-3">Thời gian</th>
                          <th className="py-2.5 px-3">Mã GD</th>
                          <th className="py-2.5 px-3">Loại</th>
                          <th className="py-2.5 px-3">Đơn Hàng</th>
                          <th className="py-2.5 px-3">Lý do</th>
                          <th className="py-2.5 px-3 text-right">Biến động</th>
                          <th className="py-2.5 px-3 text-right">Số dư</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {selectedCustomer.transactions.map((tx: any, idx: number) => (
                          <tr key={tx.id} className="hover:bg-[var(--bg-alt)]/50 transition-colors">
                            <td className="py-2.5 px-2 text-center font-mono text-[11px] text-[var(--text-muted)]">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                              {formatDate(tx.createdAt)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--accent)] whitespace-nowrap">
                              {tx.id}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {tx.eventType === 'EARN' ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  Tích điểm
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  Thu hồi
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--text)] whitespace-nowrap">
                              #{String(tx.orderCode || tx.orderId).slice(-8)}
                            </td>
                            <td className="py-2.5 px-3 text-[var(--text-muted)] max-w-xs truncate">
                              {tx.reason}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                              {tx.pointsDelta > 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400">+{tx.pointsDelta}</span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400">{tx.pointsDelta}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[var(--text)] whitespace-nowrap font-medium">
                              {tx.newBalance.toLocaleString('vi-VN')} điểm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-[var(--text-muted)] text-xs bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm">
                    Chưa có lịch sử giao dịch điểm nào được ghi nhận cho thành viên này.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[var(--border)] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] hover:text-[var(--accent)] bg-[var(--bg-card)] rounded-lg text-xs font-mono uppercase tracking-wider transition-all shadow-xs hover:shadow-sm cursor-pointer"
                >
                  Đóng
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
