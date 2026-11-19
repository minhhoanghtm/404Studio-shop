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
} from 'lucide-react';
import { parseAndValidateCategoryExcel, CategoryImportParseResult } from '@/shared/utils/excel/categoryExcel';
import { parseAndValidateProductExcel, ProductImportParseResult } from '@/shared/utils/excel/productExcel';
import { categoriesApi, adminApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';
import { formatCurrency } from '@/shared/utils/formatters';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'category' | 'product';
  onSuccess: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  type,
  onSuccess,
}) => {
  const { addToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [categoryResult, setCategoryResult] = useState<CategoryImportParseResult | null>(null);
  const [productResult, setProductResult] = useState<ProductImportParseResult | null>(null);

  const [activeTab, setActiveTab] = useState<'preview' | 'errors'>('preview');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Execution states
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [importLogs, setImportLogs] = useState<Array<{ name: string; status: 'success' | 'error'; message?: string }>>([]);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setCategoryResult(null);
    setProductResult(null);
    setParseError(null);
    setIsParsing(false);
    setIsImporting(false);
    setIsFinished(false);
    setImportLogs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileProcess = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setCategoryResult(null);
    setProductResult(null);
    setIsFinished(false);
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
        // Fetch categories to resolve codes
        const catRes = await categoriesApi.getCategories();
        const availableCats = catRes.data || (catRes as any) || [];
        const res = await parseAndValidateProductExcel(file, availableCats);
        setProductResult(res);
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
    if (type === 'category' && (!categoryResult || categoryResult.validItems.length === 0)) return;
    if (type === 'product' && (!productResult || productResult.validProducts.length === 0)) return;

    setIsImporting(true);
    const logs: Array<{ name: string; status: 'success' | 'error'; message?: string }> = [];

    if (type === 'category' && categoryResult) {
      const items = categoryResult.validItems;
      setProgress({ current: 0, total: items.length, success: 0, failed: 0 });

      let successCount = 0;
      let failedCount = 0;

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
    } else if (type === 'product' && productResult) {
      const items = productResult.validProducts;
      setProgress({ current: 0, total: items.length, success: 0, failed: 0 });

      let successCount = 0;
      let failedCount = 0;

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
        addToast(`Đã import thành công ${successCount}/${items.length} sản phẩm và các biến thể!`, 'success');
        onSuccess();
      } else {
        addToast('Không có sản phẩm nào được lưu do lỗi hệ thống.', 'error');
      }
    }
  };

  const handleDownloadErrorReport = () => {
    const errors = type === 'category' ? categoryResult?.errors : productResult?.errors;
    if (!errors || errors.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'Bảng tính (Sheet),Dòng (Row),Cột (Col),Trường dữ liệu,Mã lỗi,Mô tả lỗi,Hướng dẫn sửa đổi\n';

    errors.forEach((e) => {
      const row = `"${e.sheet}","${e.row}","${e.col}","${e.field}","${e.code}","${e.message.replace(/"/g, '""')}","${e.fix.replace(/"/g, '""')}"\n`;
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

  const summary = type === 'category' ? categoryResult?.summary : productResult?.summary;
  const errorCount = (type === 'category' ? categoryResult?.errors.length : productResult?.errors.length) || 0;
  const validCount = (type === 'category' ? categoryResult?.validItems.length : productResult?.validProducts.length) || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-noir-900 border border-white/10 rounded-sm w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-noir-950">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-champagne" />
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
                {type === 'category' ? 'Nhập Danh Mục Từ Tệp Excel' : 'Nhập Sản Phẩm & Biến Thể Từ Tệp Excel'}
              </h3>
              <p className="text-[11px] text-platinum-dark">
                Kiểm tra dữ liệu, xem trước và đồng bộ trực tiếp vào cơ sở dữ liệu thật
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng"
            className="p-1.5 text-platinum-dark hover:text-white transition-colors rounded-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Multi-variant guidance banner */}
          {type === 'product' && !selectedFile && (
            <div className="p-3.5 bg-champagne/5 border border-champagne/20 rounded-sm text-xs space-y-1">
              <div className="font-semibold text-champagne flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>Cấu Trúc Đa Biến Thể & Tồn Kho</span>
              </div>
              <p className="text-[11px] text-platinum-light leading-relaxed">
                Mỗi dòng tương ứng với 1 biến thể SKU (Màu sắc + Kích cỡ). Các dòng chung Mã Sản Phẩm sẽ được tự động gộp và tính tồn kho: <code className="text-champagne font-mono">TotalStock = SUM(VariantStock)</code>.
              </p>
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
              className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all ${
                isDragging ? 'border-champagne bg-champagne/5' : 'border-white/15 hover:border-white/30 bg-noir-950/60'
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
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-champagne mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-medium text-white">Chọn tệp Excel (.xlsx) hoặc kéo thả vào đây</h4>
              <p className="text-xs text-platinum-dark mt-1">
                Dung lượng tối đa: 10 MB. Hệ thống hỗ trợ kiểm tra dữ liệu dòng/cột trước khi lưu.
              </p>
            </div>
          )}

          {/* Loading parsing */}
          {isParsing && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-champagne" />
              <p className="text-xs text-platinum-light font-mono">Đang phân tích cấu trúc bảng tính và kiểm tra hợp đồng dữ liệu...</p>
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
          {summary && !isParsing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-noir-950 border border-white/10 rounded-sm">
                  <span className="text-[10px] font-mono uppercase text-platinum-dark block">Tổng Số Dòng</span>
                  <span className="text-lg font-mono font-bold text-white">{summary.totalRows}</span>
                </div>
                <div className="p-3 bg-noir-950 border border-white/10 rounded-sm">
                  <span className="text-[10px] font-mono uppercase text-platinum-dark block">
                    {type === 'category' ? 'Danh Mục Hợp Lệ' : 'Sản Phẩm Hợp Lệ'}
                  </span>
                  <span className="text-lg font-mono font-bold text-emerald-400">{validCount}</span>
                </div>
                {type === 'product' && (
                  <div className="p-3 bg-noir-950 border border-white/10 rounded-sm">
                    <span className="text-[10px] font-mono uppercase text-platinum-dark block">Tổng Biến Thể</span>
                    <span className="text-lg font-mono font-bold text-champagne">
                      {(summary as any).totalVariants || 0}
                    </span>
                  </div>
                )}
                <div className="p-3 bg-noir-950 border border-white/10 rounded-sm">
                  <span className="text-[10px] font-mono uppercase text-platinum-dark block">Số Lỗi Phát Hiện</span>
                  <span className={`text-lg font-mono font-bold ${errorCount > 0 ? 'text-red-400' : 'text-platinum-dark'}`}>
                    {errorCount}
                  </span>
                </div>
              </div>

              {/* Selected file information & Change button */}
              <div className="p-2.5 bg-noir-950/80 border border-white/5 rounded-sm flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-4">
                  <FileSpreadsheet className="w-4 h-4 text-champagne shrink-0" />
                  <span className="text-white font-mono truncate">{selectedFile?.name}</span>
                  <span className="text-platinum-dark text-[11px]">
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
              <div className="flex items-center justify-between border-b border-white/10 pt-2">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                      activeTab === 'preview'
                        ? 'border-champagne text-champagne'
                        : 'border-transparent text-platinum-dark hover:text-white'
                    }`}
                  >
                    Xem Trước Dữ Liệu ({validCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('errors')}
                    className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
                      activeTab === 'errors'
                        ? 'border-red-400 text-red-400'
                        : 'border-transparent text-platinum-dark hover:text-white'
                    }`}
                  >
                    <span>Danh Sách Lỗi</span>
                    {errorCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-800 text-[10px] font-mono rounded-full">
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
                    <span>Tải Báo Cáo Lỗi (.CSV)</span>
                  </button>
                )}
              </div>

              {/* Tab 1: Preview Table */}
              {activeTab === 'preview' && (
                <div className="border border-white/10 rounded-sm overflow-hidden bg-noir-950">
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

                  {type === 'product' && productResult && (
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
                          {productResult.validProducts.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-platinum-dark">
                                Không có sản phẩm nào hợp lệ để xem trước.
                              </td>
                            </tr>
                          ) : (
                            productResult.validProducts.map((p, idx) => {
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

              {/* Tab 2: Error Table */}
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
                          (type === 'category' ? categoryResult?.errors : productResult?.errors)?.map((err, idx) => (
                            <tr key={idx} className="hover:bg-red-950/10">
                              <td className="py-2.5 px-3 font-mono text-red-400">
                                Dòng {err.row}, Cột {err.col}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-white">{err.field}</td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-platinum-dark">{err.code}</td>
                              <td className="py-2.5 px-3 text-red-300">{err.message}</td>
                              <td className="py-2.5 px-3 text-platinum-dark text-[11px]">{err.fix}</td>
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
                      <span>Đang lưu trữ dữ liệu vào cơ sở dữ liệu thật...</span>
                    </span>
                    <span className="font-mono text-champagne">
                      {progress.current} / {progress.total} ({Math.round((progress.current / (progress.total || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-champagne transition-all duration-300"
                      style={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Finished Summary Banner */}
              {isFinished && (
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
        <div className="px-6 py-4 border-t border-white/10 bg-noir-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-platinum-dark">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Chế độ an toàn: CREATE_ONLY (Chỉ thêm mới bản ghi hợp lệ)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClose}
              disabled={isImporting}
              className="px-4 py-2 text-xs text-platinum-light hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-colors flex-1 sm:flex-initial"
            >
              {isFinished ? 'Đóng' : 'Hủy Bỏ'}
            </button>

            {!isFinished && validCount > 0 && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="px-6 py-2 bg-champagne text-noir-950 text-xs font-semibold rounded-sm hover:bg-champagne/90 transition-all shadow-md shadow-champagne/10 flex items-center justify-center gap-2 disabled:opacity-50 flex-1 sm:flex-initial"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Lưu...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Xác Nhận Import ({validCount} bản ghi)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
