import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Users,
  Layers,
  Shirt,
} from 'lucide-react';

interface TrackingNavProps {
  activeTab?: string;
}

export const TrackingNav: React.FC<TrackingNavProps> = () => {
  const tabs = [
    { label: 'Tổng Quan Analytics', to: '/admin/tracking', icon: Activity, end: true },
    { label: 'Hành Vi & Phiên Trực Tuyến', to: '/admin/tracking/users', icon: Users },
    { label: 'Sự Kiện Hệ Thống', to: '/admin/tracking/events', icon: Layers },
    { label: 'Sản Phẩm & Phễu Chuyển Đổi', to: '/admin/tracking/products', icon: Shirt },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[var(--border)] font-sans text-xs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-t-sm border-b-2 font-medium uppercase tracking-wider whitespace-nowrap transition-all ${
                isActive
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10 font-bold'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--table-row-hover)]'
              }`
            }
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};
