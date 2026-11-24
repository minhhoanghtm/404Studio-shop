import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Download,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Layers,
  Image as ImageIcon,
  Info,
} from 'lucide-react';
import { parseAndValidateCategoryExcel, CategoryImportParseResult } from '@/shared/utils/excel/categoryExcel';
import { parseAndValidateProductExcel, ProductImportParseResult } from '@/shared/utils/excel/productExcel';
import { categoriesApi, adminApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';
import { formatCurrency } from '@/shared/utils/formatters';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'category' | 'product';
  onSuccess: () => void;
}

interface ServerProductPreviewData {
  previewId: string;
  summary: {
    totalRows: number;
    totalProducts: number;
    validProductsCount: number;
    errorCount: number;
    warningCount: number;
    embeddedImagesCount: number;
  };
  products: Array<{
    productSku: string;
    name: string;
    slug: string;
    category_id?: string;
    categoryName?: string;
    old_price?: number;
    new_price: number;
    brand?: string;
    description?: string;
    totalStock: number;
    hasError?: boolean;
    hasEmbeddedImage?: boolean;
    thumbnailDataUrl?: string | null;
    variantsCount: number;
    variants: Array<{
      rowNumber: number;
      sku?: string;
      color: string;
      size: string;
      stock: number;
      hasEmbeddedImage?: boolean;
    }>;
  }>;
  errors: Array<{
    row: number;
    field: string;
    code: string;
    message: string;
    fix?: string;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  type,
  onSuccess,
}) => {
  const { overlayZIndex, contentZIndex } = useModal({
    id: `excel-import-modal-${type}`,
    isOpen,
    onClose,
  });

  const { addToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Results state
  const [categoryResult, setCategoryResult] = useState<CategoryImportParseResult | null>(null);
  const [clientProductResult, setClientProductResult] = useState<ProductImportParseResult | null>(null);
  const [serverProductResult, setServerProductResult] = useState<ServerProductPreviewData | null>(null);

  // Tab state: 'preview' | 'warnings' | 'errors'
  const [activeTab, setActiveTab] = useState<'preview' | 'warnings' | 'errors'>('preview');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Execution states
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [importLogs, setImportLogs] = useState<Array<{ name: string; status: 'success' | 'error'; message?: string }>>([]);
  const [serverConfirmSummary, setServerConfirmSummary] = useState<{
    importedProducts: number;
    importedVariants: number;
    uploadedImagesCount: number;
    reusedImagesCount: number;
  } | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setCategoryResult(null);
    setClientProductResult(null);
    setServerProductResult(null);
    setParseError(null);
    setIsParsing(false);
    setIsImporting(false);
    setIsFinished(false);
    setServerConfirmSummary(null);
    setImportLogs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileProcess = async (file: File) => {
    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setParseError('Chỉ chấp nhận tệp định dạng Excel (.xlsx). Các định dạng khác như .xlsm hoặc .xls không được hỗ trợ vì lý do bảo mật.');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setCategoryResult(null);
    setClientProductResult(null);
    setServerProductResult(null);
    setIsFinished(false);
    setServerConfirmSummary(null);
    setImportLogs([]);

    try {
      if (type === 'category') {
        const res = await parseAndValidateCategoryExcel(file);
        setCategoryResult(res);
        if (res.errors.length > 0 && res.validItems.length === 0) {
          setActiveTab('errors');
        } else {
          setActiveTab('preview');
        }
      } else {
        // Try server-side preview first (extracts embedded images, SHA-256, generates thumbnails)
        try {
          const res = await adminApi.previewProductsExcel(file);
          const data = res.data || (res as any);
          if (data && data.previewId) {
            setServerProductResult(data);
            if (data.summary?.errorCount > 0 && data.summary?.validProductsCount === 0) {
              setActiveTab('errors');
            } else {
              setActiveTab('preview');
            }
            return;
          }
        } catch (serverErr: any) {
          console.warn('Server preview error, falling back to client-side parser:', serverErr);
          // If server threw a clear file error, show it
          if (serverErr.message && (serverErr.message.includes('Mã') || serverErr.message.includes('Dung lượng') || serverErr.message.includes('cấu trúc'))) {
            setParseError(serverErr.message);
            return;
          }
        }

        // Client-side fallback
        const catRes = await categoriesApi.getCategories();
        const availableCats = catRes.data || (catRes as any) || [];
        const res = await parseAndValidateProductExcel(file, availableCats);
        setClientProductResult(res);
        if (res.errors.length > 0 && res.validProducts.length === 0) {
          setActiveTab('errors');
        } else {
          setActiveTab('preview');
        }
      }
    } catch (err: any) {
      setParseError(err.message || 'Lỗi khi đọc tệp Excel.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (type === 'category') {
      if (!categoryResult || categoryResult.validItems.length === 0) return;
      setIsImporting(true);
      const items = categoryResult.validItems;
      setProgress({ current: 0, total: items.length, success: 0, failed: 0 });
      let successCount = 0;
      let failedCount = 0;
      const logs: Array<{ name: string; status: 'success' | 'error'; message?: string }> = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          await adminApi.createCategory({
            name: item.name,
            image: item.image,
            slug: item.slug,
          });
          successCount++;
          logs.push({ name: item.name, status: 'success' });
        } catch (err: any) {
          failedCount++;
          const msg = err?.data?.message || err?.message || 'Lỗi từ máy chủ';
          logs.push({ name: item.name, status: 'error', message: msg });
        }
        setProgress({
          current: i + 1,
          total: items.length,
          success: successCount,
          failed: failedCount,
        });
      }

      setImportLogs(logs);
      setIsImporting(false);
      setIsFinished(true);
      if (successCount > 0) {
        addToast(`Đã import thành công ${successCount}/${items.length} danh mục!`, 'success');
        onSuccess();
      } else {
        addToast('Không có danh mục nào được lưu do lỗi hệ thống.', 'error');
      }
      return;
    }

    // Product Import via Server Preview Session
    if (serverProductResult?.previewId) {
      setIsImporting(true);
      try {
        const res = await adminApi.confirmProductsExcel(serverProductResult.previewId);
        const data = res.data || (res as any);

        const summary = {
          importedProducts: data?.importedProducts || serverProductResult.summary.validProductsCount,
          importedVariants: data?.importedVariants || 0,
          uploadedImagesCount: data?.uploadedImagesCount || 0,
          reusedImagesCount: data?.reusedImagesCount || 0,
        };

        setServerConfirmSummary(summary);
        setIsFinished(true);
        addToast(
          `Đã import thành công ${summary.importedProducts} sản phẩm và ${summary.importedVariants} biến thể!`,
          'success'
        );
        onSuccess();
      } catch (err: any) {
        const msg = err?.data?.message || err?.message || 'Lỗi khi xác nhận import từ máy chủ';
        addToast(`Thất bại: ${msg}`, 'error');
      } finally {
        setIsImporting(false);
      }
      return;
    }

    // Client-side fallback product import
    if (clientProductResult && clientProductResult.validProducts.length > 0) {
      setIsImporting(true);
      const items = clientProductResult.validProducts;
      setProgress({ current: 0, total: items.length, success: 0, failed: 0 });
      let successCount = 0;
      let failedCount = 0;
      const logs: Array<{ name: string; status: 'success' | 'error'; message?: string }> = [];

      for (let i = 0; i < items.length; i++) {
        const prod = items[i];
        try {
          const payload = {
            name: prod.name,
            slug: prod.slug,
            category_id: prod.category_id,
            brand: prod.brand,
            old_price: prod.old_price,
            new_price: prod.new_price,
            description: prod.description,
            displayProduct: prod.displayProduct,
            stock: prod.totalStock,
            is_active: true,
            is_featured: false,
            variants: prod.variants.map((v) => ({
              color: v.color,
              size: v.size,
              stock: v.stock,
              image_url: v.image_url || prod.displayProduct[0],
            })),
          };

          await adminApi.createProduct(payload);
          successCount++;
          logs.push({ name: prod.name, status: 'success' });
        } catch (err: any) {
          failedCount++;
          const msg = err?.data?.message || err?.message || 'Lỗi từ máy chủ';
          logs.push({ name: prod.name, status: 'error', message: msg });
        }
        setProgress({
          current: i + 1,
          total: items.length,
          success: successCount,
          failed: failedCount,
        });
      }

      setImportLogs(logs);
      setIsImporting(false);
      setIsFinished(true);
      if (successCount > 0) {
        addToast(`Đã import thành công ${successCount}/${items.length} sản phẩm!`, 'success');
        onSuccess();
      } else {
        addToast('Không có sản phẩm nào được lưu do lỗi hệ thống.', 'error');
      }
    }
  };

  const handleDownloadErrorReport = async () => {
    // If we have a server preview session, download official .xlsx error report
    if (serverProductResult?.previewId) {
      try {
        const blob = await adminApi.downloadErrorReport(serverProductResult.previewId);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bao-cao-loi-import-${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast('Đã tải xuống tệp báo cáo lỗi Excel chi tiết!', 'success');
        return;
      } catch (err: any) {
        console.warn('Failed to download server xlsx report, falling back to CSV:', err);
      }
    }

    // CSV Fallback
    const errors =
      type === 'category'
        ? categoryResult?.errors
        : serverProductResult?.errors || clientProductResult?.errors;

    if (!errors || errors.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'Bảng tính (Sheet),Dòng (Row),Cột (Col),Trường dữ liệu,Mã lỗi,Mô tả lỗi,Hướng dẫn sửa đổi\n';

    errors.forEach((e: any) => {
      const row = `"${e.sheet || 'DANH_SACH_SAN_PHAM'}","${e.row}","${e.col || '-'}","${e.field}","${e.code || ''}","${(e.message || '').replace(/"/g, '""')}","${(e.fix || '').replace(/"/g, '""')}"\n`;
      csvContent += row;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bao-cao-loi-import-${type}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Derive counts and summaries
  const totalRowsCount =
    type === 'category'
      ? categoryResult?.summary.totalRows || 0
      : serverProductResult?.summary.totalRows || clientProductResult?.summary.totalRows || 0;

  const validCount =
    type === 'category'
      ? categoryResult?.validItems.length || 0
      : serverProductResult?.summary.validProductsCount || clientProductResult?.validProducts.length || 0;

  const errorCount =
    type === 'category'
      ? categoryResult?.errors.length || 0
      : serverProductResult?.summary.errorCount ?? (clientProductResult?.errors.length || 0);

  const warningCount =
    type === 'category'
      ? 0
      : serverProductResult?.summary.warningCount || 0;

  const embeddedImagesCount =
    type === 'category'
      ? 0
      : serverProductResult?.summary.embeddedImagesCount || 0;

  const totalVariantsCount =
    type === 'product'
      ? serverProductResult?.products.reduce((sum, p) => sum + (p.variants?.length || 0), 0) ??
      ((clientProductResult?.summary as any)?.totalVariants || 0)
      : 0;

  const hasData = Boolean(categoryResult || serverProductResult || clientProductResult);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
        style={{ zIndex: overlayZIndex }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isImporting) handleClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Nhập Dữ Liệu Excel"
      >
        <div
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm w-full max-w-5xl max-h-[calc(100dvh-32px)] flex flex-col shadow-2xl overflow-hidden text-[var(--text-primary)]"
          style={{ zIndex: contentZIndex }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-card-muted)]">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-[var(--accent)]" />
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide uppercase font-mono">
                  {type === 'category'
                    ? 'Nhập Danh Mục Từ Tệp Excel'
                    : 'Nhập Sản Phẩm & Biến Thể Kèm Ảnh Nhúng Từ Excel'}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Trích xuất hình ảnh trực tiếp từ ô Excel, chuẩn hóa WebP 82%, khử trùng lặp SHA-256
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Đóng"
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Multi-variant & Embedded Image guidance banner */}
            {type === 'product' && !selectedFile && (
              <div className="p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-sm text-xs space-y-2">
                <div className="font-semibold text-[var(--accent)] flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>Quy Chuẩn Hình Ảnh Nhúng & Cấu Trúc Biến Thể</span>
                </div>
                <ul className="text-[11px] text-[var(--text-secondary)] leading-relaxed list-disc list-inside space-y-1">
                  <li>
                    <strong className="text-[var(--text-primary)]">Ảnh nhúng trực tiếp:</strong> Chèn ảnh vào ô &apos;Ảnh Đại Diện&apos; hoặc &apos;Ảnh Biến Thể&apos; trong Excel (Insert → Pictures). Không cần dán URL online.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Khử trùng lặp ảnh (SHA-256):</strong> Nếu nhiều biến thể dùng chung một ảnh nhúng, hệ thống tự động tối ưu chỉ lưu một lần trên ổ cứng.
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Gộp biến thể tự động:</strong> Các dòng có chung &apos;Mã Sản Phẩm (SKU Nhóm)&apos; được tự động gộp thành 1 sản phẩm với tổng tồn kho bằng tổng số lượng các biến thể.
                  </li>
                </ul>
              </div>
            )}

            {/* File Dropzone */}
            {!selectedFile && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all ${isDragging ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-page)]'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-[var(--bg-page)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-medium text-[var(--text-primary)]">Chọn tệp Excel (.xlsx) hoặc kéo thả vào đây</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Chỉ chấp nhận tệp <code className="text-[var(--accent)] font-mono">.xlsx</code> (Dung lượng tối đa: 50 MB).
                </p>
              </div>
            )}

            {/* Loading parsing */}
            {isParsing && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-champagne" />
                <p className="text-xs text-platinum-light font-mono">
                  Đang trích xuất ảnh nhúng, kiểm tra chữ ký số magic bytes và cấu trúc dữ liệu...
                </p>
              </div>
            )}

            {/* Parse error */}
            {parseError && (
              <div className="p-4 bg-red-950/30 border border-red-800 rounded-sm flex items-start gap-3 text-xs text-red-300">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h5 className="font-semibold text-red-200">Không thể phân tích tệp Excel</h5>
                  <p className="mt-1">{parseError}</p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-3 px-3 py-1 bg-red-900/60 hover:bg-red-900 text-white rounded-sm text-[11px] transition-colors"
                  >
                    Chọn tệp khác
                  </button>
                </div>
              </div>
            )}

            {/* KPI Summary Banner */}
            {hasData && !isParsing && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 bg-[var(--bg-page)] border border-[var(--border)] rounded-sm">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Tổng Số Dòng</span>
                    <span className="text-lg font-mono font-bold text-[var(--text-primary)]">{totalRowsCount}</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-page)] border border-[var(--border)] rounded-sm">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">
                      {type === 'category' ? 'Danh Mục Hợp Lệ' : 'Sản Phẩm Hợp Lệ'}
                    </span>
                    <span className="text-lg font-mono font-bold text-emerald-500 dark:text-emerald-400">{validCount}</span>
                  </div>
                  {type === 'product' && (
                    <>
                      <div className="p-3 bg-[var(--bg-page)] border border-[var(--border)] rounded-sm">
                        <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Tổng Biến Thể</span>
                        <span className="text-lg font-mono font-bold text-[var(--accent)]">{totalVariantsCount}</span>
                      </div>
                      <div className="p-3 bg-[var(--bg-page)] border border-[var(--border)] rounded-sm">
                        <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Ảnh Nhúng Trích Xuất</span>
                        <span className="text-lg font-mono font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                          <ImageIcon className="w-4 h-4 text-[var(--accent)]" />
                          <span>{embeddedImagesCount}</span>
                        </span>
                      </div>
                    </>
                  )}
                  <div className="p-3 bg-[var(--bg-page)] border border-[var(--border)] rounded-sm">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Số Lỗi Phát Hiện</span>
                    <span className={`text-lg font-mono font-bold ${errorCount > 0 ? 'text-red-500 dark:text-red-400' : 'text-[var(--text-muted)]'}`}>
                      {errorCount}
                    </span>
                  </div>
                </div>

                {/* Selected file information & Change button */}
                <div className="p-2.5 bg-[var(--bg-page)] border border-[var(--border)] rounded-sm flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate pr-4">
                    <FileSpreadsheet className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    <span className="text-[var(--text-primary)] font-mono truncate">{selectedFile?.name}</span>
                    <span className="text-[var(--text-muted)] text-[11px]">
                      ({((selectedFile?.size || 0) / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  {!isImporting && !isFinished && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-[11px] text-champagne hover:underline shrink-0"
                    >
                      Đổi tệp khác
                    </button>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-between border-b border-[var(--border)] pt-2">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'preview'
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                      Xem Trước Dữ Liệu ({validCount})
                    </button>

                    {warningCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('warnings')}
                        className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'warnings'
                          ? 'border-yellow-600 dark:border-yellow-400 text-yellow-600 dark:text-yellow-400'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                      >
                        <span>Cảnh Báo & Gợi Ý</span>
                        <span className="px-1.5 py-0.2 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/40 text-[10px] font-mono rounded-full">
                          {warningCount}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveTab('errors')}
                      className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'errors'
                        ? 'border-red-500 text-red-500'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                      <span>Danh Sách Lỗi</span>
                      {errorCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-red-500/20 text-red-500 border border-red-500/40 text-[10px] font-mono rounded-full">
                          {errorCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {errorCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadErrorReport}
                      className="pb-2 text-xs text-platinum-dark hover:text-champagne transition-colors flex items-center gap-1 font-mono"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải Báo Cáo Lỗi (.xlsx)</span>
                    </button>
                  )}
                </div>

                {/* Tab 1: Preview Table */}
                {activeTab === 'preview' && (
                  <div className="border border-white/10 rounded-sm overflow-hidden bg-noir-950">
                    {/* Category Preview */}
                    {type === 'category' && categoryResult && (
                      <div className="overflow-x-auto max-h-72">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/5 text-platinum-dark uppercase font-mono text-[10px] sticky top-0">
                            <tr>
                              <th className="py-2.5 px-3">Dòng</th>
                              <th className="py-2.5 px-3">Ảnh</th>
                              <th className="py-2.5 px-3">Tên Danh Mục</th>
                              <th className="py-2.5 px-3">Slug Dự Kiến</th>
                              <th className="py-2.5 px-3">Đường Dẫn Ảnh</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-platinum-light">
                            {categoryResult.validItems.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-platinum-dark">
                                  Không có dòng nào hợp lệ để xem trước.
                                </td>
                              </tr>
                            ) : (
                              categoryResult.validItems.map((cat, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.02]">
                                  <td className="py-2 px-3 font-mono text-[11px] text-platinum-dark">
                                    #{cat.rowNumber}
                                  </td>
                                  <td className="py-2 px-3">
                                    <img
                                      src={cat.image}
                                      alt={cat.name}
                                      className="w-8 h-8 rounded-sm object-cover bg-noir-900 border border-white/10"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  </td>
                                  <td className="py-2 px-3 font-medium text-white">{cat.name}</td>
                                  <td className="py-2 px-3 font-mono text-[11px] text-champagne">{cat.slug || 'Tự động'}</td>
                                  <td className="py-2 px-3 font-mono text-[11px] text-platinum-dark truncate max-w-xs" title={cat.image}>
                                    {cat.image}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Product Preview (Server mode) */}
                    {type === 'product' && serverProductResult && (
                      <div className="overflow-x-auto max-h-80">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/5 text-platinum-dark uppercase font-mono text-[10px] sticky top-0">
                            <tr>
                              <th className="py-2.5 px-3 w-8"></th>
                              <th className="py-2.5 px-3 w-16 text-center">Ảnh Thu Nhỏ</th>
                              <th className="py-2.5 px-3">Mã SKU Nhóm</th>
                              <th className="py-2.5 px-3">Tên Sản Phẩm</th>
                              <th className="py-2.5 px-3">Danh Mục</th>
                              <th className="py-2.5 px-3">Giá Bán</th>
                              <th className="py-2.5 px-3">Biến Thể</th>
                              <th className="py-2.5 px-3">Tồn Kho</th>
                              <th className="py-2.5 px-3">Trạng Thái Ảnh</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-platinum-light">
                            {serverProductResult.products.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="py-8 text-center text-platinum-dark">
                                  Không có sản phẩm nào hợp lệ để xem trước.
                                </td>
                              </tr>
                            ) : (
                              serverProductResult.products.map((p, idx) => {
                                const isExp = expandedRow === idx;
                                return (
                                  <React.Fragment key={idx}>
                                    <tr
                                      onClick={() => setExpandedRow(isExp ? null : idx)}
                                      className="hover:bg-white/[0.03] cursor-pointer"
                                    >
                                      <td className="py-2 px-3 text-platinum-dark">
                                        {isExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                      </td>
                                      {/* Embedded image thumbnail */}
                                      <td className="py-2 px-3 text-center">
                                        {p.thumbnailDataUrl ? (
                                          <img
                                            src={p.thumbnailDataUrl}
                                            alt={p.name}
                                            className="w-10 h-10 rounded-sm object-cover bg-noir-900 border border-white/10 mx-auto"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-platinum-dark mx-auto">
                                            <ImageIcon className="w-4 h-4 opacity-40" />
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 font-mono text-[11px] text-champagne">{p.productSku}</td>
                                      <td className="py-2 px-3 font-medium text-white">{p.name}</td>
                                      <td className="py-2 px-3 text-platinum-dark">{p.categoryName || 'Mặc định'}</td>
                                      <td className="py-2 px-3 font-mono text-platinum-light">{formatCurrency(p.new_price)}</td>
                                      <td className="py-2 px-3">
                                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-sm font-mono text-[11px]">
                                          {p.variants.length} biến thể
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 font-mono font-bold text-emerald-400">
                                        {p.totalStock.toLocaleString('vi-VN')}
                                      </td>
                                      <td className="py-2 px-3">
                                        {p.hasEmbeddedImage ? (
                                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                            Ảnh nhúng
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[11px] text-yellow-400 font-mono">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                            Giữ ảnh cũ / Trống
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                    {isExp && (
                                      <tr className="bg-noir-900/80">
                                        <td colSpan={9} className="p-3 pl-12">
                                          <div className="text-[11px] font-mono text-platinum-dark mb-1.5 uppercase">
                                            Chi tiết các biến thể thành phần:
                                          </div>
                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {p.variants.map((v, vIdx) => (
                                              <div key={vIdx} className="p-2 bg-noir-950 border border-white/5 rounded-sm">
                                                <div className="font-semibold text-white">{v.color} / Cỡ {v.size}</div>
                                                <div className="text-[11px] text-platinum-dark mt-0.5">
                                                  Tồn kho: <span className="font-mono text-emerald-400 font-bold">{v.stock}</span>
                                                </div>
                                                {v.sku && <div className="text-[10px] text-platinum-dark/70 font-mono mt-0.5">{v.sku}</div>}
                                              </div>
                                            ))}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Product Preview (Client fallback) */}
                    {type === 'product' && !serverProductResult && clientProductResult && (
                      <div className="overflow-x-auto max-h-80">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/5 text-platinum-dark uppercase font-mono text-[10px] sticky top-0">
                            <tr>
                              <th className="py-2.5 px-3 w-8"></th>
                              <th className="py-2.5 px-3">Mã SKU Nhóm</th>
                              <th className="py-2.5 px-3">Tên Sản Phẩm</th>
                              <th className="py-2.5 px-3">Danh Mục</th>
                              <th className="py-2.5 px-3">Giá Bán</th>
                              <th className="py-2.5 px-3">Số Biến Thể</th>
                              <th className="py-2.5 px-3">Tổng Tồn Kho</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-platinum-light">
                            {clientProductResult.validProducts.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-8 text-center text-platinum-dark">
                                  Không có sản phẩm nào hợp lệ để xem trước.
                                </td>
                              </tr>
                            ) : (
                              clientProductResult.validProducts.map((p, idx) => {
                                const isExp = expandedRow === idx;
                                return (
                                  <React.Fragment key={idx}>
                                    <tr
                                      onClick={() => setExpandedRow(isExp ? null : idx)}
                                      className="hover:bg-white/[0.03] cursor-pointer"
                                    >
                                      <td className="py-2 px-3 text-platinum-dark">
                                        {isExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                      </td>
                                      <td className="py-2 px-3 font-mono text-[11px] text-champagne">{p.productSku}</td>
                                      <td className="py-2 px-3 font-medium text-white">{p.name}</td>
                                      <td className="py-2 px-3 text-platinum-dark">{p.categoryName || p.category_id}</td>
                                      <td className="py-2 px-3 font-mono text-platinum-light">{formatCurrency(p.new_price)}</td>
                                      <td className="py-2 px-3">
                                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-sm font-mono text-[11px]">
                                          {p.variants.length} biến thể
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 font-mono font-bold text-emerald-400">
                                        {p.totalStock.toLocaleString('vi-VN')}
                                      </td>
                                    </tr>
                                    {isExp && (
                                      <tr className="bg-noir-900/80">
                                        <td colSpan={7} className="p-3 pl-11">
                                          <div className="text-[11px] font-mono text-platinum-dark mb-1.5 uppercase">
                                            Chi tiết các biến thể thành phần:
                                          </div>
                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {p.variants.map((v, vIdx) => (
                                              <div key={vIdx} className="p-2 bg-noir-950 border border-white/5 rounded-sm">
                                                <div className="font-semibold text-white">{v.color} / Cỡ {v.size}</div>
                                                <div className="text-[11px] text-platinum-dark mt-0.5">
                                                  Tồn kho: <span className="font-mono text-emerald-400 font-bold">{v.stock}</span>
                                                </div>
                                                {v.sku && <div className="text-[10px] text-platinum-dark/70 font-mono mt-0.5">{v.sku}</div>}
                                              </div>
                                            ))}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Warnings Table */}
                {activeTab === 'warnings' && serverProductResult && (
                  <div className="border border-yellow-950/40 rounded-sm overflow-hidden bg-noir-950">
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-yellow-950/20 text-yellow-300 uppercase font-mono text-[10px] sticky top-0 border-b border-yellow-900/30">
                          <tr>
                            <th className="py-2.5 px-3">Dòng (Row)</th>
                            <th className="py-2.5 px-3">Trường Dữ Liệu</th>
                            <th className="py-2.5 px-3">Nội Dung Cảnh Báo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-platinum-light">
                          {serverProductResult.warnings.map((w, idx) => (
                            <tr key={idx} className="hover:bg-yellow-950/10">
                              <td className="py-2.5 px-3 font-mono text-yellow-400">Dòng {w.row}</td>
                              <td className="py-2.5 px-3 font-medium text-white">{w.field}</td>
                              <td className="py-2.5 px-3 text-yellow-200">{w.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 3: Error Table */}
                {activeTab === 'errors' && (
                  <div className="border border-red-950/40 rounded-sm overflow-hidden bg-noir-950">
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-red-950/20 text-red-300 uppercase font-mono text-[10px] sticky top-0 border-b border-red-900/30">
                          <tr>
                            <th className="py-2.5 px-3">Vị Trí</th>
                            <th className="py-2.5 px-3">Trường Dữ Liệu</th>
                            <th className="py-2.5 px-3">Mã Lỗi</th>
                            <th className="py-2.5 px-3">Mô Tả Lỗi</th>
                            <th className="py-2.5 px-3">Hướng Dẫn Khắc Phục</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-platinum-light">
                          {errorCount === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-emerald-400">
                                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                                Không phát hiện lỗi dữ liệu nào trong tệp Excel!
                              </td>
                            </tr>
                          ) : (
                            (type === 'category'
                              ? categoryResult?.errors
                              : serverProductResult?.errors || clientProductResult?.errors
                            )?.map((err: any, idx: number) => (
                              <tr key={idx} className="hover:bg-red-950/10">
                                <td className="py-2.5 px-3 font-mono text-red-400">
                                  Dòng {err.row}{err.col ? `, Cột ${err.col}` : ''}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-white">{err.field}</td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-platinum-dark">{err.code}</td>
                                <td className="py-2.5 px-3 text-red-300">{err.message}</td>
                                <td className="py-2.5 px-3 text-platinum-dark text-[11px]">{err.fix || 'Kiểm tra lại dữ liệu'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Execution Progress & Logs */}
                {isImporting && (
                  <div className="p-4 bg-noir-950 border border-white/10 rounded-sm space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-mono flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-champagne" />
                        <span>
                          {serverProductResult?.previewId
                            ? 'Đang chuẩn hóa ảnh WebP 82%, khử trùng lặp SHA-256 và lưu cơ sở dữ liệu...'
                            : 'Đang lưu trữ dữ liệu vào cơ sở dữ liệu...'}
                        </span>
                      </span>
                      {!serverProductResult?.previewId && (
                        <span className="font-mono text-champagne">
                          {progress.current} / {progress.total} ({Math.round((progress.current / (progress.total || 1)) * 100)}%)
                        </span>
                      )}
                    </div>
                    {!serverProductResult?.previewId && (
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-champagne transition-all duration-300"
                          style={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Finished Summary Banner (Server Confirm) */}
                {isFinished && serverConfirmSummary && (
                  <div className="p-4 bg-noir-950 border border-emerald-800/60 rounded-sm space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hoàn tất quá trình nhập sản phẩm & hình ảnh vào hệ thống!</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
                      <div className="p-2.5 bg-black/40 border border-white/5 rounded-sm">
                        <span className="text-[10px] text-platinum-dark block">Sản Phẩm Đã Nhập</span>
                        <span className="text-emerald-400 font-bold text-sm">{serverConfirmSummary.importedProducts}</span>
                      </div>
                      <div className="p-2.5 bg-black/40 border border-white/5 rounded-sm">
                        <span className="text-[10px] text-platinum-dark block">Biến Thể Đã Tạo</span>
                        <span className="text-champagne font-bold text-sm">{serverConfirmSummary.importedVariants}</span>
                      </div>
                      <div className="p-2.5 bg-black/40 border border-white/5 rounded-sm">
                        <span className="text-[10px] text-platinum-dark block">Ảnh Mới Đã Lưu</span>
                        <span className="text-white font-bold text-sm">{serverConfirmSummary.uploadedImagesCount}</span>
                      </div>
                      <div className="p-2.5 bg-black/40 border border-white/5 rounded-sm">
                        <span className="text-[10px] text-platinum-dark block">Ảnh Khử Trùng Lặp (SHA-256)</span>
                        <span className="text-emerald-400 font-bold text-sm">{serverConfirmSummary.reusedImagesCount}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Finished Summary Banner (Client Fallback) */}
                {isFinished && !serverConfirmSummary && (
                  <div className="p-4 bg-noir-950 border border-emerald-800/60 rounded-sm space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hoàn tất quá trình nhập dữ liệu vào Backend!</span>
                    </div>
                    <div className="flex gap-4 text-xs font-mono">
                      <span className="text-emerald-400">Lưu thành công: {progress.success}</span>
                      {progress.failed > 0 && <span className="text-red-400">Thất bại: {progress.failed}</span>}
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] font-mono text-platinum-dark">
                      {importLogs.map((log, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {log.status === 'success' ? (
                            <span className="text-emerald-400">✓</span>
                          ) : (
                            <span className="text-red-400">✕</span>
                          )}
                          <span className="text-white">{log.name}</span>
                          {log.message && <span className="text-red-400">({log.message})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-card-muted)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Chế độ an toàn: Tự động giữ nguyên ảnh cũ nếu cập nhật & khử trùng lặp SHA-256</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleClose}
                disabled={isImporting}
                className="px-4 py-2 text-xs text-[var(--text-primary)] hover:text-[var(--accent)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-muted)] border border-[var(--border)] rounded-sm transition-colors flex-1 sm:flex-initial"
              >
                {isFinished ? 'Đóng' : 'Hủy Bỏ'}
              </button>

              {!isFinished && validCount > 0 && (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                  className="px-6 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold rounded-sm hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 flex-1 sm:flex-initial"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang Lưu...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Xác Nhận Import ({validCount} sản phẩm)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
