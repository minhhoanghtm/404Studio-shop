import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Tag,
  BarChart2,
  Power,
} from 'lucide-react';
import { AdminLayout } from '../Admin/AdminLayout';
import { campaignsApi } from '@/shared/api';
import { Campaign, CampaignStatus, CampaignType } from '@/shared/campaigns';
import { useToastStore } from '@/shared/stores/useToastStore';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';
import { TablePagination } from '@/shared/components/TablePagination';
import { StatusToggle } from '@/shared/components/StatusToggle';
import { StatusBadge } from '@/shared/components/StatusBadge';
import {
  AdminActionGroup,
  EditActionButton,
  DeleteActionButton,
  ViewActionButton,
} from '@/shared/components/AdminActionButton';

export const AdminCampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Deletion state
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { overlayZIndex: deleteOverlayZ, contentZIndex: deleteContentZ } = useModal({
    id: 'admin-campaign-delete-modal',
    isOpen: Boolean(deletingCampaign),
    onClose: () => setDeletingCampaign(null),
  });

  const fetchCampaigns = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await campaignsApi.getAdminCampaigns({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
      });

      if (response && response.data) {
        setCampaigns(response.data.campaigns || []);
        setTotal(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      console.error('[AdminCampaignsPage] Error loading campaigns:', err);
      setError(err?.response?.data?.message || 'Không thể tải danh sách chiến dịch.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, limit, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Quick status toggle
  const handleToggleStatus = async (camp: Campaign) => {
    const nextStatus: CampaignStatus =
      camp.status === 'active' ? 'ended' : 'active';
    const prevStatus = camp.status;

    // Cập nhật trực tiếp cục bộ, không reload lại toàn bộ bảng
    setCampaigns((prev) =>
      prev.map((c) => (c._id === camp._id ? { ...c, status: nextStatus } : c))
    );

    try {
      await campaignsApi.updateCampaign(camp._id, { status: nextStatus });
      addToast(`Đã chuyển trạng thái chiến dịch thành "${nextStatus}".`, 'success');
      void fetchCampaigns(true);
    } catch (err: any) {
      // Hoàn tác nếu lỗi
      setCampaigns((prev) =>
        prev.map((c) => (c._id === camp._id ? { ...c, status: prevStatus } : c))
      );
      addToast(err?.response?.data?.message || 'Không thể cập nhật trạng thái.', 'error');
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deletingCampaign) return;
    const targetId = deletingCampaign._id;
    setIsDeleting(true);

    // Xóa trực tiếp khỏi bảng hiển thị, không làm bảng nhấp nháy spinner
    setCampaigns((prev) => prev.filter((c) => c._id !== targetId));
    setTotal((prev) => Math.max(0, prev - 1));

    try {
      await campaignsApi.deleteCampaign(targetId);
      addToast('Chiến dịch đã được xóa thành công.', 'success');
      setDeletingCampaign(null);
      void fetchCampaigns(true);
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Lỗi khi xóa chiến dịch.', 'error');
      void fetchCampaigns();
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs text-[11px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" />
            Đang Diễn Ra
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs text-[11px] font-mono uppercase bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Clock className="w-3 h-3" />
            Đã Lên Lịch
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs text-[11px] font-mono uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            Bản Nháp
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs text-[11px] font-mono uppercase bg-white/10 text-white/50 border border-white/20">
            Đã Kết Thúc
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs text-[11px] font-mono uppercase bg-white/10 text-white/50 border border-white/20">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminLayout
      title="Chiến Dịch & Khuyến Mãi"
      subtitle="Quản lý toàn diện các chương trình Sale, Flash Sale, Popup Banner và Smart Redirect"
    >
      <div className="space-y-6">
        {/* Top Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-[var(--text-primary)] tracking-wide">
              Danh Sách Chiến Dịch Quảng Bá
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Tổng cộng {total} chiến dịch khuyến mãi được ghi nhận trên hệ thống Atelier Vérité.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchCampaigns()}
              className="px-3.5 py-2 bg-[var(--bg-card)] hover:bg-[var(--table-row-hover)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] text-xs font-mono uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all shadow-xs hover:shadow-sm cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--accent)]' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <Link
              to="/admin/campaigns/new"
              className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)] hover:brightness-105 text-xs font-mono font-bold tracking-wider uppercase rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Chiến Dịch Mới</span>
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-sm grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-sm">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên chiến dịch hoặc slug..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-sm pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-sm px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="all">Tất Cả Trạng Thái</option>
              <option value="active">Đang Diễn Ra (Active)</option>
              <option value="scheduled">Đã Lên Lịch (Scheduled)</option>
              <option value="draft">Bản Nháp (Draft)</option>
              <option value="ended">Đã Kết Thúc (Ended)</option>
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-sm px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="all">Tất Cả Loại Chiến Dịch</option>
              <option value="flash_sale">Flash Sale (Ưu đãi chớp nhoáng)</option>
              <option value="seasonal">Sự Kiện Theo Mùa (Seasonal)</option>
            </select>
          </div>
        </div>

        {/* Campaign List Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 rounded-full border border-[var(--accent)]/40 border-t-[var(--accent)] animate-spin" />
              <span>Đang tải dữ liệu...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-500 bg-rose-500/5">
              <AlertCircle className="w-5 h-5 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--text-muted)]">
              <Sparkles className="w-8 h-8 text-[var(--accent)]/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Chưa có chiến dịch nào được tìm thấy</p>
              <p className="text-[var(--text-muted)] mb-4">
                Hãy bắt đầu tạo chiến dịch Flash Sale hoặc sự kiện mùa đầu tiên để kích hoạt ưu đãi.
              </p>
              <Link
                to="/admin/campaigns/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] font-serif text-xs uppercase tracking-wider font-semibold rounded-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo Chiến Dịch Ngay</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--bg-card-muted)] border-b border-[var(--border)] text-[11px] font-mono uppercase text-[var(--text-muted)] tracking-wider">
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Chiến Dịch</th>
                    <th className="py-3 px-4">Loại</th>
                    <th className="py-3 px-4">Thời Gian Diễn Ra</th>
                    <th className="py-3 px-4">Ưu Tiên</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {campaigns.map((camp, idx) => {
                    const start = new Date(camp.startAt).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const end = new Date(camp.endAt).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr
                        key={camp._id}
                        className="hover:bg-[var(--table-row-hover)] transition-colors group"
                      >
                        <td className="py-3.5 px-3 text-center font-mono text-xs text-[var(--text-muted)]">
                          {(page - 1) * limit + idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <Link
                            to={`/admin/campaigns/${camp._id}`}
                            className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors block text-sm"
                          >
                            {camp.name}
                          </Link>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                            <span>Slug: {camp.slug}</span>
                            {camp.bannerId && (
                              <span className="text-[var(--accent)] flex items-center gap-0.5">
                                • Có Popup Banner
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <StatusBadge
                            variant={camp.type === 'flash_sale' ? 'warning' : 'purple'}
                            uppercase={true}
                          >
                            {camp.type === 'flash_sale' ? 'Flash Sale' : 'Sự Kiện Mùa'}
                          </StatusBadge>
                        </td>

                        <td className="py-3.5 px-4 text-[11px] text-[var(--text-secondary)] font-mono">
                          <div>{start}</div>
                          <div className="text-[var(--text-muted)]">đến {end}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <StatusBadge variant="neutral" size="sm">
                            Ưu tiên: {camp.priority || 0}
                          </StatusBadge>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusToggle
                            checked={camp.status === 'active'}
                            onChange={() => handleToggleStatus(camp)}
                            activeLabel="Hoạt Động"
                            inactiveLabel={camp.status === 'scheduled' ? 'Lên Lịch' : 'Tạm Dừng'}
                            ariaLabel="Bật / tắt trạng thái chiến dịch"
                          />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <AdminActionGroup>
                            <ViewActionButton
                              to={`/admin/campaigns/${camp._id}`}
                              title="Xem chi tiết & Thống kê"
                            />
                            <EditActionButton
                              to={`/admin/campaigns/${camp._id}/edit`}
                              title="Chỉnh sửa chiến dịch"
                            />
                            <DeleteActionButton
                              onClick={() => setDeletingCampaign(camp)}
                              title="Xóa chiến dịch"
                            />
                          </AdminActionGroup>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              pageSize={limit}
              onPageChange={setPage}
              itemName="chiến dịch"
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCampaign && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Xác Nhận Xóa Chiến Dịch"
            className="fixed inset-0 flex items-center justify-center p-4 bg-[rgba(26,26,23,0.55)] backdrop-blur-sm pointer-events-auto"
            style={{ zIndex: deleteOverlayZ }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) setDeletingCampaign(null);
            }}
          >
            <div
              className="w-full max-w-md bg-[var(--surface)] border border-red-500/40 p-6 rounded-sm text-[var(--text)] shadow-2xl max-h-[calc(100dvh-32px)] overflow-y-auto admin-content-scrollbar"
              style={{ zIndex: deleteContentZ }}
            >
              <div className="flex items-center gap-2.5 text-red-500 mb-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-display text-base font-semibold uppercase tracking-wider text-[var(--text)]">
                  Xác Nhận Xóa Chiến Dịch
                </h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
                Bạn có chắc chắn muốn xóa chiến dịch{' '}
                <strong className="text-[var(--text)]">"{deletingCampaign.name}"</strong>? Thao tác này sẽ dừng
                mọi hiển thị Popup và gỡ bỏ ưu đãi của các sản phẩm liên quan. Lịch sử đơn hàng vẫn
                được bảo toàn.
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setDeletingCampaign(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--text)] rounded-sm text-xs font-mono uppercase tracking-wider hover:bg-[var(--bg-alt)] transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-xs font-semibold text-white rounded-sm font-mono uppercase tracking-wider shadow-sm transition-colors"
                >
                  {isDeleting ? 'Đang Xóa...' : 'Xác Nhận Xóa'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </AdminLayout>
  );
};
