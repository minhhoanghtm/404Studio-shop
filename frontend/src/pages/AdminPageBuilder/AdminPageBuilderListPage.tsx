/**
 * ATELIER VÉRITÉ — Admin Visual Page Builder & CMS Pages List
 * Management overview of all dynamic CMS pages and layouts.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Eye,
  Trash2,
  Sparkles,
  Layers,
  Star,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
} from 'lucide-react';
import { AdminLayout } from '@/pages/Admin/AdminLayout';
import { cmsPagesApi, PolicyDocument } from '@/shared/api';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';
import { TablePagination } from '@/shared/components/TablePagination';
import { StatusBadge } from '@/shared/components/StatusBadge';
import {
  AdminActionGroup,
  EditActionButton,
  DeleteActionButton,
  ViewActionButton,
} from '@/shared/components/AdminActionButton';

export const AdminPageBuilderListPage: React.FC = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<PolicyDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { overlayZIndex, contentZIndex } = useModal({
    id: 'admin-page-builder-delete-modal',
    isOpen: Boolean(deleteTarget),
    onClose: () => setDeleteTarget(null),
  });

  const fetchPages = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await cmsPagesApi.getPages({
        search: search || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        page,
        limit: 10,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      if (res?.data) {
        setPages(res.data.pages || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách trang');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [page, statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPages();
  };

  const handleToggleFeature = async (id: string) => {
    const targetPage = pages.find((p) => p._id === id);
    const nextFeatured = !targetPage?.isFeatured;

    // Cập nhật ghim trang trực tiếp trong state cục bộ
    setPages((prev) =>
      prev.map((p) => (p._id === id ? { ...p, isFeatured: nextFeatured } : p))
    );

    try {
      await cmsPagesApi.toggleFeature(id);
      void fetchPages(true);
    } catch (err: any) {
      // Hoàn tác nếu lỗi
      setPages((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isFeatured: !nextFeatured } : p))
      );
      alert(err?.message || 'Không thể thay đổi trạng thái nổi bật');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    const targetId = deleteTarget._id;
    setDeleting(true);

    // Xóa trang trực tiếp khỏi danh sách
    setPages((prev) => prev.filter((p) => p._id !== targetId));
    setTotalCount((prev) => Math.max(0, prev - 1));

    try {
      await cmsPagesApi.deletePage(targetId);
      setDeleteTarget(null);
      void fetchPages(true);
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi xóa trang');
      void fetchPages();
    } finally {
      setDeleting(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'lookbook': return 'Lookbook Thời Trang';
      case 'about': return 'Giới Thiệu (About)';
      case 'policy': return 'Chính Sách Pháp Lý';
      case 'landing': return 'Chiến Dịch (Landing)';
      case 'faq': return 'Hỏi Đáp (FAQ)';
      case 'guide': return 'Cẩm Nang May Đo';
      default: return type;
    }
  };

  return (
    <AdminLayout
      title="Thiết Kế Trang & Quản Lý Nội Dung"
      subtitle="Visual Page Builder — Tùy biến bố cục, nội dung đa phương tiện và chính sách doanh nghiệp"
    >
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-noir-900 border border-white/10 p-4 rounded-xl">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề hoặc từ khóa..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37]"
            />
          </form>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-noir-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
            >
              <option value="">Tất cả loại trang</option>
              <option value="lookbook">Lookbook</option>
              <option value="about">Về Chúng Tôi (About)</option>
              <option value="policy">Chính Sách (Policy)</option>
              <option value="landing">Chiến Dịch (Landing)</option>
              <option value="faq">Hỏi Đáp (FAQ)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-noir-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="published">Đã Xuất Bản</option>
              <option value="draft">Bản Nháp</option>
              <option value="archived">Lưu Trữ</option>
            </select>

            {/* Create Page Button */}
            <Link
              to="/admin/page-builder/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)] text-xs font-mono font-bold uppercase tracking-wider hover:brightness-105 transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thiết Kế Trang Mới</span>
            </Link>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-noir-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-white/60 font-mono">Đang tải danh sách trang CMS...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center space-y-2 text-red-400">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p className="text-sm">{error}</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <Layers className="w-12 h-12 text-[#d4af37]/40 mx-auto" />
              <h3 className="font-serif text-lg text-white">Chưa Có Trang Thiết Kế Nào</h3>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                Tạo trang mới để tự do tùy biến giao diện Lookbook, câu chuyện thương hiệu hoặc chính sách pháp lý.
              </p>
              <Link
                to="/admin/page-builder/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)] text-xs font-mono font-bold uppercase tracking-wider hover:brightness-105 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Bắt Đầu Thiết Kế</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-white/50 uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th className="px-3 py-3.5 w-12 text-center">STT</th>
                    <th className="px-5 py-3.5">Tiêu Đề & Đường Dẫn</th>
                    <th className="px-4 py-3.5">Phân Loại</th>
                    <th className="px-4 py-3.5">Trạng Thái</th>
                    <th className="px-4 py-3.5 text-center">Nổi Bật</th>
                    <th className="px-4 py-3.5 text-right">Lượt Xem</th>
                    <th className="px-4 py-3.5">Cập Nhật</th>
                    <th className="px-5 py-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {pages.map((p, idx) => (
                    <tr key={p._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-3 py-4 text-center font-mono text-xs text-white/50">
                        {(page - 1) * 10 + idx + 1}
                      </td>
                      <td className="px-5 py-4 space-y-1">
                        <div className="font-serif text-sm font-medium text-white">
                          {p.title}
                        </div>
                        <div className="font-mono text-[11px] text-[#d4af37]/80">
                          /{p.slug}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge variant="neutral">
                          {getTypeLabel(p.type)}
                        </StatusBadge>
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge
                          variant={p.status === 'published' ? 'success' : 'warning'}
                          dot={true}
                          uppercase={true}
                        >
                          {p.status === 'published' ? 'Đã Xuất Bản' : 'Bản Nháp'}
                        </StatusBadge>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeature(p._id)}
                          className={`p-1.5 rounded transition-colors ${
                            p.isFeatured
                              ? 'text-[#d4af37] bg-[#d4af37]/10'
                              : 'text-white/20 hover:text-white/60'
                          }`}
                          title={p.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </td>

                      <td className="px-4 py-4 text-right font-mono text-white/70">
                        {p.viewCount ? p.viewCount.toLocaleString('vi-VN') : 0}
                      </td>

                      <td className="px-4 py-4 text-white/50 text-[11px]">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('vi-VN') : '—'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <AdminActionGroup>
                          <ViewActionButton
                            to={`/admin/page-builder/${p._id}/preview`}
                            title="Xem trước giao diện"
                          />
                          <EditActionButton
                            to={`/admin/page-builder/${p._id}/edit`}
                            title="Mở Visual Page Builder"
                          />
                          <DeleteActionButton
                            onClick={() => setDeleteTarget(p)}
                            title="Xóa trang"
                          />
                        </AdminActionGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={10}
              onPageChange={setPage}
              itemName="trang CMS"
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Xác Nhận Xóa Trang"
            className="fixed inset-0 bg-[rgba(26,26,23,0.55)] backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
            style={{ zIndex: overlayZIndex }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !deleting) setDeleteTarget(null);
            }}
          >
            <div
              className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-sm p-6 space-y-5 text-[var(--text)] shadow-2xl max-h-[calc(100dvh-32px)] overflow-y-auto admin-content-scrollbar"
              style={{ zIndex: contentZIndex }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <h3 className="font-display text-base font-semibold uppercase tracking-wider text-[var(--text)]">
                    Xác Nhận Xóa Trang
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors rounded-sm"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Bạn có chắc chắn muốn xóa trang <strong className="text-[var(--text)]">"{deleteTarget.title}"</strong> (/{deleteTarget.slug})? Toàn bộ các phân vùng và khối nội dung đính kèm sẽ bị xóa vĩnh viễn khỏi hệ thống.
              </p>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--text)] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[var(--bg-alt)] shadow-xs hover:shadow-sm transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold border border-red-500 rounded-lg text-xs font-mono uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {deleting ? 'Đang Xóa...' : 'Xác Nhận Xóa'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </AdminLayout>
  );
};
