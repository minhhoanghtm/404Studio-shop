import cartRepository from "./cart.repository.js";
import { Cart, CartItem } from "./cart.model.js";
import { AppError } from "../../common/exceptions/AppError.js";
import productRepository from "../products/product.repository.js";
import pricingService from "../campaigns/pricing.service.js";
import inventoryReservationService from "../inventory/inventoryReservation.service.js";
import mongoose from "mongoose";
import { ProductVariant } from "../products/product.model.js";

class CartService {
  async addCart(userId) {
    if (!userId) throw new AppError("Không tìm thấy thông tin người dùng", 401);
    return await Cart.findOneAndUpdate({ user_id: userId }, { $setOnInsert: { total_items: 0, total_price: 0 } }, { upsert: true, returnDocument: "after" });
  }

  async getCart(userId) {
    return await cartRepository.findByUserId(userId);
  }

  async updateCart(id, _updateData, userId) {
    await this._requireOwnedCart(id, userId);
    const { cart } = await this._recalculateCart(id);
    return cart;
  }

  async deleteCart(id, userId) {
    if (!userId || !mongoose.isValidObjectId(id)) throw new AppError("Giỏ hàng không tồn tại", 404);
    const deleted = await Cart.findOneAndDelete({ _id: id, user_id: userId });
    if (!deleted) {
      throw new AppError("Giỏ hàng không tồn tại", 404);
    }
    return deleted;
  }

  async addCartItem(userId, itemData) {
    if (!userId) {
      throw new AppError("Không tìm thấy thông tin người dùng", 401);
    }

    const { product_id, quantity = 1, color, size } = itemData;
    let { variant_id } = itemData;
    if (!product_id) {
      throw new AppError("Thiếu dữ liệu sản phẩm để thêm vào giỏ hàng", 400);
    }
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1 || Number(quantity) > 1000) throw new AppError("Số lượng không hợp lệ", 400);

    const product = await productRepository.findById(product_id);
    if (!product) {
      throw new AppError("Sản phẩm không tồn tại", 404);
    }
    const variants = await ProductVariant.find({ product_id, is_active: { $ne: false } }).select('_id color size').lean();
    const equal = (left, right) => String(left || '').trim().toLocaleLowerCase('vi-VN') === String(right || '').trim().toLocaleLowerCase('vi-VN');
    if (variant_id) {
      const selected = variants.find((entry) => String(entry._id) === String(variant_id));
      if (!selected || (color && !equal(selected.color, color)) || (size && !equal(selected.size, size))) throw new AppError("Phiên bản sản phẩm không hợp lệ", 400);
    } else if (variants.length) {
      const matches = variants.filter((entry) => color && size && equal(entry.color, color) && equal(entry.size, size));
      if (matches.length !== 1) throw new AppError("Vui lòng chọn màu và kích cỡ hợp lệ", 400);
      variant_id = matches[0]._id;
    }

    // Check real-time stock taking into account active Redis reservations
    const availableStock = await inventoryReservationService.getAvailableStock(product_id, variant_id);
    if (availableStock < Number(quantity)) {
      throw new AppError(
        availableStock <= 0
          ? "Sản phẩm hiện đã hết hàng hoặc đang được giữ bởi khách hàng khác"
          : `Chỉ còn ${availableStock} sản phẩm khả dụng trong kho (yêu cầu ${quantity})`,
        400
      );
    }

    const priceInfo = await pricingService.resolvePrice(product, variant_id, new Date(), userId);
    const verifiedPrice = priceInfo?.finalPrice ?? product.new_price ?? 0;

    // 1. Get or create cart in 1 query
    const cart = await Cart.findOneAndUpdate(
      { user_id: userId },
      { $setOnInsert: { total_items: 0, total_price: 0 } },
      { upsert: true, new: true }
    );

    const cartId = cart._id;
    const normalizedVariantId = variant_id || null;

    // Limit the accumulated quantity atomically, including concurrent additions.
    const key = { cart_id: cartId, product_id, variant_id: normalizedVariantId };
    const increment = () => CartItem.findOneAndUpdate({ ...key, quantity: { $lte: Math.min(availableStock, 1000) - Number(quantity) } }, { $inc: { quantity: Number(quantity) }, $set: { price: verifiedPrice } }, { returnDocument: "after", runValidators: true });
    let updated = await increment();
    if (!updated) {
      if (await CartItem.exists(key)) throw new AppError("Số lượng vượt quá tồn kho khả dụng", 400);
      try { updated = await CartItem.create({ ...key, quantity: Number(quantity), price: verifiedPrice }); }
      catch (error) { if (error.code !== 11000) throw error; updated = await increment(); }
      if (!updated) throw new AppError("Số lượng vượt quá tồn kho khả dụng", 400);
    }

    return await this._recalculateCart(cartId, false); // không cần populate khi add
  }

  async _requireOwnedCart(cartId, userId) {
    if (!userId || !mongoose.isValidObjectId(cartId) || !await Cart.exists({ _id: cartId, user_id: userId })) throw new AppError("Giỏ hàng không tồn tại", 404);
  }

  async getCartItems(cartId, userId) {
    await this._requireOwnedCart(cartId, userId);
    const recalculated = await this._recalculateCart(cartId, true);
    return recalculated.items;
  }

  async updateCartItem(itemId, updateData, userId) {
    if (!userId || !mongoose.isValidObjectId(itemId)) throw new AppError("Không tìm thấy sản phẩm trong giỏ hàng", 404);
    const cartItem = await cartRepository.findItemById(itemId);
    if (!cartItem) {
      throw new AppError("Không tìm thấy sản phẩm trong giỏ hàng", 404);
    }

    await this._requireOwnedCart(cartItem.cart_id, userId);
    if (!updateData || Object.keys(updateData).some((key) => key !== "quantity") || !Number.isInteger(Number(updateData.quantity)) || Number(updateData.quantity) < 1 || Number(updateData.quantity) > 1000) throw new AppError("Số lượng không hợp lệ", 400);
    const availableStock = await inventoryReservationService.getAvailableStock(cartItem.product_id, cartItem.variant_id);
    if (Number(updateData.quantity) > availableStock) throw new AppError("Số lượng vượt quá tồn kho khả dụng", 400);
    await CartItem.findOneAndUpdate({ _id: itemId, cart_id: cartItem.cart_id }, { $set: { quantity: Number(updateData.quantity) } }, { runValidators: true });
    return await this._recalculateCart(cartItem.cart_id);
  }

  async deleteCartItem(itemId, userId) {
    if (!userId || !mongoose.isValidObjectId(itemId)) throw new AppError("Không tìm thấy sản phẩm trong giỏ hàng", 404);
    const cartItem = await cartRepository.findItemById(itemId);
    if (!cartItem) {
      throw new AppError("Không tìm thấy sản phẩm trong giỏ hàng", 404);
    }

    await this._requireOwnedCart(cartItem.cart_id, userId);
    await CartItem.findOneAndDelete({ _id: itemId, cart_id: cartItem.cart_id });
    return await this._recalculateCart(cartItem.cart_id);
  }

  // Private helper to recalculate cart totals
  // populate=true: trả full item detail (dùng cho GET cart)
  // populate=false: chỉ trả totals (dùng cho add/update/delete → nhanh hơn)
  async _recalculateCart(cartId, populate = true) {
    const items = await CartItem.find({ cart_id: cartId }).select("quantity price");

    const totalItemsCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPrice = items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );

    const updatedCart = await Cart.findByIdAndUpdate(
      cartId,
      { total_items: totalItemsCount, total_price: totalPrice },
      { new: true }
    );

    // Chỉ populate khi caller thực sự cần (GET cart)
    let populatedItems = null;
    if (populate) {
      const rawItems = await cartRepository.findItemsWithDetails({ cart_id: cartId });
      const bundle = await pricingService.getActiveCampaignsBundle();
      populatedItems = await Promise.all(
        rawItems.map(async (rawItem) => {
          const itemObj = rawItem.toObject ? rawItem.toObject() : { ...rawItem };
          if (itemObj.product_id) {
            const priceInfo = await pricingService.resolvePrice(
              itemObj.product_id,
              itemObj.variant_id,
              new Date(),
              null,
              bundle
            );
            itemObj.current_price = priceInfo.finalPrice;
            itemObj.original_price = priceInfo.originalPrice;
            itemObj.price_changed = itemObj.current_price !== itemObj.price;
            itemObj.campaign = priceInfo.campaignId
              ? {
                  id: priceInfo.campaignId,
                  name: priceInfo.campaignName,
                  type: priceInfo.type,
                  remainingQuota: priceInfo.remainingQuota,
                  discountPercentage: priceInfo.discountPercentage,
                  isQuotaExhausted: priceInfo.isQuotaExhausted || false,
                  isSale: priceInfo.isSale,
                }
              : null;
          }
          return itemObj;
        })
      );
    }

    return {
      items: populatedItems,
      cart: updatedCart,
      total: totalPrice,
    };
  }
}

export default new CartService();
