import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, User, X, LogOut, Package, Shield } from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';
import { useSearchStore } from '../stores/useSearchStore';
import { useWishlistStore } from '../stores/useWishlistStore';
import { useThemeStore } from '../stores/useThemeStore';
import { useAuth } from '../hooks/useAuth';
import { useToastStore } from '../stores/useToastStore';
import { useModal, ModalPortal } from '../context/ModalContext';
import { Z_INDEX } from '../config/zIndex';

const navigation = [['BỘ SƯU TẬP', '/collections'], ['NỮ', '/products?category=women'], ['NAM', '/products?category=men'], ['TẠP CHÍ', '/journal'], ['ATELIER', '/about']];

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const addToast = useToastStore((state) => state.addToast);

  const cartCount = useCartStore((state) => state.getItemsCount());
  const openCart = useCartStore((state) => state.openDrawer);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const openSearch = useSearchStore((state) => state.openSearch);
  const { theme, toggleTheme } = useThemeStore();
  const isHome = location.pathname === '/';

  const { contentZIndex } = useModal({
    id: 'header-mobile-menu',
    isOpen: mobileOpen,
    onClose: () => setMobileOpen(false),
  });

  const handleLogout = () => {
    setUserDropdownOpen(false);
    logout();
    addToast('Đã đăng xuất tài khoản thành công.', 'info');
    navigate('/');
  };

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 80);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userDropdownOpen]);

  useEffect(() => {
    setUserDropdownOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  const light = isHome && !scrolled;
  const linkTone = light ? 'text-white hover:text-[var(--accent)]' : 'text-[var(--text)] hover:text-[var(--accent)]';

  return <>
    <header className={`atelier-nav ${light ? 'atelier-nav-over-hero' : 'atelier-nav-solid'}`}>
      <div className="atelier-nav-inner">
        <Link to="/" className="atelier-logo" aria-label="Trang chủ Atelier Vérité">
          <span>ATELIER VÉRITÉ</span>
          <small>PARIS · MILAN · TOKYO</small>
        </Link>
        <nav className="atelier-nav-links" aria-label="Điều hướng chính">
          {navigation.map(([label, href]) => (
            <Link key={href} to={href} className={linkTone}>{label}</Link>
          ))}
        </nav>
        <div className="atelier-nav-actions">
          <button onClick={openSearch} className={linkTone} aria-label="Tìm kiếm bộ sưu tập">
            <Search />
          </button>
          <Link to="/wishlist" className={`relative ${linkTone}`} aria-label={`Danh sách yêu thích (${wishlistCount})`}>
            <Heart />
            {wishlistCount > 0 && <sup>{wishlistCount}</sup>}
          </Link>
          <button onClick={openCart} className={`relative ${linkTone}`} aria-label={`Giỏ hàng (${cartCount})`}>
            <ShoppingBag />
            {cartCount > 0 && <sup>{cartCount}</sup>}
          </button>

          {/* User Account / Login Action */}
          {!isAuthenticated ? (
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className={`${linkTone} atelier-user-action`}
              aria-label="Đăng nhập tài khoản"
              title="Đăng nhập tài khoản"
            >
              <User />
            </Link>
          ) : (
            <div className="relative atelier-user-action" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                className={`${linkTone} flex items-center justify-center`}
                aria-label="Tài khoản Patron"
                aria-expanded={userDropdownOpen}
                title={`Tài khoản: ${user?.name || 'Patron'}`}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'Avatar'}
                    className="w-5 h-5 rounded-full object-cover border border-[var(--accent)]"
                  />
                ) : (
                  <User />
                )}
              </button>

              {userDropdownOpen && (
                <div
                  style={{ zIndex: Z_INDEX.dropdown }}
                  className="absolute right-0 top-full mt-3 w-64 rounded-2xl bg-[var(--surface)]/95 border border-[var(--border)] shadow-2xl backdrop-blur-xl p-3 text-[var(--text)] transition-all animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {/* Patron Header */}
                  <div className="px-3 py-2.5 border-b border-[var(--border)]/70 pb-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/40 flex items-center justify-center font-display text-sm text-[var(--accent)] shrink-0 overflow-hidden">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name || 'Avatar'} className="w-full h-full object-cover" />
                        ) : (
                          user?.name ? user.name.charAt(0).toUpperCase() : 'P'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-serif font-medium truncate text-[var(--text)]">
                          {user?.name || 'Khách Quý Patron'}
                        </div>
                        <div className="text-[11px] font-sans text-[var(--text-muted)] truncate">
                          {user?.email || 'patron@verite-atelier.com'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[9px] font-mono uppercase tracking-widest border border-[var(--accent)]/20 font-medium">
                        {user?.role === 'admin' ? 'Quản trị viên' : user?.vipTier || 'Thành viên'}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Navigation Links */}
                  <div className="space-y-0.5 text-xs font-sans">
                    <Link
                      to="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] transition-colors"
                    >
                      <User size={15} className="text-[var(--accent)]" />
                      <span>Hồ sơ & Tài khoản</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] transition-colors"
                    >
                      <Package size={15} className="text-[var(--accent)]" />
                      <span>Đơn hàng & Biên lai</span>
                    </Link>

                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] transition-colors"
                      >
                        <Shield size={15} className="text-[var(--accent)]" />
                        <span>Quản trị viên (CMS)</span>
                      </Link>
                    )}
                  </div>

                  <div className="my-2 border-t border-[var(--border)]/70" />

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-sans text-red-500 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut size={15} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={toggleTheme}
            className={linkTone}
            aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            title={theme === 'dark' ? 'Chế độ Sáng (Mặc định)' : 'Chế độ Tối'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className={`${linkTone} atelier-menu-toggle`} onClick={() => setMobileOpen(true)} aria-label="Mở bảng điều hướng">
            <Menu />
          </button>
        </div>
      </div>
    </header>
    {mobileOpen && (
      <ModalPortal>
        <div
          className="atelier-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng"
          style={{ zIndex: contentZIndex }}
        >
          <div className="flex items-center justify-between w-full">
            <button
              onClick={toggleTheme}
              className="text-[var(--text)] hover:text-[var(--accent)] flex items-center gap-2 text-xs font-mono uppercase"
              aria-label="Đổi giao diện sáng tối"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === 'dark' ? 'CHẾ ĐỘ SÁNG' : 'CHẾ ĐỘ TỐI'}</span>
            </button>
            <button className="atelier-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Đóng menu">
              <X size={24} />
            </button>
          </div>
          <Link className="atelier-mobile-logo" to="/" onClick={() => setMobileOpen(false)}>ATELIER VÉRITÉ</Link>
          <nav>
            {navigation.map(([label, href]) => (
              <Link key={href} to={href} onClick={() => setMobileOpen(false)}>{label}</Link>
            ))}
          </nav>

          {/* Mobile Account Action Area */}
          <div className="mt-8 pt-6 border-t border-[var(--border)]/70">
            {!isAuthenticated ? (
              <Link
                to="/login"
                state={{ from: location.pathname }}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-mono uppercase tracking-widest font-semibold shadow-md"
              >
                <User size={16} />
                <span>ĐĂNG NHẬP / ĐĂNG KÝ</span>
              </Link>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)]/70">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center font-display text-sm text-[var(--accent)] shrink-0 overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name || 'Avatar'} className="w-full h-full object-cover" />
                    ) : (
                      user?.name ? user.name.charAt(0).toUpperCase() : 'P'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-serif font-medium truncate text-[var(--text)]">
                      {user?.name || 'Khách Quý Patron'}
                    </div>
                    <div className="text-[11px] font-sans text-[var(--text-muted)] truncate">
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono uppercase tracking-wider">
                  <Link
                    to="/account"
                    onClick={() => setMobileOpen(false)}
                    className="p-2.5 rounded-lg border border-[var(--border)] text-center hover:border-[var(--accent)] transition-colors"
                  >
                    Hồ sơ
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setMobileOpen(false)}
                    className="p-2.5 rounded-lg border border-[var(--border)] text-center hover:border-[var(--accent)] transition-colors"
                  >
                    Đơn hàng
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg text-xs font-sans text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={15} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </ModalPortal>
    )}
  </>;
};
