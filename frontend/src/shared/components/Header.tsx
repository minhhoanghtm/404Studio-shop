import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, User, X } from 'lucide-react';
import { useCartStore } from '../stores/useCartStore';
import { useSearchStore } from '../stores/useSearchStore';
import { useWishlistStore } from '../stores/useWishlistStore';
import { useThemeStore } from '../stores/useThemeStore';
import { useModal, ModalPortal } from '../context/ModalContext';
import { Z_INDEX } from '../config/zIndex';

const navigation = [['BỘ SƯU TẬP', '/collections'], ['NỮ', '/products?category=women'], ['NAM', '/products?category=men'], ['TẠP CHÍ', '/journal'], ['ATELIER', '/about']];

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
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

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 80);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

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
          <Link to="/account" className={linkTone} aria-label="Tài khoản">
            <User />
          </Link>
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
        </div>
      </ModalPortal>
    )}
  </>;
};
