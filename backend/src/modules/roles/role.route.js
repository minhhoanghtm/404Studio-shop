import express from "express";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getStandardPermissions,
  getRbacUsers,
  updateUserRoleAndOverrides,
  updateUserStatus,
  getAuditLogs,
} from "./role.controller.js";
import { authenticate, authorize } from "../../middlewares/rbac.middleware.js";
import { PERMISSIONS } from "./role.constant.js";

const router = express.Router();

// All role & RBAC management endpoints require authentication
router.use(authenticate);

// Permissions catalog (open to staff/manager/admin to render matrix or UI)
router.get("/permissions", authorize(PERMISSIONS.ROLE_MANAGE, PERMISSIONS.USER_VIEW), getStandardPermissions);

// Roles CRUD (requires role:manage)
router.get("/roles", authorize(PERMISSIONS.ROLE_MANAGE), getRoles);
router.post("/roles", authorize(PERMISSIONS.ROLE_MANAGE), createRole);
router.put("/roles/:id", authorize(PERMISSIONS.ROLE_MANAGE), updateRole);
router.delete("/roles/:id", authorize(PERMISSIONS.ROLE_MANAGE), deleteRole);

// RBAC User Management (requires user:view / role:manage / user:lock)
router.get("/rbac/users", authorize(PERMISSIONS.USER_VIEW, PERMISSIONS.ROLE_MANAGE), getRbacUsers);
router.put("/rbac/users/:id/role", authorize(PERMISSIONS.ROLE_MANAGE), updateUserRoleAndOverrides);
router.put("/rbac/users/:id/status", authorize(PERMISSIONS.USER_LOCK), updateUserStatus);

// Audit Logs (requires role:manage)
router.get("/rbac/audit-logs", authorize(PERMISSIONS.ROLE_MANAGE), getAuditLogs);

export default router;
