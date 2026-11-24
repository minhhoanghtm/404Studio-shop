import React, { useState } from 'react';
import { Search, Package, MapPin, Clock, ArrowRight, RotateCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { ordersApi } from '@/shared/api';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';

export const OrderLookupPage: React.FC = () => {
  const [orderCode, setOrderCode] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<any | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim() || !phone.trim()) {
      setError('Vui lòng nhập đầy đủ Mã đơn hàng và Số điện thoại đặt hàng.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOrderResult(null);

    try {
      const res = await ordersApi.lookupOrder(orderCode.trim(), phone.trim());
      const order = res?.order || res?.data?.order || res?.data;
      if (!order) throw new Error('Không tìm thấy đơn hàng phù hợp.');
      setOrderResult(order);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Không thể tra cứu đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] uppercase tracking-wider rounded font-medium">Đã Giao Thành Công</span>;
      case 'shipping':
        return <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[11px] uppercase tracking-wider rounded font-medium">Đang Vận Chuyển Cao Cấp</span>;
      case 'processing':
        return <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] uppercase tracking-wider rounded font-medium">Đang Hoàn Thiện & Đóng Gói</span>;
      default:
        return <span className="px-3 py-1 bg-[var(--bg-alt)] text-[var(--text)] border border-[var(--border)] text-[11px] uppercase tracking-wider rounded">Chờ Xác Nhận</span>;
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--accent)] block mb-2 font-semibold">
            Dịch Vụ Hậu Mãi & Khách Hàng
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl tracking-wide mb-3 text-[var(--text)]">
            Tra Cứu Tiến Trình Đơn Hàng
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
            Nhập mã đơn hàng và số điện thoại đã sử dụng khi đặt hàng để theo dõi lịch trình may đo, hoàn thiện thủ công và hành trình chuyển phát bưu chính cao cấp.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] p-6 sm:p-8 rounded-2xl shadow-xl mb-10">
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Mã Đơn Hàng (Ví dụ: ORD-8924)
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    placeholder="Mã đơn hàng"
                    className="w-full pl-10 pr-4 py-3 text-xs bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] rounded-lg focus:border-[var(--accent)] focus:outline-none transition-colors uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Số Điện Thoại Đặt Hàng
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Số điện thoại nhận hàng"
                    className="w-full pl-10 pr-4 py-3 text-xs bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] rounded-lg focus:border-[var(--accent)] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-center gap-2 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] uppercase text-xs tracking-[0.2em] font-medium transition-all duration-300 flex items-center justify-center gap-2 rounded-lg shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Tra Cứu Lịch Trình</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Details Output */}
        {orderResult && (
          <div className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 rounded-2xl space-y-6 shadow-sm animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] block">Mã đơn hàng</span>
                <span className="font-mono text-lg font-bold text-[var(--accent)]">{orderResult.order_code || orderResult.orderCode}</span>
                <span className="text-xs text-[var(--text-muted)] block mt-0.5">
                  Ngày khởi tạo: {formatDate(orderResult.createdAt)}
                </span>
              </div>
              <div>{getStatusBadge(orderResult.status)}</div>
            </div>

            {/* Tracking info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] block font-medium">Địa chỉ giao</span>
                  <p className="text-xs mt-0.5 text-[var(--text)]">{orderResult.shipping_address?.fullName || orderResult.shippingAddress?.fullName} — {orderResult.shipping_address?.phone || orderResult.shippingAddress?.phone}</p>
                  <p className="text-xs text-[var(--text-muted)]">{orderResult.shipping_address?.addressDetail || orderResult.shippingAddress?.addressDetail}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] block font-medium">Mã vận đơn đối tác</span>
                  <p className="text-xs font-mono font-medium text-[var(--text)] mt-0.5">{orderResult.trackingNumber || 'Đang cập nhật'}</p>
                  <p className="text-xs text-[var(--text-muted)]">Dự kiến giao: {orderResult.estimatedDelivery || '2-4 ngày'}</p>
                </div>
              </div>
            </div>

            {/* Item list */}
            <div>
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] block mb-3 font-medium">
                Sản phẩm trong kiện hàng
              </span>
              <div className="space-y-3">
                {orderResult.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 py-3 border-t border-[var(--border)]">
                    <img
                      src={item.image || item.product?.images?.[0] || ''}
                      alt={item.productName || item.product?.name}
                      className="w-16 h-20 object-cover border border-[var(--border)] rounded bg-[var(--bg-alt)]"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-serif truncate text-[var(--text)]">{item.productName || item.product?.name}</h4>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Màu: {item.colorName || item.variant?.colorName || 'Tiêu chuẩn'} | Size: {item.sizeName || item.variant?.size || 'FR 38'}
                      </p>
                      <p className="text-xs font-mono text-[var(--accent)] mt-1 font-semibold">
                        {formatCurrency(item.price || 0)} × {item.quantity || 1}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Tổng thanh toán</span>
              <span className="font-mono text-base font-bold text-[var(--accent)]">
                {formatCurrency(orderResult.totalAmount || 0)}
              </span>
            </div>

            <div className="p-3.5 bg-[var(--bg-alt)] border border-[var(--border)] rounded-xl flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <ShieldCheck className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>Kiện hàng được niêm phong hộp gỗ tuyết tùng và bảo hiểm 100% giá trị trong suốt quá trình vận chuyển.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
