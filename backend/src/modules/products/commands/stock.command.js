import { Product, ProductVariant } from "../product.model.js";
import { AppError } from "../../../common/exceptions/AppError.js";

export const deductStock = async (items, session = null) => {
  const applied = [];
  try {
  for (const item of items) {
    const { product_id, variant_id, quantity } = item;
    const qty = Number(quantity);
    if (!product_id || qty <= 0) continue;

    if (variant_id) {
      // 1. Check if variant exists
      const variant = await ProductVariant.findOne({ _id: variant_id, product_id }).session(session);
      if (!variant) {
        throw new AppError("Biến thể sản phẩm không tồn tại hoặc đã bị xóa", 404);
      }

      // 2. Atomic update variant stock
      const result = await ProductVariant.updateOne(
        { _id: variant_id, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { session }
      );
      if (result.modifiedCount === 0) {
        throw new AppError(
          `Sản phẩm (Màu: ${variant.color}, Cỡ: ${variant.size || 'N/A'}) không đủ số lượng trong kho (Còn lại: ${variant.stock})`,
          400
        );
      }

      const change = { product_id, variant_id, qty, parentUpdated: false };
      applied.push(change);

      // 3. Synchronize parent Product total stock and sold count
      const parentResult = await Product.updateOne(
        { _id: product_id },
        { $inc: { stock: -qty, sold: qty } },
        { session }
      );
      if (parentResult.matchedCount !== 1) throw new AppError("Sản phẩm không tồn tại hoặc đã bị xóa", 404);
      change.parentUpdated = true;
    } else {
      // 1. Check if product exists
      const product = await Product.findOne({ _id: product_id }).session(session);
      if (!product) {
        throw new AppError("Sản phẩm không tồn tại hoặc đã bị xóa", 404);
      }

      // 2. Atomic update product stock and sold count
      const result = await Product.updateOne(
        { _id: product_id, stock: { $gte: qty } },
        { $inc: { stock: -qty, sold: qty } },
        { session }
      );
      if (result.modifiedCount === 0) {
        throw new AppError(
          `Sản phẩm "${product.name}" không đủ số lượng trong kho (Còn lại: ${product.stock})`,
          400
        );
      }
      applied.push({ product_id, qty, parentUpdated: true });
    }
  }
  } catch (error) {
    // Transactions roll back their own writes. Standalone MongoDB needs to
    // compensate earlier successful items when a later deduction fails.
    if (!session) {
      for (const change of applied.reverse()) {
        try {
          if (change.variant_id) await ProductVariant.updateOne({ _id: change.variant_id, product_id: change.product_id }, { $inc: { stock: change.qty } });
          if (change.parentUpdated) await Product.updateOne({ _id: change.product_id }, { $inc: { stock: change.qty, sold: -change.qty } });
        } catch (rollbackError) {
          console.error("Stock deduction compensation failed:", rollbackError.message);
        }
      }
    }
    throw error;
  }
};

export const restoreStock = async (items, session = null) => {
  for (const item of items) {
    const { product_id, variant_id, quantity } = item;
    const qty = Number(quantity);
    if (!product_id || qty <= 0) continue;

    if (variant_id) {
      // 1. Restore variant stock
      await ProductVariant.updateOne(
        { _id: variant_id },
        { $inc: { stock: qty } },
        { session }
      );

      // 2. Synchronize parent Product total stock and sold count
      await Product.updateOne(
        { _id: product_id },
        { $inc: { stock: qty, sold: -qty } },
        { session }
      );
    } else {
      // 1. Restore product stock and sold count
      await Product.updateOne(
        { _id: product_id },
        { $inc: { stock: qty, sold: -qty } },
        { session }
      );
    }
  }
};
