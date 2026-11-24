import crypto from "node:crypto";
import mongoose from "mongoose";
import { Product, ProductVariant } from "./product.model.js";
import { toNoAccent } from "../../common/utils/removeAccents.js";
import { AppError } from "../../common/exceptions/AppError.js";
import { triggerProductVectorSync } from "../ai/queues/vectorSync.queue.js";

const MAX_SLUG_LENGTH = 80;
const MAX_CREATE_ATTEMPTS = 6;
const MAX_STOCK = 1_000_000;

export const normalizeVariantColorKey = (value = "") => String(value)
  .replace(/\([^)]*\)/g, " ")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[đĐ]/g, "d")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "")
  .trim();

const productSkuPrefix = (product) => slugifyProductName(product.slug || product.name)
  .split("-")
  .filter(Boolean)
  .slice(0, 6)
  .map((word) => word.charAt(0))
  .join("")
  .toUpperCase() || "SP";

const colorSkuCode = (color) => {
  const words = String(color || "")
    .replace(/\([^)]*\)/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toUpperCase()
    .match(/[A-Z0-9]+/g) || [];
  if (words.length <= 1) return (words[0] || "MAU").slice(0, 6);
  return `${words[0][0]}${words.slice(1).join("")}`.slice(0, 6);
};

export const buildVariantSku = (product, color, size) => `${productSkuPrefix(product)}-${colorSkuCode(color)}-${String(size || "FS").trim().toUpperCase()}`;

const nextAvailableVariantSku = async (baseSku) => {
  let suffix = 1;
  for (;;) {
    const candidate = suffix === 1 ? baseSku : `${baseSku}-${suffix}`;
    if (!(await ProductVariant.exists({ sku: candidate }))) return candidate;
    suffix += 1;
  }
};

export const slugifyProductName = (value = "") => {
  const normalized = String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");

  return normalized || `san-pham-${crypto.randomBytes(4).toString("hex")}`;
};

const withSuffix = (base, suffix) => {
  if (!suffix) return base;
  const postfix = `-${suffix}`;
  return `${base.slice(0, MAX_SLUG_LENGTH - postfix.length).replace(/-+$/g, "")}${postfix}`;
};

const isDuplicateSlugError = (error) => error?.code === 11000 && (error?.keyPattern?.slug || error?.keyValue?.slug);

const nextAvailableSlug = async (name, startAt = 1) => {
  const base = slugifyProductName(name);
  let suffix = startAt;
  for (;;) {
    const candidate = withSuffix(base, suffix === 1 ? "" : suffix);
    // The unique DB index remains the authority. This check simply avoids normal collisions.
    if (!(await Product.exists({ slug: candidate }))) return { base, suffix, candidate };
    suffix += 1;
  }
};

const normalizePayload = (payload) => {
  const { variants = [], ...product } = payload;
  const finalStock = Array.isArray(variants)
    ? variants.filter((variant) => variant.is_active !== false).reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
    : Number(product.stock || 0);
  if (!Number.isInteger(finalStock) || finalStock < 0 || finalStock > MAX_STOCK) {
    throw new AppError("Tồn kho biến thể không hợp lệ", 400);
  }
  return { product, variants, finalStock };
};

const saveVariants = async (product, variants, session) => {
  const seen = new Set();
  const documents = [];
  for (const [position, variant] of variants.entries()) {
      const color = String(variant?.color || "").trim();
      const size = String(variant?.size || "").trim().toUpperCase();
      const colorKey = normalizeVariantColorKey(color);
      const stock = Number(variant?.stock);
      if (!color || !colorKey || !size || !Number.isInteger(stock) || stock < 0 || stock > MAX_STOCK) {
        throw new AppError("Mỗi biến thể cần màu, size và tồn kho nguyên không âm", 400);
      }
      const combination = `${colorKey}:${size}`;
      if (seen.has(combination)) throw new AppError(`Biến thể ${color} / ${size} bị trùng`, 409);
      seen.add(combination);
      if (variant.price !== undefined && variant.price !== null && Number(variant.price) > Number(product.old_price)) {
        throw new AppError("Giá biến thể không được lớn hơn giá niêm yết", 400);
      }
      const baseSku = variant.sku || buildVariantSku(product, color, size);
      documents.push({
        product_id: product._id,
        color,
        color_code: variant.color_code || "#1E1E24",
        color_key: colorKey,
        size,
        sku: await nextAvailableVariantSku(baseSku),
        stock,
        price: variant.price ?? null,
        image_url: variant.image_url || product.displayProduct?.[0],
        position: Number.isInteger(variant.position) ? variant.position : position,
        is_active: variant.is_active !== false,
      });
    }
  if (documents.length) await ProductVariant.insertMany(documents, { ordered: false, session });
};

export const createAdminFormProduct = async (payload) => {
  const { product, variants, finalStock } = normalizePayload(payload);
  let suffix = 1;

  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
    const candidate = await nextAvailableSlug(product.name, suffix);
    try {
      const created = await Product.create({
          ...product,
          slug: candidate.candidate,
          name_no_accents: toNoAccent(product.name),
          stock: finalStock,
      });
      try {
        await saveVariants(created, variants);
      } catch (error) {
        await Product.deleteOne({ _id: created._id });
        throw error;
      }
      triggerProductVectorSync(created._id).catch(() => {});
      return created;
    } catch (error) {
      if (!isDuplicateSlugError(error) || attempt === MAX_CREATE_ATTEMPTS - 1) throw error;
      suffix = candidate.suffix + 1;
    }
  }
  throw new AppError("Không thể tạo slug duy nhất cho sản phẩm", 409);
};

export const updateAdminFormProduct = async (id, payload) => {
  const { product, variants, finalStock } = normalizePayload(payload);
  const updated = await Product.findById(id);
  if (!updated) throw new AppError("Sản phẩm không tồn tại", 404);
  Object.assign(updated, { ...product, name_no_accents: toNoAccent(product.name), stock: finalStock });
  // Deliberately do not assign slug: product links are stable after creation.
  await updated.save();
  if (Array.isArray(variants)) {
    await ProductVariant.deleteMany({ product_id: updated._id });
    await saveVariants(updated, variants);
  }
  triggerProductVectorSync(updated._id).catch(() => {});
  return updated;
};
