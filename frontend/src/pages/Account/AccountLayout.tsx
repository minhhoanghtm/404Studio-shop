import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { useLoyalty } from '../../shared/hooks/useLoyalty';
import { User, Package, MapPin, Settings, LogOut, Sparkles, Tag, Award } from 'lucide-react';
import { vi } from '../../shared/locales/vi/common';

export const AccountLayout: React.FC<{ children: React.ReactNode; activeTab?: string }> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { profile } = useLoyalty();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { label: 'Tổng quan tài khoản', to: '/account', icon: User, end: true },
    { label: 'Hạng Patron & Điểm thưởng', to: '/account/loyalty', icon: Award },
    { label: 'Đơn hàng & Biên lai', to: '/orders', icon: Package },
    { label: 'Sổ địa chỉ giao hàng', to: '/account/addresses', icon: MapPin },
    { label: 'Ví phiếu ưu đãi', to: '/account/coupons', icon: Tag },
    { label: 'Cài đặt Patron', to: '/account/settings', icon: Settings },
  ];

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Patron Greeting Bar */}
        <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--accent)]/15 border-2 border-[var(--accent)] flex items-center justify-center font-display text-2xl text-[var(--accent)]">
              {user?.name ? user.name.charAt(0) : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl text-[var(--text)]">
                  {user?.name || 'Khách Quý Patron'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 border border-[var(--accent)]/30 font-medium">
                  <Sparkles className="w-3 h-3" /> {profile?.currentTier?.nameVi || user?.vipTier || 'Đồng I'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">
                {user?.email || 'patron@verite-atelier.com'} • Đã ghi danh Salon Place Vendôme
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-muted)] hover:text-red-500 transition-colors self-start md:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{vi.nav.logout}</span>
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Nav */}
          <aside className="lg:col-span-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-3 space-y-1 text-xs font-sans shadow-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium uppercase tracking-wider ${
                      isActive
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-md'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </aside>

          {/* Account Content Area */}
          <main className="lg:col-span-9 p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] min-h-[500px] shadow-sm">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
