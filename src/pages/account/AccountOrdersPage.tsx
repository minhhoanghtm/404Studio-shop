import React from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from '../../components/layout/AccountLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import { ArrowRight, Package } from 'lucide-react';

export const AccountOrdersPage: React.FC = () => {
  const { orders } = useAuthStore();

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            ACQUISITION HISTORY
          </span>
          <h2 className="font-display text-2xl sm:text-3xl text-white tracking-wide">
            Orders & Receipts
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <Package className="w-10 h-10 text-white/30 mx-auto" />
            <p className="font-serif italic text-lg text-white">No historical acquisitions recorded</p>
            <Link
              to="/shop"
              className="inline-block px-6 py-2.5 bg-champagne text-noir-950 font-semibold text-xs uppercase tracking-widest"
            >
              Explore Ready-to-Wear
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-6 rounded-xl bg-noir-950 border border-white/5 space-y-4 hover:border-white/15 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 text-xs font-sans gap-2">
                  <div>
                    <span className="font-mono text-champagne font-bold text-sm">
                      {order.orderNumber}
                    </span>
                    <span className="text-platinum-dark ml-3">{order.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/10 text-platinum-light font-mono text-[10px] uppercase">
                      {order.status}
                    </span>
                    <span className="font-mono text-white font-semibold text-sm">
                      ${order.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs font-sans"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt=""
                          className="w-12 h-14 object-cover rounded bg-noir-900 border border-white/10"
                        />
                        <div>
                          <p className="font-serif text-white font-medium">{item.name}</p>
                          <p className="text-[11px] text-platinum-dark">
                            Qty {item.quantity} • {item.color} • {item.size}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-white font-medium">
                        ${(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/5 text-xs font-sans">
                  <span className="text-platinum-dark text-[11px]">
                    Track: {order.trackingNumber || 'DHL-VIP-Pending'}
                  </span>
                  <Link
                    to={`/account/orders/${order.id}`}
                    className="text-champagne hover:underline inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-[11px]"
                  >
                    <span>View Receipt & Protocol</span>
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
