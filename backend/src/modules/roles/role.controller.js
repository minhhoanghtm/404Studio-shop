import Role from "./role.model.js";
import User from "../users/user.model.js";
import RbacAuditLog from "./auditLog.model.js";
import {
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  SYSTEM_ROLES,
} from "./role.constant.js";
import {
  getEffectivePermissions,
  invalidateRoleCache,
  recordRbacAuditLog,
} from "../../middlewares/rbac.middleware.js";
import { purgeUserTokens } from "../auth/auth.redis.service.js";
import { successResponse } from "../../common/responses/index.js";
import AppError from "../../common/exceptions/AppError.js";

// ============================================================================
// ROLE CRUD CONTROLLERS
// ============================================================================

export const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ isSystem: -1, createdAt: 1 }).lean();
    return successResponse(res, roles, "Lấy danh sách vai trò thành công");
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req, res, next) => {
  try {
    const { name, displayName, description, permissions } = req.body;

    if (!name || !displayName) {
      throw new AppError("Tên vai trò và Tên hiển thị là bắt buộc", 400);
    }

    const normalizedName = name.toLowerCase().trim();

    // Check existing
    const existing = await Role.findOne({ name: normalizedName });
    if (existing) {
      throw new AppError(`Vai trò '${normalizedName}' đã tồn tại trong hệ thống`, 409);
    }

    // Validate permissions array
    const validPermissions = Array.isArray(permissions)
      ? permissions.filter((p) => ALL_PERMISSIONS.includes(p))
      : [];

    // Privilege escalation check: Manager cannot grant permissions they do not possess
    if (req.user.role !== SYSTEM_ROLES.ADMIN) {
      const myPermissions = await getEffectivePermissions(req.user);
      const invalidGrants = validPermissions.filter((p) => !myPermissions.includes(p));
      if (invalidGrants.length > 0) {
        throw new AppError(
          `Bạn không thể cấp những quyền mà bản thân không sở hữu: ${invalidGrants.join(", ")}`,
          403
        );
      }
    }

    const newRole = await Role.create({
      name: normalizedName,
      displayName: displayName.trim(),
      description: description?.trim() || "",
      permissions: validPermissions,
      isSystem: false,
    });

    await recordRbacAuditLog({
      req,
      action: "role:create",
      targetId: newRole._id.toString(),
      targetType: "role",
      details: { name: newRole.name, permissionsCount: validPermissions.length },
    });

    invalidateRoleCache();

    return successResponse(res, newRole, "Tạo vai trò mới thành công", 201);
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { displayName, description, permissions } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      throw new AppError("Không tìm thấy vai trò cần cập nhật", 404);
    }

    // Privilege escalation check: Manager cannot grant permissions they do not possess
    if (req.user.role !== SYSTEM_ROLES.ADMIN) {
      const myPermissions = await getEffectivePermissions(req.user);
      const invalidGrants = (permissions || []).filter((p) => !myPermissions.includes(p));
      if (invalidGrants.length > 0) {
        throw new AppError(
          `Bạn không thể cấp những quyền mà bản thân không sở hữu: ${invalidGrants.join(", ")}`,
          403
        );
      }
    }

    // Admin role permissions are immutable (always full access)
    if (role.name === SYSTEM_ROLES.ADMIN) {
      role.permissions = ALL_PERMISSIONS;
    } else if (Array.isArray(permissions)) {
      role.permissions = permissions.filter((p) => ALL_PERMISSIONS.includes(p));
    }

    if (displayName) role.displayName = displayName.trim();
    if (description !== undefined) role.description = description.trim();

    await role.save();

    await recordRbacAuditLog({
      req,
      action: "role:update",
      targetId: role._id.toString(),
      targetType: "role",
      details: { name: role.name, permissionsCount: role.permissions.length },
    });

    invalidateRoleCache(role.name);

    return successResponse(res, role, "Cập nhật vai trò thành công");
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);

    if (!role) {
      throw new AppError("Không tìm thấy vai trò cần xóa", 404);
    }

    if (role.isSystem) {
      throw new AppError("Không được phép xóa vai trò hệ thống mặc định", 403);
    }

    // Check if any user is currently assigned this role
    const usersWithRole = await User.countDocuments({ role: role.name });
    if (usersWithRole > 0) {
      throw new AppError(
        `Không thể xóa vai trò này vì đang có ${usersWithRole} tài khoản sử dụng`,
        400
      );
    }

    await Role.findByIdAndDelete(id);

    await recordRbacAuditLog({
      req,
      action: "role:delete",
      targetId: id,
      targetType: "role",
      details: { name: role.name },
    });

    invalidateRoleCache(role.name);

    return successResponse(res, null, "Đã xóa vai trò thành công");
  } catch (error) {
    next(error);
  }
};

export const getStandardPermissions = async (req, res, next) => {
  try {
    return successResponse(
      res,
      {
        groups: PERMISSION_GROUPS,
        allPermissions: ALL_PERMISSIONS,
      },
      "Lấy danh mục quyền chuẩn thành công"
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// USER ROLE & PERMISSION OVERRIDES CONTROLLERS
// ============================================================================

export const getRbacUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search?.trim();
    const roleFilter = req.query.role?.trim();
    const statusFilter = req.query.status?.trim();

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (roleFilter && roleFilter !== "all") {
      query.role = roleFilter;
    }

    if (statusFilter && statusFilter !== "all") {
      query.status = statusFilter;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("fullName email phone role status permissionOverrides createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return successResponse(res, {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRoleAndOverrides = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role: newRole, allow, deny } = req.body;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      throw new AppError("Người dùng không tồn tại", 404);
    }

    // 1. Anti-Self-Escalation: User cannot modify their own role
    if (String(req.user.userId) === String(id) && newRole && newRole !== targetUser.role) {
      throw new AppError("Bạn không thể tự thay đổi vai trò của chính mình", 403);
    }

    // 2. Privilege Escalation Check: Non-admins cannot assign Admin role
    if (req.user.role !== SYSTEM_ROLES.ADMIN && newRole === SYSTEM_ROLES.ADMIN) {
      throw new AppError("Chỉ Quản trị viên tối cao mới có thể chỉ định vai trò Admin", 403);
    }

    // 3. Last Admin Protection: Ensure at least one active Admin remains
    if (targetUser.role === SYSTEM_ROLES.ADMIN && newRole && newRole !== SYSTEM_ROLES.ADMIN) {
      const activeAdminCount = await User.countDocuments({
        role: SYSTEM_ROLES.ADMIN,
        status: "active",
        _id: { $ne: targetUser._id },
      });
      if (activeAdminCount < 1) {
        throw new AppError("Không thể hạ quyền Admin cuối cùng đang hoạt động của hệ thống", 400);
      }
    }

    // 4. Overrides Validation
    if (Array.isArray(allow)) {
      // Validate permissions exist
      targetUser.permissionOverrides.allow = allow.filter((p) => ALL_PERMISSIONS.includes(p));
    }

    if (Array.isArray(deny)) {
      targetUser.permissionOverrides.deny = deny.filter((p) => ALL_PERMISSIONS.includes(p));
    }

    if (newRole) {
      const roleExists = await Role.findOne({ name: newRole.toLowerCase() });
      if (!roleExists && !Object.values(SYSTEM_ROLES).includes(newRole)) {
        throw new AppError(`Vai trò '${newRole}' không hợp lệ trong hệ thống`, 400);
      }
      targetUser.role = newRole.toLowerCase();
      if (roleExists) {
        targetUser.roleId = roleExists._id;
      }
    }

    await targetUser.save();

    // 5. Invalidate User Sessions Immediately
    await purgeUserTokens(targetUser._id.toString());

    // 6. Record Audit Log
    await recordRbacAuditLog({
      req,
      action: "user:assign_role_and_overrides",
      targetId: targetUser._id.toString(),
      targetType: "user",
      details: {
        assignedRole: targetUser.role,
        overrides: targetUser.permissionOverrides,
        targetEmail: targetUser.email,
      },
    });

    const effectivePermissions = await getEffectivePermissions(targetUser);

    return successResponse(
      res,
      {
        user: {
          id: targetUser._id,
          fullName: targetUser.fullName,
          email: targetUser.email,
          role: targetUser.role,
          permissionOverrides: targetUser.permissionOverrides,
          effectivePermissions,
        },
      },
      "Cập nhật vai trò và quyền riêng thành công"
    );
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Permission enforcement: Only admin has authority to lock/unlock accounts
    if (req.user?.role !== "admin") {
      throw new AppError("Chỉ Quản trị viên (Admin) mới có quyền khóa hoặc mở khóa tài khoản nhân viên và khách hàng.", 403);
    }

    if (!["active", "locked", "blocked"].includes(status)) {
      throw new AppError("Trạng thái không hợp lệ (chỉ chấp nhận active, locked)", 400);
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      throw new AppError("Người dùng không tồn tại", 404);
    }

    // Anti-Self-Lockout
    if (String(req.user.userId) === String(id) && status !== "active") {
      throw new AppError("Bạn không thể tự khóa tài khoản của chính mình", 403);
    }

    // Last Admin Protection: Cannot lock the last active Admin
    if (targetUser.role === SYSTEM_ROLES.ADMIN && status !== "active") {
      const activeAdminCount = await User.countDocuments({
        role: SYSTEM_ROLES.ADMIN,
        status: "active",
        _id: { $ne: targetUser._id },
      });
      if (activeAdminCount < 1) {
        throw new AppError("Không thể khóa tài khoản Quản trị viên cuối cùng của hệ thống", 400);
      }
    }

    const previousStatus = targetUser.status;
    targetUser.status = status;
    await targetUser.save();

    // If locked or blocked, revoke all current sessions immediately
    if (status !== "active") {
      await purgeUserTokens(targetUser._id.toString());
    }

    await recordRbacAuditLog({
      req,
      action: status === "active" ? "user:unlock" : "user:lock",
      targetId: targetUser._id.toString(),
      targetType: "user",
      details: {
        previousStatus,
        newStatus: status,
        targetEmail: targetUser.email,
      },
    });

    return successResponse(
      res,
      { id: targetUser._id, status: targetUser.status },
      `Đã ${status === "active" ? "mở khóa" : "khóa"} tài khoản thành công`
    );
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const total = await RbacAuditLog.countDocuments();
    const logs = await RbacAuditLog.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return successResponse(res, {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};
