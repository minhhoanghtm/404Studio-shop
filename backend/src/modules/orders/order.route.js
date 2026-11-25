import express from "express";
import {
  guestOrderLookup,
  createOrder,
  getCheckoutQuote,
  getOrdersByUser,
  updateOrder,
  deleteOrder,
  paymentOrder,
  paymentCallback,
  kpi,
  dashboardUser,
  getRevenueOverview,
  getOrderStats,
  getPurchasePerformance,
  createOrderItem,
  deleteOrderItem,
  getOrderItemsByOrderId,
  updateOrderItem,
  getAdminOrders,
  updateOrderStatus,
  getOrderPayment,
  updateGuestOrder,
  deleteGuestOrder,
  payGuestOrder,
} from "./order.controller.js";
import { protectedRoute, adminOnly, noAdmin } from "../../middlewares/auth.middleware.js";
import { authenticate, authorize } from "../../middlewares/rbac.middleware.js";
import { validateUpdateOrderStatus } from "./order.validator.js";

const orderRouter = express.Router();

orderRouter.get("/guest-lookup", guestOrderLookup);
orderRouter.post("/guest-lookup", guestOrderLookup);
orderRouter.get("/", protectedRoute, noAdmin, getOrdersByUser);
orderRouter.post("/quote", noAdmin, getCheckoutQuote);
orderRouter.post("/", noAdmin, createOrder);
orderRouter.put("/guest/:id", updateGuestOrder);
orderRouter.delete("/guest/:id", deleteGuestOrder);
orderRouter.post("/guest/:id/payment", payGuestOrder);
orderRouter.put("/:id", protectedRoute, noAdmin, updateOrder);
orderRouter.delete("/:id", protectedRoute, noAdmin, deleteOrder);
orderRouter.post("/payment", protectedRoute, noAdmin, paymentOrder);
orderRouter.get("/payment/callback", noAdmin, paymentCallback);
orderRouter.get("/:id/payment", protectedRoute, noAdmin, getOrderPayment);

// Admin reports & operations (RBAC protected)
orderRouter.get("/admin/kpi", authenticate, authorize("dashboard:view", "report:view"), kpi);
orderRouter.get("/admin/revenue", authenticate, authorize("dashboard:view", "report:view"), getRevenueOverview);
orderRouter.get("/admin/stats", authenticate, authorize("dashboard:view", "report:view"), getOrderStats);
orderRouter.get("/admin/orders", authenticate, authorize("order:view"), getAdminOrders);
orderRouter.patch("/admin/orders/:id/status", authenticate, authorize("order:update"), validateUpdateOrderStatus, updateOrderStatus);

// User metrics
orderRouter.get("/user/revenue", dashboardUser);
orderRouter.get("/user/purchasing_performance", getPurchasePerformance);

const orderItemRouter = express.Router();

orderItemRouter.get("/:order_id", authenticate, getOrderItemsByOrderId);
orderItemRouter.post("/", authenticate, authorize("order:update"), createOrderItem);
orderItemRouter.put("/:id", authenticate, authorize("order:update"), updateOrderItem);
orderItemRouter.delete("/:id", authenticate, authorize("order:update"), deleteOrderItem);

export { orderRouter, orderItemRouter };
