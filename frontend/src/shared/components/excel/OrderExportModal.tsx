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
          className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-sm w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-32px)]"
          style={{ zIndex: contentZIndex }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-card-muted)]">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-[var(--accent)]" />
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide uppercase font-mono">
                  Xuất Dữ Liệu Đơn Hàng Ra Excel
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Bảo vệ chống Spreadsheet Formula Injection (CWE-1236)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 text-xs">
            {/* Scope selection */}
            <div className="space-y-2">
              <label className="text-[var(--text-secondary)] font-medium block uppercase tracking-wider text-[11px]">
                Chọn Phạm Vi Xuất Dữ Liệu:
              </label>
              <div className="space-y-2">
                <label
                  className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${scope === 'filtered_all'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--border)] hover:border-[var(--accent)]/50 bg-[var(--bg-card-muted)]'
                    }`}
                >
                  <input
                    type="radio"
                    name="exportScope"
                    value="filtered_all"
                    checked={scope === 'filtered_all'}
                    onChange={() => setScope('filtered_all')}
                    className="mt-0.5 text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-[var(--text-primary)] flex items-center justify-between">
                      <span>Tất cả đơn phù hợp bộ lọc</span>
                      <span className="font-mono text-[var(--accent)] text-[11px]">
                        {totalFilteredCount} đơn hàng
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Tự động nạp toàn bộ các trang dữ liệu đã lọc, không bị giới hạn bởi trang hiển thị hiện tại.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${scope === 'current_page'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--border)] hover:border-[var(--accent)]/50 bg-[var(--bg-card-muted)]'
                    }`}
                >
                  <input
                    type="radio"
                    name="exportScope"
                    value="current_page"
                    checked={scope === 'current_page'}
                    onChange={() => setScope('current_page')}
                    className="mt-0.5 text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-[var(--text-primary)] flex items-center justify-between">
                      <span>Trang hiện tại</span>
                      <span className="font-mono text-[var(--text-secondary)] text-[11px]">
                        {currentPageOrders.length} đơn hàng
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Chỉ xuất các dòng đang xem trên màn hình hiện tại.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${scope === 'selected'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--border)] hover:border-[var(--accent)]/50 bg-[var(--bg-card-muted)]'
                    }`}
                >
                  <input
                    type="radio"
                    name="exportScope"
                    value="selected"
                    checked={scope === 'selected'}
                    onChange={() => setScope('selected')}
                    disabled={selectedOrders.length === 0}
                    className="mt-0.5 text-[var(--accent)] focus:ring-[var(--accent)] disabled:opacity-40"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-[var(--text-primary)] flex items-center justify-between">
                      <span className={selectedOrders.length === 0 ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}>
                        Các đơn hàng đã chọn
                      </span>
                      <span className="font-mono text-[var(--text-secondary)] text-[11px]">
                        {selectedOrders.length} đã chọn
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {selectedOrders.length > 0
                        ? 'Xuất các đơn hàng quý khách đã tích chọn trên bảng.'
                        : 'Vui lòng tích chọn ít nhất 1 đơn hàng trên bảng để sử dụng tùy chọn này.'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Include items option */}
            <div className="p-3 bg-[var(--bg-card-muted)] border border-[var(--border)] rounded-sm flex items-center justify-between">
              <div>
                <span className="font-medium text-[var(--text-primary)] block">Kèm Chi Tiết Sản Phẩm & Biến Thể</span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Xuất kèm Sheet 2 chứa SKU, màu sắc, kích cỡ, số lượng, đơn giá
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeItems}
                onChange={(e) => setIncludeItems(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--accent)] focus:ring-[var(--accent)] border-[var(--border)]"
              />
            </div>

            {/* Active filter summary */}
            <div className="p-2.5 bg-[var(--bg-card-muted)] border border-[var(--border)] rounded-sm flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <Filter className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <span>
                Bộ lọc: <strong className="text-[var(--text-primary)]">{currentFilterStatus === 'all' ? 'Tất cả trạng thái' : currentFilterStatus}</strong>
                {currentSearchQuery && <span> • Từ khóa: "{currentSearchQuery}"</span>}
              </span>
            </div>

            {/* Export progress */}
            {isExporting && exportProgress.total > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Đang nạp dữ liệu đơn hàng...</span>
                  <span className="font-mono text-[var(--accent)]">
                    {exportProgress.current} / {exportProgress.total}
                  </span>
                </div>
                <div className="w-full bg-[var(--track-bar)] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[var(--accent)] h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round((exportProgress.current / exportProgress.total) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-card-muted)] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Định dạng .xlsx • Khử trùng công thức</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card)] hover:bg-[var(--table-row-hover)] border border-[var(--border)] rounded-sm transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="px-5 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold rounded-sm hover:opacity-90 transition-all shadow-md shadow-[var(--accent)]/10 flex items-center gap-1.5 disabled:opacity-50"
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
