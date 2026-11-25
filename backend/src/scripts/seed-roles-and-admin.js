import { verifyQaSuiteTarget } from "../common/qa/qaIsolationGuard.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Role from "../modules/roles/role.model.js";
import User from "../modules/users/user.model.js";
import {
  SYSTEM_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  ALL_PERMISSIONS,
} from "../modules/roles/role.constant.js";

await verifyQaSuiteTarget();


const MONGO_URI =
  process.env.LOCAL_DEV_MONGO_URI ||
  process.env.MONGO_CONNECTIONSTRING ||
  "mongodb://127.0.0.1:27017/atelier_verite";

export async function seedRolesAndAdmin(options = {}) {
  const shouldDisconnect = options.disconnect !== false;

  if (mongoose.connection.readyState !== 1) {
    console.log(`[RBAC Seed] Kết nối MongoDB: ${MONGO_URI.replace(/\/\/.*@/, "//***:***@")}`);
    await mongoose.connect(MONGO_URI);
  }

  console.log("[RBAC Seed] Bắt đầu khởi tạo hệ thống Vai trò (Roles) và Quyền (Permissions)...");

  // 1. Seed Roles
  const rolesToSeed = [
    {
      name: SYSTEM_ROLES.ADMIN,
      displayName: "Quản Trị Viên Tối Cao",
      description: "Toàn quyền quản trị hệ thống, dữ liệu và phân quyền tài khoản",
      permissions: ALL_PERMISSIONS,
      isSystem: true,
    },
    {
      name: SYSTEM_ROLES.MANAGER,
      displayName: "Quản Lý Vận Hành",
      description: "Quản lý sản phẩm, đơn hàng, người dùng, khuyến mãi, nội dung và xem báo cáo",
      permissions: DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.MANAGER],
      isSystem: true,
    },
    {
      name: SYSTEM_ROLES.STAFF,
      displayName: "Nhân Viên Dịch Vụ & May Đo",
      description: "Xem sản phẩm, duyệt tiến độ đơn hàng và phản hồi tư vấn CSKH thời gian thực",
      permissions: DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.STAFF],
      isSystem: true,
    },
    {
      name: SYSTEM_ROLES.CUSTOMER,
      displayName: "Thượng Khách Thành Viên",
      description: "Khách hàng mua sắm, quản lý đơn hàng và hồ sơ tài khoản cá nhân",
      permissions: DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.CUSTOMER],
      isSystem: true,
    },
  ];

  const roleMap = {};
  for (const roleDef of rolesToSeed) {
    const existing = await Role.findOne({ name: roleDef.name });
    if (!existing) {
      const created = await Role.create(roleDef);
      roleMap[roleDef.name] = created;
      console.log(`[RBAC Seed] + Đã tạo role: ${roleDef.name} (${roleDef.permissions.length} quyền)`);
    } else {
      existing.displayName = roleDef.displayName;
      existing.description = roleDef.description;
      existing.isSystem = true;
      if (roleDef.name === SYSTEM_ROLES.ADMIN) {
        existing.permissions = ALL_PERMISSIONS;
      } else if (roleDef.name === SYSTEM_ROLES.STAFF || roleDef.name === SYSTEM_ROLES.MANAGER) {
        existing.permissions = roleDef.permissions;
      }
      await existing.save();
      roleMap[roleDef.name] = existing;
      console.log(`[RBAC Seed] = Cập nhật role hệ thống: ${roleDef.name} (${existing.permissions.length} quyền)`);
    }
  }

  // 2. Ensure initial Admin account exists
  const adminEmail = process.env.ADMIN_INIT_EMAIL || "admin@atelierverite.com";
  const rawPassword = process.env.ADMIN_INIT_PASSWORD || options.adminPassword;

  let adminUser = await User.findOne({ role: "admin", status: "active" });

  if (!adminUser) {
    // If no active admin exists, create one
    if (!rawPassword) {
      console.warn(
        "[RBAC Seed] CẢNH BÁO: Chưa cung cấp ADMIN_INIT_PASSWORD trong môi trường. Tạo tài khoản với mật khẩu ngẫu nhiên an toàn."
      );
    }
    const securePassword = rawPassword || `Admin@${Math.random().toString(36).slice(-8)}!`;
    const hashedPassword = await bcrypt.hash(securePassword, 10);

    adminUser = await User.create({
      email: adminEmail.toLowerCase().trim(),
      passWord: hashedPassword,
      fullName: "Tổng Quản Trị Atelier Vérité",
      role: "admin",
      roleId: roleMap[SYSTEM_ROLES.ADMIN]?._id || null,
      status: "active",
      legal_consents: {
        terms_accepted: true,
        privacy_accepted: true,
        marketing_accepted: false,
        policy_version: "current",
        recorded_at: new Date(),
      },
    });

    console.log(`[RBAC Seed] ★ Đã tạo tài khoản Admin đầu tiên thành công:`);
    console.log(`             Email:    ${adminEmail}`);
    if (!rawPassword) {
      console.log(`             Mật khẩu tạo tự động: ${securePassword}`);
      console.log(`             (Vui lòng lưu lại mật khẩu này và đổi mật khẩu sau khi đăng nhập!)`);
    }
  } else {
    // Ensure existing admin user has roleId linked
    if (!adminUser.roleId && roleMap[SYSTEM_ROLES.ADMIN]) {
      adminUser.roleId = roleMap[SYSTEM_ROLES.ADMIN]._id;
      await adminUser.save();
    }
    console.log(`[RBAC Seed] = Đã tồn tại tài khoản Admin hoạt động (${adminUser.email}). Bỏ qua tạo mới.`);
  }

  console.log("[RBAC Seed] Hoàn tất khởi tạo RBAC Roles và Admin.");

  if (shouldDisconnect) {
    await mongoose.disconnect();
  }

  return { roles: roleMap, admin: adminUser };
}

// Direct execution from CLI
if (process.argv[1]?.endsWith("seed-roles-and-admin.js")) {
  seedRolesAndAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[RBAC Seed Error]:", err);
      process.exit(1);
    });
}
