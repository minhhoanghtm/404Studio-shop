import { describe, it, expect } from 'vitest';
import {
  canAccessRoute,
  hasPermission,
  PERMISSIONS,
  ROUTE_ROLES,
  ROUTE_PERMISSIONS,
} from '../shared/config/routePermissions';

describe('Admin & Staff RBAC Page Permission Suite', () => {
  const staffPermissions: string[] = [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.CHAT_REPLY,
    PERMISSIONS.COUPON_MANAGE,
  ];

  describe('Super Admin (role: admin) access rights', () => {
    it('grants full access to all admin routes without restriction', () => {
      const allRoutes = [
        '/admin',
        '/admin/ai-assistant',
        '/admin/roles',
        '/admin/settings',
        '/admin/policies',
        '/admin/policies/new',
        '/admin/policies/privacy-policy/edit',
        '/admin/policies/terms/history',
        '/admin/tracking',
        '/admin/tracking/users',
        '/admin/tracking/events',
        '/admin/tracking/products',
        '/admin/loyalty',
        '/admin/loyalty/customers',
        '/admin/loyalty/transactions',
        '/admin/loyalty/settings',
        '/admin/products',
        '/admin/products/new',
        '/admin/products/prod_123/edit',
        '/admin/categories',
        '/admin/orders',
        '/admin/customers',
        '/admin/campaigns',
        '/admin/coupons',
        '/admin/chats',
        '/admin/page-builder',
      ];

      for (const route of allRoutes) {
        expect(canAccessRoute(route, [], 'admin')).toBe(true);
      }
    });

    it('always evaluates hasPermission to true for admin', () => {
      expect(hasPermission(PERMISSIONS.ROLE_MANAGE, [], 'admin')).toBe(true);
      expect(hasPermission(PERMISSIONS.USER_LOCK, [], 'admin')).toBe(true);
      expect(hasPermission(PERMISSIONS.PRODUCT_DELETE, [], 'admin')).toBe(true);
    });
  });

  describe('Store Operations Staff (role: staff) access rights', () => {
    it('allows access to daily operational admin pages', () => {
      const allowedRoutes = [
        '/admin',
        '/admin/ai-assistant',
        '/admin/products',
        '/admin/products/prod_abc/edit',
        '/admin/categories',
        '/admin/orders',
        '/admin/customers',
        '/admin/loyalty',
        '/admin/loyalty/customers',
        '/admin/loyalty/transactions',
        '/admin/campaigns',
        '/admin/coupons',
        '/admin/chats',
      ];

      for (const route of allowedRoutes) {
        expect(canAccessRoute(route, staffPermissions, 'staff')).toBe(true);
      }
    });

    it('strictly blocks access to sensitive Admin-only configuration and management routes', () => {
      const forbiddenRoutes = [
        '/admin/roles',
        '/admin/settings',
        '/admin/policies',
        '/admin/policies/new',
        '/admin/policies/legal-terms/edit',
        '/admin/policies/privacy/history',
        '/admin/tracking',
        '/admin/tracking/users',
        '/admin/tracking/events',
        '/admin/tracking/products',
        '/admin/loyalty/settings',
      ];

      for (const route of forbiddenRoutes) {
        expect(canAccessRoute(route, staffPermissions, 'staff')).toBe(false);
      }
    });
  });

  describe('Customer and Unauthenticated Users', () => {
    it('blocks customer role from accessing any admin routes', () => {
      expect(canAccessRoute('/admin', [], 'customer')).toBe(false);
      expect(canAccessRoute('/admin/roles', [], 'customer')).toBe(false);
      expect(canAccessRoute('/admin/products', [], 'customer')).toBe(false);
      expect(canAccessRoute('/admin/orders', [], 'customer')).toBe(false);
      expect(canAccessRoute('/admin/settings', [], 'customer')).toBe(false);
    });

    it('blocks undefined or guest role from accessing admin routes', () => {
      expect(canAccessRoute('/admin', [])).toBe(false);
      expect(canAccessRoute('/admin/roles', [])).toBe(false);
      expect(canAccessRoute('/admin/orders', [])).toBe(false);
    });
  });

  describe('Navigation Menu Link Filtering Logic', () => {
    const allNavLinks = [
      { label: 'Thống Kê Doanh Thu', to: '/admin', end: true, permission: PERMISSIONS.DASHBOARD_VIEW, roles: ['admin', 'manager', 'staff'] },
      { label: 'Admin AI Copilot ✨', to: '/admin/ai-assistant', permission: PERMISSIONS.DASHBOARD_VIEW, roles: ['admin', 'manager', 'staff'] },
      { label: 'Phân Quyền & Vai Trò', to: '/admin/roles', permission: PERMISSIONS.ROLE_MANAGE, roles: ['admin'] },
      { label: 'Thiết Kế Trang & Layouts', to: '/admin/page-builder', permission: PERMISSIONS.CONTENT_MANAGE, roles: ['admin', 'manager'] },
      { label: 'Chính Sách Doanh Nghiệp', to: '/admin/policies', permission: PERMISSIONS.ROLE_MANAGE, roles: ['admin'] },
      { label: 'Phân Tích & Tracking', to: '/admin/tracking', permission: PERMISSIONS.ROLE_MANAGE, roles: ['admin'] },
      { label: 'Quản Lý Sản Phẩm', to: '/admin/products', permission: PERMISSIONS.PRODUCT_VIEW, roles: ['admin', 'manager', 'staff'] },
      { label: 'Danh Mục Thời Trang', to: '/admin/categories', permission: PERMISSIONS.PRODUCT_VIEW, roles: ['admin', 'manager', 'staff'] },
      { label: 'Quản Lý Đơn Hàng', to: '/admin/orders', permission: PERMISSIONS.ORDER_VIEW, roles: ['admin', 'manager', 'staff'] },
      { label: 'Hồ Sơ Khách Hàng', to: '/admin/customers', permission: PERMISSIONS.USER_VIEW, roles: ['admin', 'manager', 'staff'] },
      { label: 'Khách Hàng Thân Thiết & Điểm', to: '/admin/loyalty', permission: PERMISSIONS.DASHBOARD_VIEW, roles: ['admin', 'manager', 'staff'] },
      { label: 'Chiến Dịch & Popup Sale', to: '/admin/campaigns', permission: PERMISSIONS.COUPON_MANAGE, roles: ['admin', 'manager', 'staff'] },
      { label: 'Mã Giảm Giá & Ưu Đãi', to: '/admin/coupons', permission: PERMISSIONS.COUPON_MANAGE, roles: ['admin', 'manager', 'staff'] },
      { label: 'Trò Chuyện CSKH', to: '/admin/chats', permission: PERMISSIONS.CHAT_REPLY, roles: ['admin', 'manager', 'staff'] },
      { label: 'Cấu Hình Hệ Thống', to: '/admin/settings', permission: PERMISSIONS.ROLE_MANAGE, roles: ['admin'] },
    ];

    it('renders all 15 navigation links for Admin role', () => {
      const user = { role: 'admin' };
      const links = allNavLinks.filter((link) => {
        if (user.role === 'admin') return true;
        if (link.roles && !link.roles.includes(user.role)) return false;
        return true;
      });
      expect(links.length).toBe(15);
    });

    it('filters out sensitive management links for Staff role, leaving only operational items', () => {
      const user = { role: 'staff' };
      const links = allNavLinks.filter((link) => {
        if (user.role === 'admin') return true;
        if (link.roles && !link.roles.includes(user.role)) return false;
        if (link.permission && !staffPermissions.includes(link.permission)) return false;
        return true;
      });

      const visiblePaths = links.map((l) => l.to);
      expect(visiblePaths).toContain('/admin');
      expect(visiblePaths).toContain('/admin/ai-assistant');
      expect(visiblePaths).toContain('/admin/products');
      expect(visiblePaths).toContain('/admin/categories');
      expect(visiblePaths).toContain('/admin/orders');
      expect(visiblePaths).toContain('/admin/customers');
      expect(visiblePaths).toContain('/admin/loyalty');
      expect(visiblePaths).toContain('/admin/campaigns');
      expect(visiblePaths).toContain('/admin/coupons');
      expect(visiblePaths).toContain('/admin/chats');

      // Sensitive routes MUST be absent
      expect(visiblePaths).not.toContain('/admin/roles');
      expect(visiblePaths).not.toContain('/admin/settings');
      expect(visiblePaths).not.toContain('/admin/policies');
      expect(visiblePaths).not.toContain('/admin/tracking');
      expect(visiblePaths).not.toContain('/admin/page-builder');
      expect(links.length).toBe(10);
    });
  });
});
