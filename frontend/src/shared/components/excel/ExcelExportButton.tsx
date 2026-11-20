import React, { useState } from 'react';
import { Loader2, FileSpreadsheet, X, CheckSquare, Image as ImageIcon, Download, Layers } from 'lucide-react';
import { exportCategoriesToExcel } from '@/shared/utils/excel/categoryExcel';
import { exportProductsToExcel } from '@/shared/utils/excel/productExcel';
import { categoriesApi, productsApi, adminApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';

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
        className={`px-3 py-2 text-xs font-mono uppercase tracking-wider text-platinum-light hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-all flex items-center gap-1.5 disabled:opacity-50 ${className}`}
        title={type === 'category' ? 'Xuất danh mục ra Excel' : 'Xuất danh sách sản phẩm ra Excel kèm ảnh nhúng'}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-champagne" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5 text-champagne" />
        )}
        <span>{type === 'category' ? 'Xuất Excel Danh Mục' : 'Xuất Excel Sản Phẩm'}</span>
      </button>

      {/* Export Options Modal for Products */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-noir-900 border border-white/10 rounded-sm w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-noir-950">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-champagne" />
                <div>
                  <h3 className="text-xs font-semibold text-white tracking-wide uppercase font-mono">
                    Xuất Dữ Liệu Sản Phẩm Ra Excel (.xlsx)
                  </h3>
                  <p className="text-[11px] text-platinum-dark">
                    Tùy chọn phạm vi xuất và hình thức nhúng hình ảnh
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
                className="p-1.5 text-platinum-dark hover:text-white transition-colors rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Scope Selection */}
              <div>
                <label className="text-xs font-mono uppercase text-platinum-light block mb-2.5">
                  1. Phạm Vi Dữ Liệu Cần Xuất
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-2.5 bg-noir-950/70 border border-white/5 rounded-sm cursor-pointer hover:border-white/15 transition-colors">
                    <input
                      type="radio"
                      name="exportScope"
                      value="all"
                      checked={exportScope === 'all'}
                      onChange={() => setExportScope('all')}
                      className="text-champagne focus:ring-champagne/40 bg-noir-900 border-white/20"
                    />
                    <div className="text-xs">
                      <div className="font-medium text-white">Tất cả sản phẩm trong hệ thống</div>
                      <div className="text-[11px] text-platinum-dark">
                        Xuất toàn bộ kho hàng (tối đa 500 sản phẩm có ảnh nhúng)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 bg-noir-950/70 border border-white/5 rounded-sm cursor-pointer hover:border-white/15 transition-colors">
                    <input
                      type="radio"
                      name="exportScope"
                      value="filtered"
                      checked={exportScope === 'filtered'}
                      onChange={() => setExportScope('filtered')}
                      className="text-champagne focus:ring-champagne/40 bg-noir-900 border-white/20"
                    />
                    <div className="text-xs">
                      <div className="font-medium text-white">Theo bộ lọc hiện tại trên trang</div>
                      <div className="text-[11px] text-platinum-dark">
                        {currentCategory !== 'all' && `Danh mục: ${currentCategory} • `}
                        {currentSearch ? `Từ khóa: "${currentSearch}"` : 'Theo điều kiện đang lọc'}
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-2.5 bg-noir-950/70 border border-white/5 rounded-sm transition-colors ${
                      selectedIds.length > 0
                        ? 'cursor-pointer hover:border-white/15'
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
                      className="text-champagne focus:ring-champagne/40 bg-noir-900 border-white/20"
                    />
                    <div className="text-xs">
                      <div className="font-medium text-white">
                        Chỉ sản phẩm đã chọn ({selectedIds.length} sản phẩm)
                      </div>
                      <div className="text-[11px] text-platinum-dark">
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
                <label className="text-xs font-mono uppercase text-platinum-light block mb-2.5">
                  2. Cấu Hình Hình Ảnh Nhúng
                </label>
                <label className="flex items-start gap-3 p-3 bg-champagne/5 border border-champagne/20 rounded-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="mt-0.5 rounded-sm text-champagne focus:ring-champagne/40 bg-noir-900 border-champagne/40"
                  />
                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-champagne flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Nhúng hình ảnh trực tiếp vào ô Excel (Khuyên dùng)</span>
                    </div>
                    <p className="text-[11px] text-platinum-light leading-relaxed">
                      Hình ảnh được tải về, nén JPEG chất lượng 80%, thu nhỏ tối đa 300px và neo cố định vào ô
                      (&apos;oneCell&apos;). Tương thích hoàn toàn với Microsoft Excel, WPS Office, Apple Numbers mà không
                      cần kết nối internet khi mở file.
                    </p>
                  </div>
                </label>
              </div>

              {/* Safety notice */}
              <div className="p-3 bg-noir-950 border border-white/5 rounded-sm text-[11px] text-platinum-dark space-y-1">
                <div className="font-mono text-platinum-light flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-champagne" />
                  <span>Quy định an toàn & giới hạn hệ thống:</span>
                </div>
                <p>
                  Tối đa 500 sản phẩm có ảnh nhúng cho mỗi lần xuất nhằm tối ưu RAM và tránh gián đoạn mạng.
                  Tên file tự động đính kèm ngày xuất.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-white/10 bg-noir-950 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-xs text-platinum-light hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleProductExport}
                disabled={loading}
                className="px-5 py-2 bg-champagne text-noir-950 text-xs font-semibold rounded-sm hover:bg-champagne/90 transition-all flex items-center gap-2 shadow-md shadow-champagne/10 disabled:opacity-50"
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
      )}
    </>
  );
};
