import React, { useState } from 'react';
import { Loader2, FileSpreadsheet, X, CheckSquare, Image as ImageIcon, Download, Layers } from 'lucide-react';
import { exportCategoriesToExcel } from '@/shared/utils/excel/categoryExcel';
import { exportProductsToExcel } from '@/shared/utils/excel/productExcel';
import { categoriesApi, productsApi, adminApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';

interface ExcelExportButtonProps {
  type: 'category' | 'product';
  className?: string;
  selectedIds?: string[];
  currentCategory?: string;
  currentSearch?: string;
}

export const ExcelExportButton: React.FC<ExcelExportButtonProps> = ({
  type,
  className = '',
  selectedIds = [],
  currentCategory = 'all',
  currentSearch = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState<'all' | 'filtered' | 'selected'>(
    selectedIds.length > 0 ? 'selected' : 'all'
  );
  const [includeImages, setIncludeImages] = useState(true);
  const { addToast } = useToastStore();

  const { overlayZIndex, contentZIndex } = useModal({
    id: 'excel-export-products-modal',
    isOpen: isModalOpen,
    onClose: () => setIsModalOpen(false),
  });

  const handleOpenExportModal = () => {
    if (type === 'category') {
      handleCategoryExport();
    } else {
      setExportScope(selectedIds.length > 0 ? 'selected' : 'all');
      setIsModalOpen(true);
    }
  };

  const handleCategoryExport = async () => {
    setLoading(true);
    try {
      const res = await categoriesApi.getCategories();
      const data = res.data || (res as any) || [];
      if (!Array.isArray(data) || data.length === 0) {
        addToast('Không có danh mục nào để xuất Excel.', 'info');
        return;
      }
      await exportCategoriesToExcel(data);
      addToast(`Đã xuất thành công ${data.length} danh mục ra tệp Excel!`, 'success');
    } catch (err: any) {
      addToast(`Lỗi xuất Excel: ${err.message || 'Không rõ nguyên nhân'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProductExport = async () => {
    setLoading(true);
    try {
      // 1. Try server-side export with direct image embedding
      try {
        const blob = await adminApi.exportProductsExcel({
          scope: exportScope,
          ids: exportScope === 'selected' ? selectedIds : undefined,
          category: exportScope === 'filtered' && currentCategory !== 'all' ? currentCategory : undefined,
          search: exportScope === 'filtered' && currentSearch ? currentSearch : undefined,
          includeImages,
          maxItems: 500,
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        link.download = `danh-sach-san-pham-${dateStr}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        addToast(
          includeImages
            ? 'Đã xuất file Excel thành công kèm hình ảnh nhúng trực tiếp vào ô!'
            : 'Đã xuất file Excel danh sách sản phẩm thành công!',
          'success'
        );
        setIsModalOpen(false);
        return;
      } catch (serverErr: any) {
        // If server returned specific business error (e.g., > 500 products), rethrow to alert admin
        if (serverErr.message && (serverErr.message.includes('500') || serverErr.message.includes('lọc'))) {
          throw serverErr;
        }
        // Otherwise fallback to client-side exporter
        console.warn('Server Excel export failed, falling back to client-side:', serverErr);
      }

      // 2. Client-side fallback
      const [prodRes, catRes] = await Promise.all([
        productsApi.getProducts({ limit: 500 }),
        categoriesApi.getCategories(),
      ]);
      let prods = prodRes.data || (prodRes as any) || [];
      const cats = catRes.data || (catRes as any) || [];

      if (!Array.isArray(prods) || prods.length === 0) {
        addToast('Không có sản phẩm nào để xuất Excel.', 'info');
        return;
      }

      // Filter prods based on scope
      if (exportScope === 'selected' && selectedIds.length > 0) {
        prods = prods.filter((p: any) => selectedIds.includes(p._id || p.id));
      } else if (exportScope === 'filtered') {
        if (currentCategory !== 'all') {
          prods = prods.filter(
            (p: any) =>
              p.category === currentCategory ||
              p.category_id === currentCategory ||
              (typeof p.category_id === 'object' && p.category_id?.slug === currentCategory)
          );
        }
        if (currentSearch) {
          const s = currentSearch.toLowerCase();
          prods = prods.filter(
            (p: any) =>
              (p.name || '').toLowerCase().includes(s) || (p.slug || '').toLowerCase().includes(s)
          );
        }
      }

      await exportProductsToExcel(prods, cats);
      addToast(
        `Đã xuất thành công ${prods.length} sản phẩm ra tệp Excel (Chế độ tương thích)!`,
        'success'
      );
      setIsModalOpen(false);
    } catch (err: any) {
      addToast(`Lỗi xuất Excel: ${err.message || 'Không rõ nguyên nhân'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenExportModal}
        disabled={loading}
        className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] hover:text-[var(--accent)] hover:border-[var(--accent)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-muted)] border border-[var(--border)] rounded-lg transition-all shadow-xs hover:shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${className}`}
        title={type === 'category' ? 'Xuất danh mục ra Excel' : 'Xuất danh sách sản phẩm ra Excel kèm ảnh nhúng'}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--accent)]" />
        )}
        <span>{type === 'category' ? 'Xuất Excel Danh Mục' : 'Xuất Excel Sản Phẩm'}</span>
      </button>

      {/* Export Options Modal for Products */}
      {isModalOpen && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Xuất Dữ Liệu Sản Phẩm Ra Excel"
            className="fixed inset-0 bg-[rgba(26,26,23,0.55)] backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
            style={{ zIndex: overlayZIndex }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !loading) setIsModalOpen(false);
            }}
          >
            <div
              className="bg-[var(--surface)] border border-[var(--border)] rounded-sm w-full max-w-lg shadow-2xl overflow-hidden max-h-[calc(100dvh-32px)] flex flex-col text-[var(--text)]"
              style={{ zIndex: contentZIndex }}
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-[var(--accent)]" />
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text)] tracking-wider uppercase font-display">
                      Xuất Dữ Liệu Sản Phẩm Ra Excel (.xlsx)
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Tùy chọn phạm vi xuất và hình thức nhúng hình ảnh
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors rounded-sm"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Scope Selection */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--text)] block mb-2">
                  1. Phạm Vi Dữ Liệu Cần Xuất
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-2.5 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm cursor-pointer hover:border-[var(--accent)]/50 transition-colors">
                    <input
                      type="radio"
                      name="exportScope"
                      value="all"
                      checked={exportScope === 'all'}
                      onChange={() => setExportScope('all')}
                      className="text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <div className="text-xs">
                      <div className="font-medium text-[var(--text)]">Tất cả sản phẩm trong hệ thống</div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Xuất toàn bộ kho hàng (tối đa 500 sản phẩm có ảnh nhúng)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm cursor-pointer hover:border-[var(--accent)]/50 transition-colors">
                    <input
                      type="radio"
                      name="exportScope"
                      value="filtered"
                      checked={exportScope === 'filtered'}
                      onChange={() => setExportScope('filtered')}
                      className="text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <div className="text-xs">
                      <div className="font-medium text-[var(--text)]">Theo bộ lọc hiện tại trên trang</div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {currentCategory !== 'all' && `Danh mục: ${currentCategory} • `}
                        {currentSearch ? `Từ khóa: "${currentSearch}"` : 'Theo điều kiện đang lọc'}
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-2.5 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm transition-colors ${
                      selectedIds.length > 0
                        ? 'cursor-pointer hover:border-[var(--accent)]/50'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportScope"
                      value="selected"
                      disabled={selectedIds.length === 0}
                      checked={exportScope === 'selected'}
                      onChange={() => setExportScope('selected')}
                      className="text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <div className="text-xs">
                      <div className="font-medium text-[var(--text)]">
                        Chỉ sản phẩm đã chọn ({selectedIds.length} sản phẩm)
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {selectedIds.length > 0
                          ? 'Xuất danh sách sản phẩm bạn đang tích chọn ở bảng'
                          : 'Hãy tích chọn sản phẩm ở bảng trước để dùng tùy chọn này'}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Image Option */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--text)] block mb-2">
                  2. Cấu Hình Hình Ảnh Nhúng
                </label>
                <label className="flex items-start gap-3 p-3 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="mt-0.5 rounded-sm text-[var(--accent)] focus:ring-[var(--accent)] border-[var(--border)]"
                  />
                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-[var(--accent)] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Nhúng hình ảnh trực tiếp vào ô Excel (Khuyên dùng)</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Hình ảnh được tải về, nén JPEG chất lượng 80%, thu nhỏ tối đa 300px và neo cố định vào ô
                      (&apos;oneCell&apos;). Tương thích hoàn toàn với Microsoft Excel, WPS Office, Apple Numbers mà không
                      cần kết nối internet khi mở file.
                    </p>
                  </div>
                </label>
              </div>

              {/* Safety notice */}
              <div className="p-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm text-[11px] text-[var(--text-muted)] space-y-1">
                <div className="font-mono text-[var(--text)] flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Quy định an toàn & giới hạn hệ thống:</span>
                </div>
                <p>
                  Tối đa 500 sản phẩm có ảnh nhúng cho mỗi lần xuất nhằm tối ưu RAM và tránh gián đoạn mạng.
                  Tên file tự động đính kèm ngày xuất.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
                className="px-4 py-2 border border-[var(--border)] text-[var(--text)] rounded-sm text-xs font-mono uppercase tracking-wider hover:bg-[var(--bg-alt)] transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleProductExport}
                disabled={loading}
                className="px-5 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-mono font-semibold uppercase tracking-wider rounded-sm hover:bg-[var(--accent)]/90 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Tạo File Excel...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Bắt Đầu Xuất Excel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    )}
  </>
);
};
