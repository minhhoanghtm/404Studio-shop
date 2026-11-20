import crypto from "crypto";
import express from "express";
import aiToolRegistry from "./services/aiAgent.service.js";

const internalAiRouter = express.Router();

const ALLOWED_TOOLS = new Set([
  // 1. Search Products
  "searchProducts", "search_products",
  // 2. Get Product Details
  "getProductDetails", "get_product_details", "get_product_detail",
  // 3. Get Product Variants
  "getProductVariants", "get_product_variants",
  // 4. Check Stock
  "checkStock", "check_stock",
  // 5. Add To Cart
  "addToCart", "add_to_cart",
  // 6. Update Cart
  "updateCart", "update_cart",
  // 7. Remove From Cart
  "removeFromCart", "remove_from_cart",
  // 8. Get Wishlist
  "getWishlist", "get_wishlist",
  // 9. Add To Wishlist
  "addToWishlist", "add_to_wishlist",
  // 10. Validate Voucher
  "validateVoucher", "validate_voucher",
  // 11. Apply Voucher
  "applyVoucher", "apply_voucher",
  // 12. Get My Orders
  "getMyOrders", "get_my_orders",
  // 13. Prepare Checkout
  "prepareCheckout", "prepare_checkout", "start_checkout", "buy_now",
  // 14. Confirm Order
  "confirmOrder", "confirm_order",
  // 15. Get Loyalty Status
  "getLoyaltyStatus", "get_loyalty_status",
  // 16. Get My Profile
  "getMyProfile", "get_my_profile",
  // 17. Update Allowed Profile Fields
  "updateAllowedProfileFields", "update_allowed_profile_fields",
  // 18. Search Published Policies
  "searchPublishedPolicies", "search_published_policies", "search_knowledge_base",
  // Utility & Backward-compatible tool names
  "get_my_cart", "cancel_checkout", "check_order_status", "get_vouchers", "get_categories", "get_product_reviews"
]);

function validSignature(req) {
  const secret = process.env.AI_SERVICE_SHARED_SECRET || "dev_shared_secret_key_minimum_32_characters_123456";
  const timestamp = req.get("X-AI-Service-Timestamp");
  const signature = req.get("X-AI-Service-Signature");
  if (!secret || secret.length < 32 || !timestamp || !signature) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 60) return false;
  const body = JSON.stringify(req.body || {});
  const digest = crypto.createHash("sha256").update(body).digest("hex");
  const path = req.originalUrl;
  const material = `${timestamp}.POST.${path}.${digest}`;
  const expected = crypto.createHmac("sha256", secret).update(material).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Private adapter for AI Service tool execution.
 * Authenticated via HMAC signature; identity forwarded from server session.
 */
internalAiRouter.post("/tools/:tool", async (req, res, next) => {
  try {
    if (!validSignature(req)) {
      return res.status(401).json({ success: false, code: "UNTRUSTED_AI_SERVICE" });
    }
    const { tool } = req.params;
    const rawUserId = req.get("X-AI-End-User-Id");
    const role = req.get("X-AI-End-User-Role") || "guest";
    const userId = rawUserId && rawUserId !== "anonymous" ? rawUserId : null;

    if (!ALLOWED_TOOLS.has(tool)) {
      return res.status(403).json({ success: false, code: "TOOL_NOT_ALLOWED" });
    }

    const confirmed = Boolean(req.body?.arguments?.confirmed || false);
    const result = await aiToolRegistry.executeTool(
      tool,
      req.body?.arguments || {},
      { userId, role, confirmed }
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

export default internalAiRouter;
