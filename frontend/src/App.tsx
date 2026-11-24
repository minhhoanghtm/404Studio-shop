import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import {
  AnnouncementBar,
  Header,
  Footer,
  CartDrawer,
  QuickSearchModal,
  ToastContainer,
  ScrollToTop,
  PromotionalPopup,
} from './shared/components';
import { AiAssistantModal } from './shared/components/AiAssistantModal';
import { ConsentProvider } from './shared/consent';
import { ModalProvider } from './shared/context/ModalContext';
import { Z_INDEX } from './shared/config/zIndex';
import { useCartStore } from './shared/stores/useCartStore';
import { useAuthStore } from './shared/stores/useAuthStore';
import { useToastStore } from './shared/stores/useToastStore';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { setupMultiTabAuthSync } from './shared/utils/authSync';
import { Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

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
const AuthLayout = lazy(() => import('./shared/layouts/AuthLayout').then(m => ({ default: m.AuthLayout })));
const LoginPage = lazy(() => import('./pages/Auth').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/Auth').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/Auth').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordTokenPage = lazy(() => import('./pages/Auth').then(m => ({ default: m.ResetPasswordTokenPage })));
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

// Admin Promotional Campaigns & Sale Popups Pages
const AdminCampaignsPage = lazy(() => import('./pages/AdminCampaigns').then(m => ({ default: m.AdminCampaignsPage })));
const AdminCampaignCreatePage = lazy(() => import('./pages/AdminCampaigns').then(m => ({ default: m.AdminCampaignCreatePage })));
const AdminCampaignEditPage = lazy(() => import('./pages/AdminCampaigns').then(m => ({ default: m.AdminCampaignEditPage })));
const AdminCampaignDetailPage = lazy(() => import('./pages/AdminCampaigns').then(m => ({ default: m.AdminCampaignDetailPage })));

// Admin Visual Page Builder & CMS Pages
const AdminPageBuilderListPage = lazy(() => import('./pages/AdminPageBuilder').then(m => ({ default: m.AdminPageBuilderListPage })));
const AdminPageBuilderEditorPage = lazy(() => import('./pages/AdminPageBuilder').then(m => ({ default: m.AdminPageBuilderEditorPage })));
const AdminPageBuilderPreviewPage = lazy(() => import('./pages/AdminPageBuilder').then(m => ({ default: m.AdminPageBuilderPreviewPage })));

// Admin Roles & RBAC Management (Phase 15)
const AdminRolesPage = lazy(() => import('./pages/AdminRoles/AdminRolesPage').then(m => ({ default: m.AdminRolesPage })));
const ForbiddenPage = lazy(() => import('./pages/Forbidden/ForbiddenPage').then(m => ({ default: m.ForbiddenPage })));

// High-Fashion Loading Fallback
const PageLoadingFallback: React.FC = () => (
  <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text)] p-8 transition-colors duration-300">
    <div className="w-10 h-10 rounded-full border border-[var(--accent)]/40 border-t-[var(--accent)] animate-spin mb-4" />
    <span className="text-[11px] font-mono uppercase tracking-ultra text-[var(--accent)]">
      ĐANG TẢI KHÔNG GIAN ATELIER VÉRITÉ...
    </span>
  </div>
);

const AnimatedOutlet: React.FC = () => {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = prefersReducedMotion !== false;

  return (
    <motion.div
      key={location.pathname}
      className="editorial-page min-h-full flex-1"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: 'easeOut' }}
      data-page-transition
    >
      <Suspense fallback={<PageLoadingFallback />}>
        <Outlet />
      </Suspense>
    </motion.div>
  );
};

// Admin Portal Wrapper (Guarantees zero-leak viewport lock and disables window-level scroll)
const AdminPortalRouteWrapper: React.FC = () => {
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

  return <Outlet />;
};

// Main Storefront Layout Wrapper
const RootLayout: React.FC = () => {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const location = useLocation();
  const isHomeRoute = location.pathname === '/';
  const validateCartWithBackend = useCartStore((s) => s.validateCartWithBackend);

  useEffect(() => {
    void validateCartWithBackend();
  }, [validateCartWithBackend]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--accent)]/30 selection:text-[var(--text)] relative transition-colors duration-300">
      <div className="site-chrome">
        <AnnouncementBar />
        <Header />
      </div>
      <main className={`site-main flex-1 flex flex-col ${isHomeRoute ? 'site-main-home' : 'site-main-standard'}`}>
        <AnimatedOutlet />
      </main>
      <Footer />
      <CartDrawer />
      <QuickSearchModal />
      <ToastContainer />
      <PromotionalPopup />

      {/* Stylist AI Assistant Floating Action Button */}
      <button
        onClick={() => setIsAiOpen(true)}
        style={{ zIndex: Z_INDEX.sticky }}
        className="fixed bottom-6 right-6 bg-[var(--surface)]/95 border border-[var(--border)] hover:border-[var(--accent)] text-[var(--accent)] p-3.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 group transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        title="Trợ lý Stylist AI Maison"
        aria-label="Mở Trợ lý Stylist AI"
      >
        <Sparkles className="w-5 h-5 text-[var(--accent)] group-hover:rotate-12 transition-transform" />
        <span className="text-xs uppercase tracking-widest font-serif font-medium pr-1 hidden sm:inline-block text-[var(--text)]">
          Stylist AI
        </span>
        <span className="relative flex h-2 w-2 -mr-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
        </span>
      </button>

      <AiAssistantModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
};

const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hydrateSession = useAuthStore((s) => s.hydrateSession);

  useEffect(() => {
    void hydrateSession();

    // Global 403 Forbidden Toast Listener
    const handleForbidden = (e: any) => {
      useToastStore
        .getState()
        .addToast(
          e.detail?.message || 'Bạn không có đủ quyền thực hiện hành động này',
          'error'
        );
    };
    window.addEventListener('auth:forbidden', handleForbidden);

    const cleanup = setupMultiTabAuthSync(
      () => {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && window.location) {
          const path = window.location.pathname;
          if (path.startsWith('/admin') || path.startsWith('/account') || path.startsWith('/orders')) {
            window.location.href = `/login?redirect=${encodeURIComponent(path + window.location.search)}`;
          }
        }
      },
      () => {
        // Multi-tab real-time permission update
        void useAuthStore.getState().fetchPermissions();
      }
    );

    return () => {
      window.removeEventListener('auth:forbidden', handleForbidden);
      cleanup();
    };
  }, [hydrateSession]);

  return (
    <>
      <ScrollToTop />
      {children}
    </>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
              {/* Standalone Authentication Layout (No Header/Footer) */}
              <Route
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <AuthLayout />
                  </Suspense>
                }
              >
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password/:token" element={<ResetPasswordTokenPage />} />
                <Route path="reset-password" element={<ForgotPasswordPage />} />
              </Route>

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

                {/* Account Routes (Protected) */}
                <Route path="account" element={<ProtectedRoute><AccountDashboardPage /></ProtectedRoute>} />
                <Route path="orders" element={<ProtectedRoute><AccountOrdersPage /></ProtectedRoute>} />
                <Route path="orders/:id" element={<ProtectedRoute><AccountOrderDetailPage /></ProtectedRoute>} />
                <Route path="account/orders" element={<ProtectedRoute><AccountOrdersPage /></ProtectedRoute>} />
                <Route path="account/orders/:id" element={<ProtectedRoute><AccountOrderDetailPage /></ProtectedRoute>} />
                <Route path="account/addresses" element={<ProtectedRoute><AccountAddressesPage /></ProtectedRoute>} />
                <Route path="account/settings" element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} />
                <Route path="account/coupons" element={<ProtectedRoute><MyCouponsPage /></ProtectedRoute>} />
                <Route path="my-coupons" element={<ProtectedRoute><MyCouponsPage /></ProtectedRoute>} />
                <Route path="account/loyalty" element={<ProtectedRoute><AccountLoyaltyPage /></ProtectedRoute>} />
                <Route path="loyalty" element={<ProtectedRoute><AccountLoyaltyPage /></ProtectedRoute>} />

                {/* 403 Forbidden Access */}
                <Route path="403" element={<ForbiddenPage />} />

                {/* 404 Catch-All */}
                <Route path="404" element={<NotFoundPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Admin Portal Routes (Guarded by ProtectedRoute requireAdmin) */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPortalRouteWrapper />
                  </ProtectedRoute>
                }
              >
                <Route
                  path="roles"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminRolesPage />
                    </Suspense>
                  }
                />
                <Route
                  index
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminDashboardPage />
                    </Suspense>
                  }
                />
                <Route
                  path="products"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminProductsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="products/new"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminProductCreatePage />
                    </Suspense>
                  }
                />
                <Route
                  path="products/:id/edit"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminProductEditPage />
                    </Suspense>
                  }
                />
                <Route
                  path="categories"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminCategoriesPage />
                    </Suspense>
                  }
                />
                <Route
                  path="orders"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminOrdersPage />
                    </Suspense>
                  }
                />
                <Route
                  path="customers"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminCustomersPage />
                    </Suspense>
                  }
                />
                <Route
                  path="coupons"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminCouponsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminSettingsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="chats"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminChatPage />
                    </Suspense>
                  }
                />

                {/* Admin Loyalty & 12-Tier Membership Routes */}
                <Route
                  path="loyalty"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminLoyaltyPage />
                    </Suspense>
                  }
                />
                <Route
                  path="loyalty/customers"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminLoyaltyCustomersPage />
                    </Suspense>
                  }
                />
                <Route
                  path="loyalty/transactions"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminLoyaltyTransactionsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="loyalty/settings"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminLoyaltySettingsPage />
                    </Suspense>
                  }
                />

                {/* Admin Promotional Campaigns & Sale Popups Routes */}
                <Route
                  path="campaigns"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminCampaignsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="campaigns/new"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminCampaignCreatePage />
                    </Suspense>
                  }
                />
                <Route
                  path="campaigns/:id"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminCampaignDetailPage />
                    </Suspense>
                  }
                />
                <Route
                  path="campaigns/:id/edit"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminCampaignEditPage />
                    </Suspense>
                  }
                />

                {/* Admin Visual Page Builder & CMS Routes */}
                <Route
                  path="page-builder"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminPageBuilderListPage />
                    </Suspense>
                  }
                />
                <Route
                  path="page-builder/new"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminPageBuilderEditorPage />
                    </Suspense>
                  }
                />
                <Route
                  path="page-builder/:id/edit"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminPageBuilderEditorPage />
                    </Suspense>
                  }
                />
                <Route
                  path="page-builder/:id/preview"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminPageBuilderPreviewPage />
                    </Suspense>
                  }
                />

                {/* Admin Policy Management Routes */}
                <Route
                  path="policies"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminPoliciesPage />
                    </Suspense>
                  }
                />
                <Route
                  path="policies/new"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminPolicyCreatePage />
                    </Suspense>
                  }
                />
                <Route
                  path="policies/:id/edit"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminPolicyEditPage />
                    </Suspense>
                  }
                />
                <Route
                  path="policies/:id/history"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminPolicyHistoryPage />
                    </Suspense>
                  }
                />

                {/* Admin User Tracking & Behavioral Analytics Routes */}
                <Route
                  path="tracking"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminTrackingPage />
                    </Suspense>
                  }
                />
                <Route
                  path="tracking/users"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminTrackingUsersPage />
                    </Suspense>
                  }
                />
                <Route
                  path="tracking/events"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminTrackingEventsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="tracking/products"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminTrackingProductsPage />
                    </Suspense>
                  }
                />
              </Route>
            </Routes>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <ConsentProvider>
        <ModalProvider>
          <AppInitializer>
            <AppRoutes />
          </AppInitializer>
        </ModalProvider>
      </ConsentProvider>
    </BrowserRouter>
  );
}

export default App;
