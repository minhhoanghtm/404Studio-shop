import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AccountLayout } from '../../components/layout/AccountLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import { ArrowLeft, Printer, Truck, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const AccountOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { orders } = useAuthStore();

  const order = orders.find((o) => o.id === id || o.orderNumber === id) || orders[0];

  if (!order) {
    return (
      <AccountLayout>
        <div className="py-12 text-center space-y-4">
          <h3 className="font-display text-2xl text-white">Order Not Found</h3>
          <Link to="/account/orders" className="text-champagne underline text-xs">
            Return to Orders
          </Link>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-champagne hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
          </Link>
          <button
            onClick={() => window.print()}
            className="text-xs uppercase tracking-widest text-white/60 hover:text-white flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print Receipt
          </button>
        </div>

        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
              ACQUISITION CERTIFICATE
            </span>
            <h2 className="font-display text-3xl text-white tracking-wide">
              {order.orderNumber}
            </h2>
            <p className="text-xs text-platinum-dark font-sans mt-0.5">
              Issued on {order.date} • {order.paymentMethod}
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs uppercase self-start sm:self-auto">
            Status: {order.status}
          </span>
        </div>

        {/* Tracking Bar */}
        <div className="p-6 rounded-xl bg-noir-950 border border-white/5 space-y-3 text-xs font-sans">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium flex items-center gap-2">
              <Truck className="w-4 h-4 text-champagne" /> Diplomatic Courier Protocol
            </span>
            <span className="font-mono text-champagne">{order.trackingNumber || 'FR-DHL-VIP'}</span>
          </div>
          <p className="text-platinum-dark leading-relaxed">
            {order.estimatedDelivery || 'Estimated courier delivery: 3-5 business days.'}
          </p>
        </div>

        {/* Garments Table */}
        <div className="space-y-4">
          <h4 className="text-xs uppercase tracking-widest text-white font-semibold">
            Archival Garments
          </h4>
          <div className="divide-y divide-white/5 border-y border-white/5">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="py-4 flex items-center justify-between text-xs font-sans"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt=""
                    className="w-16 h-20 object-cover rounded bg-noir-900 border border-white/10"
                  />
                  <div>
                    <h5 className="font-serif text-base text-white font-medium">{item.name}</h5>
                    <p className="text-[11px] text-platinum-dark">
                      Color: {item.color} • Size: {item.size} • Qty: {item.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-white font-medium text-sm">
                  ${(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Address and Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
          <div className="p-5 rounded-xl bg-noir-950 border border-white/5 space-y-2 text-xs font-sans text-platinum-dark">
            <h5 className="text-white uppercase tracking-wider text-[11px] font-semibold">
              Delivery Destination
            </h5>
            <p className="text-white font-medium">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
            <p>
              {order.shippingAddress.postalCode} {order.shippingAddress.city}, {order.shippingAddress.country}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-noir-950 border border-white/5 space-y-2 text-xs font-sans text-platinum-dark">
            <h5 className="text-white uppercase tracking-wider text-[11px] font-semibold mb-3">
              Cost Summary
            </h5>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-white">${order.subtotal.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-champagne">
                <span>Privilège Courtesy</span>
                <span className="font-mono">-${order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-mono text-white">
                {order.shipping === 0 ? 'Complimentary' : `$${order.shipping}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Taxes</span>
              <span className="font-mono text-white">${order.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-semibold text-white">
              <span>Total</span>
              <span className="font-mono text-champagne">${order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
};
