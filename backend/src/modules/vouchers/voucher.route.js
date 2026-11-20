import { requireFeature } from "../../middlewares/featureGuard.middleware.js";
import express from "express";
import {
  getPublicVouchers,
  claimVoucher,
  getUserWallet,
  validateVoucher,
  getAdminVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  toggleVoucherStatus,
  getDashboardStats,
} from "./voucher.controller.js";
import { protectedRoute, adminOnly, noAdmin } from "../../middlewares/auth.middleware.js";
import { authenticate, authorize } from "../../middlewares/rbac.middleware.js";
import { claimRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const voucherRouter = express.Router();

// Public / Client Voucher APIs
voucherRouter.get("/", requireFeature("enableVoucher", "Tính năng mã giảm giá hiện đang tạm tắt"), getPublicVouchers);
voucherRouter.post("/claim", requireFeature("enableVoucher", "Tính năng mã giảm giá hiện đang tạm tắt"), protectedRoute, noAdmin, claimRateLimiter, claimVoucher);
voucherRouter.get("/wallet", requireFeature("enableVoucher", "Tính năng mã giảm giá hiện đang tạm tắt"), protectedRoute, getUserWallet);
voucherRouter.post("/validate", requireFeature("enableVoucher", "Tính năng mã giảm giá hiện đang tạm tắt"), protectedRoute, validateVoucher);

// Admin Voucher APIs (protected by RBAC coupon:manage)
voucherRouter.get("/admin/stats", authenticate, authorize("coupon:manage"), getDashboardStats);
voucherRouter.get("/admin", authenticate, authorize("coupon:manage"), getAdminVouchers);
voucherRouter.post("/admin", authenticate, authorize("coupon:manage"), createVoucher);
voucherRouter.put("/admin/:id", authenticate, authorize("coupon:manage"), updateVoucher);
voucherRouter.delete("/admin/:id", authenticate, authorize("coupon:manage"), deleteVoucher);
voucherRouter.patch("/admin/:id/status", authenticate, authorize("coupon:manage"), toggleVoucherStatus);

export default voucherRouter;
