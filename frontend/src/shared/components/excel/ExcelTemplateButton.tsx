import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { generateCategoryExcelTemplate } from '@/shared/utils/excel/categoryExcel';
import { generateProductExcelTemplate } from '@/shared/utils/excel/productExcel';
import { categoriesApi, adminApi } from '@/shared/api';
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
        // Try downloading official backend template with embedded image instructions
        try {
          const blob = await adminApi.downloadProductTemplate();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'product-import-template.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          addToast('Đã tải xuống tệp mẫu sản phẩm đa biến thể có hướng dẫn ảnh nhúng!', 'success');
        } catch {
          // Fallback to client-side template generator
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
      className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] hover:text-[var(--accent)] hover:border-[var(--accent)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-muted)] border border-[var(--border)] rounded-lg transition-all shadow-xs hover:shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${className}`}
      title={type === 'category' ? 'Tải tệp Excel mẫu danh mục' : 'Tải tệp Excel mẫu sản phẩm có ảnh nhúng'}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
      ) : (
        <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
      )}
      <span>{type === 'category' ? 'Tải Mẫu Danh Mục' : 'Tải Mẫu Sản Phẩm'}</span>
    </button>
  );
};

