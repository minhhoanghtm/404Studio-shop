import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AnnouncementBar } from './components/layout/AnnouncementBar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { QuickSearchModal } from './components/common/QuickSearchModal';
import { ToastContainer } from './components/common/ToastContainer';
import { ScrollToTop } from './components/common/ScrollToTop';

// Direct import for immediate zero-latency hero rendering
import { HomePage } from './pages/HomePage';

// Lazy-loaded secondary pages for optimal bundle code-splitting
const ShopPage = lazy(() => import('./pages/ShopPage').then(m => ({ default: m.ShopPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage').then(m => ({ default: m.CollectionsPage })));
const CollectionDetailPage = lazy(() => import('./pages/CollectionDetailPage').then(m => ({ default: m.CollectionDetailPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage').then(m => ({ default: m.OrderSuccessPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const JournalPage = lazy(() => import('./pages/JournalPage').then(m => ({ default: m.JournalPage })));
const JournalDetailPage = lazy(() => import('./pages/JournalDetailPage').then(m => ({ default: m.JournalDetailPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const FAQPage = lazy(() => import('./pages/FAQPage').then(m => ({ default: m.FAQPage })));
const SizeGuidePage = lazy(() => import('./pages/SizeGuidePage').then(m => ({ default: m.SizeGuidePage })));
const ShippingPage = lazy(() => import('./pages/ShippingPage').then(m => ({ default: m.ShippingPage })));
const ReturnsPage = lazy(() => import('./pages/ReturnsPage').then(m => ({ default: m.ReturnsPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// User Account Pages
const LoginPage = lazy(() => import('./pages/account/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/account/RegisterPage').then(m => ({ default: m.RegisterPage })));
const AccountDashboardPage = lazy(() => import('./pages/account/AccountDashboardPage').then(m => ({ default: m.AccountDashboardPage })));
const AccountOrdersPage = lazy(() => import('./pages/account/AccountOrdersPage').then(m => ({ default: m.AccountOrdersPage })));
const AccountOrderDetailPage = lazy(() => import('./pages/account/AccountOrderDetailPage').then(m => ({ default: m.AccountOrderDetailPage })));
const AccountAddressesPage = lazy(() => import('./pages/account/AccountAddressesPage').then(m => ({ default: m.AccountAddressesPage })));
const AccountSettingsPage = lazy(() => import('./pages/account/AccountSettingsPage').then(m => ({ default: m.AccountSettingsPage })));

// High-Fashion Loading Fallback
const PageLoadingFallback: React.FC = () => (
  <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-noir-950 text-white p-8">
    <div className="w-10 h-10 rounded-full border border-champagne/40 border-t-champagne animate-spin mb-4" />
    <span className="text-[11px] font-mono uppercase tracking-ultra text-champagne">
      INITIALIZING ATELIER SALON...
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
          <Route path="shop" element={<ShopPage initialCategory="all" />} />
          <Route path="shop/women" element={<ShopPage initialCategory="women" />} />
          <Route path="shop/men" element={<ShopPage initialCategory="men" />} />
          <Route path="shop/accessories" element={<ShopPage initialCategory="accessories" />} />
          <Route path="shop/:category" element={<ShopPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/:slug" element={<CollectionDetailPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-success" element={<OrderSuccessPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="journal/:slug" element={<JournalDetailPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="size-guide" element={<SizeGuidePage />} />
          <Route path="shipping" element={<ShippingPage />} />
          <Route path="returns" element={<ReturnsPage />} />

          {/* User Account Routes */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="account" element={<AccountDashboardPage />} />
          <Route path="account/orders" element={<AccountOrdersPage />} />
          <Route path="account/orders/:id" element={<AccountOrderDetailPage />} />
          <Route path="account/addresses" element={<AccountAddressesPage />} />
          <Route path="account/settings" element={<AccountSettingsPage />} />

          {/* 404 Route */}
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
