import express from "express";
import { protectedRoute, adminOnly } from "../../middlewares/auth.middleware.js";
import { authenticate, authorize } from "../../middlewares/rbac.middleware.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "./category.controller.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.post("/", authenticate, authorize("product:create"), createCategory);
router.put("/:id", authenticate, authorize("product:update"), updateCategory);
router.delete("/:id", authenticate, authorize("product:delete"), deleteCategory);

export default router;
