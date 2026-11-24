import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminLayout } from './AdminLayout';
import {
  Plus,
  Ticket,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  Tag,
  Percent,
  Users,
  Truck,
  ShoppingBag,
  X,
  Check,
  Loader2,
  Copy,
} from 'lucide-react';
import { adminApi, categoriesApi, productsApi } from '@/shared/api';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';
import { useToastStore } from '@/shared/stores/useToastStore';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';
import { StatusToggle } from '@/shared/components';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { TablePagination } from '@/shared/components/TablePagination';
import {
  AdminActionGroup,
  EditActionButton,
  DeleteActionButton,
} from '@/shared/components/AdminActionButton';

interface CouponItem {
  _id?: string;
  id?: string;
  code: string;
  name?: string;
  description?: string;
  voucherType: 'order' | 'shipping' | 'product';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue: number;
  totalQuantity: number;
  claimedQuantity?: number;
  usedQuantity?: number;
  remainingQuantity?: number;
  startDate: string | Date;
  endDate: string | Date;
  targetAudience?: 'all' | 'new' | 'member' | 'vip';
  applicableCategories?: any[];
  applicableProducts?: any[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

const toDateInputValue = (d: any): string => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formVoucherType, setFormVoucherType] = useState<'order' | 'shipping' | 'product'>('order');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState<number>(15);
  const [formMaxDiscountAmount, setFormMaxDiscountAmount] = useState<number>(0);
  const [formMinOrderValue, setFormMinOrderValue] = useState<number>(0);
  const [formTotalQuantity, setFormTotalQuantity] = useState<number>(100);
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formTargetAudience, setFormTargetAudience] = useState<'all' | 'new' | 'member' | 'vip'>('all');
  const [formApplicableScope, setFormApplicableScope] = useState<'category' | 'product'>('category');
  const [formSelectedCategories, setFormSelectedCategories] = useState<string[]>([]);
  const [formSelectedProducts, setFormSelectedProducts] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Category & Product search inside modal
  const [catSearch, setCatSearch] = useState('');
  const [prodSearch, setProdSearch] = useState('');

  const { addToast } = useToastStore();

  const { overlayZIndex, contentZIndex } = useModal({
    id: 'admin-coupon-form-modal',
    isOpen: isModalOpen,
    onClose: () => setIsModalOpen(false),
  });

  // Fetch initial data
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [vouchersRes, catsRes, prodsRes] = await Promise.all([
        adminApi.getAdminVouchers({ limit: 100 }).catch(() => null),
        categoriesApi.getCategories().catch(() => ({ data: [] })),
        productsApi.getProducts({ limit: 200 }).catch(() => ({ data: [] })),
      ]);

      if (vouchersRes && (vouchersRes as any).data && Array.isArray((vouchersRes as any).data)) {
        setCoupons((vouchersRes as any).data);
      } else if (vouchersRes && Array.isArray(vouchersRes)) {
        setCoupons(vouchersRes);
      } else {
        setCoupons([]);
      }

      const catData = catsRes?.data || (catsRes as any) || [];
      setCategories(Array.isArray(catData) ? catData : []);

      const prodData = prodsRes?.data || (prodsRes as any) || [];
      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (_err) {
      addToast('Không thể tải danh sách mã giảm giá từ máy chủ.', 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Create Modal
  const handleOpenCreate = () => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    setEditingCoupon(null);
    setFormCode('');
    setFormName('');
    setFormDescription('');
    setFormVoucherType('order');
    setFormDiscountType('percentage');
    setFormDiscountValue(15);
    setFormMaxDiscountAmount(0);
    setFormMinOrderValue(0);
    setFormTotalQuantity(100);
    setFormStartDate(toDateInputValue(today));
    setFormEndDate(toDateInputValue(nextMonth));
    setFormTargetAudience('all');
    setFormApplicableScope('category');
    setFormSelectedCategories([]);
    setFormSelectedProducts([]);
    setFormStatus('ACTIVE');
    setCatSearch('');
    setProdSearch('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cp: CouponItem) => {
    setEditingCoupon(cp);
    setFormCode(cp.code || '');
    setFormName(cp.name || '');
    setFormDescription(cp.description || '');
    setFormVoucherType(cp.voucherType || 'order');
    setFormDiscountType(cp.discountType || 'percentage');
    setFormDiscountValue(cp.discountValue ?? 15);
    setFormMaxDiscountAmount(cp.maxDiscountAmount ?? 0);
    setFormMinOrderValue(cp.minOrderValue ?? 0);
    setFormTotalQuantity(cp.totalQuantity ?? 100);
    setFormStartDate(toDateInputValue(cp.startDate) || toDateInputValue(new Date()));
    setFormEndDate(toDateInputValue(cp.endDate) || toDateInputValue(new Date()));
    setFormTargetAudience(cp.targetAudience || 'all');

    // Applicable Scope
    const catIds = (cp.applicableCategories || []).map((c: any) => (typeof c === 'object' ? c._id || c.id : c)).filter(Boolean);
    const prodIds = (cp.applicableProducts || []).map((p: any) => (typeof p === 'object' ? p._id || p.id : p)).filter(Boolean);

    setFormSelectedCategories(catIds);
    setFormSelectedProducts(prodIds);

    if (cp.voucherType === 'product') {
      if (prodIds.length > 0) {
        setFormApplicableScope('product');
      } else {
        setFormApplicableScope('category');
      }
    } else {
      setFormApplicableScope('category');
    }

    setFormStatus(cp.status || 'ACTIVE');
    setCatSearch('');
    setProdSearch('');
    setIsModalOpen(true);
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = formCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!editingCoupon && !cleanCode) {
      addToast('Vui lòng nhập mã ưu đãi hợp lệ.', 'error');
      return;
    }

    if (!formStartDate || !formEndDate) {
      addToast('Vui lòng chọn ngày bắt đầu và ngày kết thúc.', 'error');
      return;
    }

    const start = new Date(formStartDate);
    const end = new Date(formEndDate);
    if (end <= start) {
      addToast('Ngày kết thúc phải lớn hơn ngày bắt đầu.', 'error');
      return;
    }

    if (formDiscountValue <= 0) {
      addToast('Mức giảm giá phải lớn hơn 0.', 'error');
      return;
    }

    if (formDiscountType === 'percentage' && formDiscountValue > 100) {
      addToast('Mức giảm theo phần trăm không được vượt quá 100%.', 'error');
      return;
    }

    if (formTotalQuantity <= 0) {
      addToast('Tổng số lượng voucher phải lớn hơn 0.', 'error');
      return;
    }

    if (formVoucherType === 'product') {
      if (formApplicableScope === 'category' && formSelectedCategories.length === 0) {
        addToast('Vui lòng chọn ít nhất 1 danh mục áp dụng voucher.', 'error');
        return;
      }
      if (formApplicableScope === 'product' && formSelectedProducts.length === 0) {
        addToast('Vui lòng chọn ít nhất 1 sản phẩm áp dụng voucher.', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formName.trim() || `Ưu đãi ${cleanCode}`,
        description: formDescription.trim(),
        voucherType: formVoucherType,
        discountType: formDiscountType,
        discountValue: Number(formDiscountValue),
        maxDiscountAmount: formDiscountType === 'percentage' ? Math.max(0, Number(formMaxDiscountAmount) || 0) : 0,
        minOrderValue: Math.max(0, Number(formMinOrderValue) || 0),
        totalQuantity: Number(formTotalQuantity),
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(`${formEndDate}T23:59:59.999Z`).toISOString(),
        targetAudience: formTargetAudience,
        applicableCategories: formVoucherType === 'product' && formApplicableScope === 'category' ? formSelectedCategories : [],
        applicableProducts: formVoucherType === 'product' && formApplicableScope === 'product' ? formSelectedProducts : [],
        status: formStatus,
      };

      if (editingCoupon) {
        const id = editingCoupon._id || editingCoupon.id;
        const res: any = await adminApi.updateVoucher(id!, payload);
        const updated = res?.data || { ...editingCoupon, ...payload };
        // Cập nhật trực tiếp coupon trong state cục bộ
        setCoupons((prev) =>
          prev.map((item) => ((item._id || item.id) === id ? { ...item, ...updated } : item))
        );
        addToast(`Cập nhật mã voucher ${editingCoupon.code} thành công!`, 'success');
      } else {
        payload.code = cleanCode;
        const res: any = await adminApi.createVoucher(payload);
        const newVoucher = res?.data || { id: `v_${Date.now()}`, ...payload };
        // Thêm trực tiếp voucher mới vào đầu danh sách
        setCoupons((prev) => [newVoucher, ...prev]);
        addToast(`Khởi tạo mã voucher ${cleanCode} thành công!`, 'success');
      }

      setIsModalOpen(false);
      void loadData(true);
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu voucher.';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Voucher Status
  const handleToggleStatus = async (cp: CouponItem) => {
    const id = cp._id || cp.id;
    if (!id) return;
    try {
      await adminApi.toggleVoucherStatus(id);
      addToast(`Đã đổi trạng thái mã ${cp.code}`, 'success');
      setCoupons((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id
            ? { ...item, status: item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
            : item
        )
      );
    } catch (err: any) {
      addToast(err?.message || 'Không thể đổi trạng thái voucher', 'error');
    }
  };

  // Delete Voucher
  const handleDelete = async (id: string, cpCode: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn mã ưu đãi ${cpCode}?`)) return;
    setDeletingId(id);
    try {
      await adminApi.deleteVoucher(id);
      setCoupons((prev) => prev.filter((c) => (c._id || c.id) !== id));
      addToast(`Đã xóa thành công mã ưu đãi ${cpCode}`, 'success');
    } catch (err: any) {
      addToast(err?.message || 'Không thể xóa voucher', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Copy Code to Clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast(`Đã sao chép mã: ${code}`, 'info');
  };

  // Filtered Coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((cp) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = cp.code?.toLowerCase().includes(q);
        const nameMatch = cp.name?.toLowerCase().includes(q);
        const descMatch = cp.description?.toLowerCase().includes(q);
        if (!codeMatch && !nameMatch && !descMatch) return false;
      }

      // Type filter
      if (filterType !== 'all') {
        if (cp.voucherType !== filterType) return false;
      }

      // Status filter
      if (filterStatus !== 'all') {
        if (cp.status !== filterStatus) return false;
      }

      return true;
    });
  }, [coupons, searchQuery, filterType, filterStatus]);

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterType, filterStatus]);

  const paginatedCoupons = useMemo(() => {
    const start = (page - 1) * 10;
    return filteredCoupons.slice(start, start + 10);
  }, [filteredCoupons, page]);

  // Statistics
  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.status === 'ACTIVE').length;
    const orderCount = coupons.filter((c) => c.voucherType === 'order').length;
    const shippingCount = coupons.filter((c) => c.voucherType === 'shipping').length;
    const productCount = coupons.filter((c) => c.voucherType === 'product').length;
    return { total, active, orderCount, shippingCount, productCount };
  }, [coupons]);

  // Filtered categories for modal
  const filteredModalCategories = useMemo(() => {
    if (!catSearch.trim()) return categories;
    return categories.filter((c) => c.name?.toLowerCase().includes(catSearch.toLowerCase().trim()));
  }, [categories, catSearch]);

  // Filtered products for modal
  const filteredModalProducts = useMemo(() => {
    if (!prodSearch.trim()) return products;
    return products.filter((p) => p.name?.toLowerCase().includes(prodSearch.toLowerCase().trim()));
  }, [products, prodSearch]);

  return (
    <AdminLayout
      title="Mã Giảm Giá & Phiếu Ưu Đãi"
      subtitle="Thiết lập các chương trình khuyến mãi đơn hàng, phí vận chuyển và ưu đãi theo danh mục hoặc sản phẩm"
    >
      <div className="space-y-6">
        {/* KPI / Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-sm shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-[var(--accent)]/10 text-[var(--accent)]">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Tổng Mã Ưu Đãi</div>
              <div className="text-xl font-bold font-mono text-[var(--text-primary)]">{stats.total}</div>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-sm shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Đang Kích Hoạt</div>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{stats.active}</div>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-sm shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Voucher Vận Chuyển</div>
              <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{stats.shippingCount}</div>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-sm shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Voucher Sản Phẩm</div>
              <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{stats.productCount}</div>
            </div>
          </div>
        </div>

        {/* Toolbar: Filters & Create button */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã hoặc tên ưu đãi..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-sm focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter by Voucher Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả loại voucher</option>
              <option value="order">📦 Voucher Đơn Hàng</option>
              <option value="shipping">🚚 Voucher Phí Vận Chuyển</option>
              <option value="product">🏷️ Voucher Theo Sản Phẩm</option>
            </select>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Tạm dừng</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-xs font-mono uppercase tracking-wider rounded-lg border border-[var(--accent)] hover:shadow-lg hover:brightness-105 active:scale-95 active:shadow-inner transition-all flex items-center justify-center gap-2 shadow-md shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Mã Ưu Đãi Mới</span>
          </button>
        </div>

        {/* Coupons Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-[var(--text-muted)] gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
              <p className="text-xs">Đang tải danh sách mã giảm giá...</p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center p-4">
              <Ticket className="w-12 h-12 text-[var(--text-muted)]/40 mb-3" />
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Không tìm thấy mã ưu đãi nào</h4>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
                Thử thay đổi bộ lọc tìm kiếm hoặc tạo một mã ưu đãi mới cho khách hàng của bạn.
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity"
              >
                Tạo Mã Mới Ngay
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider bg-[var(--bg-card-muted)]">
                    <th className="py-3 px-3 w-12 text-center font-mono text-[11px]">STT</th>
                    <th className="py-3 px-4">Mã & Tên Voucher</th>
                    <th className="py-3 px-4">Phân Loại</th>
                    <th className="py-3 px-4">Mức Giảm</th>
                    <th className="py-3 px-4">Điều Kiện & Đối Tượng</th>
                    <th className="py-3 px-4">Thời Gian Hiệu Lực</th>
                    <th className="py-3 px-4">Số Lượng Sử Dụng</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {paginatedCoupons.map((cp, idx) => {
                    const id = cp._id || cp.id || '';
                    const isExpired = new Date(cp.endDate) < new Date();
                    const notStarted = new Date(cp.startDate) > new Date();
                    const totalQty = cp.totalQuantity || 0;
                    const usedQty = cp.usedQuantity || 0;
                    const remainingQty = cp.remainingQuantity ?? totalQty - (cp.claimedQuantity || 0);

                    return (
                      <tr key={id} className="hover:bg-[var(--table-row-hover)] transition-colors">
                        {/* STT */}
                        <td className="py-3.5 px-3 text-center font-mono text-xs text-[var(--text-muted)]">
                          {(page - 1) * 10 + idx + 1}
                        </td>
                        {/* Mã & Tên */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[var(--accent)] text-sm tracking-wide">
                              {cp.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(cp.code)}
                              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
                              title="Sao chép mã"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-[11px] text-[var(--text-primary)] font-medium mt-0.5 line-clamp-1">
                            {cp.name || 'Mã ưu đãi'}
                          </div>
                          {cp.description && (
                            <div className="text-[10px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                              {cp.description}
                            </div>
                          )}
                        </td>

                        {/* Phân loại Voucher */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {cp.voucherType === 'shipping' ? (
                            <StatusBadge variant="info" icon={<Truck className="w-3 h-3" />}>
                              Phí Vận Chuyển
                            </StatusBadge>
                          ) : cp.voucherType === 'product' ? (
                            <StatusBadge variant="warning" icon={<Tag className="w-3 h-3" />}>
                              Theo Sản Phẩm
                            </StatusBadge>
                          ) : (
                            <StatusBadge variant="accent" icon={<ShoppingBag className="w-3 h-3" />}>
                              Đơn Hàng
                            </StatusBadge>
                          )}

                          {/* Chi tiết danh mục hoặc sản phẩm nếu có */}
                          {cp.voucherType === 'product' && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {cp.applicableCategories && cp.applicableCategories.length > 0 && (
                                <StatusBadge variant="neutral" size="sm">
                                  {cp.applicableCategories.length} danh mục
                                </StatusBadge>
                              )}
                              {cp.applicableProducts && cp.applicableProducts.length > 0 && (
                                <StatusBadge variant="neutral" size="sm">
                                  {cp.applicableProducts.length} sản phẩm
                                </StatusBadge>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Mức Giảm */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                          {cp.discountType === 'percentage' ? (
                            <div>
                              <StatusBadge variant="accent" size="md">
                                Giảm {cp.discountValue}%
                              </StatusBadge>
                              {cp.maxDiscountAmount && cp.maxDiscountAmount > 0 ? (
                                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                                  Tối đa {formatCurrency(cp.maxDiscountAmount)}
                                </div>
                              ) : (
                                <div className="text-[10px] text-[var(--text-muted)] mt-1">Không giới hạn trần</div>
                              )}
                            </div>
                          ) : (
                            <StatusBadge variant="success" size="md">
                              Giảm {formatCurrency(cp.discountValue)}
                            </StatusBadge>
                          )}
                        </td>

                        {/* Điều Kiện & Đối Tượng */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-[11px] text-[var(--text-primary)]">
                            Đơn tối thiểu:{' '}
                            <strong className="font-mono">
                              {cp.minOrderValue && cp.minOrderValue > 0 ? formatCurrency(cp.minOrderValue) : '0đ (Không)'}
                            </strong>
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {cp.targetAudience === 'new' ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">Khách hàng mới</span>
                            ) : cp.targetAudience === 'vip' ? (
                              <span className="text-purple-600 dark:text-purple-400 font-medium">Khách hàng VIP</span>
                            ) : cp.targetAudience === 'member' ? (
                              <span className="text-blue-600 dark:text-blue-400 font-medium">Thành viên thân thiết</span>
                            ) : (
                              <span>Tất cả khách hàng</span>
                            )}
                          </div>
                        </td>

                        {/* Thời Gian Hiệu Lực */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px] font-mono">
                          <div className="text-[var(--text-primary)] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                            <span>{formatDate(cp.startDate)} — {formatDate(cp.endDate)}</span>
                          </div>
                          <div className="mt-1">
                            {isExpired ? (
                              <span className="inline-block text-[10px] text-red-500 uppercase tracking-wider font-semibold">
                                Đã Hết Hạn
                              </span>
                            ) : notStarted ? (
                              <span className="inline-block text-[10px] text-amber-500 uppercase tracking-wider font-semibold">
                                Sắp Diễn Ra
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">
                                Còn Hiệu Lực
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Số Lượng Sử Dụng */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                          <div className="text-[var(--text-primary)]">
                            Còn lại: <strong className="text-[var(--accent)]">{remainingQty}</strong> / {totalQty}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            Đã dùng: {usedQty} lượt
                          </div>
                          {totalQty > 0 && (
                            <div className="w-24 h-1.5 bg-[var(--border)] rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="h-full bg-[var(--accent)]"
                                style={{
                                  width: `${Math.min(100, Math.round(((totalQty - remainingQty) / totalQty) * 100))}%`,
                                }}
                              />
                            </div>
                          )}
                        </td>

                        {/* Trạng Thái */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusToggle
                            size="sm"
                            color="success"
                            checked={cp.status === 'ACTIVE'}
                            onChange={() => handleToggleStatus(cp)}
                            activeLabel="Hoạt Động"
                            inactiveLabel="Tạm Khóa"
                            ariaLabel="Bật / tắt trạng thái mã giảm giá"
                          />
                        </td>

                        {/* Thao Tác */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <AdminActionGroup>
                            <EditActionButton
                              onClick={() => handleOpenEdit(cp)}
                              title="Chỉnh sửa voucher"
                            />
                            <DeleteActionButton
                              onClick={() => handleDelete(id, cp.code)}
                              disabled={deletingId === id}
                              loading={deletingId === id}
                              title="Xóa voucher"
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
                totalItems={filteredCoupons.length}
                pageSize={10}
                onPageChange={setPage}
                itemName="voucher"
              />
            </div>
          )}
        </div>

        {/* Modal Khởi Tạo & Chỉnh Sửa Voucher */}
        {isModalOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 bg-[rgba(26,26,23,0.55)] backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pointer-events-auto"
              style={{ zIndex: overlayZIndex }}
              onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) setIsModalOpen(false);
              }}
              role="dialog"
              aria-modal="true"
              aria-label={editingCoupon ? 'Chỉnh Sửa Mã Ưu Đãi' : 'Khởi Tạo Mã Ưu Đãi'}
            >
              <div
                className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-2xl rounded-sm text-[var(--text)] max-h-[calc(100dvh-32px)] flex flex-col shadow-2xl overflow-hidden admin-content-scrollbar"
                style={{ zIndex: contentZIndex }}
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center">
                  <div>
                    <h3 className="font-display text-base font-bold text-[var(--text)] flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[var(--accent)]" />
                      {editingCoupon ? (
                        <span>
                          Chỉnh Sửa Mã Ưu Đãi: <span className="font-mono text-[var(--accent)]">{editingCoupon.code}</span>
                        </span>
                      ) : (
                        'Khởi Tạo Mã Ưu Đãi Mới'
                      )}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {editingCoupon
                        ? 'Cập nhật điều kiện áp dụng, thời hạn, phạm vi danh mục và mức giảm giá'
                        : 'Điền đầy đủ thông tin để phát hành mã voucher cho khách hàng'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] rounded-sm transition-colors"
                    aria-label="Đóng"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-xs flex-1">
                  {/* PHẦN 1: Phân Loại Voucher (Đơn hàng vs Phí ship vs Sản phẩm) */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                      1. Phân Loại Voucher <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Đơn hàng */}
                      <button
                        type="button"
                        onClick={() => setFormVoucherType('order')}
                        className={`p-3 text-left border rounded-sm transition-all flex flex-col justify-between cursor-pointer hover:shadow-md active:scale-95 active:shadow-inner ${
                          formVoucherType === 'order'
                            ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)] shadow-sm'
                            : 'border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <ShoppingBag className={`w-4 h-4 ${formVoucherType === 'order' ? 'text-[var(--accent)]' : ''}`} />
                          {formVoucherType === 'order' && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                        </div>
                        <div className="font-semibold text-xs text-[var(--text-primary)]">Voucher Đơn Hàng</div>
                        <div className="text-[10px] mt-0.5">Giảm trực tiếp vào tổng tiền hàng toàn sàn</div>
                      </button>

                      {/* Phí vận chuyển */}
                      <button
                        type="button"
                        onClick={() => setFormVoucherType('shipping')}
                        className={`p-3 text-left border rounded-sm transition-all flex flex-col justify-between cursor-pointer hover:shadow-md active:scale-95 active:shadow-inner ${
                          formVoucherType === 'shipping'
                            ? 'border-indigo-500 bg-indigo-500/10 text-[var(--text-primary)] shadow-sm'
                            : 'border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Truck className={`w-4 h-4 ${formVoucherType === 'shipping' ? 'text-indigo-500' : ''}`} />
                          {formVoucherType === 'shipping' && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                        </div>
                        <div className="font-semibold text-xs text-[var(--text-primary)]">Voucher Phí Vận Chuyển</div>
                        <div className="text-[10px] mt-0.5">Trừ vào phí giao hàng (Free Ship)</div>
                      </button>

                      {/* Theo sản phẩm / danh mục */}
                      <button
                        type="button"
                        onClick={() => setFormVoucherType('product')}
                        className={`p-3 text-left border rounded-sm transition-all flex flex-col justify-between cursor-pointer hover:shadow-md active:scale-95 active:shadow-inner ${
                          formVoucherType === 'product'
                            ? 'border-amber-500 bg-amber-500/10 text-[var(--text-primary)] shadow-sm'
                            : 'border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Tag className={`w-4 h-4 ${formVoucherType === 'product' ? 'text-amber-500' : ''}`} />
                          {formVoucherType === 'product' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                        <div className="font-semibold text-xs text-[var(--text-primary)]">Voucher Theo Sản Phẩm</div>
                        <div className="text-[10px] mt-0.5">Áp dụng cho danh mục / sản phẩm chọn lọc</div>
                      </button>
                    </div>
                  </div>

                  {/* PHẦN 2: Thông Tin Cơ Bản (Mã, Tên, Mô tả) */}
                  <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                    <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                      2. Thông Tin Nhận Diện
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1">
                          Mã Ưu Đãi (In hoa, không dấu cách) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!!editingCoupon}
                          value={formCode}
                          onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                          placeholder="VÍ DỤ: HAUTE25, FREESHIP30K"
                          className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none font-mono uppercase text-[var(--text-primary)] rounded-sm disabled:opacity-60"
                        />
                      </div>

                      <div>
                        <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1">
                          Tên Chương Trình Ưu Đãi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Ví dụ: Tri Ân Thành Viên BST Thu Đông"
                          className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-1">
                        Mô Tả Chi Tiết (Tùy chọn)
                      </label>
                      <textarea
                        rows={2}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Mô tả quyền lợi hoặc điều kiện voucher gửi đến khách hàng..."
                        className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm resize-none"
                      />
                    </div>
                  </div>

                  {/* PHẦN 3: Hình Thức Giảm Giá & Mức Giảm */}
                  <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                    <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                      3. Hình Thức Giảm Giá & Giá Trị <span className="text-red-500">*</span>
                    </label>

                    <div className="flex flex-wrap gap-5 items-center py-0.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="discountType"
                          value="percentage"
                          checked={formDiscountType === 'percentage'}
                          onChange={() => setFormDiscountType('percentage')}
                          className="w-4 h-4 text-[var(--accent)] accent-[var(--accent)] focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs text-[var(--text-primary)] font-medium flex items-center gap-1.5">
                          <Percent className="w-3.5 h-3.5 text-[var(--accent)]" />
                          Giảm Theo Phần Trăm (%)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="discountType"
                          value="fixed"
                          checked={formDiscountType === 'fixed'}
                          onChange={() => setFormDiscountType('fixed')}
                          className="w-4 h-4 text-[var(--accent)] accent-[var(--accent)] focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs text-[var(--text-primary)] font-medium flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-500" />
                          Giảm Tiền Cố Định (VNĐ)
                        </span>
                      </label>
                    </div>

                    <div className={`grid grid-cols-1 ${formDiscountType === 'percentage' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 items-end`}>
                      <div className="flex flex-col justify-end">
                        <div className="flex items-center justify-between mb-1 h-5">
                          <label className="text-[var(--text-muted)] uppercase tracking-wider text-[10px] truncate">
                            {formDiscountType === 'percentage' ? 'Mức Giảm (%)' : 'Số Tiền Giảm (VNĐ)'} <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <input
                          type="number"
                          required
                          min={1}
                          max={formDiscountType === 'percentage' ? 100 : undefined}
                          step={formDiscountType === 'percentage' ? 1 : 1000}
                          value={formDiscountValue === 0 ? '' : formDiscountValue}
                          onChange={(e) => setFormDiscountValue(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                          placeholder={formDiscountType === 'percentage' ? 'Ví dụ: 15' : 'Ví dụ: 50000'}
                          className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none font-mono text-[var(--text-primary)] rounded-sm"
                        />
                      </div>

                      {formDiscountType === 'percentage' && (
                        <div className="flex flex-col justify-end">
                          <div className="flex items-center justify-between mb-1 h-5">
                            <label className="text-[var(--text-muted)] uppercase tracking-wider text-[10px] truncate">
                              Giảm Tối Đa (VNĐ)
                            </label>
                            <span className="text-[9px] text-[var(--text-muted)] font-normal lowercase tracking-normal">
                              0 = vô hạn
                            </span>
                          </div>
                          <input
                            type="number"
                            min={0}
                            step={5000}
                            value={formMaxDiscountAmount === 0 ? '' : formMaxDiscountAmount}
                            onChange={(e) => setFormMaxDiscountAmount(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                            placeholder="0 (Không giới hạn)"
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none font-mono text-[var(--text-primary)] rounded-sm"
                          />
                        </div>
                      )}

                      <div className="flex flex-col justify-end">
                        <div className="flex items-center justify-between mb-1 h-5">
                          <label className="text-[var(--text-muted)] uppercase tracking-wider text-[10px] truncate">
                            Đơn Tối Thiểu (VNĐ)
                          </label>
                          <span className="text-[9px] text-[var(--text-muted)] font-normal lowercase tracking-normal">
                            0 = mọi đơn
                          </span>
                        </div>
                        <input
                          type="number"
                          min={0}
                          step={10000}
                          value={formMinOrderValue === 0 ? '' : formMinOrderValue}
                          onChange={(e) => setFormMinOrderValue(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                          placeholder="0 (Không giới hạn)"
                          className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none font-mono text-[var(--text-primary)] rounded-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PHẦN 4: Thời Hạn & Số Lượng */}
                  <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                    <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                      4. Thời Hạn & Số Lượng Phát Hành <span className="text-red-500">*</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="flex flex-col justify-end">
                        <div className="flex items-center mb-1 h-5">
                          <label className="text-[var(--text-muted)] uppercase tracking-wider text-[10px] truncate">
                            Từ Ngày <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <input
                          type="date"
                          required
                          value={formStartDate}
                          onChange={(e) => setFormStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <div className="flex items-center mb-1 h-5">
                          <label className="text-[var(--text-muted)] uppercase tracking-wider text-[10px] truncate">
                            Đến Hết Ngày <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <input
                          type="date"
                          required
                          value={formEndDate}
                          onChange={(e) => setFormEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <div className="flex items-center mb-1 h-5">
                          <label className="text-[var(--text-muted)] uppercase tracking-wider text-[10px] truncate">
                            Tổng Số Lượng Voucher <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <input
                          type="number"
                          required
                          min={editingCoupon?.claimedQuantity || 1}
                          value={formTotalQuantity === 0 ? '' : formTotalQuantity}
                          onChange={(e) => setFormTotalQuantity(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                          placeholder="100"
                          className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none font-mono text-[var(--text-primary)] rounded-sm"
                        />
                        {editingCoupon && editingCoupon.claimedQuantity ? (
                          <div className="text-[10px] text-[var(--text-muted)] mt-1">
                            Đã nhận: {editingCoupon.claimedQuantity} mã (không thể đặt dưới mức này)
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* PHẦN 5: Đối Tượng Khách Hàng Áp Dụng */}
                  <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                    <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                      5. Đối Tượng Khách Hàng Áp Dụng
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'all', label: 'Tất cả khách hàng', desc: 'Mọi người dùng' },
                        { id: 'new', label: 'Khách hàng mới', desc: 'Chưa từng mua hàng' },
                        { id: 'member', label: 'Thành viên', desc: 'Đã có ≥ 1 đơn hàng' },
                        { id: 'vip', label: 'Khách hàng VIP', desc: 'Chi tiêu từ 5.000.000đ' },
                      ].map((aud) => (
                        <button
                          key={aud.id}
                          type="button"
                          onClick={() => setFormTargetAudience(aud.id as any)}
                          className={`p-2.5 text-left border rounded-sm transition-all cursor-pointer hover:shadow-md active:scale-95 active:shadow-inner ${
                            formTargetAudience === aud.id
                              ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)] shadow-sm'
                              : 'border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                          }`}
                        >
                          <div className="font-semibold text-xs text-[var(--text-primary)]">{aud.label}</div>
                          <div className="text-[10px] mt-0.5">{aud.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PHẦN 6: Phạm Vi Danh Mục & Sản Phẩm (khi chọn loại Sản Phẩm) */}
                  {formVoucherType === 'product' && (
                    <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                      <div className="flex justify-between items-center">
                        <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                          6. Phạm Vi Áp Dụng (Danh Mục / Sản Phẩm) <span className="text-red-500">*</span>
                        </label>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setFormApplicableScope('category')}
                            className={`px-3 py-1 rounded-sm text-xs font-medium border transition-all cursor-pointer hover:shadow-sm active:scale-95 ${
                              formApplicableScope === 'category'
                                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)] shadow-sm'
                                : 'bg-[var(--bg-card-muted)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            Theo Danh Mục
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormApplicableScope('product')}
                            className={`px-3 py-1 rounded-sm text-xs font-medium border transition-all cursor-pointer hover:shadow-sm active:scale-95 ${
                              formApplicableScope === 'product'
                                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)] shadow-sm'
                                : 'bg-[var(--bg-card-muted)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            Theo Sản Phẩm Cụ Thể
                          </button>
                        </div>
                      </div>

                      {/* Scope: Category */}
                      {formApplicableScope === 'category' && (
                        <div className="space-y-2 bg-[var(--bg-card-muted)]/50 p-3 rounded-sm border border-[var(--border)]">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-[11px] text-[var(--text-muted)]">
                              Chọn danh mục được áp dụng (Đã chọn: <strong className="text-[var(--accent)]">{formSelectedCategories.length}</strong>)
                            </span>
                            <input
                              type="text"
                              value={catSearch}
                              onChange={(e) => setCatSearch(e.target.value)}
                              placeholder="Lọc danh mục..."
                              className="px-2.5 py-1 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-sm text-[var(--text-primary)] focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pt-1">
                            {filteredModalCategories.map((cat) => {
                              const catId = cat._id || cat.id;
                              const isChecked = formSelectedCategories.includes(catId);
                              return (
                                <label
                                  key={catId}
                                  className={`flex items-center gap-2 p-2 border rounded-sm cursor-pointer transition-colors ${
                                    isChecked
                                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)]'
                                      : 'border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormSelectedCategories([...formSelectedCategories, catId]);
                                      } else {
                                        setFormSelectedCategories(formSelectedCategories.filter((id) => id !== catId));
                                      }
                                    }}
                                    className="rounded-sm text-[var(--accent)] focus:ring-0"
                                  />
                                  <span className="text-xs truncate">{cat.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Scope: Product */}
                      {formApplicableScope === 'product' && (
                        <div className="space-y-2 bg-[var(--bg-card-muted)]/50 p-3 rounded-sm border border-[var(--border)]">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-[11px] text-[var(--text-muted)]">
                              Chọn sản phẩm được áp dụng (Đã chọn: <strong className="text-[var(--accent)]">{formSelectedProducts.length}</strong>)
                            </span>
                            <input
                              type="text"
                              value={prodSearch}
                              onChange={(e) => setProdSearch(e.target.value)}
                              placeholder="Tìm sản phẩm..."
                              className="px-2.5 py-1 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-sm text-[var(--text-primary)] focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pt-1">
                            {filteredModalProducts.map((prod) => {
                              const prodId = prod._id || prod.id;
                              const isChecked = formSelectedProducts.includes(prodId);
                              return (
                                <label
                                  key={prodId}
                                  className={`flex items-center gap-2.5 p-2 border rounded-sm cursor-pointer transition-colors ${
                                    isChecked
                                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)]'
                                      : 'border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormSelectedProducts([...formSelectedProducts, prodId]);
                                      } else {
                                        setFormSelectedProducts(formSelectedProducts.filter((id) => id !== prodId));
                                      }
                                    }}
                                    className="rounded-sm text-[var(--accent)] focus:ring-0 shrink-0"
                                  />
                                  {prod.thumbnail && (
                                    <img
                                      src={prod.thumbnail}
                                      alt={prod.name}
                                      className="w-8 h-8 object-cover rounded-sm border border-[var(--border)] shrink-0"
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs truncate text-[var(--text-primary)]">{prod.name}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                                      {formatCurrency(prod.price || prod.new_price || 0)}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PHẦN 7: Trạng Thái Kích Hoạt */}
                  <div className="space-y-2 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-[var(--text-primary)]">Trạng Thái Kích Hoạt</div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        Cho phép khách hàng áp dụng voucher này ngay lập tức khi trong thời hạn
                      </div>
                    </div>

                    <StatusToggle
                      size="md"
                      color="success"
                      checked={formStatus === 'ACTIVE'}
                      onChange={(checked) => setFormStatus(checked ? 'ACTIVE' : 'INACTIVE')}
                      activeLabel="Đang Kích Hoạt"
                      inactiveLabel="Tạm Khóa"
                      ariaLabel="Trạng thái kích hoạt mã giảm giá"
                    />
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-4 flex justify-end gap-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2.5 border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-card)] text-[var(--text)] hover:text-[var(--accent)] rounded-lg text-xs font-mono uppercase tracking-wider transition-all shadow-xs hover:shadow-sm cursor-pointer"
                    >
                      Hủy
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)] font-bold rounded-lg text-xs font-mono uppercase tracking-wider hover:brightness-105 shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang Lưu...</span>
                        </>
                      ) : (
                        <span>{editingCoupon ? 'Cập Nhật Voucher' : 'Kích Hoạt Mã'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    </AdminLayout>
  );
};
