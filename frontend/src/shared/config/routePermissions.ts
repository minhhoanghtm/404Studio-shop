/**
 * Route-level and Action-level RBAC Permissions Configuration
 * Central single-source-of-truth for frontend authorization guards
 */

export const PERMISSIONS = {
  // Dashboard & Analytics
  DASHBOARD_VIEW: 'dashboard:view',
  REPORT_VIEW: 'report:view',

  // Products
  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',

  // Orders
  ORDER_VIEW: 'order:view',
  ORDER_UPDATE: 'order:update',
  ORDER_CANCEL: 'order:cancel',

  // Users & Staff
  USER_VIEW: 'user:view',
  USER_UPDATE: 'user:update',
  USER_LOCK: 'user:lock',

  // Roles & Security
  ROLE_MANAGE: 'role:manage',

  // Real-time Chat
  CHAT_REPLY: 'chat:reply',

  // Marketing & Coupons
  COUPON_MANAGE: 'coupon:manage',

  // CMS & Policies
  CONTENT_MANAGE: 'content:manage',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Route to Permission Requirement Mapping
 * If a route requires multiple, possessing ANY of them is sufficient (OR semantics).
 */
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  // Admin Routes
  '/admin': [PERMISSIONS.DASHBOARD_VIEW],
  '/admin/products': [PERMISSIONS.PRODUCT_VIEW],
  '/admin/products/new': [PERMISSIONS.PRODUCT_CREATE],
  '/admin/products/:id/edit': [PERMISSIONS.PRODUCT_UPDATE],
  '/admin/categories': [PERMISSIONS.PRODUCT_VIEW],
  '/admin/orders': [PERMISSIONS.ORDER_VIEW],
  '/admin/customers': [PERMISSIONS.USER_VIEW],
  '/admin/loyalty': [PERMISSIONS.DASHBOARD_VIEW],
  '/admin/campaigns': [PERMISSIONS.COUPON_MANAGE],
  '/admin/coupons': [PERMISSIONS.COUPON_MANAGE],
  '/admin/chats': [PERMISSIONS.CHAT_REPLY],
  '/admin/page-builder': [PERMISSIONS.CONTENT_MANAGE],
  '/admin/policies': [PERMISSIONS.CONTENT_MANAGE],
  '/admin/tracking': [PERMISSIONS.REPORT_VIEW],
  '/admin/settings': [PERMISSIONS.ROLE_MANAGE],
  '/admin/roles': [PERMISSIONS.ROLE_MANAGE],
};

/**
 * Checks whether user can access a specific route pathname
 */
export function canAccessRoute(
  pathname: string,
  userPermissions: string[],
  userRole?: string
): boolean {
  if (userRole === 'admin') return true;

  // Exact match
  if (ROUTE_PERMISSIONS[pathname]) {
    const required = ROUTE_PERMISSIONS[pathname];
    return required.some((perm) => userPermissions.includes(perm));
  }

  // Prefix/Subroute match (e.g. /admin/products/123/edit -> /admin/products/:id/edit or /admin/products)
  for (const [routePattern, required] of Object.entries(ROUTE_PERMISSIONS)) {
    if (routePattern === pathname) return required.some((p) => userPermissions.includes(p));

    // Handle param patterns like /admin/products/:id/edit
    if (routePattern.includes(':')) {
      const regexPattern = '^' + routePattern.replace(/:[a-zA-Z0-9_]+/g, '[^/]+') + '$';
      if (new RegExp(regexPattern).test(pathname)) {
        return required.some((p) => userPermissions.includes(p));
      }
    } else if (pathname.startsWith(routePattern + '/')) {
      return required.some((p) => userPermissions.includes(p));
    }
  }

  // If route is under /admin but not explicitly registered, require dashboard:view or role:manage as fallback
  if (pathname.startsWith('/admin')) {
    return userPermissions.includes(PERMISSIONS.DASHBOARD_VIEW);
  }

  return true;
}

/**
 * Checks if user has a specific permission
 */
export function hasPermission(
  requiredPermission: string,
  userPermissions: string[],
  userRole?: string
): boolean {
  if (userRole === 'admin') return true;
  return userPermissions.includes(requiredPermission);
}
