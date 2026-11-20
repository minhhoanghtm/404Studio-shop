import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, Loader2, CheckCircle2, ShieldCheck, Filter } from 'lucide-react';
import { OrderExportData, exportOrdersToExcel, normalizeOrderForExport } from '@/shared/utils/excel/orderExcel';
import { adminApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';

interface OrderExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPageOrders: any[];
  selectedOrders: any[];
  currentFilterStatus: string;
  currentSearchQuery: string;
  totalFilteredCount: number;
}

export const OrderExportModal: React.FC<OrderExportModalProps> = ({
  isOpen,
  onClose,
  currentPageOrders,
  selectedOrders,
  currentFilterStatus,
  currentSearchQuery,
  totalFilteredCount,
}) => {
  const { overlayZIndex, contentZIndex } = useModal({
    id: 'order-export-modal',
    isOpen,
    onClose,
  });

  const { addToast } = useToastStore();
  const { user } = useAuthStore();

  const [scope, setScope] = useState<'filtered_all' | 'current_page' | 'selected'>('filtered_all');
  const [includeItems, setIncludeItems] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress({ current: 0, total: 0 });

    try {
      let ordersToExport: any[] = [];

      if (scope === 'selected') {
        if (selectedOrders.length === 0) {
          addToast('Quý khách chưa chọn đơn hàng nào để xuất.', 'error');
          setIsExporting(false);
          return;
        }
        ordersToExport = [...selectedOrders];
      } else if (scope === 'current_page') {
        ordersToExport = [...currentPageOrders];
      } else {
        // filtered_all: Fetch all orders across pages safely
        addToast('Đang thu thập toàn bộ đơn hàng phù hợp bộ lọc...', 'info');
        const limitPerPage = 100;
        let page = 1;
        let hasMore = true;
        const collected: any[] = [];

        while (hasMore) {
          const res = await adminApi.getAllOrders({
            page,
            limit: limitPerPage,
            status: currentFilterStatus !== 'all' ? currentFilterStatus : undefined,
            search: currentSearchQuery || undefined,
          });

          const items = res?.data?.items || (Array.isArray(res?.data) ? res.data : []);
          collected.push(...items);

          const totalPages = res?.data?.pagination?.totalPages || 1;
          setExportProgress({ current: collected.length, total: res?.data?.pagination?.total || collected.length });

          if (page >= totalPages || items.length === 0 || collected.length >= 2000) {
            hasMore = false;
          } else {
            page++;
          }
        }
        ordersToExport = collected;
      }

      if (ordersToExport.length === 0) {
        addToast('Không có đơn hàng nào để xuất dữ liệu.', 'error');
        setIsExporting(false);
        return;
      }

      // If user selected includeItems, populate items for orders lacking them
      const normalizedOrders: OrderExportData[] = [];
      for (let i = 0; i < ordersToExport.length; i++) {
        const ord = ordersToExport[i];
        let normalized = normalizeOrderForExport(ord);

        // Fetch detailed items if requested and not yet present
        if (includeItems && (!normalized.items || normalized.items.length === 0) && ord._id) {
          try {
            const itemRes = await adminApi.getOrderItems(ord._id);
            if (itemRes?.data && Array.isArray(itemRes.data)) {
              const fullOrd = { ...ord, items: itemRes.data };
              normalized = normalizeOrderForExport(fullOrd);
            }
          } catch {
            // Keep default normalized
          }
        }
        normalizedOrders.push(normalized);
      }

      // Describe active filter
      const filterDescParts = [];
      if (currentFilterStatus !== 'all') filterDescParts.push(`Trạng thái: ${currentFilterStatus}`);
      if (currentSearchQuery) filterDescParts.push(`Từ khóa: "${currentSearchQuery}"`);
      const filterDescription = filterDescParts.length > 0 ? filterDescParts.join(' | ') : 'Tất cả trạng thái';

      await exportOrdersToExcel({
        scope,
        filterDescription,
        adminName: user?.name || 'Admin',
        adminEmail: user?.email || 'admin@atelierverite.com',
        orders: normalizedOrders,
      });

      addToast(`Đã xuất thành công ${normalizedOrders.length} đơn hàng ra tệp Excel!`, 'success');
      onClose();
    } catch (err: any) {
      addToast(`Lỗi khi xuất đơn hàng: ${err?.message || 'Không thể tạo tệp Excel'}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
        style={{ zIndex: overlayZIndex }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isExporting) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Xuất Dữ Liệu Đơn Hàng Ra Excel"
      >
        <div
          className="bg-noir-900 border border-white/10 rounded-sm w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-32px)]"
          style={{ zIndex: contentZIndex }}
        >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-noir-950">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-champagne" />
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
                Xuất Dữ Liệu Đơn Hàng Ra Excel
              </h3>
              <p className="text-[11px] text-platinum-dark">
                Bảo vệ chống Spreadsheet Formula Injection (CWE-1236)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 text-platinum-dark hover:text-white transition-colors rounded-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Scope selection */}
          <div className="space-y-2">
            <label className="text-platinum-light font-medium block uppercase tracking-wider text-[11px]">
              Chọn Phạm Vi Xuất Dữ Liệu:
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${
                  scope === 'filtered_all'
                    ? 'border-champagne bg-champagne/5'
                    : 'border-white/10 hover:border-white/20 bg-noir-950'
                }`}
              >
                <input
                  type="radio"
                  name="exportScope"
                  value="filtered_all"
                  checked={scope === 'filtered_all'}
                  onChange={() => setScope('filtered_all')}
                  className="mt-0.5 text-champagne focus:ring-champagne"
                />
                <div className="flex-1">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>Tất cả đơn phù hợp bộ lọc</span>
                    <span className="font-mono text-champagne text-[11px]">
                      {totalFilteredCount} đơn hàng
                    </span>
                  </div>
                  <p className="text-[11px] text-platinum-dark mt-0.5">
                    Tự động nạp toàn bộ các trang dữ liệu đã lọc, không bị giới hạn bởi trang hiển thị hiện tại.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${
                  scope === 'current_page'
                    ? 'border-champagne bg-champagne/5'
                    : 'border-white/10 hover:border-white/20 bg-noir-950'
                }`}
              >
                <input
                  type="radio"
                  name="exportScope"
                  value="current_page"
                  checked={scope === 'current_page'}
                  onChange={() => setScope('current_page')}
                  className="mt-0.5 text-champagne focus:ring-champagne"
                />
                <div className="flex-1">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>Trang hiện tại</span>
                    <span className="font-mono text-platinum-light text-[11px]">
                      {currentPageOrders.length} đơn hàng
                    </span>
                  </div>
                  <p className="text-[11px] text-platinum-dark mt-0.5">
                    Chỉ xuất các dòng đang xem trên màn hình hiện tại.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${
                  scope === 'selected'
                    ? 'border-champagne bg-champagne/5'
                    : 'border-white/10 hover:border-white/20 bg-noir-950'
                }`}
              >
                <input
                  type="radio"
                  name="exportScope"
                  value="selected"
                  checked={scope === 'selected'}
                  onChange={() => setScope('selected')}
                  disabled={selectedOrders.length === 0}
                  className="mt-0.5 text-champagne focus:ring-champagne disabled:opacity-40"
                />
                <div className="flex-1">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span className={selectedOrders.length === 0 ? 'text-platinum-dark' : 'text-white'}>
                      Các đơn hàng đã chọn
                    </span>
                    <span className="font-mono text-platinum-light text-[11px]">
                      {selectedOrders.length} đã chọn
                    </span>
                  </div>
                  <p className="text-[11px] text-platinum-dark mt-0.5">
                    {selectedOrders.length > 0
                      ? 'Xuất các đơn hàng quý khách đã tích chọn trên bảng.'
                      : 'Vui lòng tích chọn ít nhất 1 đơn hàng trên bảng để sử dụng tùy chọn này.'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Include items option */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-sm flex items-center justify-between">
            <div>
              <span className="font-medium text-white block">Kèm Chi Tiết Sản Phẩm & Biến Thể</span>
              <span className="text-[11px] text-platinum-dark">
                Xuất kèm Sheet 2 chứa SKU, màu sắc, kích cỡ, số lượng, đơn giá
              </span>
            </div>
            <input
              type="checkbox"
              checked={includeItems}
              onChange={(e) => setIncludeItems(e.target.checked)}
              className="w-4 h-4 rounded text-champagne focus:ring-champagne border-white/20"
            />
          </div>

          {/* Active filter summary */}
          <div className="p-2.5 bg-noir-950 border border-white/5 rounded-sm flex items-center gap-2 text-[11px] text-platinum-dark">
            <Filter className="w-3.5 h-3.5 text-champagne shrink-0" />
            <span>
              Bộ lọc: <strong className="text-white">{currentFilterStatus === 'all' ? 'Tất cả trạng thái' : currentFilterStatus}</strong>
              {currentSearchQuery && <span> • Từ khóa: "{currentSearchQuery}"</span>}
            </span>
          </div>

          {/* Export progress */}
          {isExporting && exportProgress.total > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-platinum-dark">
                <span>Đang nạp dữ liệu đơn hàng...</span>
                <span className="font-mono text-champagne">
                  {exportProgress.current} / {exportProgress.total}
                </span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-champagne h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((exportProgress.current / exportProgress.total) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-noir-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-platinum-dark">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Định dạng .xlsx • Khử trùng công thức</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs text-platinum-light hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="px-5 py-2 bg-champagne text-noir-950 text-xs font-semibold rounded-sm hover:bg-champagne/90 transition-all shadow-md shadow-champagne/10 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang Xuất...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Xác Nhận Xuất Excel</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
);
};
