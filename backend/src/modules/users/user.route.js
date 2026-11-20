import express from "express";
import {
  authMe,
  createUser,
  deleteUser,
  getAllUsers,
  updatePassword,
  updateProfile,
  updateUser,
  sendUpdatePhoneOtpController,
  verifyAndUpdatePhoneController,
} from "./user.controller.js";
import { protectedRoute, adminOnly } from "../../middlewares/auth.middleware.js";
import { authenticate, authorize } from "../../middlewares/rbac.middleware.js";
import { sendOtpLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  validateCreateUser,
  validateUpdateUser,
  validateUpdatePassword,
  validateUpdateProfile,
  validateUserIdParam,
  validateSendPhoneOtp,
  validateVerifyPhoneOtp,
} from "./user.validator.js";

const router = express.Router();

// Chạy sau middleware protectedRoute nên mặc định đã được bảo vệ
router.get("/me", authMe);
router.put("/updatePassword", validateUpdatePassword, updatePassword);
router.put("/updateProfile", validateUpdateProfile, updateProfile);
router.put("/phone/send-otp", sendOtpLimiter, validateSendPhoneOtp, sendUpdatePhoneOtpController);
router.put("/phone/verify", validateVerifyPhoneOtp, verifyAndUpdatePhoneController);

// RBAC Protected Admin User endpoints
router.get("/admin/users", authenticate, authorize("user:view"), getAllUsers);
router.get("/admin/all", authenticate, authorize("user:view"), getAllUsers);
router.post("/admin/users", authenticate, authorize("user:update"), validateCreateUser, createUser);
router.put("/admin/users/:id", authenticate, authorize("user:update"), validateUpdateUser, updateUser);
router.put("/admin/:id/status", authenticate, authorize("user:lock"), validateUpdateUser, updateUser);
router.delete("/admin/users/:id", authenticate, authorize("user:lock"), validateUserIdParam, deleteUser);

export default router;
