import express from "express";
import { checkAvailability } from "../inventory/inventory.controller.js";
import validate from "../../middlewares/validateZod.js";
import { protectedRoute, adminOnly } from "../../middlewares/auth.middleware.js";
import { authenticate, authorize } from "../../middlewares/rbac.middleware.js";
import {
  createProductSchema,
  updateProductSchema,
  searchProductSchema,
  createVariantSchema,
  updateVariantSchema,
  createAdminFormProductSchema,
  updateAdminFormProductSchema,
} from "./productValidators.js";
import {
  addProduct,
  deleteProduct,
  getProducts,
  getProductByCategory,
  getProductBySlug,
  getProductDetail,
  getSlugByProductId,
  searchProducts,
  suggestProducts,
  updateProduct,
  createProductVariant,
  deleteProductVariant,
  getProductVariantById,
  getProductVariantByProductId,
  updateProductVariant,
  addAdminFormProduct,
  updateAdminFormProduct,
  getCatalogProducts,
} from "./product.controller.js";
import {
  downloadProductTemplate,
  exportProductsExcel,
  previewProductsExcel,
  confirmProductsExcel,
  downloadErrorReport,
  excelUploadMiddleware,
} from "./productExcel.controller.js";

const productRouter = express.Router();

// Excel Import/Export with Embedded Images (Must precede /:slug)
productRouter.get("/excel/template", downloadProductTemplate);
productRouter.get("/excel/export", authenticate, authorize("product:view"), exportProductsExcel);
productRouter.post("/excel/export", authenticate, authorize("product:view"), exportProductsExcel);
productRouter.post(
  "/excel/preview",
  authenticate,
  authorize("product:create"),
  excelUploadMiddleware,
  previewProductsExcel
);
productRouter.post(
  "/excel/confirm",
  authenticate,
  authorize("product:create"),
  confirmProductsExcel
);
productRouter.get(
  "/excel/error-report/:previewId",
  authenticate,
  authorize("product:create"),
  downloadErrorReport
);

productRouter.get("/suggestions", suggestProducts);
productRouter.get("/search", validate(searchProductSchema), searchProducts);
productRouter.get("/category/:categoryid", getProductByCategory);
productRouter.get("/detail/:id", getProductDetail);
productRouter.get("/:id/availability", checkAvailability);
productRouter.get("/catalog", validate(searchProductSchema), getCatalogProducts);

// Admin / Staff Product Management endpoints
productRouter.post(
  "/admin-form",
  authenticate,
  authorize("product:create"),
  validate(createAdminFormProductSchema),
  addAdminFormProduct
);
productRouter.put(
  "/admin-form/:id",
  authenticate,
  authorize("product:update"),
  validate(updateAdminFormProductSchema),
  updateAdminFormProduct
);
productRouter.post(
  "/",
  authenticate,
  authorize("product:create"),
  validate(createProductSchema),
  addProduct
);
productRouter.get("/", getProducts);
productRouter.put(
  "/:id",
  authenticate,
  authorize("product:update"),
  validate(updateProductSchema),
  updateProduct
);
productRouter.delete(
  "/:id",
  authenticate,
  authorize("product:delete"),
  deleteProduct
);
productRouter.get("/:slug", getProductBySlug);
productRouter.get("/slug/:productId", getSlugByProductId);

const productVariantRouter = express.Router();

productVariantRouter.post(
  "/",
  authenticate,
  authorize("product:create"),
  validate(createVariantSchema),
  createProductVariant
);
productVariantRouter.get("/:product_id", getProductVariantByProductId);
productVariantRouter.get("/item/:id", getProductVariantById);
productVariantRouter.put(
  "/:id",
  authenticate,
  authorize("product:update"),
  validate(updateVariantSchema),
  updateProductVariant
);
productVariantRouter.delete(
  "/:id",
  authenticate,
  authorize("product:delete"),
  deleteProductVariant
);

export { productRouter, productVariantRouter };
