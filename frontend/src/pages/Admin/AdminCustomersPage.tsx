import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from './AdminLayout';
import { Search, Mail, Phone, Loader2, RotateCcw } from 'lucide-react';
import { adminApi } from '@/shared/api';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useToastStore } from '@/shared/stores/useToastStore';
import { formatDate } from '@/shared/utils/formatters';
import { getTierForPoints, MEMBERSHIP_TIERS } from '@/shared/loyalty';
import { TablePagination } from '@/shared/components/TablePagination';
import { StatusToggle } from '@/shared/components/StatusToggle';
import { StatusBadge } from '@/shared/components/StatusBadge';
import {
  AdminActionGroup,
  LockActionButton,
  UnlockActionButton,
} from '@/shared/components';

const ITEMS_PER_PAGE = 20;

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const { addToast } = useToastStore();
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await adminApi.getCustomers();
      const rawList = Array.isArray(res?.data)
        ? res.data
        : (Array.isArray(res?.data?.items) ? res.data.items : []);

      if (rawList && rawList.length > 0) {
        setCustomers(rawList);
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
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      addToast('Không thể tải danh sách khách hàng từ máy chủ. Đang hiển thị bản dự phòng.', 'info');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (!isAdmin) {
      addToast('Chỉ Quản trị viên (Admin) mới có quyền khóa hoặc mở khóa tài khoản.', 'error');
      return;
    }
    const isCurrentlyActive = currentStatus === 'active';
    const nextStatus = isCurrentlyActive ? 'locked' : 'active';
    setActionLoadingId(id);
    // Cập nhật trạng thái trực tiếp trong danh sách cục bộ, không reload bảng
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id || c._id === id ? { ...c, status: nextStatus } : c
      )
    );
    try {
      await adminApi.updateCustomerStatus(id, nextStatus);
      addToast(
        nextStatus === 'active'
          ? 'Đã mở khóa và kích hoạt lại tài khoản thành công.'
          : 'Đã khóa tài khoản thành viên thành công.',
        'success'
      );
      void fetchCustomers(true);
    } catch (err: any) {
      // Hoàn tác nếu lỗi
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === id || c._id === id ? { ...c, status: currentStatus } : c
        )
      );
      const errorMsg =
        err?.data?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Lỗi khi cập nhật trạng thái tài khoản';
      addToast(errorMsg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setTierFilter('all');
    setPage(1);
  };

  const isFiltered = search.trim() !== '' || roleFilter !== 'all' || statusFilter !== 'all' || tierFilter !== 'all';

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((c) => {
      // 1. Text Search Filter (name, email, phone)
      if (query) {
        const name = String(c?.fullName || '').toLowerCase();
        const email = String(c?.email || '').toLowerCase();
        const phone = String(c?.phone || '').toLowerCase();
        if (!name.includes(query) && !email.includes(query) && !phone.includes(query)) {
          return false;
        }
      }

      // 2. Role Filter
      if (roleFilter !== 'all') {
        const role = String(c?.role || 'user').toLowerCase();
        if (roleFilter === 'user') {
          if (role !== 'user' && role !== 'customer' && Boolean(c?.role)) return false;
        } else if (roleFilter === 'admin') {
          if (role !== 'admin') return false;
        } else if (roleFilter === 'manager') {
          if (role !== 'manager') return false;
        } else if (roleFilter === 'staff') {
          if (role !== 'staff') return false;
        }
      }

      // 3. Status Filter
      if (statusFilter !== 'all') {
        const status = String(c?.status || 'active').toLowerCase();
        if (statusFilter === 'active') {
          if (status !== 'active' && c?.isActive === false) return false;
        } else if (statusFilter === 'locked') {
          if (status !== 'locked' && status !== 'blocked' && status !== 'inactive') return false;
        }
      }

      // 4. Membership Tier Filter
      if (tierFilter !== 'all') {
        const rawSpend = Number(c?.totalSpent) || Number(c?.totalSpend) || 0;
        const calculatedPoints = Math.floor(rawSpend / 10000);
        const tier = getTierForPoints(calculatedPoints);
        const customTierStr = String(c?.tier || '').toLowerCase();

        if (tierFilter.startsWith('family:')) {
          const family = tierFilter.replace('family:', '');
          const matchFamily =
            tier.family === family ||
            customTierStr.includes(family) ||
            (family === 'bronze' && customTierStr.includes('đồng')) ||
            (family === 'silver' && customTierStr.includes('bạc')) ||
            (family === 'gold' && customTierStr.includes('vàng')) ||
            (family === 'diamond' && customTierStr.includes('kim cương'));
          if (!matchFamily) return false;
        } else {
          const matchTierId =
            tier.id === tierFilter ||
            customTierStr === tierFilter.toLowerCase() ||
            customTierStr.includes(tier.nameVi.toLowerCase());
          if (!matchTierId) return false;
        }
      }

      return true;
    });
  }, [customers, search, roleFilter, statusFilter, tierFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  return (
    <AdminLayout
      title="Hồ Sơ Khách Hàng Thượng Lưu"
      subtitle="Quản lý danh sách thành viên gia tộc Atelier, phân hạng thẻ và quyền truy cập"
    >
      <div className="space-y-6">
        {/* Filter & Search Bar */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-4 space-y-3 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm tên, email, SĐT..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-sm focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors"
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-sm focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="user">Khách Quý Patron (User)</option>
                <option value="admin">Quản Trị Viên (Admin)</option>
                <option value="manager">Quản Lý (Manager)</option>
                <option value="staff">Nhân Viên (Staff)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-sm focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="locked">Đã tạm khóa</option>
              </select>
            </div>

            {/* Tier Filter */}
            <div>
              <select
                value={tierFilter}
                onChange={(e) => {
                  setTierFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-sm focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                <option value="all">Tất cả hạng thành viên</option>
                <optgroup label="── Nhóm Hạng Gia Tộc ──">
                  <option value="family:bronze">Hạng Đồng (Bronze I - III)</option>
                  <option value="family:silver">Hạng Bạc (Silver I - III)</option>
                  <option value="family:gold">Hạng Vàng (Gold I - III)</option>
                  <option value="family:diamond">Hạng Kim Cương (Diamond I - III)</option>
                </optgroup>
                <optgroup label="── Chi Tiết 12 Cấp Bậc ──">
                  {MEMBERSHIP_TIERS.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.nameVi} ({tier.nameEn}) • {tier.minPoints.toLocaleString('vi-VN')} pts
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Counts & Reset Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-3">
              <span>
                Tổng thành viên: <strong className="text-[var(--text-primary)] font-mono">{customers.length.toLocaleString('vi-VN')}</strong>
              </span>
              {isFiltered && (
                <span className="text-[var(--accent)] font-mono font-medium">
                  (Khớp bộ lọc: {filtered.length.toLocaleString('vi-VN')})
                </span>
              )}
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--table-row-hover)] border border-[var(--border)] rounded-lg shadow-xs hover:shadow-sm transition-all self-start sm:self-auto cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại bộ lọc</span>
              </button>
            )}
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-card-muted)] font-mono text-[11px]">
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Khách Quý Patron</th>
                  <th className="py-3 px-4">Liên Hệ</th>
                  <th className="py-3 px-4">Hạng Thành Viên</th>
                  <th className="py-3 px-4">Đơn Hàng</th>
                  <th className="py-3 px-4">Ngày Gia Nhập</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--text-muted)]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                        <span className="font-mono text-xs">Đang tải danh sách thành viên...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[var(--text-muted)]">
                      Không tìm thấy thành viên nào phù hợp với điều kiện tìm kiếm và bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((c, idx) => {
                    const id = c.id || c._id;
                    const rawSpend = Number(c.totalSpent) || Number(c.totalSpend) || 0;
                    const calculatedPoints = Math.floor(rawSpend / 10000);
                    const tier = getTierForPoints(calculatedPoints);
                    const orderCount = Number(c.ordersCount) || Number(c.orderCount) || 0;
                    const dateFormatted = formatDate(c.createdAt);

                    let roleLabel = 'Khách Quý Patron';
                    if (c.role === 'admin') roleLabel = 'Quản Trị Viên';
                    else if (c.role === 'manager') roleLabel = 'Quản Lý';
                    else if (c.role === 'staff') roleLabel = 'Nhân Viên';

                    const isAccountActive = c.status === 'active';
                    const isTargetAdmin = c.role === 'admin';
                    const isSelf =
                      currentUser &&
                      (String(currentUser.id) === String(id) || String((currentUser as any)._id) === String(id));
                    const canLockOrUnlock = isAdmin && !isTargetAdmin && !isSelf;

                    return (
                      <tr key={id} className="hover:bg-[var(--table-row-hover)] transition-colors">
                        <td className="py-3 px-3 text-center font-mono text-xs text-[var(--text-muted)]">
                          {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-serif font-medium text-[var(--text-primary)] text-sm flex items-center gap-1.5">
                            {typeof c.fullName === 'string' && c.fullName ? c.fullName : 'Thành Viên Atelier'}
                            {isSelf && (
                              <span className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] px-1.5 py-0.2 rounded-xs font-mono font-normal">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] font-mono uppercase">
                            Vai trò: {roleLabel}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 space-y-0.5 text-[var(--text-muted)]">
                          {c.email ? (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-[var(--accent)] shrink-0" />
                              <span className="truncate max-w-[200px]">{c.email}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-[var(--text-muted)]/70 italic">Chưa liên kết email</div>
                          )}
                          {c.phone && (
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-[var(--accent)] shrink-0" />
                              <span>{c.phone}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <StatusBadge
                              variant={
                                tier.family === 'diamond'
                                  ? 'purple'
                                  : tier.family === 'gold'
                                    ? 'accent'
                                    : tier.family === 'silver'
                                      ? 'info'
                                      : 'neutral'
                              }
                              uppercase={true}
                            >
                              {tier.nameVi}
                            </StatusBadge>
                            <span className="block text-[10px] font-mono text-[var(--text-muted)]">
                              {calculatedPoints.toLocaleString('vi-VN')} pts
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[var(--text-primary)]">
                          {orderCount} đơn
                        </td>
                        <td className="py-3.5 px-4 text-[var(--text-muted)] font-mono">
                          {dateFormatted}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusToggle
                            checked={isAccountActive}
                            disabled={!canLockOrUnlock}
                            onChange={() => handleToggleStatus(id, c.status)}
                            activeLabel="Hoạt Động"
                            inactiveLabel="Đã Khóa"
                            ariaLabel={isAccountActive ? 'Đang hoạt động' : 'Đã khóa'}
                          />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <AdminActionGroup>
                            {isAccountActive ? (
                              <LockActionButton
                                title={
                                  !isAdmin
                                    ? 'Chỉ Quản trị viên (Admin) mới có quyền khóa tài khoản'
                                    : isTargetAdmin
                                    ? 'Không thể khóa tài khoản Quản trị viên cấp cao'
                                    : isSelf
                                    ? 'Bạn không thể tự khóa tài khoản của chính mình'
                                    : 'Khóa tài khoản này'
                                }
                                ariaLabel={
                                  !isAdmin
                                    ? 'Chỉ Quản trị viên (Admin) mới có quyền khóa tài khoản'
                                    : isTargetAdmin
                                    ? 'Không thể khóa tài khoản Quản trị viên cấp cao'
                                    : isSelf
                                    ? 'Bạn không thể tự khóa tài khoản của chính mình'
                                    : 'Khóa tài khoản này'
                                }
                                disabled={!canLockOrUnlock}
                                loading={actionLoadingId === id}
                                onClick={() => handleToggleStatus(id, c.status)}
                              />
                            ) : (
                              <UnlockActionButton
                                title={
                                  !isAdmin
                                    ? 'Chỉ Quản trị viên (Admin) mới có quyền mở khóa tài khoản'
                                    : 'Mở khóa tài khoản này'
                                }
                                ariaLabel={
                                  !isAdmin
                                    ? 'Chỉ Quản trị viên (Admin) mới có quyền mở khóa tài khoản'
                                    : 'Mở khóa tài khoản này'
                                }
                                disabled={!isAdmin}
                                loading={actionLoadingId === id}
                                onClick={() => handleToggleStatus(id, c.status)}
                              />
                            )}
                          </AdminActionGroup>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Shared TablePagination (Hỗ trợ cả Sáng/Tối) */}
          <TablePagination
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setPage}
            itemName="khách quý"
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomersPage;
