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

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Quick status toggle
  const handleToggleStatus = async (camp: Campaign) => {
    const nextStatus: CampaignStatus =
      camp.status === 'active' ? 'ended' : 'active';

    try {
      await campaignsApi.updateCampaign(camp._id, { status: nextStatus });
      addToast(`Đã chuyển trạng thái chiến dịch thành "${nextStatus}".`, 'success');
      fetchCampaigns();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Không thể cập nhật trạng thái.', 'error');
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deletingCampaign) return;
    setIsDeleting(true);
    try {
      await campaignsApi.deleteCampaign(deletingCampaign._id);
      addToast('Chiến dịch đã được xóa thành công.', 'success');
      setDeletingCampaign(null);
      fetchCampaigns();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Lỗi khi xóa chiến dịch.', 'error');
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
              className="px-3.5 py-2 bg-[var(--bg-card)] hover:bg-[var(--table-row-hover)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-sm flex items-center gap-2 transition-colors shadow-sm"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--accent)]' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <Link
              to="/admin/campaigns/new"
              className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 text-xs font-serif font-semibold tracking-wider uppercase rounded-sm flex items-center gap-2 transition-opacity shadow-md"
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
              <span>Đang kết nối API Backend tải danh sách chiến dịch...</span>
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
                    <th className="py-3 px-4">Chiến Dịch</th>
                    <th className="py-3 px-4">Loại</th>
                    <th className="py-3 px-4">Thời Gian Diễn Ra</th>
                    <th className="py-3 px-4">Ưu Tiên</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {campaigns.map((camp) => {
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
                          {camp.type === 'flash_sale' ? (
                            <span className="text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 border border-amber-500/20 rounded-xs text-[10px] uppercase">
                              Flash Sale
                            </span>
                          ) : (
                            <span className="text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 border border-purple-500/20 rounded-xs text-[10px] uppercase">
                              Sự Kiện Mùa
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[11px] text-[var(--text-secondary)] font-mono">
                          <div>{start}</div>
                          <div className="text-[var(--text-muted)]">đến {end}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <span className="bg-[var(--bg-card-muted)] text-[var(--accent)] px-2 py-0.5 rounded-xs border border-[var(--border)] font-bold">
                            {camp.priority || 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {getStatusBadge(camp.status)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(camp)}
                              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--table-row-hover)] rounded-xs transition-colors"
                              title={camp.status === 'active' ? 'Kết thúc chiến dịch' : 'Kích hoạt chiến dịch'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            <Link
                              to={`/admin/campaigns/${camp._id}`}
                              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--table-row-hover)] rounded-xs transition-colors"
                              title="Xem chi tiết & Thống kê"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>

                            <Link
                              to={`/admin/campaigns/${camp._id}/edit`}
                              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--table-row-hover)] rounded-xs transition-colors"
                              title="Chỉnh sửa chiến dịch"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => setDeletingCampaign(camp)}
                              className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-xs transition-colors"
                              title="Xóa chiến dịch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
            <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <div>
                Trang {page} / {totalPages} (Tổng {total} bản ghi)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-[var(--bg-card-muted)] border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--table-row-hover)] text-[var(--text-primary)] rounded-xs transition-colors"
                >
                  Trước
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 bg-[var(--bg-card-muted)] border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--table-row-hover)] text-[var(--text-primary)] rounded-xs transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCampaign && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto"
            style={{ zIndex: deleteOverlayZ }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) setDeletingCampaign(null);
            }}
          >
            <div
              className="w-full max-w-md bg-[var(--bg-card)] border border-rose-500/40 p-6 rounded-sm text-[var(--text-primary)] shadow-2xl max-h-[calc(100dvh-32px)] overflow-y-auto"
              style={{ zIndex: deleteContentZ }}
            >
              <div className="flex items-center gap-3 text-rose-500 mb-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-serif text-base uppercase tracking-wider font-medium">
                  Xác Nhận Xóa Chiến Dịch
                </h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
                Bạn có chắc chắn muốn xóa chiến dịch{' '}
                <strong className="text-[var(--text-primary)]">"{deletingCampaign.name}"</strong>? Thao tác này sẽ dừng
                mọi hiển thị Popup và gỡ bỏ ưu đãi của các sản phẩm liên quan. Lịch sử đơn hàng vẫn
                được bảo toàn.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingCampaign(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-[var(--bg-card-muted)] border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-sm transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white rounded-sm shadow-md"
                >
                  {isDeleting ? 'Đang xóa...' : 'Xác Nhận Xóa'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </AdminLayout>
  );
};
