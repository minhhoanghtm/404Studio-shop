import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import net from "node:net";
import { URL } from "node:url";
import ExcelJS from "exceljs";
import sharp from "sharp";
import { Product, ProductVariant } from "./product.model.js";
import Category from "../categories/category.model.js";
import { toNoAccent } from "../../common/utils/removeAccents.js";
import { AppError } from "../../common/exceptions/AppError.js";
import {
  slugifyProductName,
  normalizeVariantColorKey,
  buildVariantSku,
} from "./productAdminForm.service.js";
import { triggerProductVectorSync } from "../ai/queues/vectorSync.queue.js";

// Constants & Limits
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB per image
const MAX_EXCEL_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_PIXELS = 25_000_000;
const MAX_EXPORT_IMAGE_DIMENSION = 300;
const MAX_IMPORT_IMAGE_DIMENSION = 1600;
const FETCH_TIMEOUT_MS = 8000;
const PREVIEW_TTL_MS = 15 * 60 * 1000; // 15 minutes

// In-memory cache for import preview sessions
const previewSessions = new Map();

// Periodic cleanup of expired preview sessions
const sessionCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, session] of previewSessions.entries()) {
    if (now - session.createdAt > PREVIEW_TTL_MS) {
      previewSessions.delete(id);
    }
  }
}, 60 * 1000);
if (sessionCleanupTimer.unref) {
  sessionCleanupTimer.unref();
}

/**
 * SSRF Protection: verifies if URL is safe to fetch from server
 */
export const isSsrfSafeUrl = (urlString) => {
  try {
    if (!urlString || typeof urlString !== "string") return false;
    const parsed = new URL(urlString);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname === "127.0.0.1" ||
      hostname === "metadata.google.internal" ||
      hostname === "169.254.169.254"
    ) {
      return false;
    }

    if (net.isIP(hostname)) {
      const parts = hostname.split(".").map(Number);
      if (parts[0] === 10) return false;
      if (parts[0] === 127) return false;
      if (parts[0] === 0) return false;
      if (parts[0] === 169 && parts[1] === 254) return false;
      if (parts[0] === 192 && parts[1] === 168) return false;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Magic Bytes Detector: verifies true image format from buffer
 */
export const detectImageFormatFromMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  // GIF: GIF87a or GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return "gif";
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }

  return null;
};

/**
 * Formula Injection Escaper: prepends ' to values starting with =, +, -, @
 */
export const sanitizeCellForExport = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === "number" || typeof val === "boolean") return val;
  const str = String(val).trim();
  if (/^[=+@-]/.test(str)) {
    return `'${str}`;
  }
  return str;
};

/**
 * Normalizes an image for Excel embedding using sharp:
 * - Resizes longest side to max 300px
 * - Converts WebP/AVIF to PNG/JPEG (since Excel cannot display WebP)
 * - Compresses with quality ~80
 */
export const normalizeImageForExcelEmbed = async (inputBuffer) => {
  const image = sharp(inputBuffer, { limitInputPixels: MAX_IMAGE_PIXELS }).rotate();
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Không thể xác định kích thước ảnh");
  }

  const hasAlpha = Boolean(metadata.hasAlpha);
  let processedBuffer;
  let extension;

  if (hasAlpha) {
    processedBuffer = await image
      .resize({
        width: MAX_EXPORT_IMAGE_DIMENSION,
        height: MAX_EXPORT_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png({ compressionLevel: 8 })
      .toBuffer();
    extension = "png";
  } else {
    processedBuffer = await image
      .resize({
        width: MAX_EXPORT_IMAGE_DIMENSION,
        height: MAX_EXPORT_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    extension = "jpeg";
  }

  return { buffer: processedBuffer, extension };
};

/**
 * Concurrency-controlled Image Fetch Pool with URL caching & local disk read
 */
class ImageFetchPool {
  constructor(concurrency = 6) {
    this.concurrency = concurrency;
    this.cache = new Map();
    this.active = 0;
    this.queue = [];
  }

  async fetch(imageUrl) {
    if (!imageUrl || typeof imageUrl !== "string") return null;
    const trimmed = imageUrl.trim();
    if (!trimmed) return null;

    if (this.cache.has(trimmed)) {
      return this.cache.get(trimmed);
    }

    const promise = new Promise((resolve, reject) => {
      this.queue.push({
        fn: () => this._fetchAndNormalize(trimmed),
        resolve,
        reject,
      });
      this._dequeue();
    });

    this.cache.set(trimmed, promise);
    return promise;
  }

  _dequeue() {
    if (this.active >= this.concurrency || this.queue.length === 0) return;
    this.active++;
    const { fn, resolve } = this.queue.shift();
    fn()
      .then(resolve)
      .catch(() => resolve(null))
      .finally(() => {
        this.active--;
        this._dequeue();
      });
  }

  async _fetchAndNormalize(url) {
    try {
      // 1. Direct local disk read for /uploads/ files (fastest, zero network)
      const uploadMatch = url.match(/\/uploads\/([^/?#]+)/);
      if (uploadMatch) {
        const filename = path.basename(uploadMatch[1]);
        const localPath = path.join(path.resolve("uploads"), filename);
        if (fs.existsSync(localPath)) {
          const buf = await fs.promises.readFile(localPath);
          return await normalizeImageForExcelEmbed(buf);
        }
      }

      // 2. External HTTP/HTTPS URL
      if (!isSsrfSafeUrl(url)) return null;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) return null;
      const arrayBuf = await res.arrayBuffer();
      const rawBuf = Buffer.from(arrayBuf);
      if (rawBuf.length > MAX_IMAGE_FILE_SIZE * 2) return null;

      return await normalizeImageForExcelEmbed(rawBuf);
    } catch {
      return null;
    }
  }
}

/**
 * Helper to ensure uploads folder exists
 */
const ensureUploadsDir = () => {
  const dir = path.resolve("uploads");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// ============================================================================
// EXPORT SERVICE
// ============================================================================
export const exportProductsToExcelBuffer = async ({
  products = [],
  categories = [],
  includeImages = true,
}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Atelier Vérité E-Commerce Engine";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("DANH_SACH_SAN_PHAM", {
    views: [{ showGridLines: true }],
  });

  const catMap = new Map();
  categories.forEach((c) => {
    if (c._id) catMap.set(String(c._id), c.name);
    if (c.slug) catMap.set(c.slug, c.name);
  });

  // Columns specification
  // Cột "Ảnh Đại Diện" (col 9) và "Ảnh Biến Thể" (col 14) để trống chữ khi nhúng ảnh
  sheet.columns = [
    { header: "Mã Sản Phẩm (SKU Nhóm)", key: "productSku", width: 25 },
    { header: "Tên Sản Phẩm", key: "name", width: 35 },
    { header: "Slug Sản Phẩm", key: "slug", width: 25 },
    { header: "Danh Mục", key: "category", width: 25 },
    { header: "Giá Niêm Yết (VNĐ)", key: "old_price", width: 20 },
    { header: "Giá Bán Thực Tế (VNĐ)", key: "new_price", width: 22 },
    { header: "Thương Hiệu", key: "brand", width: 20 },
    { header: "Mô Tả Sản Phẩm", key: "description", width: 40 },
    { header: "Ảnh Đại Diện", key: "image", width: 16 }, // Embedded image column
    { header: "Mã SKU Biến Thể", key: "variantSku", width: 25 },
    { header: "Màu Sắc", key: "color", width: 18 },
    { header: "Kích Cỡ", key: "size", width: 14 },
    { header: "Tồn Kho Biến Thể", key: "stock", width: 18 },
    { header: "Ảnh Biến Thể", key: "variantImage", width: 16 }, // Embedded image column
    { header: "Trạng Thái", key: "status", width: 16 },
    { header: "Ghi Chú", key: "note", width: 25 },
  ];

  // Header row formatting
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFD4AF37" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF121212" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 30;

  const fetchPool = new ImageFetchPool(8);
  const rowsToEmbed = [];
  let currentRowIndex = 1;

  for (const p of products) {
    const variants = Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : [null];
    const categoryName = catMap.get(String(p.category_id)) || p.category_id?.name || p.category || "Chưa phân loại";
    const primaryImgUrl =
      (Array.isArray(p.displayProduct) && p.displayProduct[0]) ||
      (Array.isArray(p.images) && p.images[0]) ||
      p.image ||
      "";

    const baseSku = p.slug ? `ATV-${p.slug.toUpperCase()}` : `SP-${p._id}`;

    for (const v of variants) {
      currentRowIndex++;
      const variantImgUrl = v?.image_url || primaryImgUrl;

      const row = sheet.addRow({
        productSku: sanitizeCellForExport(baseSku),
        name: sanitizeCellForExport(p.name || ""),
        slug: sanitizeCellForExport(p.slug || ""),
        category: sanitizeCellForExport(categoryName),
        old_price: Number(p.old_price) || 0,
        new_price: Number(p.new_price) || 0,
        brand: sanitizeCellForExport(p.brand || "Atelier Vérité"),
        description: sanitizeCellForExport(p.description || ""),
        image: "", // Empty text! Image will be embedded into this cell
        variantSku: sanitizeCellForExport(v?.sku || (v ? `VAR-${v.color}-${v.size}` : "DEFAULT")),
        color: sanitizeCellForExport(v?.color || "Tiêu chuẩn"),
        size: sanitizeCellForExport(v?.size || "FreeSize"),
        stock: v ? Number(v.stock || 0) : Number(p.stock || 0),
        variantImage: "", // Empty text!
        status: p.is_active !== false ? "Đang mở bán" : "Ngừng bán",
        note: "",
      });

      // Set row height to 60pt (~80px) to comfortably fit embedded image
      row.height = 60;
      row.alignment = { vertical: "middle" };

      if (includeImages) {
        rowsToEmbed.push({
          rowNumber: currentRowIndex,
          primaryImgUrl,
          variantImgUrl,
        });
      }
    }
  }

  // Embed images concurrently into cells
  if (includeImages && rowsToEmbed.length > 0) {
    // Process image downloads concurrently via ImageFetchPool
    await Promise.all(
      rowsToEmbed.map(async ({ rowNumber, primaryImgUrl, variantImgUrl }) => {
        let noteErrors = [];

        // 1. Primary Product Image (Column 9: "Ảnh Đại Diện")
        if (primaryImgUrl) {
          const imgResult = await fetchPool.fetch(primaryImgUrl);
          if (imgResult) {
            const imageId = workbook.addImage({
              buffer: imgResult.buffer,
              extension: imgResult.extension,
            });
            sheet.addImage(imageId, {
              tl: { col: 8.08, row: rowNumber - 1 + 0.08 },
              ext: { width: 68, height: 68 },
              editAs: "oneCell",
            });
          } else {
            noteErrors.push("Ảnh đại diện lỗi");
          }
        }

        // 2. Variant Image (Column 14: "Ảnh Biến Thể")
        if (variantImgUrl && variantImgUrl !== primaryImgUrl) {
          const varImgResult = await fetchPool.fetch(variantImgUrl);
          if (varImgResult) {
            const imageId = workbook.addImage({
              buffer: varImgResult.buffer,
              extension: varImgResult.extension,
            });
            sheet.addImage(imageId, {
              tl: { col: 13.08, row: rowNumber - 1 + 0.08 },
              ext: { width: 68, height: 68 },
              editAs: "oneCell",
            });
          } else {
            noteErrors.push("Ảnh biến thể lỗi");
          }
        }

        if (noteErrors.length > 0) {
          const row = sheet.getRow(rowNumber);
          const currentNote = String(row.getCell(16).value || "");
          row.getCell(16).value = currentNote
            ? `${currentNote}; ${noteErrors.join(", ")}`
            : noteErrors.join(", ");
        }
      })
    );
  }

  return await workbook.xlsx.writeBuffer();
};

// ============================================================================
// TEMPLATE GENERATOR
// ============================================================================
export const generateProductTemplateExcelBuffer = async (categories = []) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Atelier Vérité Admin System";
  workbook.created = new Date();

  // 1. HUONG_DAN Sheet
  const guideSheet = workbook.addWorksheet("HUONG_DAN", {
    views: [{ showGridLines: true }],
  });
  guideSheet.columns = [
    { header: "Hạng Mục", key: "item", width: 30 },
    { header: "Quy Định & Hướng Dẫn Nhập Dữ Liệu Sản Phẩm Có Ảnh Nhúng", key: "desc", width: 85 },
  ];

  guideSheet.addRow({
    item: "HÌNH ẢNH NHÚNG TRỰC TIẾP",
    desc: "Chèn hình ảnh trực tiếp vào ô tại cột 'Ảnh Đại Diện' (và 'Ảnh Biến Thể'): Vào thẻ Insert (Chèn) → Pictures (Hình ảnh) → Chèn ảnh từ máy tính và đặt vừa vặn trong ô. TUYỆT ĐỐI KHÔNG DÁN LINK/URL.",
  });
  guideSheet.addRow({
    item: "Kích Thước Cột & Dòng Ảnh",
    desc: "Dòng đã được định sẵn chiều cao ~80px và cột rộng ~16 để hiển thị ảnh ngay ngắn. Ảnh nên có tỷ lệ vuông hoặc chữ nhật đứng.",
  });
  guideSheet.addRow({
    item: "Cấu Trúc Đa Biến Thể",
    desc: "Mỗi dòng là một biến thể (Variant). Các dòng có cùng 'Mã Sản Phẩm (SKU Nhóm)' sẽ tự động gộp thành 1 sản phẩm. Tồn kho sản phẩm = Tổng tồn kho các biến thể.",
  });
  guideSheet.addRow({
    item: "Tổ Hợp Màu & Kích Cỡ",
    desc: "Trong cùng 1 sản phẩm, không được trùng lặp tổ hợp Màu Sắc + Kích Cỡ. Số lượng tồn kho phải là số nguyên >= 0.",
  });
  guideSheet.addRow({
    item: "Danh Mục Hợp Lệ",
    desc: "Cột 'Mã / Slug Danh Mục' điền chính xác mã ID hoặc slug từ sheet DANH_MUC_HOP_LE.",
  });
  guideSheet.addRow({
    item: "An Toàn Dữ Liệu",
    desc: "Không nhập các công thức Excel bắt đầu bằng =, +, -, @. Dung lượng mỗi ảnh nhúng tối đa 5MB.",
  });

  guideSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  guideSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1A1A" } };

  // 2. DANH_SACH_SAN_PHAM Sheet
  const dataSheet = workbook.addWorksheet("DANH_SACH_SAN_PHAM", {
    views: [{ showGridLines: true }],
  });

  dataSheet.columns = [
    { header: "Mã Sản Phẩm (SKU Nhóm) *", key: "productSku", width: 25 },
    { header: "Tên Sản Phẩm *", key: "name", width: 35 },
    { header: "Mã / Slug Danh Mục *", key: "category", width: 25 },
    { header: "Giá Niêm Yết Gốc (VNĐ)", key: "old_price", width: 22 },
    { header: "Giá Bán Thực Tế (VNĐ) *", key: "new_price", width: 24 },
    { header: "Thương Hiệu", key: "brand", width: 20 },
    { header: "Mô Tả Sản Phẩm", key: "description", width: 40 },
    { header: "Ảnh Đại Diện (Nhúng trực tiếp vào ô) *", key: "image", width: 18 },
    { header: "Mã SKU Biến Thể", key: "variantSku", width: 25 },
    { header: "Màu Sắc *", key: "color", width: 18 },
    { header: "Kích Cỡ *", key: "size", width: 14 },
    { header: "Tồn Kho Biến Thể *", key: "stock", width: 20 },
    { header: "Ảnh Biến Thể (Nhúng vào ô)", key: "variantImage", width: 18 },
  ];

  const headerRow = dataSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFD4AF37" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF121212" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 32;

  // Add sample placeholder rows
  const catCode = categories[0]?.slug || "ao-khoac";
  const sampleRows = [
    {
      productSku: "ATV-COAT-BIELLA",
      name: "Áo Khoác Dạ Lông Cừu Biella",
      category: catCode,
      old_price: 35000000,
      new_price: 29000000,
      brand: "Atelier Vérité",
      description: "Chất liệu dạ cừu tự nhiên dệt thủ công tại vùng Piedmont.",
      image: "",
      variantSku: "ATV-COAT-RED-S",
      color: "Đỏ Rượu",
      size: "S",
      stock: 10,
      variantImage: "",
    },
    {
      productSku: "ATV-COAT-BIELLA",
      name: "Áo Khoác Dạ Lông Cừu Biella",
      category: catCode,
      old_price: 35000000,
      new_price: 29000000,
      brand: "Atelier Vérité",
      description: "Chất liệu dạ cừu tự nhiên dệt thủ công tại vùng Piedmont.",
      image: "",
      variantSku: "ATV-COAT-RED-M",
      color: "Đỏ Rượu",
      size: "M",
      stock: 15,
      variantImage: "",
    },
    {
      productSku: "ATV-COAT-BIELLA",
      name: "Áo Khoác Dạ Lông Cừu Biella",
      category: catCode,
      old_price: 35000000,
      new_price: 29000000,
      brand: "Atelier Vérité",
      description: "Chất liệu dạ cừu tự nhiên dệt thủ công tại vùng Piedmont.",
      image: "",
      variantSku: "ATV-COAT-BLK-S",
      color: "Đen Tuyền",
      size: "S",
      stock: 20,
      variantImage: "",
    },
  ];

  sampleRows.forEach((r) => {
    const row = dataSheet.addRow(r);
    row.height = 60; // 60pt (~80px)
    row.alignment = { vertical: "middle" };
  });

  // 3. DANH_MUC_HOP_LE Sheet
  const catSheet = workbook.addWorksheet("DANH_MUC_HOP_LE", {
    views: [{ showGridLines: true }],
  });
  catSheet.columns = [
    { header: "Mã Hệ Thống (_ID)", key: "id", width: 28 },
    { header: "Tên Danh Mục", key: "name", width: 35 },
    { header: "Slug Danh Mục (Khuyên dùng)", key: "slug", width: 28 },
  ];
  catSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  catSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2A2A2A" } };

  categories.forEach((cat) => {
    catSheet.addRow({
      id: cat._id || cat.id,
      name: cat.name,
      slug: cat.slug,
    });
  });

  return await workbook.xlsx.writeBuffer();
};

// ============================================================================
// IMPORT SERVICE: STEP 1 - PREVIEW & EXTRACT EMBEDDED IMAGES
// ============================================================================
export const previewProductExcelImport = async (fileBuffer) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new AppError("Tệp Excel trống", 400);
  }
  if (fileBuffer.length > MAX_EXCEL_FILE_SIZE) {
    throw new AppError("Dung lượng tệp vượt quá giới hạn 50MB", 400);
  }

  // Verify Zip signature (PK.. -> 50 4B 03 04)
  if (
    fileBuffer[0] !== 0x50 ||
    fileBuffer[1] !== 0x4b ||
    fileBuffer[2] !== 0x03 ||
    fileBuffer[3] !== 0x04
  ) {
    throw new AppError("Định dạng tệp không hợp lệ. Chỉ chấp nhận tệp Excel (.xlsx)", 400);
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(fileBuffer);
  } catch {
    throw new AppError("Không thể đọc tệp Excel. Vui lòng kiểm tra tệp không bị mã hóa hoặc lỗi cấu trúc.", 400);
  }

  const sheet =
    workbook.getWorksheet("DANH_SACH_SAN_PHAM") ||
    workbook.getWorksheet("SAN_PHAM") ||
    workbook.worksheets[0];

  if (!sheet) {
    throw new AppError("Tệp Excel không chứa bảng tính hợp lệ", 400);
  }

  // 1. Read all embedded images from worksheet
  const rawImages = sheet.getImages() || [];
  const imagesByCell = new Map(); // key: `${row}:${col}` -> { buffer, extension }
  const imagesByRow = new Map(); // key: row -> Array<{ col, buffer, extension }>

  for (const img of rawImages) {
    const range = img.range;
    if (!range || !range.tl) continue;

    // ExcelJS nativeRow / nativeCol are 0-indexed
    const r = (range.tl.nativeRow != null ? range.tl.nativeRow : Math.floor(range.tl.row)) + 1;
    const c = (range.tl.nativeCol != null ? range.tl.nativeCol : Math.floor(range.tl.col)) + 1;

    try {
      const media = workbook.getImage(Number(img.imageId));
      if (media && media.buffer) {
        const trueFormat = detectImageFormatFromMagicBytes(media.buffer);
        if (trueFormat) {
          const entry = { buffer: media.buffer, extension: trueFormat };
          imagesByCell.set(`${r}:${c}`, entry);

          if (!imagesByRow.has(r)) imagesByRow.set(r, []);
          imagesByRow.get(r).push({ col: c, ...entry });
        }
      }
    } catch {
      // Ignore corrupted individual media items
    }
  }

  // 2. Fetch categories for resolving
  const categories = await Category.find({}).lean();
  const catById = new Map();
  const catBySlug = new Map();
  const catByName = new Map();

  categories.forEach((cat) => {
    catById.set(String(cat._id), cat);
    if (cat.slug) catBySlug.set(cat.slug.toLowerCase(), cat);
    if (cat.name) catByName.set(cat.name.toLowerCase(), cat);
  });

  // 3. Header column index mapping
  const headerRow = sheet.getRow(1);
  const colMap = {
    productSku: 1,
    name: 2,
    category: 3,
    old_price: 4,
    new_price: 5,
    brand: 6,
    description: 7,
    image: 8,
    variantSku: 9,
    color: 10,
    size: 11,
    stock: 12,
    variantImage: 13,
  };

  headerRow.eachCell((cell, colNumber) => {
    const val = String(cell.value || "").trim().toLowerCase();
    if (val.includes("mã sản phẩm") || (val.includes("sku") && val.includes("nhóm"))) colMap.productSku = colNumber;
    else if (val.includes("tên") && val.includes("sản phẩm")) colMap.name = colNumber;
    else if (val.includes("danh mục")) colMap.category = colNumber;
    else if (val.includes("giá niêm yết") || val.includes("giá gốc")) colMap.old_price = colNumber;
    else if (val.includes("giá bán") || val.includes("giá khuyến mãi")) colMap.new_price = colNumber;
    else if (val.includes("thương hiệu") || val.includes("brand")) colMap.brand = colNumber;
    else if (val.includes("mô tả") || val.includes("description")) colMap.description = colNumber;
    else if (val.includes("ảnh đại diện") || (val.includes("ảnh") && val.includes("chính"))) colMap.image = colNumber;
    else if (val.includes("mã sku biến thể") || (val.includes("sku") && val.includes("biến thể"))) colMap.variantSku = colNumber;
    else if (val.includes("màu") || val.includes("color")) colMap.color = colNumber;
    else if (val.includes("cỡ") || val.includes("size")) colMap.size = colNumber;
    else if (val.includes("tồn kho") || val.includes("stock")) colMap.stock = colNumber;
    else if (val.includes("ảnh biến thể")) colMap.variantImage = colNumber;
  });

  // 4. Parse rows
  const errors = [];
  const warnings = [];
  const groups = new Map();
  let totalRows = 0;
  let embeddedImagesCount = 0;

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const isRowEmpty =
      !row.values ||
      (Array.isArray(row.values) &&
        row.values.every((v) => v === null || v === undefined || v === ""));
    if (isRowEmpty) continue;

    totalRows++;

    const productSku = String(row.getCell(colMap.productSku).value || "").trim();
    const name = String(row.getCell(colMap.name).value || "").trim();
    const categoryCode = String(row.getCell(colMap.category).value || "").trim();
    const rawOldPrice = row.getCell(colMap.old_price).value;
    const rawNewPrice = row.getCell(colMap.new_price).value;
    const brand = String(row.getCell(colMap.brand).value || "Atelier Vérité").trim();
    const description = String(row.getCell(colMap.description).value || "").trim();
    const textImageVal = String(row.getCell(colMap.image).value || "").trim();

    const variantSku = String(row.getCell(colMap.variantSku).value || "").trim();
    const color = String(row.getCell(colMap.color).value || "").trim();
    const size = String(row.getCell(colMap.size).value || "").trim();
    const rawStock = row.getCell(colMap.stock).value;
    const textVarImageVal = String(row.getCell(colMap.variantImage).value || "").trim();

    // Check embedded images for this row
    const embeddedPrimary =
      imagesByCell.get(`${r}:${colMap.image}`) ||
      imagesByRow.get(r)?.find((img) => img.col === colMap.image) ||
      imagesByRow.get(r)?.[0];

    const embeddedVariant =
      imagesByCell.get(`${r}:${colMap.variantImage}`) ||
      imagesByRow.get(r)?.find((img) => img.col === colMap.variantImage);

    if (embeddedPrimary) embeddedImagesCount++;
    if (embeddedVariant && embeddedVariant !== embeddedPrimary) embeddedImagesCount++;

    // Validation
    if (!name) {
      errors.push({
        row: r,
        field: "Tên Sản Phẩm",
        code: "ERR_NAME_REQUIRED",
        message: "Tên sản phẩm không được để trống",
      });
    }

    let resolvedCategory = null;
    if (!categoryCode) {
      errors.push({
        row: r,
        field: "Mã / Slug Danh Mục",
        code: "ERR_CATEGORY_REQUIRED",
        message: "Mã danh mục không được để trống",
      });
    } else {
      resolvedCategory =
        catById.get(categoryCode) ||
        catBySlug.get(categoryCode.toLowerCase()) ||
        catByName.get(categoryCode.toLowerCase());

      if (!resolvedCategory) {
        errors.push({
          row: r,
          field: "Mã / Slug Danh Mục",
          code: "ERR_CATEGORY_NOT_FOUND",
          message: `Không tìm thấy danh mục "${categoryCode}"`,
        });
      }
    }

    const oldPriceNum = Number(rawOldPrice) || 0;
    const newPriceNum = Number(rawNewPrice);
    if (isNaN(newPriceNum) || newPriceNum < 0) {
      errors.push({
        row: r,
        field: "Giá Bán Thực Tế",
        code: "ERR_PRICE_INVALID",
        message: "Giá bán thực tế phải là số hợp lệ >= 0",
      });
    }

    if (!color) {
      errors.push({
        row: r,
        field: "Màu Sắc",
        code: "ERR_COLOR_REQUIRED",
        message: "Màu sắc biến thể không được để trống",
      });
    }

    if (!size) {
      errors.push({
        row: r,
        field: "Kích Cỡ",
        code: "ERR_SIZE_REQUIRED",
        message: "Kích cỡ biến thể không được để trống",
      });
    }

    const stockNum = Number(rawStock);
    if (!Number.isInteger(stockNum) || stockNum < 0 || isNaN(stockNum)) {
      errors.push({
        row: r,
        field: "Tồn Kho Biến Thể",
        code: "ERR_STOCK_INVALID",
        message: "Tồn kho phải là số nguyên >= 0",
      });
    }

    // Image handling & warnings
    let primaryBuffer = embeddedPrimary?.buffer || null;
    let variantBuffer = embeddedVariant?.buffer || primaryBuffer;
    let primaryFallbackUrl = null;
    let variantFallbackUrl = null;

    if (!primaryBuffer) {
      if (/^https?:\/\//i.test(textImageVal) || textImageVal.startsWith("/uploads/")) {
        primaryFallbackUrl = textImageVal;
        warnings.push({
          row: r,
          field: "Ảnh Đại Diện",
          message: "Dòng này dùng liên kết URL thay vì hình ảnh nhúng trực tiếp. Khuyên dùng ảnh nhúng.",
        });
      } else {
        warnings.push({
          row: r,
          field: "Ảnh Đại Diện",
          message: "Không có hình ảnh nhúng cho dòng này. Nếu là sản phẩm mới sẽ để trống ảnh.",
        });
      }
    }

    if (!variantBuffer && textVarImageVal) {
      if (/^https?:\/\//i.test(textVarImageVal) || textVarImageVal.startsWith("/uploads/")) {
        variantFallbackUrl = textVarImageVal;
      }
    }

    const groupKey = productSku || name.toLowerCase();
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        productSku: productSku || `SKU-${Date.now()}`,
        name,
        categoryCode,
        resolvedCategory,
        oldPrice: oldPriceNum,
        newPrice: isNaN(newPriceNum) ? 0 : newPriceNum,
        brand,
        description,
        primaryBuffer,
        primaryFallbackUrl,
        variants: [],
      });
    }

    groups.get(groupKey).variants.push({
      rowNumber: r,
      variantSku,
      color,
      size,
      stock: Number.isInteger(stockNum) && stockNum >= 0 ? stockNum : 0,
      variantBuffer,
      variantFallbackUrl,
    });
  }

  // Check duplicate color+size within product
  const validProducts = [];

  for (const group of groups.values()) {
    const seenCombos = new Set();
    let hasGroupError = false;

    for (const v of group.variants) {
      const combo = `${normalizeVariantColorKey(v.color)}:${v.size.trim().toUpperCase()}`;
      if (seenCombos.has(combo)) {
        errors.push({
          row: v.rowNumber,
          field: "Màu Sắc + Kích Cỡ",
          code: "ERR_DUPLICATE_VARIANT",
          message: `Biến thể "${v.color}" và cỡ "${v.size}" bị trùng lặp trong cùng sản phẩm "${group.name}"`,
        });
        hasGroupError = true;
      } else {
        seenCombos.add(combo);
      }
    }

    const errorRows = new Set(errors.map((e) => e.row));
    if (group.variants.some((v) => errorRows.has(v.rowNumber)) || !group.resolvedCategory) {
      hasGroupError = true;
    }

    // Generate thumbnail for preview table
    let thumbnailDataUrl = null;
    if (group.primaryBuffer) {
      try {
        const thumbBuf = await sharp(group.primaryBuffer)
          .resize({ width: 80, height: 80, fit: "cover" })
          .jpeg({ quality: 70 })
          .toBuffer();
        thumbnailDataUrl = `data:image/jpeg;base64,${thumbBuf.toString("base64")}`;
      } catch {
        // Thumbnail generation issue, fallback to null
      }
    } else if (group.primaryFallbackUrl) {
      thumbnailDataUrl = group.primaryFallbackUrl;
    }

    const totalStock = group.variants.reduce((sum, v) => sum + v.stock, 0);

    validProducts.push({
      productSku: group.productSku,
      name: group.name,
      slug: slugifyProductName(group.name),
      category_id: group.resolvedCategory?._id,
      categoryName: group.resolvedCategory?.name || group.categoryCode,
      old_price: group.oldPrice,
      new_price: group.newPrice,
      brand: group.brand,
      description: group.description,
      totalStock,
      hasError: hasGroupError,
      hasEmbeddedImage: Boolean(group.primaryBuffer),
      thumbnailDataUrl,
      variantsCount: group.variants.length,
      variants: group.variants.map((v) => ({
        rowNumber: v.rowNumber,
        sku: v.variantSku,
        color: v.color,
        size: v.size,
        stock: v.stock,
        hasEmbeddedImage: Boolean(v.variantBuffer),
      })),
      _rawBuffers: {
        primary: group.primaryBuffer,
        primaryFallbackUrl: group.primaryFallbackUrl,
        variants: group.variants.map((v) => ({
          buffer: v.variantBuffer,
          fallbackUrl: v.variantFallbackUrl,
        })),
      },
    });
  }

  // Create preview session in cache
  const previewId = crypto.randomUUID();
  previewSessions.set(previewId, {
    previewId,
    createdAt: Date.now(),
    products: validProducts,
    errors,
  });

  const validProductsCount = validProducts.filter((p) => !p.hasError).length;

  return {
    previewId,
    summary: {
      totalRows,
      totalProducts: validProducts.length,
      validProductsCount,
      errorCount: errors.length,
      warningCount: warnings.length,
      embeddedImagesCount,
    },
    products: validProducts.map(({ _rawBuffers, ...rest }) => rest),
    errors,
    warnings,
  };
};

// ============================================================================
// IMPORT SERVICE: STEP 2 - CONFIRM & PERSIST TO DB WITH IMAGE DEDUPLICATION
// ============================================================================
export const confirmProductExcelImport = async (previewId) => {
  const session = previewSessions.get(previewId);
  if (!session) {
    throw new AppError("Phiên xem trước đã hết hạn hoặc không tồn tại. Vui lòng tải lại tệp Excel.", 400);
  }

  const validProducts = session.products.filter((p) => !p.hasError);
  if (validProducts.length === 0) {
    throw new AppError("Không có sản phẩm hợp lệ nào để lưu.", 400);
  }

  const uploadsDir = ensureUploadsDir();
  const createdFilePaths = [];
  const hashToUrlMap = new Map(); // SHA-256 hash -> uploaded URL

  let importedProductsCount = 0;
  let importedVariantsCount = 0;
  let reusedImagesCount = 0;
  let newImagesCount = 0;

  try {
    for (const prod of validProducts) {
      const raw = prod._rawBuffers;

      // 1. Process and save Primary Image
      let primaryImageUrl = raw?.primaryFallbackUrl || "";

      if (raw?.primary) {
        const hash = crypto.createHash("sha256").update(raw.primary).digest("hex");
        if (hashToUrlMap.has(hash)) {
          primaryImageUrl = hashToUrlMap.get(hash);
          reusedImagesCount++;
        } else {
          const filename = `${crypto.randomUUID()}.webp`;
          const filePath = path.join(uploadsDir, filename);

          await sharp(raw.primary, { limitInputPixels: MAX_IMAGE_PIXELS })
            .rotate()
            .resize({
              width: MAX_IMPORT_IMAGE_DIMENSION,
              height: MAX_IMPORT_IMAGE_DIMENSION,
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: 82 })
            .toFile(filePath);

          createdFilePaths.push(filePath);
          primaryImageUrl = `/uploads/${filename}`;
          hashToUrlMap.set(hash, primaryImageUrl);
          newImagesCount++;
        }
      }

      // Check if product exists in DB (by slug or name)
      let existingProduct = await Product.findOne({
        $or: [{ slug: prod.slug }, { name: prod.name }],
      });

      // If updating and no new image provided in Excel, keep existing images!
      if (existingProduct && !primaryImageUrl) {
        primaryImageUrl =
          (Array.isArray(existingProduct.displayProduct) && existingProduct.displayProduct[0]) || "";
      }

      // 2. Process variant images
      const variantDocs = [];
      for (let i = 0; i < prod.variants.length; i++) {
        const v = prod.variants[i];
        const vRaw = raw?.variants?.[i];

        let vImgUrl = primaryImageUrl;
        if (vRaw?.buffer) {
          const vHash = crypto.createHash("sha256").update(vRaw.buffer).digest("hex");
          if (hashToUrlMap.has(vHash)) {
            vImgUrl = hashToUrlMap.get(vHash);
            reusedImagesCount++;
          } else {
            const filename = `${crypto.randomUUID()}.webp`;
            const filePath = path.join(uploadsDir, filename);

            await sharp(vRaw.buffer, { limitInputPixels: MAX_IMAGE_PIXELS })
              .rotate()
              .resize({
                width: MAX_IMPORT_IMAGE_DIMENSION,
                height: MAX_IMPORT_IMAGE_DIMENSION,
                fit: "inside",
                withoutEnlargement: true,
              })
              .webp({ quality: 82 })
              .toFile(filePath);

            createdFilePaths.push(filePath);
            vImgUrl = `/uploads/${filename}`;
            hashToUrlMap.set(vHash, vImgUrl);
            newImagesCount++;
          }
        } else if (vRaw?.fallbackUrl) {
          vImgUrl = vRaw.fallbackUrl;
        }

        const colorKey = normalizeVariantColorKey(v.color);
        const baseSku = v.sku || buildVariantSku(prod, v.color, v.size);

        variantDocs.push({
          color: v.color,
          color_code: "#1E1E24",
          color_key: colorKey,
          size: v.size.trim().toUpperCase(),
          sku: baseSku,
          stock: v.stock,
          price: prod.new_price,
          image_url: vImgUrl || primaryImageUrl || "/uploads/default-product.webp",
          position: i,
          is_active: true,
        });
      }

      let savedProduct;
      if (existingProduct) {
        existingProduct.name = prod.name;
        existingProduct.category_id = prod.category_id;
        existingProduct.brand = prod.brand;
        existingProduct.old_price = prod.old_price;
        existingProduct.new_price = prod.new_price;
        existingProduct.description = prod.description;
        existingProduct.stock = prod.totalStock;
        if (primaryImageUrl) {
          existingProduct.displayProduct = [primaryImageUrl];
        }
        await existingProduct.save();

        // Replace variants
        await ProductVariant.deleteMany({ product_id: existingProduct._id });
        const variantInserts = variantDocs.map((vd) => ({
          ...vd,
          product_id: existingProduct._id,
        }));
        await ProductVariant.insertMany(variantInserts);
        savedProduct = existingProduct;
      } else {
        // Create new product
        savedProduct = await Product.create({
          name: prod.name,
          name_no_accents: toNoAccent(prod.name),
          slug: prod.slug,
          category_id: prod.category_id,
          brand: prod.brand,
          old_price: prod.old_price,
          new_price: prod.new_price,
          description: prod.description,
          stock: prod.totalStock,
          displayProduct: primaryImageUrl ? [primaryImageUrl] : [],
          is_active: true,
        });

        const variantInserts = variantDocs.map((vd) => ({
          ...vd,
          product_id: savedProduct._id,
        }));
        await ProductVariant.insertMany(variantInserts);
      }

      triggerProductVectorSync(savedProduct._id).catch(() => {});
      importedProductsCount++;
      importedVariantsCount += variantDocs.length;
    }

    // Clean preview session after successful import
    previewSessions.delete(previewId);

    return {
      success: true,
      importedProductsCount,
      importedVariantsCount,
      newImagesCount,
      reusedImagesCount,
    };
  } catch (err) {
    // Rollback: clean up all created image files if DB write failed
    for (const filePath of createdFilePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {
        // Ignore file cleanup error
      }
    }
    throw err;
  }
};

// ============================================================================
// ERROR REPORT GENERATOR
// ============================================================================
export const generateErrorReportBuffer = async (previewId) => {
  const session = previewSessions.get(previewId);
  if (!session) {
    throw new AppError("Không tìm thấy phiên xem trước để tải báo cáo lỗi.", 404);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Atelier Vérité Security & Audit Engine";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("BAO_CAO_LOI", {
    views: [{ showGridLines: true }],
  });

  sheet.columns = [
    { header: "Dòng", key: "row", width: 12 },
    { header: "Trường Dữ Liệu", key: "field", width: 25 },
    { header: "Mã Lỗi", key: "code", width: 25 },
    { header: "Chi Tiết Lỗi", key: "message", width: 50 },
    { header: "Hướng Khắc Phục", key: "fix", width: 45 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF8B0000" } };
  sheet.getRow(1).height = 28;

  session.errors.forEach((e) => {
    sheet.addRow({
      row: e.row,
      field: e.field || "Toàn bộ",
      code: e.code || "ERR_VALIDATION",
      message: e.message || "",
      fix: e.fix || "Vui lòng chỉnh sửa dữ liệu theo hướng dẫn mẫu và tải lại tệp.",
    });
  });

  return await workbook.xlsx.writeBuffer();
};
