import React from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from './AccountLayout';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { formatCurrency } from '../../shared/utils/formatters';
import { ArrowRight, Package } from 'lucide-react';

export const AccountOrdersPage: React.FC = () => {
  const { orders } = useAuthStore();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Đã giao thành công';
      case 'shipped':
        return 'Đang chuyển phát ngoại giao';
      case 'processing':
        return 'Đang chuẩn bị & kiểm định';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            SỔ GIAO THỨC SỞ HỮU
          </span>
          <h2 className="font-display text-2xl sm:text-3xl text-white tracking-wide">
            Lịch Sử Đơn Hàng & Biên Lai Lưu Trữ
          </h2>
          <p className="text-xs text-platinum-dark font-sans mt-1">
            Toàn bộ các sản phẩm y phục đã được ủy thác và tiến trình chuyển phát găng tay trắng.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="p-16 rounded-xl bg-noir-950 border border-white/5 text-center space-y-4">
            <Package className="w-10 h-10 text-champagne mx-auto" />
            <h4 className="font-display text-xl text-white">Chưa Có Đơn Hàng</h4>
            <p className="text-xs text-platinum-dark max-w-sm mx-auto">
              Quý khách hiện chưa có đơn hàng nào được ghi nhận trong sổ lưu trữ của Maison.
            </p>
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-champagne text-noir-950 text-xs font-semibold uppercase tracking-widest rounded-lg"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-6 rounded-xl bg-noir-950 border border-white/5 space-y-4 hover:border-champagne/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 text-xs font-sans gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-champagne font-bold text-sm">
                      {order.orderNumber}
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="text-platinum-dark">{order.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase">
                      {getStatusLabel(order.status)}
                    </span>
                    <span className="font-mono text-white font-semibold text-sm">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-white/5">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image}
                          alt=""
                          className="w-12 h-14 object-cover rounded bg-noir-900 border border-white/10 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-serif text-white font-medium truncate">{item.name}</p>
                          <p className="text-[11px] text-platinum-dark">
                            Số lượng: {item.quantity} • {item.color} • Cỡ {item.size}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-white/80 flex-shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-champagne hover:underline"
                  >
                    <span>Xem chi tiết & Biên lai</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
};
