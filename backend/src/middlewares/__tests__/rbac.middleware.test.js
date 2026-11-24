import { jest } from "@jest/globals";
import {
  getEffectivePermissions,
  authorize,
  invalidateRoleCache,
} from "../rbac.middleware.js";
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  SYSTEM_ROLES,
} from "../../modules/roles/role.constant.js";
import Role from "../../modules/roles/role.model.js";

describe("RBAC System - Effective Permissions & Authorization Tests", () => {
  beforeEach(() => {
    invalidateRoleCache();
    jest.clearAllMocks();
  });

  describe("getEffectivePermissions Calculation", () => {
    test("Admin role always receives ALL permissions unconditionally", async () => {
      const adminUser = {
        role: SYSTEM_ROLES.ADMIN,
        permissionOverrides: { allow: [], deny: ["product:create"] }, // even with deny, admin has full bypass
      };

      const permissions = await getEffectivePermissions(adminUser);
      expect(permissions).toEqual(ALL_PERMISSIONS);
      expect(permissions).toContain(PERMISSIONS.ROLE_MANAGE);
      expect(permissions).toContain(PERMISSIONS.PRODUCT_DELETE);
    });

    test("Staff role calculates effective permissions = (base ∪ allow) ∖ deny", async () => {
      // Mock Role.findOne for staff
      jest.spyOn(Role, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            permissions: DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.STAFF],
          }),
        }),
      });

      const staffUser = {
        role: SYSTEM_ROLES.STAFF,
        permissionOverrides: {
          allow: [PERMISSIONS.DASHBOARD_VIEW], // Granted extra
          deny: [PERMISSIONS.CHAT_REPLY],     // Denied base permission
        },
      };

      const effective = await getEffectivePermissions(staffUser);

      // Should have base product:view
      expect(effective).toContain(PERMISSIONS.PRODUCT_VIEW);
      // Should have newly granted allow
      expect(effective).toContain(PERMISSIONS.DASHBOARD_VIEW);
      // Should NOT have denied chat:reply
      expect(effective).not.toContain(PERMISSIONS.CHAT_REPLY);
      // Should not have unassigned permissions like role:manage
      expect(effective).not.toContain(PERMISSIONS.ROLE_MANAGE);
    });

    test("Customer with no overrides has empty permission set", async () => {
      jest.spyOn(Role, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            permissions: [],
          }),
        }),
      });

      const customerUser = {
        role: SYSTEM_ROLES.CUSTOMER,
        permissionOverrides: { allow: [], deny: [] },
      };

      const effective = await getEffectivePermissions(customerUser);
      expect(effective).toEqual([]);
    });
  });

  describe("authorize Middleware Guard", () => {
    test("Returns 401 if request has no user", async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = authorize(PERMISSIONS.PRODUCT_CREATE);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("Allows admin through unconditionally", async () => {
      const req = {
        user: {
          userId: "admin_123",
          role: SYSTEM_ROLES.ADMIN,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = authorize(PERMISSIONS.ROLE_MANAGE);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("Returns 403 when user lacks required permission", async () => {
      jest.spyOn(Role, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            permissions: [PERMISSIONS.PRODUCT_VIEW],
          }),
        }),
      });

      const req = {
        user: {
          userId: "staff_456",
          role: SYSTEM_ROLES.STAFF,
          permissionOverrides: { allow: [], deny: [] },
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const middleware = authorize(PERMISSIONS.ROLE_MANAGE);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          required: [PERMISSIONS.ROLE_MANAGE],
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("Allows user through when user possesses one of alternative permissions", async () => {
      jest.spyOn(Role, "findOne").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            permissions: [PERMISSIONS.PRODUCT_UPDATE],
          }),
        }),
      });

      const req = {
        user: {
          userId: "manager_789",
          role: SYSTEM_ROLES.MANAGER,
          permissionOverrides: { allow: [], deny: [] },
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      // Either product:create OR product:update
      const middleware = authorize(PERMISSIONS.PRODUCT_CREATE, PERMISSIONS.PRODUCT_UPDATE);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
