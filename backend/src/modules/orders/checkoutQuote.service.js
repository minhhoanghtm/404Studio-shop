import mongoose from "mongoose";
import { Product, ProductVariant } from "../products/product.model.js";
import User from "../users/user.model.js";
import pricingService from "../campaigns/pricing.service.js";
import voucherService from "../vouchers/voucher.service.js";
import inventoryReservationService from "../inventory/inventoryReservation.service.js";
import { isFeatureEnabled } from "../../common/utils/featureFlags.js";
import { AppError } from "../../common/exceptions/AppError.js";

export const checkoutShippingFee = (subtotal) => subtotal >= 1000000 || subtotal === 0 ? 0 : 30000;

export async function validateCheckoutReservation(userId, reservationId, items) {
  if (!reservationId) return null;
  const reservation = await inventoryReservationService.getReservation(reservationId);
  if (reservation?.status === "COMPLETED") throw new AppError("Phiên giữ hàng đã được sử dụng", 409);
  if (!reservation || reservation.status !== "ACTIVE" || reservation.remainingSeconds <= 0) throw new AppError("Phiên giữ hàng không còn hiệu lực", 400);
  if (userId && String(reservation.userId) !== String(userId)) throw new AppError("Phiên giữ hàng không thuộc về tài khoản này", 403);
  if (!userId && mongoose.isValidObjectId(reservation.userId) && await User.exists({ _id: reservation.userId })) throw new AppError("Cần đăng nhập để sử dụng phiên giữ hàng này", 403);
  const comparable = (entries) => entries.map((item) => `${item.productId || item.product_id}:${item.variantId || item.variant_id || item.product_variant_id || ""}:${Number(item.quantity)}`).sort().join("|");
  if (!Array.isArray(items) || !items.length || comparable(items) !== comparable(reservation.items || [])) throw new AppError("Sản phẩm đặt hàng không khớp với phiên giữ hàng", 400);
  return reservation;
}

export async function quoteCheckout(userId, { items, voucher_code: voucherCode, reservation_id: reservationId } = {}) {
  if (!Array.isArray(items) || !items.length || items.length > 100) throw new AppError("Danh sách sản phẩm không hợp lệ", 400);
  const keys = new Set();
  for (const item of items) {
    if (!mongoose.isValidObjectId(item.product_id) || (item.variant_id && !mongoose.isValidObjectId(item.variant_id)) || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || Number(item.quantity) > 1000) throw new AppError("Sản phẩm hoặc số lượng không hợp lệ", 400);
    const key = `${item.product_id}:${item.variant_id || ""}`;
    if (keys.has(key)) throw new AppError("Sản phẩm trong đơn hàng bị trùng lặp", 400);
    keys.add(key);
  }
  await validateCheckoutReservation(userId, reservationId, items);
  const products = await Product.find({ _id: { $in: items.map((item) => item.product_id) }, is_active: { $ne: false } }).lean();
  const variants = await ProductVariant.find({ product_id: { $in: items.map((item) => item.product_id) }, is_active: { $ne: false } }).lean();
  const bundle = await pricingService.getActiveCampaignsBundle(new Date());
  const lines = [];
  for (const item of items) {
    const product = products.find((entry) => String(entry._id) === String(item.product_id));
    if (!product) throw new AppError("Sản phẩm không còn khả dụng", 400);
    const productVariants = variants.filter((entry) => String(entry.product_id) === String(product._id));
    if ((item.variant_id && !productVariants.some((entry) => String(entry._id) === String(item.variant_id))) || (!item.variant_id && productVariants.length)) throw new AppError("Phiên bản sản phẩm không hợp lệ", 400);
    const pricing = await pricingService.resolvePrice(product, item.variant_id || null, new Date(), userId, bundle);
    if (pricing.isQuotaExhausted || !Number.isFinite(Number(pricing.finalPrice)) || Number(pricing.finalPrice) <= 0) throw new AppError("Giá sản phẩm không còn khả dụng", 409);
    lines.push({ product_id: String(product._id), variant_id: item.variant_id || null, quantity: Number(item.quantity), unitPrice: Number(pricing.finalPrice) });
  }
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const shipping = checkoutShippingFee(subtotal);
  let discount = 0;
  if (voucherCode) {
    if (typeof voucherCode !== "string" || voucherCode.length > 200 || !await isFeatureEnabled("enableVoucher")) throw new AppError("Mã ưu đãi chưa khả dụng", 400);
    const orderItems = lines.map((line) => ({ product_id: new mongoose.Types.ObjectId(line.product_id), variant_id: line.variant_id, quantity: line.quantity, price: line.unitPrice }));
    for (const code of voucherCode.split(",").map((entry) => entry.trim()).filter(Boolean)) {
      const amount = Number((await voucherService.validateVoucher(userId, code, subtotal, orderItems, shipping)).discountAmount);
      if (!Number.isFinite(amount) || amount < 0) throw new AppError("Giá trị ưu đãi không hợp lệ", 400);
      discount += amount;
    }
  }
  return { items: lines, subtotal, shipping, discount, tax: 0, total: Math.max(0, subtotal + shipping - discount) };
}
