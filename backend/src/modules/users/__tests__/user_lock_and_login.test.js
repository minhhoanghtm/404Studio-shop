import { jest } from "@jest/globals";
import { AppError } from "../../../common/exceptions/AppError.js";

describe("User Lock Permissions and Locked Account Login Notice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("userService.updateUser - RBAC & Protection Rules", () => {
    test("Non-admin role cannot lock or unlock accounts (403)", async () => {
      const { default: userService } = await import("../user.service.js");
      const { default: userRepository } = await import("../user.repository.js");

      jest.spyOn(userRepository, "findById").mockResolvedValue({
        _id: "user-target-1",
        role: "user",
        status: "active",
      });

      const staffActor = { userId: "staff-1", role: "staff" };

      await expect(
        userService.updateUser("user-target-1", { status: "locked" }, staffActor)
      ).rejects.toThrow("Chỉ Quản trị viên (Admin) mới có quyền khóa hoặc mở khóa tài khoản nhân viên và khách hàng.");
    });

    test("Admin cannot lock an admin account (400)", async () => {
      const { default: userService } = await import("../user.service.js");
      const { default: userRepository } = await import("../user.repository.js");

      jest.spyOn(userRepository, "findById").mockResolvedValue({
        _id: "admin-target-2",
        role: "admin",
        status: "active",
      });

      const adminActor = { userId: "admin-actor-1", role: "admin" };

      await expect(
        userService.updateUser("admin-target-2", { status: "locked" }, adminActor)
      ).rejects.toThrow("Không thể khóa tài khoản Quản trị viên cấp cao.");
    });

    test("Admin cannot self-lock their own account (400)", async () => {
      const { default: userService } = await import("../user.service.js");
      const { default: userRepository } = await import("../user.repository.js");

      jest.spyOn(userRepository, "findById").mockResolvedValue({
        _id: "admin-actor-1",
        role: "admin",
        status: "active",
      });

      const adminActor = { userId: "admin-actor-1", role: "admin" };

      await expect(
        userService.updateUser("admin-actor-1", { status: "locked" }, adminActor)
      ).rejects.toThrow("Bạn không thể tự khóa tài khoản của chính mình.");
    });

    test("Admin can successfully lock customer account and sign out sessions", async () => {
      const { default: userService } = await import("../user.service.js");
      const { default: userRepository } = await import("../user.repository.js");

      const mockSave = jest.fn().mockResolvedValue(true);
      const mockCustomer = {
        _id: "customer-1",
        role: "user",
        status: "active",
        save: mockSave,
      };

      jest.spyOn(userRepository, "findById").mockResolvedValue(mockCustomer);
      jest.spyOn(userRepository, "findByIdWithoutPassword").mockResolvedValue({
        _id: "customer-1",
        role: "user",
        status: "locked",
      });

      const adminActor = { userId: "admin-1", role: "admin" };

      const result = await userService.updateUser("customer-1", { status: "locked" }, adminActor);

      expect(mockCustomer.status).toBe("locked");
      expect(mockSave).toHaveBeenCalled();
      expect(result.status).toBe("locked");
    });
  });

  describe("authService.signIn - Locked Account Message", () => {
    test("Attempting login with locked status returns shop contact instruction", async () => {
      const { default: authService } = await import("../../auth/auth.service.js");
      const { default: userRepository } = await import("../user.repository.js");

      jest.spyOn(userRepository, "findByEmail").mockResolvedValue({
        _id: "locked-user-1",
        email: "locked@atelierverite.com",
        status: "locked",
      });

      try {
        await authService.signIn("locked@atelierverite.com", "SecretPassword123!");
        throw new Error("Should have failed");
      } catch (err) {
        expect(err.statusCode).toBe(403);
        expect(err.message).toBe("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với shop để giải quyết.");
      }
    });

    test("Attempting login with blocked status returns shop contact instruction", async () => {
      const { default: authService } = await import("../../auth/auth.service.js");
      const { default: userRepository } = await import("../user.repository.js");

      jest.spyOn(userRepository, "findByEmail").mockResolvedValue({
        _id: "blocked-user-1",
        email: "blocked@atelierverite.com",
        status: "blocked",
      });

      try {
        await authService.signIn("blocked@atelierverite.com", "SecretPassword123!");
        throw new Error("Should have failed");
      } catch (err) {
        expect(err.statusCode).toBe(403);
        expect(err.message).toBe("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với shop để giải quyết.");
      }
    });
  });
});
