import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AccountLayout } from './AccountLayout';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { formatCurrency } from '../../shared/utils/formatters';
import { ArrowLeft, Printer, Truck } from 'lucide-react';

export const AccountOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { orders } = useAuthStore();

  const order = orders.find((o) => o.id === id || o.orderNumber === id) || orders[0];

  if (!order) {
    return (
      <AccountLayout>
        <div className="py-20 text-center space-y-4">
          <h3 className="font-display text-2xl text-[var(--text)]">Không tìm thấy đơn hàng</h3>
          <Link
            to="/orders"
            className="text-xs uppercase tracking-widest text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Trở lại sổ đơn hàng
          </Link>
        </div>
      </AccountLayout>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] pb-6 gap-4">
          <div>
            <Link
              to="/orders"
              className="text-xs uppercase tracking-widest text-[var(--accent)] hover:underline inline-flex items-center gap-1 mb-2 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Trở lại sổ đơn hàng
            </Link>
            <h1 className="font-display text-2xl sm:text-3xl text-[var(--text)]">
              Đơn hàng {order.orderNumber}
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
              Thời gian khởi tạo: {order.date}
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-[var(--surface)] hover:bg-[var(--bg-alt)] border border-[var(--border)] rounded-lg text-xs uppercase tracking-wider text-[var(--text)] transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>In biên lai chứng thực</span>
          </button>
        </div>

        {/* Tracking Milestone */}
        <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] block">
            Tiến trình vận chuyển ngoại giao
          </span>
          <div className="flex items-center gap-3 text-xs font-sans text-[var(--text)]">
            <Truck className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
            <span>Mã định danh DHL Diplomatic: <strong className="font-mono text-[var(--accent)]">DHL-EXP-FR884920X</strong></span>
          </div>
        </div>

        {/* Items List */}
        <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-4 shadow-sm">
          <h4 className="font-display text-lg text-[var(--text)]">Sản phẩm trong đơn hàng</h4>
          <div className="divide-y divide-[var(--border)]">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={item.image}
                    alt=""
                    className="w-16 h-20 object-cover rounded bg-[var(--bg-alt)] border border-[var(--border)] flex-shrink-0"
                  />
                  <div>
                    <h5 className="font-serif text-[var(--text)] font-medium text-sm">{item.name}</h5>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Màu: {item.color} • Kích cỡ: {item.size} • Số lượng: {item.quantity}
                    </p>
                    <span className="font-mono text-xs text-[var(--accent)] block mt-1 font-semibold">
                      {formatCurrency(item.price)} / chiếc
                    </span>
                  </div>
                </div>
                <span className="font-mono text-sm text-[var(--text)] font-semibold">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Addresses & Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans">
          <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3 shadow-sm">
            <h5 className="font-semibold text-[var(--text)] uppercase tracking-wider text-[11px]">
              Địa chỉ nhận găng tay trắng
            </h5>
            <p className="text-[var(--text)]">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p className="text-[var(--text-muted)]">
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
            </p>
            <p className="text-[var(--text-muted)]">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
            <p className="text-[var(--text-muted)]">{order.shippingAddress.country}</p>
            <p className="text-[var(--text-muted)] font-mono pt-1">{order.shippingAddress.phone}</p>
          </div>

          <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3 shadow-sm">
            <h5 className="font-semibold text-[var(--text)] uppercase tracking-wider text-[11px]">
              Tóm tắt chi phí thanh toán
            </h5>
            <div className="space-y-1.5 text-[var(--text-muted)]">
              <div className="flex justify-between">
                <span>Tạm tính sản phẩm:</span>
                <span className="font-mono text-[var(--text)]">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[var(--accent)] font-semibold">
                  <span>Ưu đãi đặc quyền:</span>
                  <span className="font-mono">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Vận chuyển găng tay trắng:</span>
                <span className="font-mono text-[var(--text)]">
                  {order.shipping === 0 ? 'Miễn phí' : formatCurrency(order.shipping)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Thuế giá trị gia tăng (8%):</span>
                <span className="font-mono text-[var(--text)]">{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-[var(--text)] font-semibold text-sm pt-2 border-t border-[var(--border)]">
                <span>Tổng giá trị đơn hàng:</span>
                <span className="font-mono text-[var(--accent)] font-bold">{formatCurrency(order.total)}</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] pt-2">
              Phương thức: {order.paymentMethod}
            </p>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
};
