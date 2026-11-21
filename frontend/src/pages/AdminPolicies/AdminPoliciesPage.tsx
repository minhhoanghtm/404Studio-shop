import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  History,
  Trash2,
  CheckCircle,
  Archive,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { AdminLayout } from '../Admin/AdminLayout';
import { adminPoliciesApi, PolicyDocument } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';
import { POLICY_CATEGORIES, PolicyStatusFilter } from './types';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';

export const AdminPoliciesPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PolicyStatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Deletion modal state
  const [deletingPolicy, setDeletingPolicy] = useState<PolicyDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { overlayZIndex, contentZIndex } = useModal({
    id: 'admin-delete-policy-modal',
    isOpen: Boolean(deletingPolicy),
    onClose: () => setDeletingPolicy(null),
  });

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminPoliciesApi.getPolicies({
        type: 'policy',
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search.trim() || undefined,
        page,
        limit,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });

      if (response && response.data) {
        setPolicies(response.data.pages || []);
        setTotal(response.data.total || 0);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách chính sách từ máy chủ Backend');
      addToast({
        title: 'Lỗi nạp dữ liệu',
        message: err?.message || 'Lỗi kết nối Backend API',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, search, addToast]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleQuickStatusChange = async (policy: PolicyDocument, newStatus: 'published' | 'archived') => {
    try {
      await adminPoliciesApi.updatePolicy(policy._id, {
        status: newStatus,
        publishedAt: newStatus === 'published' ? new Date().toISOString() : policy.publishedAt,
      });
      addToast({
        title: 'Cập nhật trạng thái thành công',
        message: `Chính sách "${policy.title}" đã được chuyển sang ${newStatus === 'published' ? 'ĐÃ XUẤT BẢN' : 'LƯU TRỮ'}.`,
        type: 'success',
      });
      fetchPolicies();
    } catch (err: any) {
      addToast({
        title: 'Cập nhật thất bại',
        message: err?.message || 'Không thể thay đổi trạng thái chính sách',
        type: 'error',
      });
    }
  };

  const confirmDelete = async () => {
    if (!deletingPolicy) return;
    setIsDeleting(true);
    try {
      await adminPoliciesApi.deletePolicy(deletingPolicy._id);
      addToast({
        title: 'Xóa chính sách thành công',
        message: `Chính sách "${deletingPolicy.title}" đã được gỡ bỏ khỏi hệ thống.`,
        type: 'success',
      });
      setDeletingPolicy(null);
      fetchPolicies();
    } catch (err: any) {
      addToast({
        title: 'Lỗi xóa chính sách',
        message: err?.message || 'Không thể xóa chính sách',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const publishedCount = policies.filter((p) => p.status === 'published').length;
  const draftCount = policies.filter((p) => p.status === 'draft').length;
  const archivedCount = policies.filter((p) => p.status === 'archived').length;

  return (
    <AdminLayout
      title="Quản Lý Chính Sách Doanh Nghiệp"
      subtitle="Quản trị vòng đời chính sách pháp lý & quy định vận hành Atelier Vérité"
    >
      <div className="space-y-6">
        {/* KPI / Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-sm bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Tổng Chính Sách</p>
              <h3 className="font-display text-2xl text-[var(--text-primary)] mt-1">{total}</h3>
            </div>
            <div className="w-10 h-10 rounded-sm bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-sm bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Đang Có Hiệu Lực</p>
              <h3 className="font-display text-2xl text-[var(--text-primary)] mt-1">{publishedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-sm bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-sm bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">Bản Thảo / Nháp</p>
              <h3 className="font-display text-2xl text-[var(--text-primary)] mt-1">{draftCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-sm bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-sm bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Đã Lưu Trữ</p>
              <h3 className="font-display text-2xl text-[var(--text-primary)] mt-1">{archivedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-sm bg-[var(--bg-card-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
              <Archive className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Action Header & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] p-4 border border-[var(--border)] rounded-sm shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm kiếm theo tiêu đề chính sách hoặc mã slug..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {/* Controls: Filter & Create button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] hidden sm:inline-block" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as PolicyStatusFilter);
                  setPage(1);
                }}
                className="bg-[var(--input-bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] px-3 py-2 rounded-sm focus:outline-none focus:border-[var(--accent)]"
                aria-label="Lọc theo trạng thái"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="published">Đã xuất bản (Có hiệu lực)</option>
                <option value="draft">Bản nháp (Đang soạn thảo)</option>
                <option value="archived">Đã lưu trữ (Ngừng áp dụng)</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)] hidden sm:inline-block" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[var(--input-bg)] border border-[var(--border)] text-xs text-[var(--text-primary)] px-3 py-2 rounded-sm focus:outline-none focus:border-[var(--accent)]"
                aria-label="Lọc theo danh mục"
              >
                {POLICY_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchPolicies()}
              className="p-2 border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--accent)] rounded-sm transition-colors bg-[var(--bg-card-muted)]"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--accent)]' : ''}`} />
            </button>

            {/* Create New Policy CTA */}
            <Link
              to="/admin/policies/new"
              className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold text-xs uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Chính Sách Mới</span>
            </Link>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-sm bg-red-950/40 border border-red-500/40 flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchPolicies()}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 border border-red-400/40 text-[11px] uppercase tracking-wider rounded-sm transition-colors"
            >
              Thử Lại
            </button>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-card-muted)] border-b border-[var(--border)] text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-mono">
                <tr>
                  <th className="px-5 py-4">Tên Chính Sách & Đường Dẫn</th>
                  <th className="px-4 py-4">Phân Loại</th>
                  <th className="px-4 py-4">Trạng Thái</th>
                  <th className="px-4 py-4">Lượt Xem</th>
                  <th className="px-4 py-4">Cập Nhật Lần Cuối</th>
                  <th className="px-5 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-sans">
                {loading ? (
                  // Loading Skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4">
                        <div className="h-4 bg-[var(--border)] rounded w-48 mb-2" />
                        <div className="h-3 bg-[var(--bg-card-muted)] rounded w-24" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-[var(--bg-card-muted)] rounded w-20" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-5 bg-[var(--border)] rounded-full w-24" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-[var(--bg-card-muted)] rounded w-12" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-[var(--bg-card-muted)] rounded w-28" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="h-6 bg-[var(--border)] rounded w-32 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : policies.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-full bg-[var(--bg-card-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
                          <FileText className="w-6 h-6" />
                        </div>
                        <h4 className="font-display text-base text-[var(--text-primary)]">Chưa có chính sách nào phù hợp</h4>
                        <p className="text-xs text-[var(--text-muted)]">
                          Không tìm thấy chính sách nào theo tiêu chí tìm kiếm hiện tại. Bạn có thể tạo mới chính sách để ban hành cho khách hàng.
                        </p>
                        <div className="pt-2">
                          <Link
                            to="/admin/policies/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tạo Chính Sách Đầu Tiên</span>
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Data Rows
                  policies.map((policy) => {
                    return (
                      <tr key={policy._id} className="hover:bg-[var(--table-row-hover)] transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-medium text-[var(--text-primary)] text-sm tracking-wide">
                            {policy.title}
                          </div>
                          <div className="text-[11px] font-mono text-[var(--accent)] mt-0.5">
                            /{policy.slug}
                          </div>
                          {policy.excerpt && (
                            <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-1 max-w-sm">
                              {policy.excerpt}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 rounded-sm bg-[var(--bg-card-muted)] border border-[var(--border)] text-[11px] font-mono uppercase text-[var(--text-secondary)]">
                            {policy.type}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {policy.status === 'published' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Đã Xuất Bản
                            </span>
                          ) : policy.status === 'draft' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Bản Nháp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-card-muted)] border border-[var(--border)] text-[var(--text-muted)] text-[11px] font-medium">
                              <Archive className="w-3 h-3" />
                              Đã Lưu Trữ
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 font-mono text-[var(--text-primary)]">
                          {policy.viewCount ?? 0} lượt
                        </td>

                        <td className="px-4 py-4 text-[var(--text-muted)] text-[11px] font-mono">
                          {policy.updatedAt
                            ? new Date(policy.updatedAt).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Public View (if published) */}
                            {policy.status === 'published' && (
                              <a
                                href={`/${policy.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded hover:bg-[var(--table-row-hover)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                                title="Xem trang công khai"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/policies/${policy._id}/edit`)}
                              className="p-1.5 rounded hover:bg-[var(--table-row-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                              title="Chỉnh sửa nội dung"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Version History */}
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/policies/${policy._id}/history`)}
                              className="p-1.5 rounded hover:bg-[var(--table-row-hover)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                              title="Lịch sử phiên bản"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>

                            {/* Quick Publish / Archive Toggle */}
                            {policy.status !== 'published' ? (
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(policy, 'published')}
                                className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                                title="Xuất bản chính sách này"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(policy, 'archived')}
                                className="p-1.5 rounded hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors"
                                title="Ngừng hiệu lực & Lưu trữ"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeletingPolicy(policy)}
                              className="p-1.5 rounded hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                              title="Xóa chính sách"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-card-muted)]">
              <div>
                Hiển thị trang <span className="font-semibold text-[var(--text-primary)]">{page}</span> / {totalPages} (Tổng cộng {total} chính sách)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-[var(--border)] rounded-sm hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-30 disabled:hover:border-[var(--border)] disabled:hover:text-[var(--text-muted)] transition-colors uppercase tracking-wider text-[11px] bg-[var(--bg-card)]"
                >
                  Trang Trước
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border border-[var(--border)] rounded-sm hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-30 disabled:hover:border-[var(--border)] disabled:hover:text-[var(--text-muted)] transition-colors uppercase tracking-wider text-[11px] bg-[var(--bg-card)]"
                >
                  Trang Tiếp
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deletingPolicy && (
          <ModalPortal>
            <div
              className="fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in pointer-events-auto"
              style={{ zIndex: overlayZIndex }}
              onClick={(e) => {
                if (e.target === e.currentTarget && !isDeleting) setDeletingPolicy(null);
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Xác nhận xóa chính sách"
            >
              <div
                className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-6 space-y-4 shadow-2xl max-h-[calc(100dvh-32px)] overflow-y-auto"
                style={{ zIndex: contentZIndex }}
              >
              <div className="flex items-center gap-3 text-red-500">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-[var(--text-primary)]">Xác nhận xóa chính sách</h3>
                  <p className="text-xs text-[var(--text-muted)]">Thao tác này sẽ xóa vĩnh viễn khỏi CSDL.</p>
                </div>
              </div>

              <div className="p-3 bg-[var(--bg-card-muted)] border border-[var(--border)] rounded text-xs space-y-1">
                <div className="text-[var(--text-primary)] font-medium">{deletingPolicy.title}</div>
                <div className="text-[var(--text-muted)] font-mono">/{deletingPolicy.slug}</div>
              </div>

              {deletingPolicy.status === 'published' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-700 dark:text-amber-200">
                  <strong>Cảnh báo pháp lý:</strong> Chính sách này đang có hiệu lực công khai. Việc xóa có thể ảnh hưởng đến bằng chứng đồng thuận pháp lý của khách hàng. Khuyến nghị chuyển sang trạng thái <em>Lưu trữ (archived)</em> thay vì xóa vĩnh viễn.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingPolicy(null)}
                  className="px-4 py-2 border border-[var(--border)] hover:border-[var(--text-muted)] text-xs uppercase tracking-wider text-[var(--text-primary)] rounded-sm transition-colors bg-[var(--bg-card-muted)]"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2 shadow-md"
                >
                  {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xác Nhận Xóa</span>
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
