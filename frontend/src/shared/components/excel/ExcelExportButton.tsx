import React, { useState } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';
import { exportCategoriesToExcel } from '@/shared/utils/excel/categoryExcel';
import { exportProductsToExcel } from '@/shared/utils/excel/productExcel';
import { categoriesApi, productsApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';

interface ExcelExportButtonProps {
  type: 'category' | 'product';
  className?: string;
}

export const ExcelExportButton: React.FC<ExcelExportButtonProps> = ({
  type,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();

  const handleExport = async () => {
    setLoading(true);
    try {
      if (type === 'category') {
        const res = await categoriesApi.getCategories();
        const data = res.data || (res as any) || [];
        if (!Array.isArray(data) || data.length === 0) {
          addToast('Không có danh mục nào để xuất Excel.', 'info');
          return;
        }
        await exportCategoriesToExcel(data);
        addToast(`Đã xuất thành công ${data.length} danh mục ra tệp Excel!`, 'success');
      } else {
        const [prodRes, catRes] = await Promise.all([
          productsApi.getProducts({ limit: 500 }),
          categoriesApi.getCategories(),
        ]);
        const prods = prodRes.data || (prodRes as any) || [];
        const cats = catRes.data || (catRes as any) || [];

        if (!Array.isArray(prods) || prods.length === 0) {
          addToast('Không có sản phẩm nào để xuất Excel.', 'info');
          return;
        }
        await exportProductsToExcel(prods, cats);
        addToast(`Đã xuất thành công ${prods.length} sản phẩm và các biến thể ra tệp Excel!`, 'success');
      }
    } catch (err: any) {
      addToast(`Lỗi xuất Excel: ${err.message || 'Không rõ nguyên nhân'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className={`px-3 py-2 text-xs font-mono uppercase tracking-wider text-platinum-light hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-all flex items-center gap-1.5 disabled:opacity-50 ${className}`}
      title={type === 'category' ? 'Xuất danh sách danh mục ra Excel' : 'Xuất danh sách sản phẩm ra Excel'}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-champagne" />
      ) : (
        <FileSpreadsheet className="w-3.5 h-3.5 text-champagne" />
      )}
      <span>{type === 'category' ? 'Xuất Excel Danh Mục' : 'Xuất Excel Sản Phẩm'}</span>
    </button>
  );
};
