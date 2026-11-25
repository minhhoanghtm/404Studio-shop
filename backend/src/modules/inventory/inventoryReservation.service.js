import crypto from "crypto";
import mongoose from "mongoose";
import { getRedisConnection } from "../../configs/redis.js";
import InventoryReservation from "./inventoryReservation.model.js";
import { Product, ProductVariant } from "../products/product.model.js";
import { Order } from "../orders/order.model.js";
import UserEvent from "../tracking/userEvent.model.js";
import { EVENT_TYPES } from "../tracking/tracking.constants.js";
import logger from "../../common/logger.js";
import pricingService from "../campaigns/pricing.service.js";

export const HOLD_DURATION_SECONDS = 300; // Exactly 5 minutes (300s)

export const KEY_PREFIX_RES = "webfashion:reservation:";
export const KEY_PREFIX_STOCK_RESERVED = "webfashion:stock:reserved:";
export const KEY_PREFIX_STOCK_RESERVATIONS = "webfashion:stock:reservations:";
export const KEY_EXPIRATIONS_ZSET = "webfashion:reservation:expirations";
export const KEY_IDEMPOTENCY_PREFIX = "webfashion:checkout:idempotency:";

const LUA_RESERVE = `
local resKey = KEYS[1]
local expirationsKey = KEYS[2]
local resId = ARGV[1]
local resJson = ARGV[2]
local expiresAtMs = tonumber(ARGV[3])
local ttlSec = tonumber(ARGV[4])
local numItems = tonumber(ARGV[5])
local baseIdx = 6

-- Check availability for all items first (All-or-nothing check)
for i = 1, numItems do
  local sku = ARGV[baseIdx + (i - 1) * 3]
  local requested = tonumber(ARGV[baseIdx + (i - 1) * 3 + 1])
  local dbStock = tonumber(ARGV[baseIdx + (i - 1) * 3 + 2])
  local reservedKey = "webfashion:stock:reserved:" .. sku
  local currentReserved = tonumber(redis.call("GET", reservedKey) or "0")
  local available = dbStock - currentReserved
  if available < requested then
    return cjson.encode({
      success = false,
      code = "INSUFFICIENT_STOCK",
      sku = sku,
      available = math.max(0, available),
      requested = requested
    })
  end
end

-- All items passed, atomically increment reserved counts
for i = 1, numItems do
  local sku = ARGV[baseIdx + (i - 1) * 3]
  local requested = tonumber(ARGV[baseIdx + (i - 1) * 3 + 1])
  local reservedKey = "webfashion:stock:reserved:" .. sku
  local reservationsKey = "webfashion:stock:reservations:" .. sku
  redis.call("INCRBY", reservedKey, requested)
  redis.call("SADD", reservationsKey, resId)
end

-- Store reservation data with exact TTL
redis.call("SET", resKey, resJson, "EX", ttlSec)
redis.call("ZADD", expirationsKey, expiresAtMs, resId)

return cjson.encode({ success = true, reservationId = resId })
`;

const LUA_RELEASE = `
local resKey = KEYS[1]
local expirationsKey = KEYS[2]
local resId = ARGV[1]
local reason = ARGV[2]
local updatedJson = ARGV[3]

local raw = redis.call("GET", resKey)
if not raw then
  redis.call("ZREM", expirationsKey, resId)
  return cjson.encode({ success = true, code = "ALREADY_CLEANED" })
end

local res = cjson.decode(raw)
if res.status ~= "ACTIVE" then
  redis.call("ZREM", expirationsKey, resId)
  return cjson.encode({ success = true, code = "ALREADY_RELEASED", status = res.status })
end

-- Decrement reserved count for each SKU
if res.items then
  for _, item in ipairs(res.items) do
    local sku = item.sku
    local qty = tonumber(item.quantity or 1)
    local reservedKey = "webfashion:stock:reserved:" .. sku
    local reservationsKey = "webfashion:stock:reservations:" .. sku
    local current = tonumber(redis.call("GET", reservedKey) or "0")
    local newReserved = math.max(0, current - qty)
    if newReserved > 0 then
      redis.call("SET", reservedKey, tostring(newReserved))
    else
      redis.call("DEL", reservedKey)
    end
    redis.call("SREM", reservationsKey, resId)
  end
end

redis.call("ZREM", expirationsKey, resId)

if updatedJson and updatedJson ~= "" then
  local patch = cjson.decode(updatedJson)
  for k, v in pairs(patch) do
    res[k] = v
  end
  redis.call("SET", resKey, cjson.encode(res), "EX", 3600)
else
  redis.call("DEL", resKey)
end

return cjson.encode({ success = true, status = reason })
`;

const LUA_COMMIT = `
local resKey = KEYS[1]
local expirationsKey = KEYS[2]
local resId = ARGV[1]
local updatedJson = ARGV[2]

local raw = redis.call("GET", resKey)
if not raw then
  redis.call("ZREM", expirationsKey, resId)
  return cjson.encode({ success = true, code = "ALREADY_CLEANED" })
end

local res = cjson.decode(raw)
if res.items then
  for _, item in ipairs(res.items) do
    local sku = item.sku
    local qty = tonumber(item.quantity or 1)
    local reservedKey = "webfashion:stock:reserved:" .. sku
    local reservationsKey = "webfashion:stock:reservations:" .. sku
    local current = tonumber(redis.call("GET", reservedKey) or "0")
    local newReserved = math.max(0, current - qty)
    if newReserved > 0 then
      redis.call("SET", reservedKey, tostring(newReserved))
    else
      redis.call("DEL", reservedKey)
    end
    redis.call("SREM", reservationsKey, resId)
  end
end

redis.call("ZREM", expirationsKey, resId)

if updatedJson and updatedJson ~= "" then
  local patch = cjson.decode(updatedJson)
  for k, v in pairs(patch) do
    res[k] = v
  end
  redis.call("SET", resKey, cjson.encode(res), "EX", 86400)
end

return cjson.encode({ success = true, status = "COMPLETED" })
`;

class InventoryReservationService {
  constructor() {
    this._reconcileInterval = null;
    this._startBackgroundReconciliation();
  }

  getRedis() {
    return getRedisConnection();
  }

  /**
   * Helper to derive canonical SKU string for reservation.
   */
  getSku(productId, variantId) {
    if (variantId && String(variantId) !== "null" && String(variantId) !== "undefined") {
      return `variant_${variantId}`;
    }
    return `product_${productId}`;
  }

  /**
   * Get active reserved quantity in Redis for a given SKU.
   */
  async getReservedStock(sku) {
    try {
      const redis = this.getRedis();
      const val = await redis.get(`${KEY_PREFIX_STOCK_RESERVED}${sku}`);
      return Math.max(0, parseInt(val || "0", 10));
    } catch (e) {
      logger.warn("Redis getReservedStock error, falling back to 0:", e.message);
      return 0;
    }
  }

  /**
   * Query real-time available stock factoring in Redis active reservations.
   */
  async getAvailableStock(productId, variantId = null) {
    let dbStock = 0;
    if (variantId && mongoose.isValidObjectId(variantId)) {
      const variant = await ProductVariant.findById(variantId).select("stock").lean();
      dbStock = Number(variant?.stock || 0);
    } else if (productId && mongoose.isValidObjectId(productId)) {
      const product = await Product.findById(productId).select("stock").lean();
      dbStock = Number(product?.stock || 0);
    }
    const sku = this.getSku(productId, variantId);
    const reserved = await this.getReservedStock(sku);
    return Math.max(0, dbStock - reserved);
  }

  /**
   * Create an atomic 300s inventory reservation in Redis and durable ledger in MongoDB.
   */
  async createReservation({
    userId,
    items = [],
    checkoutSessionId = null,
    idempotencyKey = null,
    durationSeconds = HOLD_DURATION_SECONDS,
  }) {
    if (!userId) {
      throw new Error("userId là bắt buộc để giữ hàng");
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      throw Object.assign(new Error("Danh sách sản phẩm giữ hàng không hợp lệ"), { statusCode: 400, status: "fail", isOperational: true });
    }

    const redis = this.getRedis();

    // Check idempotency if key supplied
    if (idempotencyKey) {
      const existing = await InventoryReservation.findOne({
        userId,
        idempotencyKey,
        status: "ACTIVE",
        expiresAt: { $gt: new Date() },
      }).lean();
      if (existing) {
        const comparable = (entries) => entries.map((item) => `${item.productId || item.product_id}:${item.variantId || item.variant_id || item.product_variant_id || ""}:${Number(item.quantity ?? 1)}`).sort().join("|");
        if (comparable(items) !== comparable(existing.items || [])) throw Object.assign(new Error("Khóa giữ hàng đã được sử dụng cho sản phẩm khác"), { statusCode: 409, code: "IDEMPOTENCY_CONFLICT", status: "fail", isOperational: true });
        return this.formatReservation(existing);
      }
    }

    // 1. Verify DB stock for each item & assemble Lua arguments
    const preparedItems = [];
    const luaArgs = [];
    const seenSkus = new Set();

    for (const it of items) {
      const productId = String(it.productId || it.product_id);
      const variantId = it.variantId || it.variant_id ? String(it.variantId || it.variant_id) : null;
      const quantity = Number(it.quantity ?? 1);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) throw Object.assign(new Error("Số lượng giữ hàng không hợp lệ"), { statusCode: 400, status: "fail", isOperational: true });

      let dbStock = 0;
      let name = it.name || "Sản phẩm";
      let color = it.color || "";
      let size = it.size || "";
      let unitPrice = 0;
      let image = it.image || "";

      let variantDoc = null;
      if (variantId && mongoose.isValidObjectId(variantId)) {
        variantDoc = await ProductVariant.findOne({ _id: variantId, product_id: productId, is_active: { $ne: false } }).lean();
      }

      const productDoc = await Product.findById(productId).lean();
      if (!productDoc || productDoc.is_active === false) {
        throw new Error(`Sản phẩm không tồn tại (ID: ${productId})`);
      }

      name = productDoc.name;
      if (productDoc.displayProduct?.[0]) image = productDoc.displayProduct[0];
      if (productDoc.image) image = productDoc.image;

      // Check embedded variants in product.variants if not in standalone collection
      if (!variantDoc && Array.isArray(productDoc.variants) && productDoc.variants.length > 0) {
        if (variantId) {
          variantDoc = productDoc.variants.find(
            (v) => String(v._id) === String(variantId) || v.sku === variantId
          );
        }
        if (!variantDoc && (color || size)) {
          variantDoc = productDoc.variants.find(
            (v) => (!color || v.color?.toLowerCase() === color.toLowerCase()) &&
                   (!size || v.size?.toUpperCase() === size.toUpperCase())
          );
        }
        if (!variantDoc && !variantId) {
          variantDoc = productDoc.variants[0];
        }
      }
      if (variantId && !variantDoc) throw Object.assign(new Error("Phiên bản sản phẩm không hợp lệ"), { statusCode: 400, status: "fail", isOperational: true });

      if (variantDoc) {
        dbStock = Number(variantDoc.stock || 0);
        color = variantDoc.color || color;
        size = variantDoc.size || size;
        if (variantDoc.image_url || variantDoc.image) {
          image = variantDoc.image_url || variantDoc.image;
        }
      } else {
        dbStock = Number(productDoc.stock || 0);
      }

      // Single source of truth for pricing: pricingService
      try {
        const resolved = await pricingService.resolvePrice(productDoc, variantDoc, new Date(), userId);
        unitPrice = Number(resolved.finalPrice || 0);
      } catch (priceErr) {
        logger.warn(`Failed to resolve price via pricingService for ${productId}: ${priceErr.message}`);
        unitPrice = Number(variantDoc?.price ?? productDoc.new_price ?? productDoc.price ?? 0);
      }

      let finalVarId = null;
      if (variantDoc?._id && mongoose.isValidObjectId(variantDoc._id)) {
        finalVarId = String(variantDoc._id);
      } else if (variantId && mongoose.isValidObjectId(variantId)) {
        finalVarId = String(variantId);
      }
      const sku = this.getSku(productId, finalVarId);
      if (seenSkus.has(sku)) throw Object.assign(new Error("Sản phẩm giữ hàng bị trùng lặp"), { statusCode: 400, status: "fail", isOperational: true });
      seenSkus.add(sku);

      preparedItems.push({
        productId,
        product_id: productId,
        variantId: finalVarId,
        product_variant_id: finalVarId,
        sku,
        name,
        color,
        size,
        quantity,
        unitPrice,
        unit_price: unitPrice,
        price: unitPrice,
        new_price: unitPrice,
        image,
      });

      // Triplet for Lua: sku, requestedQty, dbStock
      luaArgs.push(sku, String(quantity), String(dbStock));
    }

    const reservationId = `res_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const now = Date.now();
    const expiresAtMs = now + durationSeconds * 1000;
    const expiresAt = new Date(expiresAtMs);
    const totalAmount = preparedItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);

    const reservationPayload = {
      reservationId,
      userId: String(userId),
      checkoutSessionId: checkoutSessionId || `cs_${reservationId}`,
      items: preparedItems,
      totalAmount,
      status: "ACTIVE",
      createdAt: now,
      expiresAt: expiresAtMs,
      idempotencyKey,
    };

    // 2. Execute Atomic Lua Reservation in Redis
    const resKey = `${KEY_PREFIX_RES}${reservationId}`;
    const resultRaw = await redis.eval(
      LUA_RESERVE,
      2,
      resKey,
      KEY_EXPIRATIONS_ZSET,
      reservationId,
      JSON.stringify(reservationPayload),
      String(expiresAtMs),
      String(durationSeconds),
      String(preparedItems.length),
      ...luaArgs
    );

    const resResult = typeof resultRaw === "string" ? JSON.parse(resultRaw) : resultRaw;
    if (!resResult.success) {
      UserEvent.create({
        event_id: new mongoose.Types.ObjectId().toString(),
        event_type: EVENT_TYPES.CHECKOUT_STOCK_INSUFFICIENT,
        user_id: mongoose.isValidObjectId(userId) ? userId : null,
        meta: {
          sku: resResult.sku,
          available: resResult.available,
          requested: resResult.requested,
        },
      }).catch(() => {});

      throw Object.assign(
        new Error(
          `Sản phẩm hiện không đủ số lượng khả dụng trong kho (Còn lại: ${resResult.available}, yêu cầu: ${resResult.requested})`
        ),
        {
          statusCode: 409,
          code: resResult.code,
          sku: resResult.sku,
          available: resResult.available,
        }
      );
    }

    // 3. Persist in MongoDB durable ledger for crash recovery
    try {
      await InventoryReservation.create({
        reservationId,
        userId,
        checkoutSessionId: reservationPayload.checkoutSessionId,
        items: preparedItems,
        totalAmount,
        status: "ACTIVE",
        idempotencyKey,
        expiresAt,
      });

      UserEvent.create({
        event_id: new mongoose.Types.ObjectId().toString(),
        event_type: EVENT_TYPES.CHECKOUT_RESERVATION_CREATED,
        user_id: mongoose.isValidObjectId(userId) ? userId : null,
        meta: {
          reservation_id: reservationId,
          checkout_session_id: reservationPayload.checkoutSessionId,
          total_amount: totalAmount,
          item_count: preparedItems.length,
          expires_at: expiresAt,
        },
      }).catch(() => {});
    } catch (dbErr) {
      logger.error("Failed to persist durable reservation ledger, releasing Redis hold:", dbErr);
      await this.releaseReservation(reservationId, "FAILED_PERSIST");
      throw new Error("Lỗi hệ thống khi lưu trữ phiên giữ hàng. Vui lòng thử lại.");
    }

    return this.formatReservation(reservationPayload);
  }

  /**
   * Fetch reservation by ID (checks Redis first, falls back to DB, auto-expires if past TTL).
   */
  async getReservation(reservationId) {
    if (!reservationId) return null;
    const redis = this.getRedis();
    const resKey = `${KEY_PREFIX_RES}${reservationId}`;

    let data = null;
    let fromRedis = false;
    try {
      const cached = await redis.get(resKey);
      if (cached) {
        data = JSON.parse(cached);
        fromRedis = true;
      }
    } catch (e) {
      logger.warn("Redis getReservation cache miss/error:", e.message);
    }

    if (!data) {
      const doc = await InventoryReservation.findOne({ reservationId }).lean();
      if (!doc) return null;
      data = doc;
    } else if (data.status === "ACTIVE") {
      // Reconcile if MongoDB ledger or Order already finalized this reservation (e.g. crash before Redis cleanup)
      const [dbDoc, existingOrder] = await Promise.all([
        InventoryReservation.findOne({ reservationId }).select("status orderId completedAt releasedAt").lean(),
        Order.findOne({ reservation_id: reservationId }).select("_id").lean(),
      ]);
      if (existingOrder || (dbDoc && dbDoc.status !== "ACTIVE")) {
        const resolvedStatus = existingOrder ? "COMPLETED" : dbDoc.status;
        if (existingOrder && dbDoc?.status === "ACTIVE") {
          await InventoryReservation.updateOne(
            { reservationId, status: "ACTIVE" },
            { $set: { status: "COMPLETED", orderId: existingOrder._id, completedAt: new Date() } }
          );
        }
        if (resolvedStatus === "COMPLETED") {
          await this.finalizeCommittedReservationRedis(reservationId, existingOrder?._id || dbDoc?.orderId || null);
        } else {
          await this.releaseReservation(reservationId, resolvedStatus);
        }
        data.status = resolvedStatus;
        return this.formatReservation(data);
      }
    }

    const now = Date.now();
    const expiresAtMs = new Date(data.expiresAt).getTime();

    // Lazy expiration check (do not expire if an Order already exists)
    if (data.status === "ACTIVE" && now >= expiresAtMs) {
      const existingOrder = await Order.findOne({ reservation_id: reservationId }).select("_id").lean();
      if (existingOrder) {
        await this.commitReservation(reservationId, existingOrder._id);
        data.status = "COMPLETED";
      } else {
        await this.releaseReservation(reservationId, "EXPIRED");
        data.status = "EXPIRED";
      }
    } else if (!fromRedis && data.status === "ACTIVE") {
      const existingOrder = await Order.findOne({ reservation_id: reservationId }).select("_id").lean();
      if (existingOrder) {
        await this.commitReservation(reservationId, existingOrder._id);
        data.status = "COMPLETED";
      }
    }

    return this.formatReservation(data);
  }

  /**
   * Release reservation immediately (User cancel, or 300s expired).
   */
  async releaseReservation(reservationId, reason = "RELEASED") {
    if (!reservationId) return false;
    const redis = this.getRedis();
    const resKey = `${KEY_PREFIX_RES}${reservationId}`;

    // Update in Redis via atomic Lua
    const updatedPayload = { status: reason, releasedAt: Date.now() };
    try {
      await redis.eval(
        LUA_RELEASE,
        2,
        resKey,
        KEY_EXPIRATIONS_ZSET,
        reservationId,
        reason,
        JSON.stringify(updatedPayload)
      );
    } catch (e) {
      logger.error("Error executing LUA_RELEASE in Redis:", e.message);
    }

    // Update MongoDB ledger
    try {
      await InventoryReservation.updateOne(
        { reservationId, status: "ACTIVE" },
        {
          $set: {
            status: reason === "EXPIRED" ? "EXPIRED" : "RELEASED",
            releasedAt: new Date(),
          },
        }
      );

      const isExpired = reason === "EXPIRED";
      UserEvent.create({
        event_id: new mongoose.Types.ObjectId().toString(),
        event_type: isExpired
          ? EVENT_TYPES.CHECKOUT_RESERVATION_EXPIRED
          : EVENT_TYPES.CHECKOUT_RESERVATION_CANCELLED,
        meta: { reservation_id: reservationId, reason },
      }).catch(() => {});
    } catch (dbErr) {
      logger.error("Error updating MongoDB reservation status:", dbErr.message);
    }

    return true;
  }

  /**
   * Release Redis reservation hold & expirations entry after MongoDB ledger is committed.
   */
  async finalizeCommittedReservationRedis(reservationId, orderId = null) {
    if (!reservationId) return false;
    const redis = this.getRedis();
    const resKey = `${KEY_PREFIX_RES}${reservationId}`;
    const updatedPayload = { status: "COMPLETED", orderId, completedAt: Date.now() };
    let redisOk = false;
    try {
      await redis.eval(
        LUA_COMMIT,
        2,
        resKey,
        KEY_EXPIRATIONS_ZSET,
        reservationId,
        JSON.stringify(updatedPayload)
      );
      redisOk = true;
    } catch (e) {
      logger.warn("Redis LUA_COMMIT failed after reservation commit (reconcilable on startup):", e.message);
    }

    UserEvent.create({
      event_id: new mongoose.Types.ObjectId().toString(),
      event_type: EVENT_TYPES.CHECKOUT_RESERVATION_CONFIRMED,
      meta: { reservation_id: reservationId, order_id: orderId },
    }).catch(() => {});

    return redisOk;
  }

  /**
   * Commit reservation upon successful order placement (durable DB + Redis hold release).
   */
  async commitReservation(reservationId, orderId = null, options = {}) {
    if (!reservationId) return false;

    const updateOptions = options?.session ? { session: options.session } : {};
    await InventoryReservation.updateOne(
      { reservationId },
      {
        $set: {
          status: "COMPLETED",
          orderId: orderId || null,
          completedAt: new Date(),
        },
      },
      updateOptions
    );

    if (!options?.session) {
      await this.finalizeCommittedReservationRedis(reservationId, orderId);
    }

    return true;
  }

  /**
   * Process all expired reservations using ZRANGEBYSCORE in Redis.
   */
  async processExpiredReservations() {
    try {
      const redis = this.getRedis();
      const nowMs = Date.now();
      const expiredIds = await redis.zrangebyscore(KEY_EXPIRATIONS_ZSET, 0, nowMs);

      if (Array.isArray(expiredIds) && expiredIds.length > 0) {
        for (const resId of expiredIds) {
          const existingOrder = await Order.findOne({ reservation_id: resId }).select("_id").lean();
          if (existingOrder) {
            await this.commitReservation(resId, existingOrder._id);
          } else {
            await this.releaseReservation(resId, "EXPIRED");
          }
        }
        logger.info(`Released ${expiredIds.length} expired inventory reservations`);
      }
    } catch (err) {
      // In case Redis is temporarily disconnected
    }
  }

  /**
   * Reconcile Redis reservations from durable MongoDB ledger (used on crash/restart recovery).
   */
  async reconcileReservationsFromDB() {
    try {
      const redis = this.getRedis();
      const now = new Date();
      const nowMs = now.getTime();

      // Find all ACTIVE reservations in MongoDB
      const activeReservations = await InventoryReservation.find({
        status: "ACTIVE",
      }).lean();

      const activeIds = activeReservations.map((r) => r.reservationId).filter(Boolean);
      const existingOrders = activeIds.length
        ? await Order.find({ reservation_id: { $in: activeIds } }).select("_id reservation_id").lean()
        : [];
      const orderByResId = new Map(existingOrders.map((o) => [o.reservation_id, o._id]));

      let recovered = 0;
      let expiredCount = 0;
      let completedFromOrders = 0;
      const stillActive = [];

      for (const res of activeReservations) {
        const matchedOrderId = orderByResId.get(res.reservationId);
        if (matchedOrderId) {
          await InventoryReservation.updateOne(
            { _id: res._id, status: "ACTIVE" },
            { $set: { status: "COMPLETED", orderId: matchedOrderId, completedAt: now } }
          );
          await this.finalizeCommittedReservationRedis(res.reservationId, matchedOrderId);
          completedFromOrders++;
          continue;
        }

        const expiresAtMs = new Date(res.expiresAt).getTime();
        if (expiresAtMs <= nowMs) {
          await InventoryReservation.updateOne(
            { _id: res._id, status: "ACTIVE" },
            { $set: { status: "EXPIRED", releasedAt: now } }
          );
          await this.releaseReservation(res.reservationId, "EXPIRED");
          expiredCount++;
        } else {
          stillActive.push(res);
        }
      }

      // Remove any non-active reservations lingering in Redis expirations ZSET
      const zsetIds = await redis.zrange(KEY_EXPIRATIONS_ZSET, 0, -1);
      const stillActiveSet = new Set(stillActive.map((r) => r.reservationId));
      for (const zId of zsetIds) {
        if (!stillActiveSet.has(zId)) {
          await redis.zrem(KEY_EXPIRATIONS_ZSET, zId);
          await redis.del(`${KEY_PREFIX_RES}${zId}`);
        }
      }

      // Idempotently rebuild SKU reserved counters from truly active reservations
      const skuTotals = new Map();
      for (const res of stillActive) {
        for (const item of res.items || []) {
          const sku = item.sku;
          if (!sku) continue;
          const entry = skuTotals.get(sku) || { qty: 0, ids: [] };
          entry.qty += Number(item.quantity || 1);
          entry.ids.push(res.reservationId);
          skuTotals.set(sku, entry);
        }
      }

      const existingReservedKeys = await redis.keys(`${KEY_PREFIX_STOCK_RESERVED}*`);
      for (const key of existingReservedKeys) {
        const sku = key.slice(KEY_PREFIX_STOCK_RESERVED.length);
        if (!skuTotals.has(sku)) {
          await redis.del(key);
        }
      }
      const existingResSets = await redis.keys(`${KEY_PREFIX_STOCK_RESERVATIONS}*`);
      for (const key of existingResSets) {
        const sku = key.slice(KEY_PREFIX_STOCK_RESERVATIONS.length);
        if (!skuTotals.has(sku)) {
          await redis.del(key);
        }
      }

      for (const [sku, entry] of skuTotals.entries()) {
        await redis.set(`${KEY_PREFIX_STOCK_RESERVED}${sku}`, String(entry.qty));
        const setKey = `${KEY_PREFIX_STOCK_RESERVATIONS}${sku}`;
        await redis.del(setKey);
        if (entry.ids.length > 0) {
          await redis.sadd(setKey, ...entry.ids);
        }
      }

      for (const res of stillActive) {
        const expiresAtMs = new Date(res.expiresAt).getTime();
        const remainingSec = Math.max(1, Math.floor((expiresAtMs - nowMs) / 1000));
        const resKey = `${KEY_PREFIX_RES}${res.reservationId}`;
        await redis.set(resKey, JSON.stringify(res), "EX", remainingSec);
        await redis.zadd(KEY_EXPIRATIONS_ZSET, expiresAtMs, res.reservationId);
        recovered++;
      }

      logger.info(
        `Inventory Reservation Reconcile Complete: ${recovered} active recovered, ${expiredCount} expired marked, ${completedFromOrders} completed from orders`
      );
      return { recovered, expiredCount, completedFromOrders };
    } catch (e) {
      logger.error("Error during reconcileReservationsFromDB:", e.message);
      return { recovered: 0, expiredCount: 0, completedFromOrders: 0, error: e.message };
    }
  }

  formatReservation(data) {
    const rawExpiresAt = data.expiresAt;
    let expiresAtMs =
      typeof rawExpiresAt === "number"
        ? rawExpiresAt
        : new Date(rawExpiresAt || Date.now()).getTime();

    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= 0) {
      expiresAtMs = Date.now();
    }

    const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
    const items = data.items || [];
    const formattedItems = items.map((it) => {
      const priceVal = Number(it.unitPrice ?? it.unit_price ?? it.new_price ?? it.price ?? 0);
      const prodId = String(it.productId || it.product_id || "");
      const varId = it.variantId || it.product_variant_id ? String(it.variantId || it.product_variant_id) : null;
      return {
        sku: it.sku,
        productId: prodId,
        product_id: prodId,
        variantId: varId,
        product_variant_id: varId,
        quantity: Number(it.quantity || 1),
        name: it.name,
        color: it.color,
        size: it.size,
        unitPrice: priceVal,
        unit_price: priceVal,
        price: priceVal,
        new_price: priceVal,
        image: it.image,
      };
    });

    return {
      reservationId: data.reservationId,
      userId: data.userId ? String(data.userId) : null,
      checkoutSessionId: data.checkoutSessionId,
      status: remainingSeconds <= 0 && data.status === "ACTIVE" ? "EXPIRED" : data.status,
      reservedItems: formattedItems,
      items: formattedItems,
      totalAmount: data.totalAmount,
      totalAmountFormatted: `${Number(data.totalAmount || 0).toLocaleString("vi-VN")}đ`,
      expiresAt: expiresAtMs,
      expiresAtDate: new Date(expiresAtMs).toISOString(),
      serverTime: Date.now(),
      remainingSeconds,
      holdDurationSeconds: HOLD_DURATION_SECONDS,
      holdDurationFormatted: `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(
        remainingSeconds % 60
      ).padStart(2, "0")}`,
    };
  }

  _startBackgroundReconciliation() {
    if (this._reconcileInterval) return;
    this._reconcileInterval = setInterval(() => {
      this.processExpiredReservations().catch(() => {});
    }, 10000); // Check every 10 seconds
    this._reconcileInterval.unref?.();
  }
}

const inventoryReservationService = new InventoryReservationService();
export default inventoryReservationService;

