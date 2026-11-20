import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import sharp from "sharp";
import mongoose from "mongoose";
import {
  isSsrfSafeUrl,
  detectImageFormatFromMagicBytes,
  sanitizeCellForExport,
  normalizeImageForExcelEmbed,
  exportProductsToExcelBuffer,
  generateProductTemplateExcelBuffer,
  previewProductExcelImport,
  confirmProductExcelImport,
} from "../productExcel.service.js";
import { Product, ProductVariant } from "../product.model.js";
import Category from "../../categories/category.model.js";

// Helper to create a valid test PNG buffer
const createTestPngBuffer = async (color = { r: 212, g: 175, b: 55, alpha: 1 }) => {
  return await sharp({
    create: {
      width: 40,
      height: 40,
      channels: 4,
      background: color,
    },
  })
    .png()
    .toBuffer();
};

// Helper to create a valid test WebP buffer
const createTestWebpBuffer = async () => {
  return await sharp({
    create: {
      width: 50,
      height: 50,
      channels: 4,
      background: { r: 50, g: 50, b: 200, alpha: 1 },
    },
  })
    .webp()
    .toBuffer();
};

describe("Product Excel Embedded Images Suite", () => {
  let sampleCategory;
  let samplePngBuffer;

  beforeAll(async () => {
    // Ensure MongoDB connection (if already connected in Jest or mock)
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/atelier_verite_test";
      await mongoose.connect(uri);
    }

    samplePngBuffer = await createTestPngBuffer();

    sampleCategory = await Category.findOneAndUpdate(
      { slug: "ao-khoac-test-excel" },
      { name: "Áo Khoác Dạ", slug: "ao-khoac-test-excel" },
      { upsert: true, new: true }
    );
  });

  afterAll(async () => {
    if (sampleCategory) {
      await Category.deleteOne({ _id: sampleCategory._id });
    }
  });

  // --------------------------------------------------------------------------
  // 1. SSRF & Security Tests
  // --------------------------------------------------------------------------
  describe("1. Security & Sanitization", () => {
    test("isSsrfSafeUrl accepts public HTTP/HTTPS URLs", () => {
      expect(isSsrfSafeUrl("https://images.unsplash.com/photo-123")).toBe(true);
      expect(isSsrfSafeUrl("http://cdn.atelierverite.com/products/look.jpg")).toBe(true);
    });

    test("isSsrfSafeUrl rejects localhost, internal IPs and dangerous protocols", () => {
      expect(isSsrfSafeUrl("http://localhost:5000/api/secret")).toBe(false);
      expect(isSsrfSafeUrl("http://127.0.0.1:5000")).toBe(false);
      expect(isSsrfSafeUrl("http://10.0.0.1/admin")).toBe(false);
      expect(isSsrfSafeUrl("http://192.168.1.100")).toBe(false);
      expect(isSsrfSafeUrl("http://172.20.0.1")).toBe(false);
      expect(isSsrfSafeUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
      expect(isSsrfSafeUrl("file:///etc/passwd")).toBe(false);
      expect(isSsrfSafeUrl("ftp://ftp.example.com")).toBe(false);
      expect(isSsrfSafeUrl("javascript:alert(1)")).toBe(false);
    });

    test("sanitizeCellForExport escapes formula injection operators (=, +, -, @)", () => {
      expect(sanitizeCellForExport("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
      expect(sanitizeCellForExport("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
      expect(sanitizeCellForExport("-12345")).toBe("'-12345");
      expect(sanitizeCellForExport("@SUM")).toBe("'@SUM");
      expect(sanitizeCellForExport("Áo Khoác Dạ")).toBe("Áo Khoác Dạ");
      expect(sanitizeCellForExport(29000000)).toBe(29000000);
    });

    test("detectImageFormatFromMagicBytes identifies valid PNG, JPEG, GIF, WebP", async () => {
      const pngBuf = await createTestPngBuffer();
      const webpBuf = await createTestWebpBuffer();
      const fakeBuf = Buffer.from("THIS IS NOT AN IMAGE");

      expect(detectImageFormatFromMagicBytes(pngBuf)).toBe("png");
      expect(detectImageFormatFromMagicBytes(webpBuf)).toBe("webp");
      expect(detectImageFormatFromMagicBytes(fakeBuf)).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Normalization & Sharp Image Processing
  // --------------------------------------------------------------------------
  describe("2. Normalization for Excel Embedding", () => {
    test("normalizeImageForExcelEmbed converts WebP to PNG or JPEG and resizes to <= 300px", async () => {
      const webpBuf = await createTestWebpBuffer();
      const normalized = await normalizeImageForExcelEmbed(webpBuf);

      expect(normalized).toBeDefined();
      expect(["png", "jpeg"]).toContain(normalized.extension);

      const meta = await sharp(normalized.buffer).metadata();
      expect(meta.width).toBeLessThanOrEqual(300);
      expect(meta.height).toBeLessThanOrEqual(300);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Export with Embedded Images Test
  // --------------------------------------------------------------------------
  describe("3. Excel Export with Embedded Images", () => {
    test("exportProductsToExcelBuffer embeds images directly into cells without raw URLs", async () => {
      // Create a temporary upload file so local fetch succeeds instantly
      const uploadsDir = path.resolve("uploads");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const testImageName = `test-export-${Date.now()}.png`;
      const testImagePath = path.join(uploadsDir, testImageName);
      await fs.promises.writeFile(testImagePath, samplePngBuffer);

      const testProducts = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: "Áo Blazer Cashmere",
          slug: "ao-blazer-cashmere-excel-test",
          category_id: sampleCategory._id,
          old_price: 15000000,
          new_price: 12500000,
          brand: "Atelier Vérité",
          description: "Dệt thủ công bằng sợi len Cashmere cao cấp",
          displayProduct: [`/uploads/${testImageName}`],
          is_active: true,
          variants: [
            {
              color: "Đen",
              size: "S",
              stock: 8,
              sku: "ATV-BLZ-BLK-S",
              image_url: `/uploads/${testImageName}`,
            },
            {
              color: "Đen",
              size: "M",
              stock: 12,
              sku: "ATV-BLZ-BLK-M",
              image_url: `/uploads/${testImageName}`,
            },
          ],
        },
      ];

      const excelBuffer = await exportProductsToExcelBuffer({
        products: testProducts,
        categories: [sampleCategory],
        includeImages: true,
      });

      expect(excelBuffer).toBeDefined();
      expect(excelBuffer.byteLength).toBeGreaterThan(5000);

      // Verify with ExcelJS
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(excelBuffer);

      const sheet = wb.getWorksheet("DANH_SACH_SAN_PHAM");
      expect(sheet).toBeDefined();

      // Check header and column properties
      const imageCol = sheet.getColumn(9); // "Ảnh Đại Diện"
      expect(imageCol.width).toBeGreaterThanOrEqual(15);

      // Check row height
      const row2 = sheet.getRow(2);
      expect(row2.height).toBe(60); // 60pt = ~80px

      // Check that cell text for "Ảnh Đại Diện" is EMPTY (not a raw URL)
      expect(row2.getCell(9).value).toBeFalsy();

      // Verify embedded images
      const images = sheet.getImages();
      expect(images.length).toBeGreaterThanOrEqual(1);

      const firstImg = images[0];
      expect(firstImg.range.tl.nativeCol).toBe(8); // 0-based col 8 = column 9
      expect(firstImg.range.editAs || firstImg.editAs).toBe("oneCell");

      // Verify image data retrieved from workbook
      const imgData = wb.getImage(Number(firstImg.imageId));
      expect(imgData).toBeDefined();
      expect(imgData.buffer.byteLength).toBeGreaterThan(0);

      // Clean up test file
      if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
    });

    test("generateProductTemplateExcelBuffer creates guide sheet and pre-sized product entry sheet", async () => {
      const templateBuf = await generateProductTemplateExcelBuffer([sampleCategory]);
      expect(templateBuf).toBeDefined();

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(templateBuf);

      expect(wb.getWorksheet("HUONG_DAN")).toBeDefined();
      expect(wb.getWorksheet("DANH_SACH_SAN_PHAM")).toBeDefined();
      expect(wb.getWorksheet("DANH_MUC_HOP_LE")).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Import with Embedded Images & Deduplication Test
  // --------------------------------------------------------------------------
  describe("4. Excel Import with Embedded Images & Deduplication", () => {
    test("preview and confirm import extracts embedded images, deduplicates identical buffers, and creates product in DB", async () => {
      // 1. Build an in-memory Excel file with embedded image
      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet("DANH_SACH_SAN_PHAM");

      sheet.columns = [
        { header: "Mã Sản Phẩm (SKU Nhóm)", key: "productSku", width: 25 },
        { header: "Tên Sản Phẩm", key: "name", width: 35 },
        { header: "Mã / Slug Danh Mục", key: "category", width: 25 },
        { header: "Giá Niêm Yết", key: "old_price", width: 20 },
        { header: "Giá Bán Thực Tế", key: "new_price", width: 22 },
        { header: "Thương Hiệu", key: "brand", width: 20 },
        { header: "Mô Tả", key: "description", width: 40 },
        { header: "Ảnh Đại Diện", key: "image", width: 16 },
        { header: "Mã SKU Biến Thể", key: "variantSku", width: 25 },
        { header: "Màu Sắc", key: "color", width: 18 },
        { header: "Kích Cỡ", key: "size", width: 14 },
        { header: "Tồn Kho Biến Thể", key: "stock", width: 18 },
        { header: "Ảnh Biến Thể", key: "variantImage", width: 16 },
      ];

      const testSku = `ATV-TRENCH-${Date.now()}`;
      const testName = `Áo Măng Tô Khuy Sừng ${Date.now()}`;

      // Row 2 (Variant S)
      const r2 = sheet.addRow({
        productSku: testSku,
        name: testName,
        category: sampleCategory.slug,
        old_price: 22000000,
        new_price: 19500000,
        brand: "Atelier Vérité",
        description: "Dáng dài cổ điển, lót lụa habotai",
        image: "",
        variantSku: `${testSku}-CAMEL-S`,
        color: "Camel",
        size: "S",
        stock: 5,
        variantImage: "",
      });
      r2.height = 60;

      // Row 3 (Variant M - uses SAME embedded image)
      const r3 = sheet.addRow({
        productSku: testSku,
        name: testName,
        category: sampleCategory.slug,
        old_price: 22000000,
        new_price: 19500000,
        brand: "Atelier Vérité",
        description: "Dáng dài cổ điển, lót lụa habotai",
        image: "",
        variantSku: `${testSku}-CAMEL-M`,
        color: "Camel",
        size: "M",
        stock: 10,
        variantImage: "",
      });
      r3.height = 60;

      // Add image to workbook and anchor to Row 2 & Row 3 (col 8 = column 9)
      const imageId = wb.addImage({
        buffer: samplePngBuffer,
        extension: "png",
      });

      sheet.addImage(imageId, {
        tl: { col: 7.08, row: 1.08 }, // Row 2
        ext: { width: 65, height: 65 },
        editAs: "oneCell",
      });

      sheet.addImage(imageId, {
        tl: { col: 7.08, row: 2.08 }, // Row 3
        ext: { width: 65, height: 65 },
        editAs: "oneCell",
      });

      const importExcelBuffer = await wb.xlsx.writeBuffer();

      // 2. Step 1: Preview
      const preview = await previewProductExcelImport(importExcelBuffer);

      expect(preview).toBeDefined();
      expect(preview.previewId).toBeDefined();
      expect(preview.summary.totalRows).toBe(2);
      expect(preview.summary.totalProducts).toBe(1);
      expect(preview.summary.validProductsCount).toBe(1);
      expect(preview.summary.embeddedImagesCount).toBe(2);
      expect(preview.products[0].hasEmbeddedImage).toBe(true);
      expect(preview.products[0].thumbnailDataUrl).toContain("data:image/jpeg;base64,");

      // 3. Step 2: Confirm
      const confirmResult = await confirmProductExcelImport(preview.previewId);

      expect(confirmResult.success).toBe(true);
      expect(confirmResult.importedProductsCount).toBe(1);
      expect(confirmResult.importedVariantsCount).toBe(2);
      // SHA-256 deduplication test: both rows used the exact same image buffer!
      // Therefore newImagesCount should be 1, and reusedImagesCount should be >= 1!
      expect(confirmResult.newImagesCount).toBe(1);
      expect(confirmResult.reusedImagesCount).toBeGreaterThanOrEqual(1);

      // Verify in MongoDB
      const savedProd = await Product.findOne({ name: testName }).populate("variants");
      expect(savedProd).toBeDefined();
      expect(savedProd.displayProduct[0]).toMatch(/^\/uploads\/.+\.webp$/);
      expect(savedProd.stock).toBe(15); // 5 + 10 = 15
      expect(savedProd.variants).toHaveLength(2);

      // Clean up test product
      await ProductVariant.deleteMany({ product_id: savedProd._id });
      await Product.deleteOne({ _id: savedProd._id });
    });
  });

  // --------------------------------------------------------------------------
  // 5. Round-trip Consistency Test
  // --------------------------------------------------------------------------
  describe("5. Round-trip Export -> Import Loop", () => {
    test("exported Excel with embedded images can be successfully imported back", async () => {
      // 1. Create product in DB
      const originalProduct = await Product.create({
        name: `Áo Lụa Tơ Tằm Loop ${Date.now()}`,
        slug: `ao-lua-to-tam-loop-${Date.now()}`,
        category_id: sampleCategory._id,
        old_price: 8000000,
        new_price: 6500000,
        stock: 20,
        is_active: true,
      });

      // Save a local image for it
      const uploadsDir = path.resolve("uploads");
      const imgFileName = `test-loop-${Date.now()}.png`;
      const imgPath = path.join(uploadsDir, imgFileName);
      await fs.promises.writeFile(imgPath, samplePngBuffer);

      originalProduct.displayProduct = [`/uploads/${imgFileName}`];
      await originalProduct.save();

      await ProductVariant.create({
        product_id: originalProduct._id,
        color: "Trắng Ngà",
        color_key: "trangnga",
        size: "M",
        stock: 20,
        sku: `LOOP-SILK-${Date.now()}`,
        image_url: `/uploads/${imgFileName}`,
      });

      // 2. Export to Excel
      const exportedBuf = await exportProductsToExcelBuffer({
        products: [await Product.findById(originalProduct._id).populate("variants").lean()],
        categories: [sampleCategory],
        includeImages: true,
      });

      // 3. Import back via preview
      const previewRes = await previewProductExcelImport(exportedBuf);
      expect(previewRes.summary.validProductsCount).toBe(1);
      expect(previewRes.products[0].hasEmbeddedImage).toBe(true);

      // 4. Confirm import
      const confirmRes = await confirmProductExcelImport(previewRes.previewId);
      expect(confirmRes.importedProductsCount).toBe(1);

      // 5. Clean up
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      await ProductVariant.deleteMany({ product_id: originalProduct._id });
      await Product.deleteOne({ _id: originalProduct._id });
    });
  });
});
