import { isFeatureEnabled } from "../../../common/utils/featureFlags.js";
import orderRepository from "../order.repository.js";
import productRepository from "../../products/product.repository.js";
import productFacade from "../../products/product.facade.js";
import { AppError } from "../../../common/exceptions/AppError.js";
import * as momoProvider from "../../../providers/momo.provider.js";
import mongoose from "mongoose";
import voucherService from "../../vouchers/voucher.service.js";
import { Cart, CartItem } from "../../carts/cart.model.js";
import dotenv from "dotenv";
import pricingService from "../../campaigns/pricing.service.js";
import CampaignProduct from "../../campaigns/campaignProduct.model.js";
import CampaignPurchase from "../../campaigns/campaignPurchase.model.js";
import inventoryReservationService from "../../inventory/inventoryReservation.service.js";
import InventoryReservation from "../../inventory/inventoryReservation.model.js";
import crypto from "crypto";
import { checkoutShippingFee, quoteCheckout, validateCheckoutReservation } from "../checkoutQuote.service.js";
import { Order } from "../order.model.js";
dotenv.config();

const isNonTransactionalFallbackAllowed = () =>
  process.env.NODE_ENV !== "production" &&
  process.env.REQUIRE_MONGO_TRANSACTIONS !== "true";

const computeCheckoutRequestHash = (userId, orderData) => {
  const items = Array.isArray(orderData.items)
    ? orderData.items.map((item) => ({
        product_id: String(item.product_id || ""),
        variant_id: item.variant_id || item.product_variant_id ? String(item.variant_id || item.product_variant_id) : null,
        quantity: Number(item.quantity || 0),
      }))
    : [];
  const rawAddr = orderData.shipping_address || orderData.shippingAddress || {};
  const canonical = {
    userId: userId ? String(userId) : null,
    items,
    payment_method: String(orderData.payment_method || orderData.paymentMethod || "cod").toLowerCase(),
    voucher_code: String(orderData.voucher_code || orderData.voucherCode || "").trim().toUpperCase(),
    reservation_id: orderData.reservation_id || orderData.reservationId || null,
    shipping_address: typeof rawAddr === "object" && rawAddr !== null ? {
      full_name: rawAddr.full_name || "",
      phone: rawAddr.phone || "",
      city: rawAddr.city || "",
      district: rawAddr.district || "",
      ward: rawAddr.ward || "",
      address_detail: rawAddr.address_detail || "",
    } : String(rawAddr),
  };
  return crypto.createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
};

// Validate fields that the Order model requires before stock, campaigns or
// vouchers can be changed on standalone MongoDB without transactions.
const validateOrderInput = (orderData) => {
  const raw = orderData.shipping_address || orderData.shippingAddress;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new AppError("Vui lòng cung cấp đầy đủ thông tin giao hàng", 400);
  }
  const shippingAddress = raw;
  const payment = orderData.payment_method || orderData.paymentMethod || "cod";
  if (typeof payment !== "string") throw new AppError("Phương thức thanh toán không hợp lệ", 400);
  const validation = new Order({ total_price: 0, shipping_address: shippingAddress, payment_method: payment.toLowerCase() }).validateSync();
  if (validation) throw new AppError("Thông tin giao hàng hoặc phương thức thanh toán không hợp lệ", 400);
};

export const createOrder = async (userId, orderData) => {
  const reservationId = orderData.reservation_id || orderData.reservationId || null;
  const rawIdempotencyKey = orderData.idempotency_key ?? orderData.idempotencyKey ?? null;
  const idempotencyKey = typeof rawIdempotencyKey === "string" && rawIdempotencyKey.trim()
    ? rawIdempotencyKey.trim()
    : null;
  if (rawIdempotencyKey !== null && rawIdempotencyKey !== undefined && (!idempotencyKey || idempotencyKey.length > 200)) {
    throw new AppError("Khóa idempotency không hợp lệ", 400);
  }
  if (reservationId !== null && (typeof reservationId !== "string" || reservationId.length > 200)) {
    throw new AppError("Phiên giữ hàng không hợp lệ", 400);
  }

  const items = Array.isArray(orderData.items)
    ? orderData.items.map((item) => ({ ...item, variant_id: item.variant_id || item.product_variant_id || undefined }))
    : orderData.items;
  if (reservationId) {
    await validateCheckoutReservation(userId, reservationId, items);
  }

  const requestHash = idempotencyKey ? computeCheckoutRequestHash(userId, orderData) : null;
  if (!reservationId && !idempotencyKey) {
    return createOrderUnlocked(userId, orderData, { requestHash, idempotencyKey });
  }

  const redis = inventoryReservationService.getRedis();
  const acquiredLocks = [];
  const acquireLock = async (lockKey, conflictMessage) => {
    const lockToken = crypto.randomBytes(24).toString("hex");
    let acquired;
    try {
      acquired = await redis.set(lockKey, lockToken, "EX", 300, "NX");
    } catch {
      throw new AppError("Không thể kiểm tra khóa xử lý đơn hàng, vui lòng thử lại", 503);
    }
    if (acquired !== "OK") {
      throw new AppError(conflictMessage, 409);
    }
    acquiredLocks.push({ lockKey, lockToken });
  };

  try {
    if (reservationId) {
      await acquireLock(`webfashion:checkout:order-lock:${reservationId}`, "Phiên giữ hàng đang được xử lý");
    }
    if (idempotencyKey) {
      await acquireLock(`webfashion:checkout:idemp-lock:${userId || "guest"}:${idempotencyKey}`, "Đơn hàng đang được xử lý, vui lòng không gửi trùng lặp");
    }

    if (idempotencyKey) {
      const existingByKey = await Order.findOne({
        user_id: userId || null,
        idempotency_key: idempotencyKey,
      }).select("+idempotency_request_hash");
      if (existingByKey) {
        if (existingByKey.idempotency_request_hash && existingByKey.idempotency_request_hash !== requestHash) {
          throw Object.assign(new AppError("Khóa idempotency đã được sử dụng cho yêu cầu khác", 409), { code: "IDEMPOTENCY_CONFLICT" });
        }
        return existingByKey;
      }
    }

    if (reservationId) {
      // A previous order may already exist even if Redis finalization failed.
      if (await Order.exists({ reservation_id: reservationId })) {
        throw new AppError("Phiên giữ hàng đã được sử dụng", 409);
      }
    }

    // The inner checkout revalidates the reservation and executes atomically.
    return await createOrderUnlocked(userId, orderData, { requestHash, idempotencyKey });
  } finally {
    for (const { lockKey, lockToken } of acquiredLocks.reverse()) {
      try {
        await redis.eval(
          'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end',
          1,
          lockKey,
          lockToken
        );
      } catch (error) {
        console.error("Checkout lock release failed:", error.message);
      }
    }
  }
};

const createOrderUnlocked = async (userId, orderData, idempotencyMeta = {}) => {
  // Guest orders have no account identity. Generate a high-entropy credential
  // once and persist only its SHA-256 hash.
  const guestAccessToken = userId ? null : crypto.randomBytes(32).toString("base64url");
  const guestAccessTokenHash = guestAccessToken
    ? crypto.createHash("sha256").update(guestAccessToken).digest("hex")
    : null;
  const reservationId = orderData.reservation_id || orderData.reservationId || null;
  const quotedItems = Array.isArray(orderData.items) ? orderData.items.map((item) => ({ ...item, variant_id: item.variant_id || item.product_variant_id || undefined })) : orderData.items;
  await quoteCheckout(userId, { items: quotedItems, voucher_code: orderData.voucher_code || orderData.voucherCode, reservation_id: reservationId });
  validateOrderInput(orderData);

  if (!userId) {
    const guestAllowed = await isFeatureEnabled("allowGuestCheckout");
    if (!guestAllowed) {
      throw new AppError("Chức năng mua hàng không cần đăng nhập hiện đang tạm đóng. Vui lòng đăng nhập.", 403, "GUEST_CHECKOUT_DISABLED");
    }
  }

  const session = await mongoose.startSession();
  let transactionCompleted = false;
  try {
    let createdOrder;
    let orderItems = [];
    await session.withTransaction(async () => {
      const items = orderData.items || [];
      const paymentMethod =
        orderData.payment_method || orderData.paymentMethod || "cod";
      const rawShippingAddress =
        orderData.shipping_address || orderData.shippingAddress;
      let voucherCode = orderData.voucher_code || orderData.voucherCode;
      if (voucherCode) {
        const voucherAllowed = await isFeatureEnabled("enableVoucher");
        if (!voucherAllowed) {
          voucherCode = null;
        }
      }

      const dbShippingAddress = rawShippingAddress;

      let subtotal = 0;
      orderItems = [];
      const activeCampaignsBundle = await pricingService.getActiveCampaignsBundle(new Date());





  if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          if (!item.product_id || !mongoose.Types.ObjectId.isValid(item.product_id)) {
            throw new AppError(`product_id không hợp lệ: ${item.product_id}`, 400);
          }
          const productObjectId = new mongoose.Types.ObjectId(item.product_id);

          const product = await productRepository.findOne({
            _id: productObjectId,
          }, { session });
          if (!product) {
            throw new AppError(
              `Sản phẩm với id ${item.product_id} không tồn tại`,
              404,
            );
          }

          const variantId = item.variant_id || item.product_variant_id || null;
          const priceInfo = await pricingService.resolvePrice(
            product,
            variantId,
            new Date(),
            userId,
            activeCampaignsBundle
          );

          if (item.price !== undefined && item.price !== null && Math.abs(Number(item.price) - priceInfo.finalPrice) > 0.01) {
            throw new AppError(
              `Giá sản phẩm "${product.name}" đã thay đổi từ ${Number(item.price).toLocaleString("vi-VN")}đ thành ${priceInfo.finalPrice.toLocaleString("vi-VN")}đ do chương trình khuyến mãi thay đổi. Vui lòng cập nhật giỏ hàng.`,
              409
            );
          }

          if (priceInfo.isQuotaExhausted) {
            throw new AppError(
              `Sản phẩm "${product.name}" trong Flash Sale đã hết suất ưu đãi. Vui lòng cập nhật lại giỏ hàng.`,
              409
            );
          }

          if (priceInfo.type === "flash_sale" && priceInfo.cpConfig) {
            const qty = Number(item.quantity);
            if (priceInfo.cpConfig.per_user_limit && userId) {
              const userPurchases = await CampaignPurchase.aggregate([
                {
                  $match: {
                    campaign_id: priceInfo.campaignId,
                    product_id: productObjectId,
                    user_id: new mongoose.Types.ObjectId(userId),
                  },
                },
                {
                  $group: {
                    _id: null,
                    totalBought: { $sum: "$quantity" },
                  },
                },
              ]).session(session);

              const alreadyBought = userPurchases[0]?.totalBought || 0;
              if (alreadyBought + qty > priceInfo.cpConfig.per_user_limit) {
                throw new AppError(
                  `Bạn chỉ được mua tối đa ${priceInfo.cpConfig.per_user_limit} sản phẩm "${product.name}" với giá ưu đãi trong đợt khuyến mãi này.`,
                  400
                );
              }
            }

            const cpDeducted = await CampaignProduct.findOneAndUpdate(
              {
                _id: priceInfo.cpConfig._id,
                $expr: {
                  $lte: [{ $add: ["$sold", qty] }, "$quota"],
                },
              },
              {
                $inc: { sold: qty },
              },
              { session, new: true }
            );

            if (!cpDeducted) {
              throw new AppError(
                `Sản phẩm "${product.name}" trong Flash Sale vừa hết suất khuyến mãi`,
                409
              );
            }
          }

          const priceToUse = priceInfo.finalPrice;
          if (priceToUse <= 0) {
            throw new AppError(
              `Sản phẩm "${product.name}" chưa xác định được giá hợp lệ từ hệ thống hoặc có giá 0đ`,
              400
            );
          }
          const totalCalculated = priceToUse * item.quantity;
          subtotal += totalCalculated;

          orderItems.push({
            product_id: productObjectId,
            product_name: product.name,
            product_slug: product.slug,
            product_image:
              product.image ||
              (product.displayProduct && product.displayProduct[0]),
            quantity: item.quantity,
            price: priceToUse,
            variant_id: variantId,
            campaign_id: priceInfo.campaignId || null,
            campaign_name: priceInfo.campaignName || null,
            original_price: priceInfo.originalPrice,
          });
        }
      } else {
        subtotal = Number(orderData.total_price || orderData.totalPrice || 0);
      }

      const shippingFee = checkoutShippingFee(subtotal);
      let discountAmount = 0;
      const voucherIds = [];
      const voucherCodes = voucherCode ? voucherCode.split(",").map((c) => c.trim()) : [];

      for (const code of voucherCodes) {
        if (code) {
          const validation = await voucherService.validateVoucher(
            userId,
            code,
            subtotal,
            orderItems,
            shippingFee,
            { session },
          );
          discountAmount += validation.discountAmount;
          const placeholderOrderId = new mongoose.Types.ObjectId();
          if (validation.voucherId) {
            voucherIds.push({ id: validation.voucherId, placeholderOrderId });
          }

          await voucherService.applyVoucherWithPlaceholder(
            userId,
            code,
            validation.discountAmount,
            { session, placeholderOrderId },
          );
        }
      }

      const finalTotalPrice = Math.max(0, subtotal + shippingFee - discountAmount);

      if (orderItems.length > 0) {
        await productFacade.deductStock(orderItems, session);
      }

      const orderArray = await orderRepository.create(
        [
          {
            user_id: userId || null,
            is_guest: !userId,
            guest_email: orderData.email || orderData.guest_email || null,
            guest_access_token_hash: guestAccessTokenHash,
            total_price: finalTotalPrice,
            original_price: subtotal,
            discount_amount: discountAmount,
            shipping_fee: shippingFee,
            reservation_id: reservationId,
            idempotency_key: idempotencyMeta.idempotencyKey || null,
            idempotency_request_hash: idempotencyMeta.requestHash || null,
            voucher_code: voucherCode ? voucherCode.toUpperCase() : null,
            status: "pending",
            payment_method: paymentMethod.toLowerCase(),
            shipping_address: dbShippingAddress,
            stock_deducted: true,
          },
        ],
        { session },
      );

      createdOrder = orderArray[0];

      if (reservationId) {
        const resFilter = { reservationId, status: "ACTIVE" };
        if (userId) resFilter.userId = String(userId);
        const consumedReservation = await InventoryReservation.findOneAndUpdate(
          resFilter,
          { $set: { status: "COMPLETED", orderId: createdOrder._id, completedAt: new Date() } },
          { session, new: true },
        );
        if (!consumedReservation) {
          throw new AppError("Phiên giữ hàng đã được sử dụng hoặc không còn hiệu lực", 409);
        }
      }

      // Ghi nhận lượt mua chiến dịch để kiểm soát per_user_limit
      for (const orderItem of orderItems) {
        if (orderItem.campaign_id && userId) {
          await CampaignPurchase.create(
            [
              {
                campaign_id: orderItem.campaign_id,
                product_id: orderItem.product_id,
                user_id: userId,
                order_id: createdOrder._id,
                quantity: orderItem.quantity,
              },
            ],
            { session }
          );
        }
      }

      for (const vRef of voucherIds) {
        await voucherService.linkVoucherUsageToOrder(
          userId,
          vRef.id,
          createdOrder._id,
          { session, placeholderOrderId: vRef.placeholderOrderId },
        );
      }

      if (orderItems.length > 0) {
        const orderItemsToInsert = orderItems.map((item) => ({
          ...item,
          order_id: createdOrder._id,
        }));

        await orderRepository.insertManyItems(orderItemsToInsert, {
          session,
        });

        if (userId) {
          const userCart = await Cart.findOne({ user_id: userId }).session(
            session,
          );
          if (userCart) {
          await CartItem.deleteMany({
            cart_id: userCart._id,
            $or: orderItems.map((item) => ({ product_id: item.product_id, variant_id: item.variant_id || null })),
          }).session(session);

          const remainingItems = await CartItem.find({
            cart_id: userCart._id,
          }).session(session);
          const totalItemsCount = remainingItems.reduce(
            (sum, item) => sum + (item.quantity || 0),
            0,
          );
          const totalPrice = remainingItems.reduce(
            (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
            0,
          );
          await Cart.findByIdAndUpdate(
            userCart._id,
            {
              total_items: totalItemsCount,
              total_price: totalPrice,
            },
            { session },
          );
          }
        }
      }
    });

    transactionCompleted = true;
    if (reservationId && createdOrder) {
      await inventoryReservationService.finalizeCommittedReservationRedis(reservationId, createdOrder._id);
    }

    if (createdOrder) {
      import("../../../sockets/events.js")
        .then(({ emitOrderNotification }) => {
          emitOrderNotification(createdOrder);
        })
        .catch((err) =>
          console.error(
            "Failed to emit order socket notification:",
            err.message,
          ),
        );

      // Ghi nhận sự kiện order_placed sau khi commit transaction (có quy kết A/B Testing)
      if (Array.isArray(orderItems) && orderItems.length > 0) {
        Promise.all([
          import("../../../queues/tracking.queue.js"),
          import("../../recommendations/experiments/experiment.service.js"),
        ])
          .then(([{ addTrackingJob }, { default: expService }]) => {
            expService.resolveOrderAttribution(createdOrder.user_id, orderItems).then((attribution) => {
              orderItems.forEach((item) => {
                addTrackingJob({
                  event_id: new mongoose.Types.ObjectId().toString(),
                  user_id: createdOrder.user_id ? createdOrder.user_id.toString() : null,
                  anonymous_id: null,
                  event_type: "order_placed",
                  product_id: item.product_id ? item.product_id.toString() : null,
                  category_id: null,
                  query: null,
                  meta: {
                    price: item.price || 0,
                    quantity: item.quantity || 1,
                    order_id: createdOrder._id.toString(),
                    payment_method: createdOrder.payment_method,
                    experiment_id: attribution?.experiment_id || null,
                    variant: attribution?.variant || null,
                    rec_attributed: attribution?.is_direct_rec_assisted || false,
                  },
                  timestamp: new Date().toISOString(),
                }).catch(() => {});
              });
            }).catch(() => {});
          })
          .catch((err) => console.warn("[Tracking] Lỗi import trackingQueue/expService:", err.message));
      }
    }

    if (guestAccessToken) {
      // Keep the raw credential out of persistence/serialization. The controller
      // returns it exactly once in the create-order response.
      Object.defineProperty(createdOrder, "guestAccessToken", {
        value: guestAccessToken,
        enumerable: false,
      });
    }
    return createdOrder;
  } catch (error) {
    if (
      !transactionCompleted && error.code === 20 &&
      /transaction numbers are only allowed on a replica set member or mongos/i.test(error.message || "")
    ) {
      if (!isNonTransactionalFallbackAllowed()) {
        throw Object.assign(
          new AppError("Hệ thống thanh toán yêu cầu MongoDB Replica Set hỗ trợ giao dịch nguyên tử.", 503),
          { code: "TRANSACTION_REQUIRED" },
        );
      }
      console.warn(
        "⚠️ MongoDB local does not support Transactions. Falling back to non-transactional execution.",
      );
      return await createOrderWithoutTransaction(userId, orderData, { guestAccessToken, guestAccessTokenHash, ...idempotencyMeta });
    }
    if (!transactionCompleted && error.code === 11000) {
      if (error.keyPattern?.reservation_id) {
        throw new AppError("Phiên giữ hàng đã được sử dụng", 409);
      }
      if (error.keyPattern?.idempotency_key && idempotencyMeta.idempotencyKey) {
        const existingByKey = await Order.findOne({
          user_id: userId || null,
          idempotency_key: idempotencyMeta.idempotencyKey,
        }).select("+idempotency_request_hash");
        if (existingByKey) {
          if (existingByKey.idempotency_request_hash && existingByKey.idempotency_request_hash !== idempotencyMeta.requestHash) {
            throw Object.assign(new AppError("Khóa idempotency đã được sử dụng cho yêu cầu khác", 409), { code: "IDEMPOTENCY_CONFLICT" });
          }
          return existingByKey;
        }
      }
    }
    throw error;
  } finally {
    session.endSession();
  }
};

export const createOrderWithoutTransaction = async (userId, orderData, guest = {}) => {
  if (!isNonTransactionalFallbackAllowed()) {
    throw Object.assign(
      new AppError("Hệ thống thanh toán yêu cầu MongoDB Replica Set hỗ trợ giao dịch nguyên tử.", 503),
      { code: "TRANSACTION_REQUIRED" },
    );
  }
  const reservationId = orderData.reservation_id || orderData.reservationId || null;
  const guestAccessToken = userId ? null : (guest.guestAccessToken || crypto.randomBytes(32).toString("base64url"));
  const guestAccessTokenHash = userId ? null : (guest.guestAccessTokenHash || crypto.createHash("sha256").update(guestAccessToken).digest("hex"));
  const quotedItems = Array.isArray(orderData.items) ? orderData.items.map((item) => ({ ...item, variant_id: item.variant_id || item.product_variant_id || undefined })) : orderData.items;
  await quoteCheckout(userId, { items: quotedItems, voucher_code: orderData.voucher_code || orderData.voucherCode, reservation_id: reservationId });
  validateOrderInput(orderData);
  if (!userId) {
    const guestAllowed = await isFeatureEnabled("allowGuestCheckout");
    if (!guestAllowed) {
      throw new AppError("Chức năng mua hàng không cần đăng nhập hiện đang tạm đóng. Vui lòng đăng nhập.", 403, "GUEST_CHECKOUT_DISABLED");
    }
  }

  const items = orderData.items || [];
  const paymentMethod =
    orderData.payment_method || orderData.paymentMethod || "cod";
  const rawShippingAddress =
    orderData.shipping_address || orderData.shippingAddress;
  let voucherCode = orderData.voucher_code || orderData.voucherCode;
  if (voucherCode) {
    const voucherAllowed = await isFeatureEnabled("enableVoucher");
    if (!voucherAllowed) {
      voucherCode = null;
    }
  }

  const dbShippingAddress = rawShippingAddress;

  let subtotal = 0;
  const orderItems = [];
  const appliedCampaigns = [];
  const appliedVouchers = [];
  let stockDeducted = false;
  let order = null;

  try {
    const activeCampaignsBundle = await pricingService.getActiveCampaignsBundle(new Date());

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item.product_id || !mongoose.Types.ObjectId.isValid(item.product_id)) {
          throw new AppError(`product_id không hợp lệ: ${item.product_id}`, 400);
        }
        const productObjectId = new mongoose.Types.ObjectId(item.product_id);

        const product = await productRepository.findOne({
          _id: productObjectId,
        });
        if (!product) {
          throw new AppError(
            `Sản phẩm với id ${item.product_id} không tồn tại`,
            404,
          );
        }

        const variantId = item.variant_id || item.product_variant_id || null;
        const priceInfo = await pricingService.resolvePrice(
          product,
          variantId,
          new Date(),
          userId,
          activeCampaignsBundle
        );

        if (item.price !== undefined && item.price !== null && Math.abs(Number(item.price) - priceInfo.finalPrice) > 0.01) {
          throw new AppError(
            `Giá sản phẩm "${product.name}" đã thay đổi từ ${Number(item.price).toLocaleString("vi-VN")}đ thành ${priceInfo.finalPrice.toLocaleString("vi-VN")}đ do chương trình khuyến mãi thay đổi. Vui lòng cập nhật giỏ hàng.`,
            409
          );
        }

        if (priceInfo.isQuotaExhausted) {
          throw new AppError(
            `Sản phẩm "${product.name}" trong Flash Sale đã hết suất ưu đãi. Vui lòng cập nhật lại giỏ hàng.`,
            409
          );
        }

        if (priceInfo.type === "flash_sale" && priceInfo.cpConfig) {
          const qty = Number(item.quantity);
          if (priceInfo.cpConfig.per_user_limit && userId) {
            const userPurchases = await CampaignPurchase.aggregate([
              {
                $match: {
                  campaign_id: priceInfo.campaignId,
                  product_id: productObjectId,
                  user_id: new mongoose.Types.ObjectId(userId),
                },
              },
              {
                $group: {
                  _id: null,
                  totalBought: { $sum: "$quantity" },
                },
              },
            ]);

            const alreadyBought = userPurchases[0]?.totalBought || 0;
            if (alreadyBought + qty > priceInfo.cpConfig.per_user_limit) {
              throw new AppError(
                `Bạn chỉ được mua tối đa ${priceInfo.cpConfig.per_user_limit} sản phẩm "${product.name}" với giá ưu đãi trong đợt khuyến mãi này.`,
                400
              );
            }
          }

          const cpDeducted = await CampaignProduct.findOneAndUpdate(
            {
              _id: priceInfo.cpConfig._id,
              $expr: {
                $lte: [{ $add: ["$sold", qty] }, "$quota"],
              },
            },
            {
              $inc: { sold: qty },
            },
            { new: true }
          );

          if (!cpDeducted) {
            throw new AppError(
              `Sản phẩm "${product.name}" trong Flash Sale vừa hết suất khuyến mãi`,
              409
            );
          }
          appliedCampaigns.push({ cpId: priceInfo.cpConfig._id, qty });
        }

        const priceToUse = priceInfo.finalPrice;
        if (priceToUse <= 0) {
          throw new AppError(
            `Sản phẩm "${product.name}" chưa xác định được giá hợp lệ từ hệ thống hoặc có giá 0đ`,
            400
          );
        }
        const totalCalculated = priceToUse * item.quantity;
        subtotal += totalCalculated;

        orderItems.push({
          product_id: productObjectId,
          product_name: product.name,
          product_slug: product.slug,
          product_image:
            product.image ||
            (product.displayProduct && product.displayProduct[0]),
          quantity: item.quantity,
          price: priceToUse,
          variant_id: variantId,
          campaign_id: priceInfo.campaignId || null,
          campaign_name: priceInfo.campaignName || null,
          original_price: priceInfo.originalPrice,
        });
      }
    } else {
      subtotal = Number(orderData.total_price || orderData.totalPrice || 0);
    }

    const shippingFee = checkoutShippingFee(subtotal);
    let discountAmount = 0;
    const voucherIds = [];
    const voucherCodes = voucherCode ? voucherCode.split(",").map((c) => c.trim()) : [];

    for (const code of voucherCodes) {
      if (code) {
        const validation = await voucherService.validateVoucher(
          userId,
          code,
          subtotal,
          orderItems,
          shippingFee,
        );
        discountAmount += validation.discountAmount;
        if (validation.voucherId) {
          voucherIds.push({
            id: validation.voucherId,
            code,
            disc: validation.discountAmount,
          });
        }

        await voucherService.applyVoucherNoUsage(userId, code);
        appliedVouchers.push({ code, voucherId: validation.voucherId });
      }
    }

    const finalTotalPrice = Math.max(0, subtotal + shippingFee - discountAmount);

    if (orderItems.length > 0) {
      await productFacade.deductStock(orderItems);
      stockDeducted = true;
    }

    order = await orderRepository.create({
      user_id: userId || null,
      is_guest: !userId,
      guest_email: orderData.email || orderData.guest_email || null,
      guest_access_token_hash: guestAccessTokenHash,
      total_price: finalTotalPrice,
      original_price: subtotal,
      discount_amount: discountAmount,
      shipping_fee: shippingFee,
      reservation_id: reservationId,
      idempotency_key: guest.idempotencyKey || null,
      idempotency_request_hash: guest.requestHash || null,
      voucher_code: voucherCode ? voucherCode.toUpperCase() : null,
      status: "pending",
      payment_method: paymentMethod.toLowerCase(),
      shipping_address: dbShippingAddress,
      stock_deducted: true,
    });

    // Ghi nhận lượt mua chiến dịch để kiểm soát per_user_limit
    for (const orderItem of orderItems) {
      if (orderItem.campaign_id && userId) {
        await CampaignPurchase.create({
          campaign_id: orderItem.campaign_id,
          product_id: orderItem.product_id,
          user_id: userId,
          order_id: order._id,
          quantity: orderItem.quantity,
        });
      }
    }

    for (const vUsage of voucherIds) {
      await voucherService.createVoucherUsage(
        userId,
        vUsage.id,
        order._id,
        vUsage.disc,
      );
    }

    if (orderItems.length > 0) {
      const orderItemsToInsert = orderItems.map((item) => ({
        ...item,
        order_id: order._id,
      }));
      await orderRepository.insertManyItems(orderItemsToInsert);

      if (userId) {
        const userCart = await Cart.findOne({ user_id: userId });
        if (userCart) {
          await CartItem.deleteMany({
            cart_id: userCart._id,
            $or: orderItems.map((item) => ({ product_id: item.product_id, variant_id: item.variant_id || null })),
          });

          const remainingItems = await CartItem.find({ cart_id: userCart._id });
          const totalItemsCount = remainingItems.reduce(
            (sum, item) => sum + (item.quantity || 0),
            0,
          );
          const totalPrice = remainingItems.reduce(
            (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
            0,
          );
          await Cart.findByIdAndUpdate(userCart._id, {
            total_items: totalItemsCount,
            total_price: totalPrice,
          });
        }
      }
    }

    if (reservationId) await inventoryReservationService.commitReservation(reservationId, order._id);
  } catch (error) {
    if (order?._id) {
      await CampaignPurchase.deleteMany({ order_id: order._id }).catch(() => {});
      await orderRepository.findByIdAndDelete(order._id).catch(() => {});
    }
    if (stockDeducted && orderItems.length > 0) {
      await productFacade.restoreStock(orderItems).catch((err) => {
        console.error("Fallback stock compensation failed:", err.message);
      });
    }
    for (const v of appliedVouchers.reverse()) {
      await voucherService.rollbackVoucherUsage(userId, v.code, order?._id || null).catch((err) => {
        console.error("Fallback voucher compensation failed:", err.message);
      });
    }
    for (const cp of appliedCampaigns.reverse()) {
      await CampaignProduct.updateOne({ _id: cp.cpId }, { $inc: { sold: -cp.qty } }).catch(() => {});
    }
    if (error.code === 11000) {
      if (error.keyPattern?.reservation_id) {
        throw new AppError("Phiên giữ hàng đã được sử dụng", 409);
      }
      if (error.keyPattern?.idempotency_key && guest.idempotencyKey) {
        const existingByKey = await Order.findOne({
          user_id: userId || null,
          idempotency_key: guest.idempotencyKey,
        }).select("+idempotency_request_hash");
        if (existingByKey) {
          if (existingByKey.idempotency_request_hash && existingByKey.idempotency_request_hash !== guest.requestHash) {
            throw Object.assign(new AppError("Khóa idempotency đã được sử dụng cho yêu cầu khác", 409), { code: "IDEMPOTENCY_CONFLICT" });
          }
          return existingByKey;
        }
      }
    }
    throw error;
  }

  import("../../../sockets/events.js")
    .then(({ emitOrderNotification }) => {
      emitOrderNotification(order);
    })
    .catch((err) =>
      console.error("Failed to emit order socket notification:", err.message),
    );

  // Ghi nhận sự kiện order_placed an toàn phía máy chủ (Server-only guard có quy kết A/B Testing)
  if (Array.isArray(orderItems) && orderItems.length > 0) {
    import("../../tracking/tracking.service.js")
      .then(({ default: trackingService }) => {
        trackingService.trackOrderPlaced({
          ...(order.toObject ? order.toObject() : order),
          items: orderItems,
        });
      })
      .catch((err) => console.warn("[Tracking] Lỗi ghi nhận order_placed:", err.message));
  }

  if (guestAccessToken) {
    Object.defineProperty(order, "guestAccessToken", {
      value: guestAccessToken,
      enumerable: false,
    });
  }
  return order;
};

export const paymentOrder = async (userId, orderId, payment_method, { guestAuthorized = false } = {}) => {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new AppError("Đơn hàng không tồn tại", 404);
  }
  const isOwner = userId && order.user_id && String(order.user_id) === String(userId);
  if (!isOwner && !guestAuthorized) {
    throw new AppError("Bạn không có quyền thanh toán đơn hàng này", 403);
  }

  if (order.payment_status === "paid") {
    throw new AppError(
      "Đơn hàng đã được thanh toán hoặc đang trong quá trình xử lý. Vui lòng không thanh toán lại.",
      400,
    );
  }

  const oldStatus = order.status;
  const oldPaymentStatus = order.payment_status;
  const emitChangedOrder = () => {
    import("../../../sockets/events.js")
      .then(({ emitOrderStatusChanged, emitPaymentUpdated }) => {
        if (order.status !== oldStatus) emitOrderStatusChanged(order);
        if (order.payment_status !== oldPaymentStatus) emitPaymentUpdated(order);
      })
      .catch((err) => console.error("Failed to emit order update:", err.message));
  };

  if (payment_method === "cod") {
    order.payment_method = "cod";
    order.payment_status = "pending";
    order.status = "confirmed";
    await order.save();
    emitChangedOrder();
    return {
      success: true,
      message:
        "Đơn hàng đã được đặt thành công. Vui lòng chuẩn bị tiền mặt khi nhận hàng.",
      order,
    };
  }

  if (payment_method === "momo") {
    order.payment_method = "momo";
    order.payment_status = "pending";
    await order.save();
    emitChangedOrder();

    const momoResult = await momoProvider.createMomoPayment(
      order._id,
      order.total_price,
    );
    return {
      success: true,
      message: "Chuyển đến cổng thanh toán",
      paymentUrl: momoResult.paymentUrl,
      order,
    };
  }

  if (payment_method === "vnpay") {
    order.payment_method = "vnpay";
    order.payment_status = "pending";
    await order.save();
    emitChangedOrder();

    const paymentUrl = `${process.env.CLIENT_URL}/payment-success?orderId=${order._id}&provider=vnpay`;
    return {
      success: true,
      message: "Chuyển đến cổng thanh toán",
      paymentUrl,
      order,
    };
  }

  throw new AppError("Phương thức thanh toán không hợp lệ", 400);
};
