import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from './AdminLayout';
import { Plus, Edit3, Trash2, FolderTree, Upload, AlertCircle, Loader2, X } from 'lucide-react';
import { categoriesApi, adminApi, productsApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';
import { CategoryImageUploader } from '@/shared/components/category/CategoryImageUploader';
import { ExcelTemplateButton } from '@/shared/components/excel/ExcelTemplateButton';
import { ExcelExportButton } from '@/shared/components/excel/ExcelExportButton';
import { ExcelImportModal } from '@/shared/components/excel/ExcelImportModal';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { overlayZIndex, contentZIndex } = useModal({
    id: 'admin-category-form-modal',
    isOpen: isModalOpen,
    onClose: () => setIsModalOpen(false),
  });
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { addToast } = useToastStore();

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        categoriesApi.getCategories(),
        productsApi.getProducts({ limit: 500 }).catch(() => ({ data: [] })),
      ]);

      const catData = catRes?.data || (catRes as any);
      if (Array.isArray(catData)) {
        setCategories(catData);
      } else {
        setCategories([]);
      }

      // Calculate product count per category
      const prods = prodRes?.data || (prodRes as any) || [];
      const counts: Record<string, number> = {};
      if (Array.isArray(prods)) {
        prods.forEach((p: any) => {
          if (p.category_id) {
            const key = String(p.category_id);
            counts[key] = (counts[key] || 0) + 1;
          }
        });
      }
      setProductCounts(counts);
    } catch (_err: any) {
      addToast('Không thể tải danh sách danh mục từ máy chủ.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = () => {
    setEditingCat(null);
    setFormName('');
    setFormSlug('');
    setFormImage('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCat(cat);
    setFormName(cat.name || '');
    setFormSlug(cat.slug || '');
    setFormImage(cat.image || '');
    setFormDescription(cat.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formName.trim();
    if (!trimmedName) {
      addToast('Vui lòng nhập tên danh mục.', 'error');
      return;
    }

    if (!formImage.trim()) {
      addToast('Hình ảnh đại diện danh mục là bắt buộc theo quy định của hệ thống.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: trimmedName,
        image: formImage.trim(),
        slug: formSlug.trim() || undefined,
        description: formDescription.trim() || undefined,
      };

      if (editingCat) {
        const id = editingCat._id || editingCat.id;
        await adminApi.updateCategory(id, payload);
        addToast(`Cập nhật danh mục "${trimmedName}" thành công!`, 'success');
      } else {
        await adminApi.createCategory(payload);
        addToast(`Đã thêm danh mục mới "${trimmedName}" thành công!`, 'success');
      }

      setIsModalOpen(false);
      setEditingCat(null);
      await fetchCategories();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Lỗi khi lưu danh mục';
      addToast(`Không thể lưu danh mục: ${msg}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const count = productCounts[id] || 0;
    if (count > 0) {
      addToast(`Không thể xóa danh mục "${name}" vì đang có ${count} sản phẩm thuộc danh mục này.`, 'error');
      return;
    }

    if (!window.confirm(`Quý khách có chắc chắn muốn xóa danh mục "${name}"?`)) return;

    setDeletingId(id);
    try {
      await adminApi.deleteCategory(id);
      addToast(`Đã xóa danh mục "${name}" thành công!`, 'success');
      await fetchCategories();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Lỗi khi xóa danh mục';
      addToast(`Không thể xóa danh mục: ${msg}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout
      title="Quản Lý Danh Mục Thời Trang"
      subtitle="Quản lý cấu trúc cây danh mục, hình ảnh đại diện, xuất nhập dữ liệu Excel"
    >
      <div className="space-y-6">
        {/* Action Header & Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="text-xs text-[var(--text-muted)]">
            Tổng cộng: <strong className="text-[var(--text-primary)] font-mono">{categories.length}</strong> danh mục
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download Template */}
            <ExcelTemplateButton type="category" />

            {/* Import Excel */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card-muted)] hover:bg-[var(--table-row-hover)] border border-[var(--border)] rounded-sm transition-all flex items-center gap-1.5 shadow-sm"
              title="Nhập danh mục từ tệp Excel"
            >
              <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Nhập Excel</span>
            </button>

            {/* Export Excel */}
            <ExcelExportButton type="category" />

            {/* Add Category */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold text-xs uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Danh Mục Mới</span>
            </button>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mx-auto" />
              <p className="text-xs text-[var(--text-muted)]">Đang nạp dữ liệu danh mục thời trang từ máy chủ...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <FolderTree className="w-10 h-10 text-[var(--text-muted)]/40 mx-auto" />
              <h4 className="text-xs font-medium text-[var(--text-primary)]">Chưa có danh mục nào</h4>
              <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                Quý khách có thể thêm danh mục đầu tiên hoặc nhập hàng loạt từ tệp Excel.
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold rounded-sm mt-2 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo Danh Mục Đầu Tiên
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-platinum-dark uppercase tracking-wider bg-white/5 font-mono text-[11px]">
                  <th className="py-3 px-4 w-16">Hình Ảnh</th>
                  <th className="py-3 px-4">Tên Danh Mục</th>
                  <th className="py-3 px-4">Đường Dẫn Slug</th>
                  <th className="py-3 px-4">Mô Tả Định Hướng</th>
                  <th className="py-3 px-4">Số Sản Phẩm</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.map((cat) => {
                  const id = cat._id || cat.id;
                  const count = productCounts[id] || productCounts[cat.slug] || 0;
                  return (
                    <tr key={id} className="hover:bg-white/5 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="py-3 px-4">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-10 h-10 rounded-sm object-cover bg-noir-950 border border-white/10"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200';
                            }}
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-sm bg-white/5 border border-amber-800/40 flex items-center justify-center text-amber-400"
                            title="Thiếu ảnh đại diện"
                          >
                            <AlertCircle className="w-5 h-5" />
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-serif font-medium text-[var(--text-primary)] text-sm">
                        {cat.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[var(--accent)]">{cat.slug}</td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)] max-w-xs truncate">
                        {cat.description || 'Danh mục thời trang cao cấp'}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="px-2 py-0.5 bg-[var(--bg-card-muted)] border border-[var(--border)] rounded-sm text-[var(--text-secondary)]">
                          {count} sản phẩm
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                          title="Chỉnh sửa danh mục"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === id}
                          onClick={() => handleDelete(id, cat.name)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Create / Edit */}
        {isModalOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
              style={{ zIndex: overlayZIndex }}
              onClick={(e) => {
                if (e.target === e.currentTarget && !isSaving) setIsModalOpen(false);
              }}
              role="dialog"
              aria-modal="true"
              aria-label={editingCat ? 'Chỉnh Sửa Danh Mục' : 'Tạo Danh Mục Mới'}
            >
              <div
                className="bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-md p-6 rounded-sm text-[var(--text-primary)] space-y-4 max-h-[calc(100dvh-32px)] overflow-y-auto shadow-2xl"
                style={{ zIndex: contentZIndex }}
              >
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                    {editingCat ? 'Chỉnh Sửa Danh Mục Thời Trang' : 'Tạo Danh Mục Thời Trang Mới'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                {/* Category Name */}
                <div>
                  <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Tên Danh Mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ví dụ: Đầm Dạ Tiệc"
                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm"
                  />
                </div>

                {/* Category Image Uploader */}
                <CategoryImageUploader
                  value={formImage}
                  onChange={setFormImage}
                  required={true}
                />

                {/* Slug */}
                <div>
                  <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Đường Dẫn Slug (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="Tuỳ chọn (hệ thống tự động sinh từ tên nếu để trống)"
                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none font-mono text-[var(--text-primary)] rounded-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Mô Tả Định Hướng
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Mô tả phong cách, kiểu dáng hoặc chất liệu..."
                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm"
                  />
                </div>

                {/* Action buttons */}
                <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="px-4 py-2 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--table-row-hover)] uppercase tracking-wider rounded-sm transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-champagne text-noir-950 font-semibold uppercase tracking-wider rounded-sm hover:bg-champagne/90 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSaving ? 'Đang Lưu...' : editingCat ? 'Cập Nhật' : 'Tạo Mới'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
          </ModalPortal>
        )}

        {/* Excel Import Modal */}
        <ExcelImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          type="category"
          onSuccess={fetchCategories}
        />
      </div>
    </AdminLayout>
  );
};
