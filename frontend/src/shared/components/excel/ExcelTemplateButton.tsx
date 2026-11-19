import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { generateCategoryExcelTemplate } from '@/shared/utils/excel/categoryExcel';
import { generateProductExcelTemplate } from '@/shared/utils/excel/productExcel';
import { categoriesApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';

interface ExcelTemplateButtonProps {
  type: 'category' | 'product';
  className?: string;
}

export const ExcelTemplateButton: React.FC<ExcelTemplateButtonProps> = ({
  type,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();

  const handleDownload = async () => {
    setLoading(true);
    try {
      if (type === 'category') {
        await generateCategoryExcelTemplate();
        addToast('Đã tải xuống tệp mẫu danh mục: category-import-template.xlsx', 'success');
      } else {
        // Fetch current categories to populate reference sheet
        let cats: any[] = [];
        try {
          const res = await categoriesApi.getCategories();
          cats = res.data || (res as any) || [];
        } catch {
          // Ignore
        }
        await generateProductExcelTemplate(cats);
        addToast('Đã tải xuống tệp mẫu sản phẩm đa biến thể: product-import-template.xlsx', 'success');
      }
    } catch (err: any) {
      addToast(`Lỗi tạo tệp mẫu Excel: ${err.message || 'Không rõ nguyên nhân'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className={`px-3 py-2 text-xs font-mono uppercase tracking-wider text-platinum-light hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-all flex items-center gap-1.5 disabled:opacity-50 ${className}`}
      title={type === 'category' ? 'Tải tệp Excel mẫu danh mục' : 'Tải tệp Excel mẫu sản phẩm'}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-champagne" />
      ) : (
        <Download className="w-3.5 h-3.5 text-champagne" />
      )}
      <span>{type === 'category' ? 'Tải Mẫu Danh Mục' : 'Tải Mẫu Sản Phẩm'}</span>
    </button>
  );
};
