import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import {
  AnnouncementBar,
  Header,
  Footer,
  CartDrawer,
  QuickSearchModal,
  ToastContainer,
  ScrollToTop,
} from './shared/components';

// Direct import for immediate zero-latency hero rendering
import { HomePage } from './pages/Home';

// Lazy-loaded secondary pages for optimal bundle code-splitting
const ProductsPage = lazy(() => import('./pages/Products').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetailPage })));
const CollectionsPage = lazy(() => import('./pages/Collections').then(m => ({ default: m.CollectionsPage })));
const CollectionDetailPage = lazy(() => import('./pages/Collections').then(m => ({ default: m.CollectionDetailPage })));
const SearchPage = lazy(() => import('./pages/Search').then(m => ({ default: m.SearchPage })));
const WishlistPage = lazy(() => import('./pages/Wishlist').then(m => ({ default: m.WishlistPage })));
const CartPage = lazy(() => import('./pages/Cart').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/Checkout').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccess').then(m => ({ default: m.OrderSuccessPage })));
const AboutPage = lazy(() => import('./pages/About').then(m => ({ default: m.AboutPage })));
const JournalPage = lazy(() => import('./pages/Journal').then(m => ({ default: m.JournalPage })));
const JournalDetailPage = lazy(() => import('./pages/Journal').then(m => ({ default: m.JournalDetailPage })));
const ContactPage = lazy(() => import('./pages/Contact').then(m => ({ default: m.ContactPage })));
const SupportPage = lazy(() => import('./pages/Support').then(m => ({ default: m.SupportPage })));
const NotFoundPage = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFoundPage })));

// User Account & Auth Pages
const LoginPage = lazy(() => import('./pages/Auth').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/Auth').then(m => ({ default: m.RegisterPage })));
const AccountDashboardPage = lazy(() => import('./pages/Account').then(m => ({ default: m.AccountDashboardPage })));
const AccountOrdersPage = lazy(() => import('./pages/Account').then(m => ({ default: m.AccountOrdersPage })));
const AccountOrderDetailPage = lazy(() => import('./pages/Account').then(m => ({ default: m.AccountOrderDetailPage })));
const AccountAddressesPage = lazy(() => import('./pages/Account').then(m => ({ default: m.AccountAddressesPage })));
const AccountSettingsPage = lazy(() => import('./pages/Account').then(m => ({ default: m.AccountSettingsPage })));

// High-Fashion Loading Fallback
const PageLoadingFallback: React.FC = () => (
  <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-noir-950 text-white p-8">
    <div className="w-10 h-10 rounded-full border border-champagne/40 border-t-champagne animate-spin mb-4" />
    <span className="text-[11px] font-mono uppercase tracking-ultra text-champagne">
      ĐANG TẢI KHÔNG GIAN ATELIER VÉRITÉ...
    </span>
  </div>
);

// Main Layout Wrapper
const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-noir-950 text-white selection:bg-champagne/30 selection:text-white">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />

      {/* Global Interactive Overlays */}
      <CartDrawer />
      <QuickSearchModal />
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<RootLayout />}>
          {/* Public Routes */}
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/:slug" element={<CollectionDetailPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-success" element={<OrderSuccessPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="journal/:slug" element={<JournalDetailPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="support" element={<SupportPage />} />

          {/* Support Anchor Aliases */}
          <Route path="faq" element={<Navigate to="/support#faq" replace />} />
          <Route path="size-guide" element={<Navigate to="/support#size-guide" replace />} />
          <Route path="shipping" element={<Navigate to="/support#shipping" replace />} />
          <Route path="returns" element={<Navigate to="/support#returns" replace />} />

          {/* Legacy Shop Aliases */}
          <Route path="shop" element={<Navigate to="/products" replace />} />
          <Route path="shop/women" element={<Navigate to="/products?category=women" replace />} />
          <Route path="shop/men" element={<Navigate to="/products?category=men" replace />} />
          <Route path="shop/accessories" element={<Navigate to="/products?category=accessories" replace />} />
          <Route path="shop/:category" element={<ProductsPage />} />

          {/* Auth Routes */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* Account Routes */}
          <Route path="account" element={<AccountDashboardPage />} />
          <Route path="orders" element={<AccountOrdersPage />} />
          <Route path="orders/:id" element={<AccountOrderDetailPage />} />
          <Route path="account/orders" element={<AccountOrdersPage />} />
          <Route path="account/orders/:id" element={<AccountOrderDetailPage />} />
          <Route path="account/addresses" element={<AccountAddressesPage />} />
          <Route path="account/settings" element={<AccountSettingsPage />} />

          {/* 404 Catch-All */}
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
