import express from "express";
import { protectedRoute, adminOnly } from "../../middlewares/auth.middleware.js";
import { successResponse } from "../../common/responses/index.js";
import { Order } from "../orders/order.model.js";
import User from "../users/user.model.js";

const router = express.Router();
const VND_PER_POINT = 10_000;
const tiers = [
  ["bronze_1", "Đồng I", 0], ["bronze_2", "Đồng II", 100], ["bronze_3", "Đồng III", 250],
  ["silver_1", "Bạc I", 500], ["silver_2", "Bạc II", 900], ["silver_3", "Bạc III", 1400],
  ["gold_1", "Vàng I", 2000], ["gold_2", "Vàng II", 3000], ["gold_3", "Vàng III", 4500],
  ["diamond_1", "Kim Cương I", 6500], ["diamond_2", "Kim Cương II", 9000], ["diamond_3", "Kim Cương III", 12000],
];
const profileFromOrders = async (userId, user = null) => {
  const orders = await Order.find({ user_id: userId, status: "delivered" }).sort({ createdAt: -1 }).lean();
  const transactions = orders.map((order, index) => ({
    id: String(order._id), customerId: String(userId), orderId: String(order._id), eventType: "EARN",
    pointsDelta: Math.floor(Number(order.total_price || 0) / VND_PER_POINT), createdAt: order.createdAt,
    reason: "Đơn hàng đã giao", idempotencyKey: `order:${order._id}`, ruleVersion: "v1.0",
    previousBalance: orders.slice(index + 1).reduce((sum, value) => sum + Math.floor(Number(value.total_price || 0) / VND_PER_POINT), 0),
  }));
  const points = transactions.reduce((sum, transaction) => sum + transaction.pointsDelta, 0);
  transactions.forEach((transaction) => { transaction.newBalance = transaction.previousBalance + transaction.pointsDelta; });
  const tierIndex = tiers.reduce((current, tier, index) => points >= tier[2] ? index : current, 0);
  const tier = tiers[tierIndex]; const next = tiers[tierIndex + 1] || null;
  return { customerId: String(userId), customerName: user?.fullName, customerEmail: user?.email, customerPhone: user?.phone,
    qualifyingPoints: points, earnedPoints: points, reversedPoints: 0, currentBalance: points,
    currentTier: { id: tier[0], nameVi: tier[1], minPoints: tier[2] }, nextTier: next ? { id: next[0], nameVi: next[1], minPoints: next[2] } : null,
    pointsToNextTier: next ? next[2] - points : 0, progressPercentage: next ? Math.min(100, ((points - tier[2]) / (next[2] - tier[2])) * 100) : 100,
    transactions, eligibleOrdersCount: orders.length, totalEligibleSpend: orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0) };
};

router.get("/profile", protectedRoute, async (req, res, next) => { try { const user = await User.findById(req.user.userId).lean(); return successResponse(res, await profileFromOrders(req.user.userId, user)); } catch (error) { next(error); } });
router.get("/transactions", protectedRoute, async (req, res, next) => { try { const user = await User.findById(req.user.userId).lean(); return successResponse(res, (await profileFromOrders(req.user.userId, user)).transactions); } catch (error) { next(error); } });
router.get("/tiers", (_req, res) => successResponse(res, tiers.map(([id, nameVi, minPoints]) => ({ id, nameVi, minPoints }))));
router.get("/admin/stats", protectedRoute, adminOnly, async (_req, res, next) => { try { const users = await User.find({}).select("_id fullName email phone").lean(); const profiles = await Promise.all(users.map((user) => profileFromOrders(user._id, user))); return successResponse(res, { totalMembers: profiles.length, activeBalance: profiles.reduce((sum, item) => sum + item.currentBalance, 0), profiles }); } catch (error) { next(error); } });
router.get("/admin/customers", protectedRoute, adminOnly, async (_req, res, next) => { try { const users = await User.find({}).select("_id fullName email phone").lean(); return successResponse(res, await Promise.all(users.map((user) => profileFromOrders(user._id, user)))); } catch (error) { next(error); } });
router.get("/admin/transactions", protectedRoute, adminOnly, async (_req, res, next) => { try { const users = await User.find({}).select("_id fullName email phone").lean(); const profiles = await Promise.all(users.map((user) => profileFromOrders(user._id, user))); return successResponse(res, profiles.flatMap((profile) => profile.transactions)); } catch (error) { next(error); } });
router.put("/admin/tiers", protectedRoute, adminOnly, (_req, res) => successResponse(res, tiers.map(([id, nameVi, minPoints]) => ({ id, nameVi, minPoints })), "Tier configuration is read-only in this release"));

export default router;
