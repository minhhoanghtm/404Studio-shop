import React, { Suspense, lazy, useState } from 'react';
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
import { AiAssistantModal } from './shared/components/AiAssistantModal';
import { ConsentProvider } from './shared/consent';
import { Sparkles } from 'lucide-react';

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

// Legal & Privacy Compliance Pages (Phase 11)
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfServicePage })));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicy').then(m => ({ default: m.CookiePolicyPage })));
const ReturnsRefundsPage = lazy(() => import('./pages/ReturnsRefunds').then(m => ({ default: m.ReturnsRefundsPage })));
const DataPrivacyPage = lazy(() => import('./pages/DataPrivacy').then(m => ({ default: m.DataPrivacyPage })));
const DataPrivacyRequestPage = lazy(() => import('./pages/DataPrivacyRequest').then(m => ({ default: m.DataPrivacyRequestPage })));

// Specialized Customer Feature Pages
const VerifyOtpPage = lazy(() => import('./pages/Auth').then(m => ({ default: m.VerifyOtpPage })));
const ResetPasswordPage = lazy(() => import('./pages/Auth').then(m => ({ default: m.ResetPasswordPage })));
const OrderLookupPage = lazy(() => import('./pages/OrderLookup').then(m => ({ default: m.OrderLookupPage })));
const PaymentResultPage = lazy(() => import('./pages/PaymentResult').then(m => ({ default: m.PaymentResultPage })));
const VouchersPage = lazy(() => import('./pages/Vouchers').then(m => ({ default: m.VouchersPage })));
const LookbooksPage = lazy(() => import('./pages/Lookbooks').then(m => ({ default: m.LookbooksPage })));
const CreateReviewPage = lazy(() => import('./pages/Reviews').then(m => ({ default: m.CreateReviewPage })));

// User Account & Auth Pages
const LoginPage = lazy(() => import('./pages/Auth').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/Auth').then(m => ({ default: m.RegisterPage })));
const AccountDashboardPage = lazy(() => import('./pages/Account').then(m => ({ default: m.AccountDashboardPage })));
const AccountOrdersPage = lazy(() => import('./pages/Account').then(m => ({ default: m.AccountOrdersPage })));
const AccountOrderDetailPage = lazy(() => import('./pages/Account').then(m => ({ default: m.AccountOrderDetailPage })));
const AccountAddressesPage = lazy(() => import('./pages/Account').then(m => ({ default: m.AccountAddressesPage })));
const AccountSettingsPage = lazy(() => import('./pages/Account').then(m => ({ default: m.AccountSettingsPage })));
const MyCouponsPage = lazy(() => import('./pages/Account').then(m => ({ default: m.MyCouponsPage })));
const AccountLoyaltyPage = lazy(() => import('./pages/Account').then(m => ({ default: m.AccountLoyaltyPage })));

// Admin Portal Pages
const AdminDashboardPage = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import('./pages/AdminProducts').then(m => ({ default: m.AdminProductsPage })));
const AdminProductCreatePage = lazy(() => import('./pages/AdminProductCreate').then(m => ({ default: m.AdminProductCreatePage })));
const AdminProductEditPage = lazy(() => import('./pages/AdminProductEdit').then(m => ({ default: m.AdminProductEditPage })));
const AdminCategoriesPage = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminCategoriesPage })));
const AdminOrdersPage = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminOrdersPage })));
const AdminCustomersPage = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminCustomersPage })));
const AdminCouponsPage = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminCouponsPage })));
const AdminSettingsPage = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminSettingsPage })));
const AdminChatPage = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminChatPage })));
const AdminLoyaltyPage = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminLoyaltyPage })));
const AdminLoyaltyCustomersPage = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminLoyaltyCustomersPage })));
const AdminLoyaltyTransactionsPage = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminLoyaltyTransactionsPage })));
const AdminLoyaltySettingsPage = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminLoyaltySettingsPage })));

// Admin Enterprise Policy Management Pages
const AdminPoliciesPage = lazy(() => import('./pages/AdminPolicies').then(m => ({ default: m.AdminPoliciesPage })));
const AdminPolicyCreatePage = lazy(() => import('./pages/AdminPolicyCreate').then(m => ({ default: m.AdminPolicyCreatePage })));
const AdminPolicyEditPage = lazy(() => import('./pages/AdminPolicyEdit').then(m => ({ default: m.AdminPolicyEditPage })));
const AdminPolicyHistoryPage = lazy(() => import('./pages/AdminPolicyHistory').then(m => ({ default: m.AdminPolicyHistoryPage })));

// Admin User Tracking & Behavioral Analytics Pages
const AdminTrackingPage = lazy(() => import('./pages/AdminTracking').then(m => ({ default: m.AdminTrackingPage })));
const AdminTrackingUsersPage = lazy(() => import('./pages/AdminTrackingUsers').then(m => ({ default: m.AdminTrackingUsersPage })));
const AdminTrackingEventsPage = lazy(() => import('./pages/AdminTrackingEvents').then(m => ({ default: m.AdminTrackingEventsPage })));
const AdminTrackingProductsPage = lazy(() => import('./pages/AdminTrackingProducts').then(m => ({ default: m.AdminTrackingProductsPage })));
const AdminTrackingConsentPage = lazy(() => import('./pages/AdminTrackingConsent').then(m => ({ default: m.AdminTrackingConsentPage })));

// High-Fashion Loading Fallback
const PageLoadingFallback: React.FC = () => (
  <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-ivory-50 text-noir-900 dark:bg-noir-950 dark:text-white p-8 transition-colors duration-300">
    <div className="w-10 h-10 rounded-full border border-champagne/40 border-t-champagne animate-spin mb-4" />
    <span className="text-[11px] font-mono uppercase tracking-ultra text-champagne">
      ĐANG TẢI KHÔNG GIAN ATELIER VÉRITÉ...
    </span>
  </div>
);

// Main Storefront Layout Wrapper
const RootLayout: React.FC = () => {
  const [isAiOpen, setIsAiOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-noir-900 dark:bg-noir-950 dark:text-white selection:bg-champagne/30 selection:text-white relative transition-colors duration-300">
      <AnnouncementBar />
      <Header />
      <main className="flex-1 flex flex-col">
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <QuickSearchModal />
      <ToastContainer />
      <ScrollToTop />

      {/* Stylist AI Assistant Floating Action Button */}
      <button
        onClick={() => setIsAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-white/90 dark:bg-[#0e0e12] border border-[#d4af37]/40 hover:border-[#d4af37] text-[#d4af37] p-3.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 group transition-all duration-300 hover:scale-105"
        title="Trợ lý Stylist AI Maison"
        aria-label="Mở Trợ lý Stylist AI"
      >
        <Sparkles className="w-5 h-5 text-[#d4af37] group-hover:rotate-12 transition-transform" />
        <span className="text-xs uppercase tracking-widest font-serif font-medium pr-1 hidden sm:inline-block text-noir-900 dark:text-white">
          Stylist AI
        </span>
      </button>

      <AiAssistantModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <ConsentProvider>
        <Routes>
          {/* Main Customer Storefront Layout */}
          <Route path="/" element={<RootLayout />}>
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

            {/* Legal & Privacy Compliance Routes (Phase 11) */}
            <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="terms-of-service" element={<TermsOfServicePage />} />
            <Route path="cookie-policy" element={<CookiePolicyPage />} />
            <Route path="returns-refunds" element={<ReturnsRefundsPage />} />
            <Route path="data-privacy" element={<DataPrivacyPage />} />
            <Route path="data-privacy/request" element={<DataPrivacyRequestPage />} />

            {/* Legal Route Aliases */}
            <Route path="privacy" element={<Navigate to="/privacy-policy" replace />} />
            <Route path="terms" element={<Navigate to="/terms-of-service" replace />} />
            <Route path="cookies" element={<Navigate to="/cookie-policy" replace />} />
            <Route path="cookie-settings" element={<Navigate to="/data-privacy" replace />} />
            <Route path="privacy-center" element={<Navigate to="/data-privacy" replace />} />

            {/* Specialized Customer Routes */}
            <Route path="verify-otp" element={<VerifyOtpPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="order-lookup" element={<OrderLookupPage />} />
            <Route path="payment-result" element={<PaymentResultPage />} />
            <Route path="vouchers" element={<VouchersPage />} />
            <Route path="lookbooks" element={<LookbooksPage />} />
            <Route path="reviews/create" element={<CreateReviewPage />} />

            {/* Support Anchor Aliases */}
            <Route path="faq" element={<Navigate to="/support#faq" replace />} />
            <Route path="size-guide" element={<Navigate to="/support#size-guide" replace />} />
            <Route path="shipping" element={<Navigate to="/support#shipping" replace />} />
            <Route path="returns" element={<Navigate to="/returns-refunds" replace />} />

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
            <Route path="account/coupons" element={<MyCouponsPage />} />
            <Route path="my-coupons" element={<MyCouponsPage />} />
            <Route path="account/loyalty" element={<AccountLoyaltyPage />} />
            <Route path="loyalty" element={<AccountLoyaltyPage />} />

            {/* 404 Catch-All */}
            <Route path="404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Admin Portal Routes (Isolated Layout) */}
          <Route
            path="admin"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminDashboardPage />
              </Suspense>
            }
          />
          <Route
            path="admin/products"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminProductsPage />
              </Suspense>
            }
          />
          <Route
            path="admin/products/new"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminProductCreatePage />
              </Suspense>
            }
          />
          <Route
            path="admin/products/:id/edit"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminProductEditPage />
              </Suspense>
            }
          />
          <Route
            path="admin/categories"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminCategoriesPage />
              </Suspense>
            }
          />
          <Route
            path="admin/orders"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminOrdersPage />
              </Suspense>
            }
          />
          <Route
            path="admin/customers"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminCustomersPage />
              </Suspense>
            }
          />
          <Route
            path="admin/coupons"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminCouponsPage />
              </Suspense>
            }
          />
          <Route
            path="admin/settings"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminSettingsPage />
              </Suspense>
            }
          />
          <Route
            path="admin/chats"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminChatPage />
              </Suspense>
            }
          />

          {/* Admin Loyalty & 12-Tier Membership Routes */}
          <Route
            path="admin/loyalty"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminLoyaltyPage />
              </Suspense>
            }
          />
          <Route
            path="admin/loyalty/customers"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminLoyaltyCustomersPage />
              </Suspense>
            }
          />
          <Route
            path="admin/loyalty/transactions"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminLoyaltyTransactionsPage />
              </Suspense>
            }
          />
          <Route
            path="admin/loyalty/settings"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminLoyaltySettingsPage />
              </Suspense>
            }
          />

          {/* Admin Policy Management Routes */}
          <Route
            path="admin/policies"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminPoliciesPage />
              </Suspense>
            }
          />
          <Route
            path="admin/policies/new"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminPolicyCreatePage />
              </Suspense>
            }
          />
          <Route
            path="admin/policies/:id/edit"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminPolicyEditPage />
              </Suspense>
            }
          />
          <Route
            path="admin/policies/:id/history"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminPolicyHistoryPage />
              </Suspense>
            }
          />

          {/* Admin User Tracking & Behavioral Analytics Routes */}
          <Route
            path="admin/tracking"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminTrackingPage />
              </Suspense>
            }
          />
          <Route
            path="admin/tracking/users"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminTrackingUsersPage />
              </Suspense>
            }
          />
          <Route
            path="admin/tracking/events"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminTrackingEventsPage />
              </Suspense>
            }
          />
          <Route
            path="admin/tracking/products"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminTrackingProductsPage />
              </Suspense>
            }
          />
          <Route
            path="admin/tracking/consent"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AdminTrackingConsentPage />
              </Suspense>
            }
          />
        </Routes>
      </ConsentProvider>
    </BrowserRouter>
  );
}

export default App;
