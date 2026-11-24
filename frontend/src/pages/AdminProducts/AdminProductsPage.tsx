import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../Admin/AdminLayout';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  RotateCw,
  RotateCcw,
  Layers,
  Package,
  Upload,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { productsApi, adminApi, categoriesApi } from '@/shared/api';
import { formatCurrency } from '@/shared/utils/formatters';
import { useToastStore } from '@/shared/stores/useToastStore';
import { CategoryOption } from './types';
import { ExcelTemplateButton } from '@/shared/components/excel/ExcelTemplateButton';
import { ExcelExportButton } from '@/shared/components/excel/ExcelExportButton';
import { ExcelImportModal } from '@/shared/components/excel/ExcelImportModal';
import { TablePagination } from '@/shared/components/TablePagination';
import {
  AdminActionGroup,
  EditActionButton,
  DeleteActionButton,
  ViewActionButton,
} from '@/shared/components/AdminActionButton';
import { StatusToggle } from '@/shared/components/StatusToggle';

const ITEMS_PER_PAGE = 10;

export const AdminProductsPage: React.FC = () => {
  const { addToast } = useToastStore();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, stockFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoriesApi.getCategories();
      if (res?.data && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch {
      // Ignore category load error
    }
  }, []);

  const fetchProducts = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await productsApi.getProducts({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        limit: 100,
      });

      const raw = res?.data || (res as any);
      if (Array.isArray(raw)) {
        setProducts(raw);
      } else {
        setProducts([]);
      }
    } catch (_err: any) {
      addToast('Không thể tải danh sách sản phẩm từ máy chủ.', 'error');
      setProducts([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [selectedCategory, addToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Quý khách có chắc chắn muốn xóa sản phẩm "${name}"? Thao tác này sẽ xóa vĩnh viễn sản phẩm và toàn bộ các biến thể liên quan.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await adminApi.deleteProduct(id);
      addToast(`Đã xóa sản phẩm: ${name}`, 'success');
      setProducts((prev) => prev.filter((p) => p.id !== id && p._id !== id));
      void fetchProducts(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể xóa sản phẩm';
      addToast(`Lỗi khi xóa sản phẩm: ${msg}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.slug || '').toLowerCase().includes(search.toLowerCase());

    const stock = Number(p.stock || 0);
    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'in_stock'
        ? stock > 0
        : stock === 0;

    return matchesSearch && matchesStock;
  });

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, page]);

  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredProducts.map((p) => p.id || p._id);
    if (selectedIds.length === allFilteredIds.length && allFilteredIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  const isFiltered = search.trim() !== '' || selectedCategory !== 'all' || stockFilter !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setStockFilter('all');
    setPage(1);
  };

  const handleToggleProductStatus = async (p: any) => {
    const id = p.id || p._id;
    const nextStatus = !(p.is_active !== false);
    // Cập nhật lạc quan trạng thái sản phẩm trực tiếp trong bảng
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id || item._id === id ? { ...item, is_active: nextStatus } : item
      )
    );
    try {
      await adminApi.updateProduct(id, { is_active: nextStatus });
      addToast(nextStatus ? 'Đã bật mở bán sản phẩm' : 'Đã tạm ẩn sản phẩm', 'info');
      void fetchProducts(true);
    } catch {
      // Hoàn tác nếu lỗi
      setProducts((prev) =>
        prev.map((item) =>
          item.id === id || item._id === id ? { ...item, is_active: !nextStatus } : item
        )
      );
      addToast('Lỗi khi cập nhật trạng thái sản phẩm', 'error');
    }
  };

  return (
    <AdminLayout
      title="Quản Lý Sản Phẩm"
      subtitle="Danh mục sản phẩm, biến thể kích thước, màu sắc và tồn kho xưởng may"
    >
      <div className="space-y-6">
        {/* 1. Nhóm Tác Vụ & Dữ Liệu Excel (Actions & Data Tools) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Cụm công cụ Excel */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mr-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Dữ liệu Excel:</span>
            </div>
            <ExcelTemplateButton type="product" />

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] bg-[var(--bg-card)] hover:bg-[var(--table-row-hover)] border border-[var(--border)] rounded-lg transition-all shadow-xs hover:shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Nhập sản phẩm từ tệp Excel"
            >
              <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Nhập Excel</span>
            </button>

            <ExcelExportButton
              type="product"
              selectedIds={selectedIds}
              currentCategory={selectedCategory}
              currentSearch={search}
            />
          </div>

          {/* Cụm hành động chính */}
          <div className="flex items-center justify-end">
            <Link
              to="/admin/products/new"
              className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)] font-bold text-xs font-mono uppercase tracking-wider rounded-lg hover:brightness-105 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Sản Phẩm Mới</span>
            </Link>
          </div>
        </div>

        {/* 2. Nhóm Tìm Kiếm & Bộ Lọc Thẳng Hàng (Dedicated Filters Toolbar) */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-3 shadow-xs">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Bộ lọc thẳng hàng */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Ô tìm kiếm */}
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm sản phẩm theo tên hoặc mã slug..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-sm focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
                    title="Xóa từ khóa tìm kiếm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Lọc danh mục */}
              <div className="min-w-[170px]">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-sm focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)]"
                >
                  <option value="all">Tất cả danh mục</option>
                  {categories.map((c) => (
                    <option key={c._id || c.id} value={c.slug || c._id || c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lọc tồn kho */}
              <div className="min-w-[150px]">
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as any)}
                  className="w-full py-2 px-3 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-sm focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] font-mono"
                >
                  <option value="all">Tất cả tồn kho</option>
                  <option value="in_stock">Còn hàng (&gt; 0)</option>
                  <option value="out_of_stock">Hết hàng (0)</option>
                </select>
              </div>

              {/* Nút đặt lại / xóa lọc nếu có điều kiện lọc đang active */}
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-2 text-xs font-mono text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 border border-[var(--border)] hover:border-red-500/30 rounded-sm transition-colors flex items-center gap-1.5 shrink-0"
                  title="Đặt lại toàn bộ bộ lọc"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa lọc</span>
                </button>
              )}
            </div>

            {/* Thống kê số lượng kết quả */}
            <div className="text-xs font-mono text-[var(--text-muted)] shrink-0 self-start lg:self-center">
              Hiển thị <span className="text-[var(--text-primary)] font-semibold">{filteredProducts.length}</span> / {products.length} sản phẩm
            </div>
          </div>
        </div>

        {/* Selection Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-sm">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[var(--accent)] font-semibold">Đã chọn: {selectedIds.length} sản phẩm</span>
              <span className="text-[var(--text-muted)]">•</span>
              <span className="text-[var(--text-secondary)]">Sẵn sàng xuất Excel hoặc thao tác hàng loạt</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] underline font-mono"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        )}

        {/* Product Inventory Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-16 text-center space-y-3">
              <RotateCw className="w-8 h-8 text-[var(--accent)] animate-spin mx-auto" />
              <p className="text-xs text-[var(--text-muted)]">Đang nạp dữ liệu danh mục sản phẩm...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Package className="w-10 h-10 text-[var(--text-muted)]/40 mx-auto" />
              <h4 className="text-xs font-medium text-[var(--text-primary)]">Không tìm thấy sản phẩm phù hợp</h4>
              <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                Quý khách có thể thử tìm với từ khóa khác hoặc tạo sản phẩm mới.
              </p>
              <Link
                to="/admin/products/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)] text-xs font-mono font-bold uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition-all mt-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo sản phẩm đầu tiên
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-card-muted)] font-mono text-[11px]">
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                        onChange={handleSelectAll}
                        aria-label="Chọn tất cả sản phẩm"
                        className="rounded-sm border-[var(--border)] bg-[var(--input-bg)] text-[var(--accent)] focus:ring-[var(--accent)]/40 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Sản Phẩm</th>
                    <th className="py-3 px-4">Phân Loại</th>
                    <th className="py-3 px-4">Đơn Giá</th>
                    <th className="py-3 px-4">Biến Thể (Màu/Size)</th>
                    <th className="py-3 px-4">Tổng Tồn Kho</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-sans">
                  {paginatedProducts.map((p, idx) => {
                    const id = p.id || p._id;
                    const isSelected = selectedIds.includes(id);
                    const stock = Number(p.stock || 0);
                    const variantsCount = Array.isArray(p.variants) ? p.variants.length : 0;
                    const displayImage =
                      p.image ||
                      (Array.isArray(p.displayProduct) ? p.displayProduct[0] : null) ||
                      (Array.isArray(p.images) ? p.images[0] : null) ||
                      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100';

                    const categoryName =
                      typeof p.category_id === 'object' && p.category_id?.name
                        ? p.category_id.name
                        : p.category || 'Mặc định';

                    return (
                      <tr
                        key={id}
                        className={`hover:bg-[var(--table-row-hover)] transition-colors ${
                          isSelected ? 'bg-[var(--accent)]/10' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectProduct(id)}
                            aria-label={`Chọn sản phẩm ${p.name}`}
                            className="rounded-sm border-[var(--border)] bg-[var(--input-bg)] text-[var(--accent)] focus:ring-[var(--accent)]/40 cursor-pointer"
                          />
                        </td>

                        {/* STT */}
                        <td className="py-3.5 px-3 text-center font-mono text-xs text-[var(--text-muted)]">
                          {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>
                        {/* Product Info */}
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img
                            src={displayImage}
                            alt={p.name}
                            className="w-12 h-14 object-cover border border-[var(--border)] rounded-sm shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-serif font-medium text-[var(--text-primary)] text-sm truncate max-w-xs">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5 truncate max-w-[200px]">
                              {p.slug}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 capitalize text-[var(--text-secondary)]">
                          {categoryName}
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 font-mono font-bold text-[var(--accent)]">
                          {formatCurrency(p.new_price || p.price || 0)}
                        </td>

                        {/* Variants Count & Summary */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span className="font-mono text-[var(--text-secondary)] font-medium">
                              {variantsCount > 0 ? `${variantsCount} biến thể` : 'Chưa có biến thể'}
                            </span>
                          </div>
                        </td>

                        {/* Aggregated Total Stock */}
                        <td className="py-3.5 px-4 font-mono">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-semibold text-[11px] ${
                              stock > 0
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30'
                            }`}
                          >
                            {stock > 0 ? `${stock} sản phẩm` : 'Hết hàng (0)'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusToggle
                            size="sm"
                            color="success"
                            checked={p.is_active !== false}
                            onChange={() => handleToggleProductStatus(p)}
                            activeLabel="Đang Bán"
                            inactiveLabel="Tạm Ẩn"
                            ariaLabel="Bật / tắt trạng thái mở bán sản phẩm"
                          />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <AdminActionGroup>
                            <ViewActionButton
                              to={`/products/${p.slug}`}
                              title="Xem trang sản phẩm"
                            />
                            <EditActionButton
                              to={`/admin/products/${id}/edit`}
                              title="Chỉnh sửa sản phẩm & biến thể"
                            />
                            <DeleteActionButton
                              onClick={() => handleDelete(id, p.name)}
                              disabled={deletingId === id}
                              loading={deletingId === id}
                              title="Xóa sản phẩm"
                            />
                          </AdminActionGroup>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <TablePagination
                currentPage={page}
                totalItems={filteredProducts.length}
                pageSize={ITEMS_PER_PAGE}
                onPageChange={setPage}
                itemName="sản phẩm"
              />
            </div>
          )}
        </div>

        {/* Excel Import Modal */}
        <ExcelImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          type="product"
          onSuccess={fetchProducts}
        />
      </div>
    </AdminLayout>
  );
};
