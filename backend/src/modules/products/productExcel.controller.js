import multer from "multer";
import { Product } from "./product.model.js";
import Category from "../categories/category.model.js";
import {
  exportProductsToExcelBuffer,
  generateProductTemplateExcelBuffer,
  previewProductExcelImport,
  confirmProductExcelImport,
  generateErrorReportBuffer,
} from "./productExcel.service.js";
import { AppError } from "../../common/exceptions/AppError.js";

// Multer memory storage with 50MB limit & .xlsx extension check
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.toLowerCase();
    if (!ext.endsWith(".xlsx")) {
      return cb(
        new AppError("Định dạng tệp không hợp lệ. Chỉ chấp nhận tệp Excel (.xlsx)", 400),
        false
      );
    }
    cb(null, true);
  },
});

export const excelUploadMiddleware = upload.single("file");

/**
 * GET /api/products/excel/template
 * Downloads standardized Excel template with instructions for embedded images
 */
export const downloadProductTemplate = async (req, res, next) => {
  try {
    const categories = await Category.find({}).lean();
    const buffer = await generateProductTemplateExcelBuffer(categories);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="product-import-template.xlsx"'
    );
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products/excel/export or GET /api/products/excel/export
 * Exports products to Excel with directly embedded images
 */
export const exportProductsExcel = async (req, res, next) => {
  try {
    const scope = req.body?.scope || req.query?.scope || "all";
    const ids = req.body?.ids || (req.query?.ids ? String(req.query.ids).split(",") : null);
    const category = req.body?.category || req.query?.category;
    const search = req.body?.search || req.query?.search;
    const includeImages =
      req.body?.includeImages !== false && req.query?.includeImages !== "false";

    // Build filter
    const filter = {};

    if (scope === "selected" && Array.isArray(ids) && ids.length > 0) {
      filter._id = { $in: ids };
    } else {
      if (category && category !== "all") {
        const catDoc = await Category.findOne({
          $or: [{ slug: category }, { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }],
        }).lean();
        if (catDoc) filter.category_id = catDoc._id;
      }

      if (search && String(search).trim()) {
        const term = String(search).trim();
        filter.$or = [
          { name: { $regex: term, $options: "i" } },
          { slug: { $regex: term, $options: "i" } },
        ];
      }
    }

    const [products, categories] = await Promise.all([
      Product.find(filter).populate("variants").lean(),
      Category.find({}).lean(),
    ]);

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm nào trong phạm vi đã chọn để xuất Excel.",
      });
    }

    // Limit export to 500 products with embedded images per file to protect memory
    const limitedProducts = products.slice(0, 500);

    const buffer = await exportProductsToExcelBuffer({
      products: limitedProducts,
      categories,
      includeImages,
    });

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `danh-sach-san-pham-${dateStr}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products/excel/preview
 * Analyzes uploaded Excel, extracts embedded images and returns summary & thumbnails
 */
export const previewProductsExcel = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      throw new AppError("Vui lòng tải lên tệp Excel (.xlsx)", 400);
    }

    const preview = await previewProductExcelImport(req.file.buffer);

    res.status(200).json({
      success: true,
      data: preview,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products/excel/confirm
 * Confirms import preview, uploads images with SHA-256 deduplication and updates database
 */
export const confirmProductsExcel = async (req, res, next) => {
  try {
    const { previewId } = req.body;
    if (!previewId) {
      throw new AppError("Thiếu mã phiên xem trước (previewId)", 400);
    }

    const result = await confirmProductExcelImport(previewId);

    res.status(200).json({
      success: true,
      message: `Đã nhập thành công ${result.importedProductsCount} sản phẩm (${result.importedVariantsCount} biến thể). Đã tải ${result.newImagesCount} ảnh mới, tái sử dụng ${result.reusedImagesCount} ảnh trùng lặp.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/excel/error-report/:previewId
 * Downloads Excel error report for skipped / invalid rows
 */
export const downloadErrorReport = async (req, res, next) => {
  try {
    const { previewId } = req.params;
    if (!previewId) {
      throw new AppError("Thiếu mã phiên xem trước", 400);
    }

    const buffer = await generateErrorReportBuffer(previewId);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="bao-cao-loi-nhap-san-pham.xlsx"'
    );
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
};
