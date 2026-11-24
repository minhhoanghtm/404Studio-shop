import jwt from "jsonwebtoken";
import User from "../modules/users/user.model.js";
import Role from "../modules/roles/role.model.js";
import RbacAuditLog from "../modules/roles/auditLog.model.js";
import { isAccessValid } from "../modules/auth/auth.redis.service.js";
import { ALL_PERMISSIONS, SYSTEM_ROLES } from "../modules/roles/role.constant.js";

// In-memory short-lived cache for role permissions (TTL: 60s)
const rolePermissionsCache = new Map();
const ROLE_CACHE_TTL = 60 * 1000;

export function invalidateRoleCache(roleName) {
  if (roleName) {
    rolePermissionsCache.delete(roleName);
  } else {
    rolePermissionsCache.clear();
  }
}

/**
 * Calculates the effective permissions for a user:
 * Effective = (Role.permissions ∪ user.permissionOverrides.allow) ∖ user.permissionOverrides.deny
 */
export async function getEffectivePermissions(user) {
  if (!user) return [];

  // Superadmin has all permissions unconditionally
  if (user.role === SYSTEM_ROLES.ADMIN) {
    return ALL_PERMISSIONS;
  }

  const roleName = user.role || SYSTEM_ROLES.CUSTOMER;

  // Retrieve base role permissions
  let basePermissions = [];
  const cached = rolePermissionsCache.get(roleName);
  const now = Date.now();

  if (cached && now - cached.timestamp < ROLE_CACHE_TTL) {
    basePermissions = cached.permissions;
  } else {
    const roleDoc = await Role.findOne({ name: roleName }).select("permissions").lean();
    basePermissions = roleDoc?.permissions || [];
    rolePermissionsCache.set(roleName, {
      permissions: basePermissions,
      timestamp: now,
    });
  }

  const allow = Array.isArray(user.permissionOverrides?.allow) ? user.permissionOverrides.allow : [];
  const deny = Array.isArray(user.permissionOverrides?.deny) ? user.permissionOverrides.deny : [];

  // Union (base ∪ allow)
  const combined = new Set([...basePermissions, ...allow]);

  // Difference (\ deny)
  for (const deniedPerm of deny) {
    combined.delete(deniedPerm);
  }

  return Array.from(combined);
}

const extractBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
};

/**
 * Robust Authenticate Middleware:
 * Verifies JWT, checks Redis revocation, loads user directly from DB to verify role and status.
 */
export const authenticate = async (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Vui lòng đăng nhập để tiếp tục",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const tokenValid = await isAccessValid(decoded.jti, decoded.userId);

    if (!tokenValid) {
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập đã bị thu hồi hoặc hết hạn!",
      });
    }

    // Always fetch latest role, status and overrides from database (never trust token payload for roles)
    const user = await User.findById(decoded.userId).select(
      "fullName email phone role status permissionOverrides"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại trên hệ thống",
      });
    }

    if (user.status === "blocked" || user.status === "locked" || user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với shop để giải quyết.",
      });
    }

    req.user = {
      ...decoded,
      userId: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role || SYSTEM_ROLES.CUSTOMER,
      status: user.status,
      permissionOverrides: user.permissionOverrides || { allow: [], deny: [] },
    };

    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ!",
      });
    }

    console.error("[RBAC Authenticate Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống xác thực",
    });
  }
};

/**
 * Authorize Middleware:
 * Checks if authenticated user has any of the required permissions.
 * Usage: authorize("product:create", "product:update")
 */
export const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          message: "Vui lòng đăng nhập để tiếp tục",
        });
      }

      // Admin has blanket bypass
      if (req.user.role === SYSTEM_ROLES.ADMIN) {
        req.user.effectivePermissions = ALL_PERMISSIONS;
        return next();
      }

      const effectivePermissions = await getEffectivePermissions(req.user);
      req.user.effectivePermissions = effectivePermissions;

      if (requiredPermissions.length === 0) {
        return next();
      }

      // Check if user has at least one of the required permissions
      const hasPermission = requiredPermissions.some((perm) =>
        effectivePermissions.includes(perm)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có đủ quyền thực hiện hành động này",
          required: requiredPermissions,
          role: req.user.role,
        });
      }

      return next();
    } catch (error) {
      console.error("[RBAC Authorize Error]:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi kiểm tra quyền hạn",
      });
    }
  };
};

/**
 * IDOR Ownership or Permission Guard:
 * Allows request if target owner ID matches req.user.userId, OR if user has specified permission.
 */
export const requireSelfOrPermission = (getOwnerId, requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ success: false, message: "Vui lòng đăng nhập" });
      }

      const ownerId = typeof getOwnerId === "function" ? getOwnerId(req) : req.params.id;

      // Self access check
      if (ownerId && String(ownerId) === String(req.user.userId)) {
        return next();
      }

      // Fallback to permission check (staff/manager/admin)
      if (req.user.role === SYSTEM_ROLES.ADMIN) {
        return next();
      }

      const effective = await getEffectivePermissions(req.user);
      if (requiredPermission && effective.includes(requiredPermission)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập dữ liệu của người dùng khác",
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
};

/**
 * Write RBAC Audit Log Helper
 */
export async function recordRbacAuditLog({
  req,
  action,
  targetId,
  targetType = "user",
  details = {},
}) {
  try {
    const actorId = req?.user?.userId;
    const actorEmail = req?.user?.email || "system";
    const actorRole = req?.user?.role || "system";
    const ipAddress =
      req?.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
      req?.socket?.remoteAddress ||
      "unknown";
    const userAgent = req?.headers?.["user-agent"] || "unknown";

    if (!actorId) return null;

    return await RbacAuditLog.create({
      actorId,
      actorEmail,
      actorRole,
      action,
      targetId: String(targetId || ""),
      targetType,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("[RBAC Audit Log Error]:", error);
    return null;
  }
}
