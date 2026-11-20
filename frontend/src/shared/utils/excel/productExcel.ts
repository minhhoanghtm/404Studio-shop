import ExcelJS from 'exceljs';
import { sanitizeCellForExport, validateExcelFileSafety } from './excelSecurity';
import { ExcelValidationError } from './categoryExcel';

export interface ParsedProductVariant {
  rowNumber: number;
  sku?: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  image_url: string;
}

export interface ParsedProductGroup {
  rowNumbers: number[];
  productSku: string;
  name: string;
  slug: string;
  category_id: string;
  categoryName?: string;
  old_price: number;
  new_price: number;
  brand: string;
  description: string;
  displayProduct: string[];
  variants: ParsedProductVariant[];
  totalStock: number;
}

export interface ProductImportParseResult {
  validProducts: ParsedProductGroup[];
  errors: ExcelValidationError[];
  summary: {
    totalRows: number;
    totalProducts: number;
    totalVariants: number;
    errorCount: number;
  };
}

/**
 * Generates the standardized Excel template for Multi-Variant Product Import
 */
export const generateProductExcelTemplate = async (
  existingCategories: Array<{ _id: string; name: string; slug: string }>
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Atelier Vérité E-Commerce Engine';
  workbook.created = new Date();

  // 1. INSTRUCTION SHEET
  const instructionSheet = workbook.addWorksheet('HUONG_DAN', {
    views: [{ showGridLines: true }],
  });

  instructionSheet.columns = [
    { header: 'Hạng Mục', key: 'item', width: 28 },
    { header: 'Quy Định & Hướng Dẫn Chi Tiết Nhập Đa Biến Thể', key: 'desc', width: 85 },
  ];

  instructionSheet.addRow({
    item: 'Hình Ảnh Nhúng Trực Tiếp',
    desc: 'Chèn ảnh trực tiếp vào ô tại cột "Ảnh Đại Diện" (và "Ảnh Biến Thể") bằng tính năng Insert (Chèn) → Pictures (Hình ảnh) của Excel. Tuyệt đối không dán link/URL.',
  });
  instructionSheet.addRow({
    item: 'Cấu Trúc Đa Biến Thể',
    desc: 'Mỗi dòng trong bảng tính đại diện cho MỘT BIẾN THỂ (Variant). Các dòng có cùng "Mã Sản Phẩm (SKU Nhóm)" sẽ được tự động gộp thành một sản phẩm duy nhất.',
  });
  instructionSheet.addRow({
    item: 'Tính Tồn Kho Tự Động',
    desc: 'Hệ thống tự động tính TotalStock = SUM(VariantStock). Ví dụ: 10 + 15 + 20 + 5 = 50 sản phẩm. Quý khách không cần cộng thủ công.',
  });
  instructionSheet.addRow({
    item: 'Quy Tắc Biến Thể',
    desc: 'Trong cùng một sản phẩm, không được có 2 dòng trùng lặp cả Màu Sắc (Color) và Kích Cỡ (Size). Số lượng tồn kho phải là số nguyên >= 0.',
  });
  instructionSheet.addRow({
    item: 'Danh Mục Sản Phẩm',
    desc: 'Cột "Mã / Slug Danh Mục *" cần điền chính xác mã _ID hoặc slug danh mục có sẵn (Xem sheet DANH_MUC_HOP_LE).',
  });
  instructionSheet.addRow({
    item: 'Bảo Vệ & An Toàn',
    desc: 'Không chèn công thức Excel (bắt đầu bằng =, +, -, @). Hệ thống sẽ kiểm tra và báo lỗi chính xác từng dòng/cột trước khi lưu.',
  });

  instructionSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  instructionSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1A1A1A' },
  };

  // 2. DATA ENTRY SHEET
  const dataSheet = workbook.addWorksheet('SAN_PHAM', {
    views: [{ showGridLines: true }],
  });

  dataSheet.columns = [
    { header: 'Mã Sản Phẩm (SKU Nhóm) *', key: 'productSku', width: 25 },
    { header: 'Tên Sản Phẩm *', key: 'productName', width: 35 },
    { header: 'Mã / Slug Danh Mục *', key: 'categoryCode', width: 25 },
    { header: 'Giá Niêm Yết Gốc (VNĐ)', key: 'oldPrice', width: 22 },
    { header: 'Giá Bán Thực Tế (VNĐ) *', key: 'newPrice', width: 24 },
    { header: 'Thương Hiệu', key: 'brand', width: 20 },
    { header: 'Mô Tả Sản Phẩm', key: 'desc', width: 40 },
    { header: 'Ảnh Đại Diện (Chèn ảnh vào ô) *', key: 'productImage', width: 18 },
    { header: 'Mã SKU Biến Thể', key: 'variantSku', width: 25 },
    { header: 'Màu Sắc *', key: 'color', width: 18 },
    { header: 'Kích Cỡ *', key: 'size', width: 15 },
    { header: 'Tồn Kho Biến Thể *', key: 'stock', width: 20 },
    { header: 'Ảnh Biến Thể (Chèn ảnh vào ô)', key: 'variantImage', width: 18 },
  ];

  const headerRow = dataSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFD4AF37' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF121212' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;

  // Add sample multi-variant rows (Áo Khoác Dạ Lông Cừu: 10 + 15 + 20 + 5 = 50)
  const sampleCatSlug = existingCategories[0]?.slug || 'outerwear';
  dataSheet.addRows([
    {
      productSku: 'ATV-COAT-BIELLA',
      productName: 'Áo Khoác Dạ Lông Cừu Biella',
      categoryCode: sampleCatSlug,
      oldPrice: 35000000,
      newPrice: 29000000,
      brand: 'Atelier Vérité',
      desc: 'Chất liệu dạ cừu tự nhiên dệt thủ công tại vùng Piedmont, ve áo cắt xéo kiến trúc.',
      productImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
      variantSku: 'ATV-COAT-RED-S',
      color: 'Đỏ',
      size: 'S',
      stock: 10,
      variantImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
    },
    {
      productSku: 'ATV-COAT-BIELLA',
      productName: 'Áo Khoác Dạ Lông Cừu Biella',
      categoryCode: sampleCatSlug,
      oldPrice: 35000000,
      newPrice: 29000000,
      brand: 'Atelier Vérité',
      desc: 'Chất liệu dạ cừu tự nhiên dệt thủ công tại vùng Piedmont, ve áo cắt xéo kiến trúc.',
      productImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
      variantSku: 'ATV-COAT-RED-M',
      color: 'Đỏ',
      size: 'M',
      stock: 15,
      variantImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
    },
    {
      productSku: 'ATV-COAT-BIELLA',
      productName: 'Áo Khoác Dạ Lông Cừu Biella',
      categoryCode: sampleCatSlug,
      oldPrice: 35000000,
      newPrice: 29000000,
      brand: 'Atelier Vérité',
      desc: 'Chất liệu dạ cừu tự nhiên dệt thủ công tại vùng Piedmont, ve áo cắt xéo kiến trúc.',
      productImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
      variantSku: 'ATV-COAT-BLK-S',
      color: 'Đen',
      size: 'S',
      stock: 20,
      variantImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
    },
    {
      productSku: 'ATV-COAT-BIELLA',
      productName: 'Áo Khoác Dạ Lông Cừu Biella',
      categoryCode: sampleCatSlug,
      oldPrice: 35000000,
      newPrice: 29000000,
      brand: 'Atelier Vérité',
      desc: 'Chất liệu dạ cừu tự nhiên dệt thủ công tại vùng Piedmont, ve áo cắt xéo kiến trúc.',
      productImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
      variantSku: 'ATV-COAT-BLK-L',
      color: 'Đen',
      size: 'L',
      stock: 5,
      variantImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
    },
  ]);

  // 3. AVAILABLE CATEGORIES REFERENCE SHEET
  const catSheet = workbook.addWorksheet('DANH_MUC_HOP_LE', {
    views: [{ showGridLines: true }],
  });

  catSheet.columns = [
    { header: 'Mã Hệ Thống (_ID)', key: 'id', width: 28 },
    { header: 'Tên Danh Mục Thời Trang', key: 'name', width: 35 },
    { header: 'Slug Danh Mục (Khuyên dùng)', key: 'slug', width: 28 },
  ];

  catSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  catSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2A2A2A' },
  };

  existingCategories.forEach((cat) => {
    catSheet.addRow({
      id: cat._id,
      name: cat.name,
      slug: cat.slug,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer, 'product-import-template.xlsx');
};

/**
 * Exports current products and their variants to Excel (1 row per variant)
 */
export const exportProductsToExcel = async (
  products: any[],
  categoriesList: any[],
  options?: {
    scope?: 'all' | 'filtered' | 'selected';
    ids?: string[];
    category?: string;
    search?: string;
    includeImages?: boolean;
  }
): Promise<void> => {
  // 1. Try Backend Server-Side Export with Embedded Images & Sharp normalization
  try {
    const { adminApi } = await import('@/shared/api');
    const blob = await adminApi.exportProductsExcel({
      scope: options?.scope || 'all',
      ids: options?.ids,
      category: options?.category,
      search: options?.search,
      includeImages: options?.includeImages !== false,
    });
    const dateStr = new Date().toISOString().split('T')[0];
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `danh-sach-san-pham-${dateStr}.xlsx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
    return;
  } catch (backendErr) {
    console.warn('Backend excel export failed or unavailable, falling back to client-side generator:', backendErr);
  }

  // 2. Client-side fallback generator
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Atelier Vérité Admin System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('DANH_SACH_SAN_PHAM', {
    views: [{ showGridLines: true }],
  });

  const catMap = new Map<string, string>();
  categoriesList.forEach((c) => {
    if (c._id) catMap.set(String(c._id), c.name);
    if (c.slug) catMap.set(c.slug, c.name);
  });

  sheet.columns = [
    { header: 'Mã Sản Phẩm (SKU Nhóm)', key: 'productSku', width: 25 },
    { header: 'Tên Sản Phẩm', key: 'productName', width: 35 },
    { header: 'Slug Sản Phẩm', key: 'slug', width: 25 },
    { header: 'Danh Mục', key: 'category', width: 25 },
    { header: 'Giá Niêm Yết', key: 'oldPrice', width: 18 },
    { header: 'Giá Khuyến Mãi', key: 'newPrice', width: 18 },
    { header: 'Thương Hiệu', key: 'brand', width: 18 },
    { header: 'Mã SKU Biến Thể', key: 'variantSku', width: 24 },
    { header: 'Màu Sắc', key: 'color', width: 18 },
    { header: 'Kích Cỡ', key: 'size', width: 12 },
    { header: 'Tồn Kho Biến Thể', key: 'stock', width: 18 },
    { header: 'Ảnh Đại Diện', key: 'image', width: 18 },
    { header: 'Trạng Thái', key: 'status', width: 15 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFD4AF37' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF121212' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  products.forEach((p) => {
    const variants = Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : [null];
    const categoryName = catMap.get(String(p.category_id)) || p.category_id || 'Chưa phân loại';

    variants.forEach((v: any) => {
      const row = sheet.addRow({
        productSku: sanitizeCellForExport(p.slug ? `ATV-${p.slug.toUpperCase()}` : p._id || ''),
        productName: sanitizeCellForExport(p.name || ''),
        slug: sanitizeCellForExport(p.slug || ''),
        category: sanitizeCellForExport(categoryName),
        oldPrice: p.old_price || 0,
        newPrice: p.new_price || 0,
        brand: sanitizeCellForExport(p.brand || 'Atelier Vérité'),
        variantSku: sanitizeCellForExport(v?.sku || (v ? `VAR-${v.color}-${v.size}` : 'DEFAULT')),
        color: sanitizeCellForExport(v?.color || 'Tiêu chuẩn'),
        size: sanitizeCellForExport(v?.size || 'FreeSize'),
        stock: v ? Number(v.stock || 0) : Number(p.stock || 0),
        image: '', // Leave empty text for image cell
        status: p.is_active !== false ? 'Đang mở bán' : 'Ngừng bán',
      });
      row.height = 60;
      row.alignment = { vertical: 'middle' };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = new Date().toISOString().split('T')[0];
  triggerDownload(buffer, `danh-sach-san-pham-${dateStr}.xlsx`);
};

/**
 * Parses, validates, and groups multi-variant product rows from an Excel file
 */
export const parseAndValidateProductExcel = async (
  file: File,
  availableCategories: any[]
): Promise<ProductImportParseResult> => {
  const safety = validateExcelFileSafety(file);
  if (!safety.ok) {
    throw new Error(safety.reason);
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const sheet = workbook.getWorksheet('SAN_PHAM') || workbook.worksheets[0];
  if (!sheet) {
    throw new Error('Tệp Excel không chứa bảng tính (sheet) hợp lệ.');
  }

  // Build category lookup maps
  const catById = new Map<string, any>();
  const catBySlug = new Map<string, any>();
  const catByName = new Map<string, any>();

  availableCategories.forEach((cat) => {
    if (cat._id) catById.set(String(cat._id), cat);
    if (cat.id) catById.set(String(cat.id), cat);
    if (cat.slug) catBySlug.set(String(cat.slug).toLowerCase(), cat);
    if (cat.name) catByName.set(String(cat.name).toLowerCase(), cat);
  });

  // Extract all embedded images from the sheet
  const rawImages = (sheet as any).getImages?.() || [];
  const embeddedImagesByCell = new Map<string, string>();

  for (const img of rawImages) {
    const range = img.range;
    if (!range || !range.tl) continue;
    const r = (range.tl.nativeRow != null ? range.tl.nativeRow : Math.floor(range.tl.row)) + 1;
    const c = (range.tl.nativeCol != null ? range.tl.nativeCol : Math.floor(range.tl.col)) + 1;
    try {
      const media = workbook.getImage(Number(img.imageId));
      if (media && media.buffer) {
        const u8 = new Uint8Array(media.buffer);
        let binary = '';
        for (let i = 0; i < u8.length; i++) {
          binary += String.fromCharCode(u8[i]);
        }
        const base64 = btoa(binary);
        const ext = media.extension || 'png';
        const dataUrl = `data:image/${ext};base64,${base64}`;
        embeddedImagesByCell.set(`${r}:${c}`, dataUrl);
        if (!embeddedImagesByCell.has(`${r}:primary`)) {
          embeddedImagesByCell.set(`${r}:primary`, dataUrl);
        }
      }
    } catch {
      // Ignore corrupted individual media items
    }
  }
  const colMap = {
    productSku: 1,
    productName: 2,
    categoryCode: 3,
    oldPrice: 4,
    newPrice: 5,
    brand: 6,
    desc: 7,
    productImage: 8,
    variantSku: 9,
    color: 10,
    size: 11,
    stock: 12,
    variantImage: 13,
  };

  headerRow.eachCell((cell, colNumber) => {
    const val = String(cell.value || '').trim().toLowerCase();
    if (val.includes('mã sản phẩm') || (val.includes('sku') && val.includes('nhóm'))) colMap.productSku = colNumber;
    else if (val.includes('tên') && val.includes('sản phẩm')) colMap.productName = colNumber;
    else if (val.includes('danh mục')) colMap.categoryCode = colNumber;
    else if (val.includes('giá niêm yết') || val.includes('giá gốc')) colMap.oldPrice = colNumber;
    else if (val.includes('giá bán') || val.includes('giá khuyến mãi')) colMap.newPrice = colNumber;
    else if (val.includes('thương hiệu') || val.includes('brand')) colMap.brand = colNumber;
    else if (val.includes('mô tả') || val.includes('desc')) colMap.desc = colNumber;
    else if ((val.includes('ảnh') || val.includes('image')) && val.includes('chính')) colMap.productImage = colNumber;
    else if (val.includes('màu') || val.includes('color')) colMap.color = colNumber;
    else if (val.includes('cỡ') || val.includes('size')) colMap.size = colNumber;
    else if (val.includes('tồn kho') || val.includes('stock')) colMap.stock = colNumber;
    else if ((val.includes('ảnh') || val.includes('image')) && val.includes('biến thể')) colMap.variantImage = colNumber;
  });

  const errors: ExcelValidationError[] = [];
  const errorRowNumbers = new Set<number>();
  const addError = (err: ExcelValidationError) => {
    errors.push(err);
    errorRowNumbers.add(err.row);
  };
  const groups = new Map<string, {
    productSku: string;
    rows: Array<{
      rowNumber: number;
      productName: string;
      categoryCode: string;
      oldPrice: number;
      newPrice: number;
      brand: string;
      description: string;
      productImage: string;
      variantSku: string;
      color: string;
      size: string;
      stock: number;
      variantImage: string;
    }>;
  }>();

  let totalRows = 0;

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const isRowEmpty = !row.values || (Array.isArray(row.values) && row.values.every((v) => v === null || v === undefined || v === ''));
    if (isRowEmpty) continue;

    totalRows++;

    const productSku = String(row.getCell(colMap.productSku).value || '').trim();
    const productName = String(row.getCell(colMap.productName).value || '').trim();
    const categoryCode = String(row.getCell(colMap.categoryCode).value || '').trim();
    const rawOldPrice = row.getCell(colMap.oldPrice).value;
    const rawNewPrice = row.getCell(colMap.newPrice).value;
    const brand = String(row.getCell(colMap.brand).value || 'Atelier Vérité').trim();
    const desc = String(row.getCell(colMap.desc).value || '').trim();
    const productImage = String(row.getCell(colMap.productImage).value || '').trim();

    const variantSku = String(row.getCell(colMap.variantSku).value || '').trim();
    const color = String(row.getCell(colMap.color).value || '').trim();
    const size = String(row.getCell(colMap.size).value || '').trim();
    const rawStock = row.getCell(colMap.stock).value;
    const variantImage = String(row.getCell(colMap.variantImage).value || '').trim();

    // Check Product Name
    if (!productName) {
      addError({
        sheet: sheet.name,
        row: r,
        col: getColumnLetter(colMap.productName),
        field: 'Tên Sản Phẩm',
        code: 'ERR_PROD_NAME_REQUIRED',
        message: 'Tên sản phẩm không được để trống.',
        fix: 'Nhập tên sản phẩm thời trang.',
      });
    }

    // Check Category Code
    let resolvedCategory: any = null;
    if (!categoryCode) {
      addError({
        sheet: sheet.name,
        row: r,
        col: getColumnLetter(colMap.categoryCode),
        field: 'Mã / Slug Danh Mục',
        code: 'ERR_PROD_CATEGORY_REQUIRED',
        message: 'Mã hoặc slug danh mục không được để trống.',
        fix: 'Nhập slug hoặc _ID danh mục hợp lệ từ sheet DANH_MUC_HOP_LE.',
      });
    } else {
      resolvedCategory =
        catById.get(categoryCode) ||
        catBySlug.get(categoryCode.toLowerCase()) ||
        catByName.get(categoryCode.toLowerCase());

      if (!resolvedCategory) {
        addError({
          sheet: sheet.name,
          row: r,
          col: getColumnLetter(colMap.categoryCode),
          field: 'Mã / Slug Danh Mục',
          code: 'ERR_PROD_CATEGORY_NOT_FOUND',
          message: `Không tìm thấy danh mục phù hợp với mã/slug "${categoryCode}" trong hệ thống.`,
          fix: 'Kiểm tra sheet DANH_MUC_HOP_LE để chọn đúng slug hoặc _ID danh mục đang tồn tại.',
        });
      }
    }

    // Check Prices
    const oldPriceNum = Number(rawOldPrice) || 0;
    const newPriceNum = Number(rawNewPrice);
    if (isNaN(newPriceNum) || newPriceNum < 0) {
      addError({
        sheet: sheet.name,
        row: r,
        col: getColumnLetter(colMap.newPrice),
        field: 'Giá Bán Thực Tế',
        code: 'ERR_PROD_PRICE_INVALID',
        message: 'Giá bán thực tế phải là số hợp lệ lớn hơn hoặc bằng 0.',
        fix: 'Nhập số tiền VNĐ (VD: 29000000).',
      });
    }

    // Check Variant Color & Size
    if (!color) {
      addError({
        sheet: sheet.name,
        row: r,
        col: getColumnLetter(colMap.color),
        field: 'Màu Sắc Biến Thể',
        code: 'ERR_VARIANT_COLOR_REQUIRED',
        message: 'Màu sắc của biến thể không được để trống.',
        fix: 'Nhập tên màu (VD: Đen, Trắng, Đỏ).',
      });
    }

    if (!size) {
      addError({
        sheet: sheet.name,
        row: r,
        col: getColumnLetter(colMap.size),
        field: 'Kích Cỡ Biến Thể',
        code: 'ERR_VARIANT_SIZE_REQUIRED',
        message: 'Kích cỡ của biến thể không được để trống.',
        fix: 'Nhập kích cỡ (VD: XS, S, M, L, XL, XXL, FreeSize).',
      });
    }

    // Check Stock
    const stockNum = Number(rawStock);
    if (!Number.isInteger(stockNum) || stockNum < 0 || isNaN(stockNum)) {
      addError({
        sheet: sheet.name,
        row: r,
        col: getColumnLetter(colMap.stock),
        field: 'Tồn Kho Biến Thể',
        code: 'ERR_VARIANT_STOCK_INVALID',
        message: `Số lượng tồn kho "${rawStock}" không hợp lệ. Tồn kho phải là số nguyên không âm (>= 0).`,
        fix: 'Nhập số nguyên không âm (VD: 0, 10, 25).',
      });
    }

    // Grouping key: Use productSku if provided, else fallback to trimmed productName
    const groupKey = productSku || productName.toLowerCase();

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        productSku: productSku || `SKU-${Date.now()}`,
        rows: [],
      });
    }

    groups.get(groupKey)!.rows.push({
      rowNumber: r,
      productName,
      categoryCode,
      oldPrice: oldPriceNum,
      newPrice: isNaN(newPriceNum) ? 0 : newPriceNum,
      brand,
      description: desc,
      productImage: productImage || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
      variantSku,
      color,
      size,
      stock: Number.isInteger(stockNum) && stockNum >= 0 ? stockNum : 0,
      variantImage: variantImage || productImage || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
    });
  }

  // Validate each product group for internal duplicate variants & consistency
  const validProducts: ParsedProductGroup[] = [];

  groups.forEach((group) => {
    const firstRow = group.rows[0];
    if (!firstRow) return;

    // Check duplicate color + size within this product group
    const seenCombos = new Set<string>();
    let hasGroupError = false;

    group.rows.forEach((r) => {
      const combo = `${r.color.trim().toLowerCase()}_${r.size.trim().toLowerCase()}`;
      if (seenCombos.has(combo)) {
        errors.push({
          sheet: sheet.name,
          row: r.rowNumber,
          col: getColumnLetter(colMap.color),
          field: 'Màu Sắc + Kích Cỡ',
          code: 'ERR_VARIANT_DUPLICATE_COMBINATION',
          message: `Sản phẩm "${r.productName}" đã có biến thể màu "${r.color}" và cỡ "${r.size}". Không được tạo trùng tổ hợp trong cùng sản phẩm.`,
          fix: 'Xóa dòng trùng lặp hoặc điều chỉnh màu sắc/kích cỡ riêng biệt.',
        });
        hasGroupError = true;
      } else {
        seenCombos.add(combo);
      }
    });

    // Check if category resolves
    const resolvedCat =
      catById.get(firstRow.categoryCode) ||
      catBySlug.get(firstRow.categoryCode.toLowerCase()) ||
      catByName.get(firstRow.categoryCode.toLowerCase());

    if (!firstRow.productName || !resolvedCat || group.rows.some((r) => errorRowNumbers.has(r.rowNumber))) {
      hasGroupError = true;
    }

    if (!hasGroupError) {
      const variants: ParsedProductVariant[] = group.rows.map((r) => ({
        rowNumber: r.rowNumber,
        sku: r.variantSku || undefined,
        color: r.color,
        size: r.size,
        price: r.newPrice,
        stock: r.stock,
        image_url: r.variantImage,
      }));

      // TotalStock = SUM(VariantStock)
      const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

      const generatedSlug = firstRow.productName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      validProducts.push({
        rowNumbers: group.rows.map((r) => r.rowNumber),
        productSku: group.productSku,
        name: firstRow.productName,
        slug: generatedSlug,
        category_id: resolvedCat._id || resolvedCat.id,
        categoryName: resolvedCat.name,
        old_price: firstRow.oldPrice,
        new_price: firstRow.newPrice,
        brand: firstRow.brand,
        description: firstRow.description,
        displayProduct: [firstRow.productImage],
        variants,
        totalStock,
      });
    }
  });

  const totalVariantsCount = validProducts.reduce((sum, p) => sum + p.variants.length, 0);

  return {
    validProducts,
    errors,
    summary: {
      totalRows,
      totalProducts: validProducts.length,
      totalVariants: totalVariantsCount,
      errorCount: errors.length,
    },
  };
};

const triggerDownload = (buffer: ExcelJS.Buffer, filename: string) => {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

const getColumnLetter = (colIndex: number): string => {
  let temp = colIndex;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter || 'A';
};
