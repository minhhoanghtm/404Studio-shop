import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../Admin/AdminLayout';
import { Plus, Search, Edit3, Trash2, Eye, RotateCw, Layers, Package, Upload } from 'lucide-react';
import { productsApi, adminApi, categoriesApi } from '@/shared/api';
import { formatCurrency } from '@/shared/utils/formatters';
import { useToastStore } from '@/shared/stores/useToastStore';
import { CategoryOption } from './types';
import { ExcelTemplateButton } from '@/shared/components/excel/ExcelTemplateButton';
import { ExcelExportButton } from '@/shared/components/excel/ExcelExportButton';
import { ExcelImportModal } from '@/shared/components/excel/ExcelImportModal';

export const AdminProductsPage: React.FC = () => {
  const { addToast } = useToastStore();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
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

  return (
    <AdminLayout
      title="Quản Lý Sản Phẩm"
      subtitle="Danh mục sản phẩm, biến thể kích thước, màu sắc và tồn kho xưởng may"
    >
      <div className="space-y-6">
        {/* Action Header & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-platinum-dark absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm sản phẩm theo tên hoặc mã slug..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-noir-900 border border-white/10 rounded-sm focus:border-champagne focus:outline-none text-white"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 text-xs bg-noir-900 border border-white/10 rounded-sm focus:border-champagne focus:outline-none text-white"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c._id || c.id} value={c.slug || c._id || c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="py-2 px-3 text-xs bg-noir-900 border border-white/10 rounded-sm focus:border-champagne focus:outline-none text-white font-mono"
            >
              <option value="all">Tất cả tồn kho</option>
              <option value="in_stock">Còn hàng (&gt; 0)</option>
              <option value="out_of_stock">Hết hàng (0)</option>
            </select>
          </div>

          {/* Action Buttons & Excel Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <ExcelTemplateButton type="product" />

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-platinum-light hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-all flex items-center gap-1.5"
              title="Nhập sản phẩm từ tệp Excel"
            >
              <Upload className="w-3.5 h-3.5 text-champagne" />
              <span>Nhập Excel</span>
            </button>

            <ExcelExportButton type="product" />

            <Link
              to="/admin/products/new"
              className="px-4 py-2 bg-champagne text-noir-950 font-semibold text-xs uppercase tracking-wider rounded-sm hover:bg-champagne/90 transition-colors flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Sản Phẩm Mới</span>
            </Link>
          </div>
        </div>

        {/* Product Inventory Table */}
        <div className="bg-noir-900 border border-white/10 rounded-sm overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center space-y-3">
              <RotateCw className="w-8 h-8 text-champagne animate-spin mx-auto" />
              <p className="text-xs text-platinum-dark">Đang nạp dữ liệu danh mục sản phẩm từ MongoDB...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Package className="w-10 h-10 text-platinum-dark/40 mx-auto" />
              <h4 className="text-xs font-medium text-white">Không tìm thấy sản phẩm phù hợp</h4>
              <p className="text-[11px] text-platinum-dark max-w-sm mx-auto">
                Quý khách có thể thử tìm với từ khóa khác hoặc tạo sản phẩm mới.
              </p>
              <Link
                to="/admin/products/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-champagne text-noir-950 text-xs font-semibold rounded-sm mt-2"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo sản phẩm đầu tiên
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-platinum-dark uppercase tracking-wider bg-white/5 font-mono text-[11px]">
                    <th className="py-3 px-4">Sản Phẩm</th>
                    <th className="py-3 px-4">Phân Loại</th>
                    <th className="py-3 px-4">Đơn Giá</th>
                    <th className="py-3 px-4">Biến Thể (Màu/Size)</th>
                    <th className="py-3 px-4">Tổng Tồn Kho</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredProducts.map((p) => {
                    const id = p.id || p._id;
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
                      <tr key={id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Product Info */}
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img
                            src={displayImage}
                            alt={p.name}
                            className="w-12 h-14 object-cover border border-white/10 rounded-sm shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-serif font-medium text-white text-sm truncate max-w-xs">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-platinum-dark font-mono mt-0.5 truncate max-w-[200px]">
                              {p.slug}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 capitalize text-platinum-light">
                          {categoryName}
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 font-mono font-bold text-champagne">
                          {formatCurrency(p.new_price || p.price || 0)}
                        </td>

                        {/* Variants Count & Summary */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-platinum-dark" />
                            <span className="font-mono text-platinum-light font-medium">
                              {variantsCount > 0 ? `${variantsCount} biến thể` : 'Chưa có biến thể'}
                            </span>
                          </div>
                        </td>

                        {/* Aggregated Total Stock */}
                        <td className="py-3.5 px-4 font-mono">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-semibold text-[11px] ${
                              stock > 0
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                                : 'bg-red-950/60 text-red-400 border border-red-800'
                            }`}
                          >
                            {stock > 0 ? `${stock} sản phẩm` : 'Hết hàng (0)'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              p.is_active !== false ? 'bg-emerald-400' : 'bg-neutral-600'
                            }`}
                          />
                          <span className="text-[11px] text-platinum-dark">
                            {p.is_active !== false ? 'Đang bán' : 'Ẩn'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <Link
                            to={`/products/${p.slug}`}
                            className="p-1.5 inline-block text-platinum-dark hover:text-white transition-colors"
                            title="Xem trang sản phẩm"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/products/${id}/edit`}
                            className="p-1.5 inline-block text-platinum-dark hover:text-champagne transition-colors"
                            title="Chỉnh sửa sản phẩm & biến thể"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            disabled={deletingId === id}
                            onClick={() => handleDelete(id, p.name)}
                            className="p-1.5 text-platinum-dark hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
