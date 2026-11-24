import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from './AdminLayout';
import {
  ShoppingBag,
  Eye,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Loader2,
  RefreshCw,
  Package,
  Calendar,
  X,
} from 'lucide-react';
import { adminApi } from '@/shared/api';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';
import { useToastStore } from '@/shared/stores/useToastStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { OrderExportModal } from '@/shared/components/excel/OrderExportModal';
import { TablePagination } from '@/shared/components/TablePagination';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';
import { AdminActionGroup, ViewActionButton } from '@/shared/components/AdminActionButton';
import {
  normalizeOrderForExport,
  exportOrdersToExcel,
  mapOrderStatusLabel,
} from '@/shared/utils/excel/orderExcel';

export const AdminOrdersPage: React.FC = () => {
  const { addToast } = useToastStore();
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Selected orders for bulk operations & export
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const { overlayZIndex, contentZIndex } = useModal({
    id: 'admin-order-detail-modal',
    isOpen: Boolean(selectedOrder),
    onClose: () => setSelectedOrder(null),
  });
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isExportingSingle, setIsExportingSingle] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAllOrders({
        page,
        limit: 15,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      const items = res?.data?.items || (Array.isArray(res?.data) ? res.data : []);
      const pagination = res?.data?.pagination;

      setOrders(items);
      setTotalOrders(pagination?.total ?? items.length);
      setTotalPages(pagination?.totalPages || 1);
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Không thể tải danh sách đơn hàng';
      addToast(msg, 'error');
      setOrders([]);
      setTotalOrders(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search, startDate, endDate, addToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allVisibleIds = new Set(orders.map((o) => o._id || o.id));
      setSelectedIds(allVisibleIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && (selectedOrder._id === orderId || selectedOrder.id === orderId)) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
      addToast('Cập nhật trạng thái đơn hàng thành công!', 'success');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Lỗi khi cập nhật trạng thái';
      addToast(msg, 'error');
    }
  };

  const handleOpenDetail = async (ord: any) => {
    setSelectedOrder(ord);
    setSelectedOrderItems(ord.items || []);

    const orderId = ord._id || ord.id;
    if (orderId && (!ord.items || ord.items.length === 0)) {
      setIsLoadingItems(true);
      try {
        const itemRes = await adminApi.getOrderItems(orderId);
        if (itemRes?.data && Array.isArray(itemRes.data)) {
          setSelectedOrderItems(itemRes.data);
        }
      } catch {
        // Fallback to order items if already on ord
      } finally {
        setIsLoadingItems(false);
      }
    }
  };

  const handleExportSingleOrder = async (ord: any) => {
    setIsExportingSingle(true);
    try {
      const fullOrd = { ...ord, items: selectedOrderItems.length > 0 ? selectedOrderItems : ord.items };
      const normalized = normalizeOrderForExport(fullOrd);

      await exportOrdersToExcel({
        scope: 'single',
        filterDescription: `Chi tiết đơn hàng: ${normalized.orderCode}`,
        adminName: user?.name || 'Admin',
        adminEmail: user?.email || 'admin@atelierverite.com',
        orders: [normalized],
      });
      addToast(`Đã xuất thành công đơn hàng ${normalized.orderCode} ra Excel!`, 'success');
    } catch (err: any) {
      addToast(`Lỗi xuất Excel: ${err?.message || 'Không thể tạo tệp'}`, 'error');
    } finally {
      setIsExportingSingle(false);
    }
  };

  const selectedOrdersList = orders.filter((o) => selectedIds.has(o._id || o.id));

  return (
    <AdminLayout
      title="Quản Lý Đơn Hàng & Vận Đơn"
      subtitle="Theo dõi đơn hàng, quản lý trạng thái thanh toán và xuất báo cáo Excel đa phạm vi"
    >
      <div className="space-y-6">
        {/* Action Header & Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm mã đơn, tên, SĐT..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-sm focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-sm focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] font-mono"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="shipping">Đang giao hàng</option>
              <option value="delivered">Giao thành công</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            {/* Date Range Filter: Từ ngày - Đến ngày */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-sm px-2.5 py-1.5 text-xs font-mono">
                <Calendar className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span className="text-[11px] text-[var(--text-muted)] shrink-0">Từ ngày:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
                  title="Lọc đơn hàng từ ngày"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-sm px-2.5 py-1.5 text-xs font-mono">
                <Calendar className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span className="text-[11px] text-[var(--text-muted)] shrink-0">Đến ngày:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
                  title="Lọc đơn hàng đến ngày"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setPage(1);
                  }}
                  className="px-2 py-1.5 text-[11px] font-mono text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 border border-[var(--border)] hover:border-red-500/30 rounded-sm transition-colors"
                  title="Xóa bộ lọc ngày"
                >
                  Xóa lọc ngày
                </button>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchOrders}
              disabled={isLoading}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] bg-[var(--bg-card)] hover:bg-[var(--table-row-hover)] border border-[var(--border)] rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[var(--accent)]' : ''}`} />
            </button>

            {/* Export Excel Button */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] hover:text-[var(--accent)] hover:border-[var(--accent)] bg-[var(--bg-card)] hover:bg-[var(--table-row-hover)] border border-[var(--border)] rounded-lg transition-all shadow-xs hover:shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Mở bảng tùy chọn xuất Excel đa phạm vi"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Xuất Excel</span>
              {selectedIds.size > 0 && (
                <span className="px-1.5 py-0.2 bg-[var(--accent)] text-[var(--accent-contrast)] text-[10px] font-bold rounded-full ml-1">
                  {selectedIds.size}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Selected count indicator */}
        {selectedIds.size > 0 && (
          <div className="p-2.5 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-sm flex items-center justify-between text-xs text-[var(--text-primary)]">
            <span>
              Đã chọn <strong className="text-[var(--accent)] font-mono">{selectedIds.size}</strong> đơn hàng trên trang này.
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mx-auto" />
              <p className="text-xs text-[var(--text-muted)]">Đang nạp dữ liệu đơn hàng từ máy chủ MongoDB...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-card-muted)] font-mono text-[11px]">
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={orders.length > 0 && orders.every((o) => selectedIds.has(o._id || o.id))}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        disabled={orders.length === 0}
                        className="w-3.5 h-3.5 rounded text-[var(--accent)] focus:ring-[var(--accent)] border-[var(--border)]"
                        title="Chọn tất cả đơn hàng trên trang"
                      />
                    </th>
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Mã Đơn</th>
                    <th className="py-3 px-4">Khách Hàng</th>
                    <th className="py-3 px-4">Thời Gian</th>
                    <th className="py-3 px-4">Thanh Toán</th>
                    <th className="py-3 px-4 text-right">Tổng Tiền</th>
                    <th className="py-3 px-4">Trạng Thái Xử Lý</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-14 text-center">
                        <Package className="w-9 h-9 text-[var(--text-muted)]/40 mx-auto mb-2.5" />
                        <h4 className="text-xs font-medium text-[var(--text-primary)] mb-1">Không tìm thấy đơn hàng nào</h4>
                        <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                          Quý khách có thể thử tìm với từ khóa khác hoặc xóa bộ lọc để hiển thị tất cả.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord, idx) => {
                    const id = String(ord._id || ord.id);
                    const code = ord.orderCode || `ORD-${id.slice(-8).toUpperCase()}`;
                    const customerName =
                      ord.shipping_address?.full_name || ord.customerName || ord.guest_email || 'Khách Vãng Lai';
                    const customerPhone = ord.shipping_address?.phone || ord.customerPhone || '';
                    const total = Number(ord.total_price || ord.totalAmount || 0);
                    const paymentMethod = ord.payment_method || ord.paymentMethod || 'COD';
                    const isSelected = selectedIds.has(id);

                    return (
                      <tr
                        key={id}
                        className={`transition-colors ${
                          isSelected ? 'bg-[var(--accent)]/10 hover:bg-[var(--accent)]/15' : 'hover:bg-[var(--table-row-hover)]'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(id)}
                            className="w-3.5 h-3.5 rounded text-[var(--accent)] focus:ring-[var(--accent)] border-[var(--border)]"
                          />
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-xs text-[var(--text-muted)]">
                          {(page - 1) * 15 + idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[var(--accent)]">
                          {code}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[var(--text-primary)]">{customerName}</div>
                          {customerPhone && (
                            <div className="text-[11px] text-[var(--text-muted)] font-mono">{customerPhone}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[var(--text-muted)] font-mono text-[11px]">
                          {formatDate(ord.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-[var(--text-muted)] text-[11px]">
                          <span className="uppercase font-mono">{paymentMethod}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[var(--text-primary)] text-right">
                          {formatCurrency(total)}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={ord.status || 'pending'}
                            onChange={(e) => handleUpdateStatus(id, e.target.value)}
                            className="py-1 px-2.5 bg-[var(--input-bg)] border border-[var(--border)] text-[11px] font-mono rounded-sm focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)]"
                          >
                            <option value="pending">Chờ xử lý</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="shipping">Đang giao</option>
                            <option value="delivered">Đã giao</option>
                            <option value="cancelled">Đã hủy</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <AdminActionGroup>
                            <ViewActionButton
                              onClick={() => handleOpenDetail(ord)}
                              title="Xem chi tiết đơn hàng & xuất Excel"
                            />
                          </AdminActionGroup>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalOrders}
              pageSize={10}
              onPageChange={setPage}
              itemName="đơn hàng"
            />
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <ModalPortal>
            <div
              className="fixed inset-0 bg-[rgba(26,26,23,0.55)] backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
              style={{ zIndex: overlayZIndex }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedOrder(null);
              }}
              role="dialog"
              aria-modal="true"
              aria-label={`Chi tiết đơn hàng ${selectedOrder.orderCode || selectedOrder._id}`}
            >
              <div
                className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-2xl p-6 rounded-sm text-[var(--text)] space-y-5 text-xs shadow-2xl max-h-[calc(100dvh-32px)] overflow-y-auto admin-content-scrollbar"
                style={{ zIndex: contentZIndex }}
              >
              <div className="flex justify-between items-start pb-3 border-b border-[var(--border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg text-[var(--accent)] font-bold">
                      Hóa Đơn {selectedOrder.orderCode || `ORD-${String(selectedOrder._id || selectedOrder.id).slice(-8).toUpperCase()}`}
                    </h3>
                    <StatusBadge
                      variant={
                        selectedOrder.status === 'delivered'
                          ? 'success'
                          : selectedOrder.status === 'cancelled'
                            ? 'danger'
                            : selectedOrder.status === 'shipping'
                              ? 'info'
                              : 'warning'
                      }
                      uppercase={true}
                    >
                      {mapOrderStatusLabel(selectedOrder.status)}
                    </StatusBadge>
                  </div>
                  <span className="text-[var(--text-muted)] text-[11px] block mt-0.5">
                    Khởi tạo lúc: {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Đóng"
                  className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Delivery Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm">
                <div>
                  <span className="text-[var(--text-muted)] uppercase tracking-wider block text-[10px] font-mono">
                    Khách Hàng
                  </span>
                  <p className="font-medium text-[var(--text)] mt-0.5">
                    {selectedOrder.shipping_address?.full_name || selectedOrder.customerName || selectedOrder.guest_email || 'Khách Vãng Lai'}
                  </p>
                  <p className="text-[var(--text-muted)] text-[11px] font-mono">
                    {selectedOrder.shipping_address?.phone || selectedOrder.customerPhone || 'Chưa có SĐT'}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] uppercase tracking-wider block text-[10px] font-mono">
                    Địa Chỉ Giao Hàng
                  </span>
                  <p className="text-[var(--text)] text-[11px] mt-0.5 leading-relaxed">
                    {[
                      selectedOrder.shipping_address?.address_detail,
                      selectedOrder.shipping_address?.ward,
                      selectedOrder.shipping_address?.district,
                      selectedOrder.shipping_address?.city,
                    ]
                      .filter(Boolean)
                      .join(', ') || selectedOrder.shippingAddress || 'Chưa cung cấp'}
                  </p>
                </div>
              </div>

              {/* Purchased items list */}
              <div>
                <span className="text-[var(--text-muted)] uppercase tracking-wider block mb-2 text-[10px] font-mono">
                  Chi Tiết Sản Phẩm & Biến Thể Đặt Mua
                </span>
                {isLoadingItems ? (
                  <div className="py-8 text-center text-[var(--text-muted)] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                    <span>Đang nạp chi tiết biến thể...</span>
                  </div>
                ) : selectedOrderItems.length === 0 ? (
                  <div className="p-4 bg-[var(--bg-alt)] text-center text-[var(--text-muted)] text-[11px] rounded-sm border border-[var(--border)]">
                    Không có thông tin chi tiết từng sản phẩm cho đơn hàng này.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedOrderItems.map((item: any, idx: number) => {
                      const pName = item.product_name || item.product_id?.name || item.productName || 'Sản phẩm thời trang';
                      const color = item.variant?.color || item.color || item.variant_id?.color;
                      const size = item.variant?.size || item.size || item.variant_id?.size;
                      const price = Number(item.price || item.unitPrice || 0);
                      const qty = Number(item.quantity || 1);

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-sm flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium text-[var(--text)]">{pName}</div>
                            <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                              {color && <span>Màu: <strong className="text-[var(--text)]">{color}</strong></span>}
                              {size && <span>• Size: <strong className="text-[var(--text)]">{size}</strong></span>}
                              <span>• SL: <strong className="text-[var(--text)] font-mono">{qty}</strong></span>
                            </div>
                          </div>
                          <div className="font-mono text-[var(--accent)] font-bold text-right">
                            <div>{formatCurrency(price * qty)}</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-normal">
                              {formatCurrency(price)} / sp
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order total & actions */}
              <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="uppercase text-[var(--text-muted)] tracking-wider text-[10px] font-mono block">
                    Tổng Giá Trị Đơn Hàng
                  </span>
                  <span className="font-mono font-bold text-[var(--accent)] text-lg">
                    {formatCurrency(selectedOrder.total_price || selectedOrder.totalAmount || 0)}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleExportSingleOrder(selectedOrder)}
                    disabled={isExportingSingle}
                    className="px-5 py-2.5 bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)] font-bold text-xs font-mono uppercase tracking-wider rounded-lg hover:brightness-105 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer"
                  >
                    {isExportingSingle ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang Xuất...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Xuất Excel Đơn Này</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2.5 border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-card)] text-[var(--text)] hover:text-[var(--accent)] rounded-lg text-xs font-mono uppercase tracking-wider transition-all shadow-xs hover:shadow-sm cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
          </ModalPortal>
        )}

        {/* Multi-Scope Order Export Modal */}
        <OrderExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          currentPageOrders={orders}
          selectedOrders={selectedOrdersList}
          currentFilterStatus={statusFilter}
          currentSearchQuery={search}
          totalFilteredCount={totalOrders}
        />
      </div>
    </AdminLayout>
  );
};
