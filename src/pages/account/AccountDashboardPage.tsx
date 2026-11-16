import React from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from '../../components/layout/AccountLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import { Package, ArrowRight, Sparkles, MapPin, ShieldCheck } from 'lucide-react';

export const AccountDashboardPage: React.FC = () => {
  const { user, orders } = useAuthStore();
  const recentOrder = orders[0];

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            PORTFOLIO OVERVIEW
          </span>
          <h2 className="font-display text-2xl sm:text-3xl text-white tracking-wide">
            Patron Privilèges & Overview
          </h2>
        </div>

        {/* Tier Status Card */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-noir-950 via-noir-850 to-noir-900 border border-champagne/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-champagne" />
              <h4 className="font-display text-lg text-white">Haute Circle Membership</h4>
            </div>
            <p className="text-xs text-platinum-dark font-sans mt-1">
              Active privileges: Priority runway reservations, private fitting concierge, and complimentary international white-glove delivery.
            </p>
          </div>
          <span className="text-xs font-mono text-champagne bg-champagne/10 px-3 py-1.5 rounded-full border border-champagne/30 self-start sm:self-auto">
            VIP Tier: Tier 1
          </span>
        </div>

        {/* Recent Order Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-white">Most Recent Acquisition</h3>
            <Link
              to="/account/orders"
              className="text-xs uppercase tracking-wider text-champagne hover:underline flex items-center gap-1"
            >
              <span>All Orders ({orders.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentOrder ? (
            <div className="p-6 rounded-xl bg-noir-950 border border-white/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 text-xs font-sans gap-2">
                <div>
                  <span className="font-mono text-champagne font-bold">{recentOrder.orderNumber}</span>
                  <span className="text-platinum-dark ml-3">{recentOrder.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase">
                    {recentOrder.status}
                  </span>
                  <span className="font-mono text-white font-semibold">
                    ${recentOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {recentOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
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
                ))}
              </div>

              <div className="pt-2">
                <Link
                  to={`/account/orders/${recentOrder.id}`}
                  className="text-xs font-semibold uppercase tracking-wider text-champagne hover:underline inline-flex items-center gap-1"
                >
                  <span>View Archival Order Receipt & Tracking</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-xs text-platinum-dark">No orders registered yet.</p>
          )}
        </div>

        {/* Primary Address */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-white">Default Residence</h3>
            <Link
              to="/account/addresses"
              className="text-xs uppercase tracking-wider text-champagne hover:underline"
            >
              Manage Addresses
            </Link>
          </div>

          {user?.addresses[0] && (
            <div className="p-5 rounded-xl bg-noir-950 border border-white/5 text-xs text-platinum-dark font-sans leading-relaxed">
              <strong className="text-white block font-medium">
                {user.addresses[0].firstName} {user.addresses[0].lastName}
              </strong>
              <p>{user.addresses[0].addressLine1}</p>
              {user.addresses[0].addressLine2 && <p>{user.addresses[0].addressLine2}</p>}
              <p>
                {user.addresses[0].postalCode} {user.addresses[0].city}, {user.addresses[0].country}
              </p>
            </div>
          )}
        </div>
      </div>
    </AccountLayout>
  );
};
