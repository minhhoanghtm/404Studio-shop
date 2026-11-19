import React from 'react';
import { NavLink } from 'react-router-dom';
import { Award, Users, Clock, Settings, ShieldCheck } from 'lucide-react';

export const AdminLoyaltyNav: React.FC = () => {
  const tabs = [
    { label: 'Tổng Quan & Cấp Hạng', to: '/admin/loyalty', end: true, icon: Award },
    { label: 'Hồ Sơ Điểm Thành Viên', to: '/admin/loyalty/customers', icon: Users },
    { label: 'Sổ Cái Giao Dịch Điểm', to: '/admin/loyalty/transactions', icon: Clock },
    { label: 'Quy Tắc & Kiểm Định Backend', to: '/admin/loyalty/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-2 rounded-sm text-xs font-mono uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-champagne text-noir-950 font-bold shadow-md'
                  : 'bg-white/5 text-platinum-light hover:text-white hover:bg-white/10'
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
