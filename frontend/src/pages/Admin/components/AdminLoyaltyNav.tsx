import React from 'react';
import { NavLink } from 'react-router-dom';
import { Award, Users, Clock, Settings } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/useAuthStore';

export const AdminLoyaltyNav: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.vipTier === 'admin';

  const allTabs = [
    { label: 'Tổng Quan & Cấp Hạng', to: '/admin/loyalty', end: true, icon: Award, adminOnly: false },
    { label: 'Hồ Sơ Điểm Thành Viên', to: '/admin/loyalty/customers', icon: Users, adminOnly: false },
    { label: 'Sổ Cái Giao Dịch Điểm', to: '/admin/loyalty/transactions', icon: Clock, adminOnly: false },
    { label: 'Cấu Hình & Quản Trị Điểm', to: '/admin/loyalty/settings', icon: Settings, adminOnly: true },
  ];

  const tabs = allTabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'admin-tab-active'
                  : 'admin-tab-inactive'
              }`
            }
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};
