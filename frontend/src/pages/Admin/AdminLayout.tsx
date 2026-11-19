import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Shirt,
  FolderTree,
  ShoppingBag,
  Users,
  Ticket,
  MessageSquare,
  Settings,
  ArrowLeft,
  Sparkles,
  Shield,
  LogOut,
  FileText,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '@/shared/stores/useAuthStore';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title = 'Bảng Điều Khiển Quản Trị',
  subtitle = 'Hệ Thống Vận Hành Atelier Vérité Haute Couture',
}) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Thống Kê Doanh Thu', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Chính Sách Doanh Nghiệp', to: '/admin/policies', icon: FileText },
    { label: 'Phân Tích & Tracking', to: '/admin/tracking', icon: Activity },
    { label: 'Quản Lý Tác Phẩm', to: '/admin/products', icon: Shirt },
    { label: 'Danh Mục Thời Trang', to: '/admin/categories', icon: FolderTree },
    { label: 'Quản Lý Đơn Hàng', to: '/admin/orders', icon: ShoppingBag },
    { label: 'Hồ Sơ Khách Hàng', to: '/admin/customers', icon: Users },
    { label: 'Mã Giảm Giá & Ưu Đãi', to: '/admin/coupons', icon: Ticket },
    { label: 'Trò Chuyện CSKH', to: '/admin/chats', icon: MessageSquare },
    { label: 'Cấu Hình Hệ Thống', to: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-noir-950 text-white flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-noir-900 border-r border-white/10 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Brand Identity */}
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-champagne/15 border border-champagne/40 flex items-center justify-center text-champagne font-display text-xl font-bold">
              V
            </div>
            <div>
              <span className="font-display text-base tracking-widest text-white uppercase block">
                Atelier Vérité
              </span>
              <span className="text-[10px] font-mono tracking-widest text-champagne uppercase block">
                Cổng Quản Trị Admin
              </span>
            </div>
          </div>

          {/* Links list */}
          <nav className="p-3 space-y-1 text-xs font-sans">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-sm transition-all font-medium uppercase tracking-wider ${
                      isActive
                        ? 'bg-champagne text-noir-950 font-semibold shadow-md'
                        : 'text-platinum-dark hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <Link
            to="/"
            className="w-full py-2.5 px-3 border border-white/15 hover:border-champagne hover:text-champagne text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 rounded-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Cửa Hàng Khách</span>
          </Link>

          <div className="flex items-center justify-between text-xs text-platinum-dark px-1">
            <div className="flex items-center gap-2 truncate">
              <Shield className="w-3.5 h-3.5 text-champagne shrink-0" />
              <span className="truncate">{user?.name || 'Quản Trị Viên'}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-white/60 hover:text-red-400 p-1"
              title="Đăng xuất"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-noir-950 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="px-6 py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-noir-900/60 backdrop-blur-md">
          <div>
            <h1 className="font-display text-2xl text-white tracking-wide">{title}</h1>
            <p className="text-xs text-platinum-dark mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-champagne/15 border border-champagne/30 text-champagne text-[11px] font-mono uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Phiên Bản Hệ Thống 2.0
            </span>
          </div>
        </header>

        {/* Dynamic Body */}
        <div className="p-6 lg:p-8 flex-1">{children}</div>
      </main>
    </div>
  );
};
