import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AccountLayout } from './AccountLayout';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { formatCurrency } from '../../shared/utils/formatters';
import { ArrowLeft, Printer, ShieldCheck, Truck, PackageCheck } from 'lucide-react';

export const AccountOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { orders } = useAuthStore();

  const order = orders.find((o) => o.id === id || o.orderNumber === id) || orders[0];

  if (!order) {
    return (
      <AccountLayout>
        <div className="py-20 text-center space-y-4">
          <h3 className="font-display text-2xl text-white">Không tìm thấy đơn hàng</h3>
          <Link
            to="/orders"
            className="text-xs uppercase tracking-widest text-champagne hover:underline inline-flex items-center gap-1"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-6 gap-4">
          <div>
            <Link
              to="/orders"
              className="text-xs uppercase tracking-widest text-champagne hover:underline inline-flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Trở lại sổ đơn hàng
            </Link>
            <h1 className="font-display text-2xl sm:text-3xl text-white">
              Đơn hàng {order.orderNumber}
            </h1>
            <p className="text-xs text-platinum-dark font-mono mt-0.5">
              Thời gian khởi tạo: {order.date}
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg text-xs uppercase tracking-wider text-white transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Printer className="w-3.5 h-3.5 text-champagne" />
            <span>In biên lai chứng thực</span>
          </button>
        </div>

        {/* Tracking Milestone */}
        <div className="p-6 rounded-xl bg-noir-950 border border-white/5 space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-champagne block">
            Tiến trình vận chuyển ngoại giao
          </span>
          <div className="flex items-center gap-3 text-xs font-sans text-white/80">
            <Truck className="w-4 h-4 text-champagne flex-shrink-0" />
            <span>Mã định danh DHL Diplomatic: <strong className="font-mono text-white">DHL-EXP-FR884920X</strong></span>
          </div>
        </div>

        {/* Items List */}
        <div className="p-6 rounded-xl bg-noir-950 border border-white/5 space-y-4">
          <h4 className="font-display text-lg text-white">Sản phẩm trong đơn hàng</h4>
          <div className="divide-y divide-white/5">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={item.image}
                    alt=""
                    className="w-16 h-20 object-cover rounded bg-noir-900 border border-white/10 flex-shrink-0"
                  />
                  <div>
                    <h5 className="font-serif text-white font-medium text-sm">{item.name}</h5>
                    <p className="text-[11px] text-platinum-dark mt-0.5">
                      Màu: {item.color} • Kích cỡ: {item.size} • Số lượng: {item.quantity}
                    </p>
                    <span className="font-mono text-xs text-champagne block mt-1">
                      {formatCurrency(item.price)} / chiếc
                    </span>
                  </div>
                </div>
                <span className="font-mono text-sm text-white font-semibold">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Addresses & Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans">
          <div className="p-6 rounded-xl bg-noir-950 border border-white/5 space-y-3">
            <h5 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Địa chỉ nhận găng tay trắng
            </h5>
            <p className="text-white/80">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p className="text-platinum-dark">
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
            </p>
            <p className="text-platinum-dark">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
            <p className="text-platinum-dark">{order.shippingAddress.country}</p>
            <p className="text-white/60 font-mono pt-1">{order.shippingAddress.phone}</p>
          </div>

          <div className="p-6 rounded-xl bg-noir-950 border border-white/5 space-y-3">
            <h5 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Tóm tắt chi phí thanh toán
            </h5>
            <div className="space-y-1.5 text-platinum-dark">
              <div className="flex justify-between">
                <span>Tạm tính sản phẩm:</span>
                <span className="font-mono text-white">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-champagne">
                  <span>Ưu đãi đặc quyền:</span>
                  <span className="font-mono">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Vận chuyển găng tay trắng:</span>
                <span className="font-mono text-white">
                  {order.shipping === 0 ? 'Miễn phí' : formatCurrency(order.shipping)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Thuế giá trị gia tăng (8%):</span>
                <span className="font-mono text-white">{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-white font-semibold text-sm pt-2 border-t border-white/10">
                <span>Tổng giá trị đơn hàng:</span>
                <span className="font-mono text-champagne">{formatCurrency(order.total)}</span>
              </div>
            </div>
            <p className="text-[11px] text-white/40 pt-2">
              Phương thức: {order.paymentMethod}
            </p>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
};
