import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
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
  ShieldCheck,
  LogOut,
  FileText,
  Activity,
  Award,
  Palette,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { motion, useReducedMotion } from 'motion/react';
import { Z_INDEX } from '@/shared/config/zIndex';
import { PERMISSIONS } from '@/shared/config/routePermissions';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  fullHeight?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title = 'Bảng Điều Khiển Quản Trị',
  subtitle = 'Hệ Thống Vận Hành Atelier Vérité Haute Couture',
  fullHeight = false,
}) => {
  const { user, permissions, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const contentScrollRef = useRef<HTMLDivElement>(null);
  const sidebarNavRef = useRef<HTMLElement>(null);
  const activeNavRef = useRef<HTMLAnchorElement | null>(null);

  // Lock HTML and Body scrolling while anywhere in Admin Portal
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.classList.add('admin-active');
    body.classList.add('admin-active');
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      html.classList.remove('admin-active');
      body.classList.remove('admin-active');
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // On subroute change: auto-scroll main content area to top (0, 0)
  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  // Sidebar navigation: keep scroll position and smoothly scroll active link into view if outside viewport
  useEffect(() => {
    if (activeNavRef.current) {
      activeNavRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [location.pathname]);

  // Observe and automatically lock content scroll when any modal or drawer is open
  useEffect(() => {
    const container = contentScrollRef.current;
    if (!container) return;

    const checkModalState = () => {
      const modalInContainer = container.querySelector(
        '[class*="fixed"][class*="inset-0"], [role="dialog"], [aria-modal="true"]'
      );
      const modalInBody = document.querySelector(
        'body > [class*="fixed"][class*="inset-0"], body > [role="dialog"]'
      );
      const shouldLock = Boolean(modalInContainer || modalInBody || isMobileMenuOpen);

      if (shouldLock) {
        container.style.overflowY = 'hidden';
      } else if (!fullHeight) {
        container.style.overflowY = 'auto';
      }
    };

    checkModalState();

    const observer = new MutationObserver(checkModalState);
    observer.observe(container, { childList: true, subtree: true });
    observer.observe(document.body, { childList: true });

    return () => observer.disconnect();
  }, [fullHeight, isMobileMenuOpen]);

  const allNavLinks = [
    { label: 'Thống Kê Doanh Thu', to: '/admin', icon: LayoutDashboard, end: true, permission: PERMISSIONS.DASHBOARD_VIEW },
    { label: 'Phân Quyền & Vai Trò', to: '/admin/roles', icon: ShieldCheck, permission: PERMISSIONS.ROLE_MANAGE },
    { label: 'Thiết Kế Trang & Layouts', to: '/admin/page-builder', icon: Palette, permission: PERMISSIONS.CONTENT_MANAGE },
    { label: 'Chính Sách Doanh Nghiệp', to: '/admin/policies', icon: FileText, permission: PERMISSIONS.CONTENT_MANAGE },
    { label: 'Phân Tích & Tracking', to: '/admin/tracking', icon: Activity, permission: PERMISSIONS.REPORT_VIEW },
    { label: 'Quản Lý Sản Phẩm', to: '/admin/products', icon: Shirt, permission: PERMISSIONS.PRODUCT_VIEW },
    { label: 'Danh Mục Thời Trang', to: '/admin/categories', icon: FolderTree, permission: PERMISSIONS.PRODUCT_VIEW },
    { label: 'Quản Lý Đơn Hàng', to: '/admin/orders', icon: ShoppingBag, permission: PERMISSIONS.ORDER_VIEW },
    { label: 'Hồ Sơ Khách Hàng', to: '/admin/customers', icon: Users, permission: PERMISSIONS.USER_VIEW },
    { label: 'Khách Hàng Thân Thiết & Điểm', to: '/admin/loyalty', icon: Award, permission: PERMISSIONS.DASHBOARD_VIEW },
    { label: 'Chiến Dịch & Popup Sale', to: '/admin/campaigns', icon: Sparkles, permission: PERMISSIONS.COUPON_MANAGE },
    { label: 'Mã Giảm Giá & Ưu Đãi', to: '/admin/coupons', icon: Ticket, permission: PERMISSIONS.COUPON_MANAGE },
    { label: 'Trò Chuyện CSKH', to: '/admin/chats', icon: MessageSquare, permission: PERMISSIONS.CHAT_REPLY },
    { label: 'Cấu Hình Hệ Thống', to: '/admin/settings', icon: Settings, permission: PERMISSIONS.ROLE_MANAGE },
  ];

  // RBAC Filtering: Only render menu items where user has sufficient permission (Admins always see all)
  const navLinks = allNavLinks.filter((link) => {
    if (user?.role === 'admin' || user?.vipTier === 'admin') return true;
    if (!link.permission) return true;
    return permissions.includes(link.permission);
  });

  return (
    <div className="admin-shell h-screen h-[100dvh] max-h-screen max-h-[100dvh] w-full overflow-hidden bg-[var(--bg)] text-[var(--text)] flex flex-row">
      {/* Mobile Drawer Backdrop (<= 1024px) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-[rgba(26,26,23,0.55)] backdrop-blur-sm lg:hidden transition-opacity"
          style={{ zIndex: Z_INDEX.drawerOverlay }}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Đóng menu điều hướng"
        />
      )}

      {/* Sidebar Navigation (Desktop: Fixed 260px in-flow; Mobile: Slide-out Drawer <= 1024px) */}
      <aside
        className={`fixed inset-y-0 left-0 w-[260px] max-w-[85vw] h-full bg-[var(--surface)] border-r border-[var(--border)] flex flex-col justify-between shrink-0 overscroll-contain transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:h-full lg:max-w-none lg:translate-x-0 lg:shadow-none lg:transition-none ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
          }`}
        style={{
          overscrollBehavior: 'contain',
          zIndex: isMobileMenuOpen ? Z_INDEX.drawer : undefined,
        }}
        aria-label="Menu quản trị"
      >
        {/* Sidebar Header: Brand & Logo (Fixed at top) */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-[var(--accent)]/15 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] font-display text-xl font-bold">
              V
            </div>
            <div>
              <span className="font-display text-base tracking-widest text-[var(--text)] uppercase block">
                Atelier Vérité
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[var(--accent)] uppercase block font-semibold">
                Cổng Quản Trị Admin
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] rounded-sm transition-colors"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav: Scrollable Menu with Independent Scroll */}
        <nav
          ref={sidebarNavRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-1 text-xs font-sans admin-sidebar-scrollbar"
          style={{ overscrollBehavior: 'contain' }}
          aria-label="Danh mục chức năng admin"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isCurrentActive = link.end
              ? location.pathname === link.to
              : location.pathname === link.to || location.pathname.startsWith(link.to + '/');

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                ref={isCurrentActive ? activeNavRef : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-sm transition-all font-medium uppercase tracking-wider ${isActive
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer: User Info & Actions (Fixed at bottom) */}
        <div className="p-4 border-t border-[var(--border)] space-y-3 shrink-0 bg-[var(--surface)]">
          <Link
            to="/"
            className="w-full py-2.5 px-3 border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--text)] text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 rounded-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Cửa Hàng Khách</span>
          </Link>

          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
            <div className="flex items-center gap-2.5 truncate">
              <Shield className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <div className="truncate text-left">
                <span className="truncate block font-medium text-[var(--text)] text-xs">
                  {user?.name || 'Quản Trị Viên'}
                </span>
                <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--accent)] block font-semibold">
                  {user?.role === 'admin'
                    ? 'Tổng Quản Trị'
                    : user?.role === 'manager'
                    ? 'Quản Lý Vận Hành'
                    : user?.role === 'staff'
                    ? 'Nhân Viên CSKH'
                    : 'Thành Viên'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-[var(--text-muted)] hover:text-red-500 p-1 rounded-sm"
              title="Đăng xuất"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area Column (Flex-1, min-w-0, height 100%, independent scroll) */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full bg-[var(--bg)] overflow-hidden relative">
        {/* Topbar: Fixed at top of column */}
        <header className="px-4 lg:px-6 py-3.5 lg:py-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 lg:gap-4 bg-[var(--surface)]/90 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[var(--text)] hover:text-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent)] rounded-sm transition-colors"
              title="Mở menu quản trị"
              aria-label="Mở menu quản trị"
            >
              <Menu className="w-4 h-4 text-[var(--accent)]" />
            </button>
            <div>
              <h1 className="font-display text-xl md:text-2xl text-[var(--text)] tracking-wide">{title}</h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-[11px] font-mono uppercase tracking-widest flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3 h-3" /> Phiên Bản Hệ Thống 2.0
            </span>
          </div>
        </header>

        {/* Scrollable Content Body with Independent Scrollbar */}
        {fullHeight ? (
          <div
            ref={contentScrollRef}
            className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col p-2 sm:p-4 md:p-6"
          >
            {children}
          </div>
        ) : (
          <div
            ref={contentScrollRef}
            className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain admin-content-scrollbar"
            style={{ overscrollBehavior: 'contain', scrollbarGutter: 'stable' }}
          >
            <motion.div
              key={location.pathname}
              initial={prefersReducedMotion === false ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion === false ? { duration: 0.38, ease: 'easeOut' } : { duration: 0 }}
              className="p-4 sm:p-6 lg:p-8 min-h-full flex flex-col"
            >
              {children}
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};
