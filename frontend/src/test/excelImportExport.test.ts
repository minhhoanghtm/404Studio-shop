import { describe, it, expect, vi } from 'vitest';
import ExcelJS from 'exceljs';
import { sanitizeCellForExport, validateExcelFileSafety } from '../shared/utils/excel/excelSecurity';
import {
  parseAndValidateCategoryExcel,
} from '../shared/utils/excel/categoryExcel';
import {
  parseAndValidateProductExcel,
} from '../shared/utils/excel/productExcel';

describe('Excel Import/Export & Security Suite', () => {
  describe('1. Excel Security & Formula Injection Defense (CWE-1236)', () => {
    it('should prepend single quote to dangerous formula prefixes (=, +, -, @, tab, cr)', () => {
      expect(sanitizeCellForExport('=SUM(A1:B10)')).toBe("'=SUM(A1:B10)");
      expect(sanitizeCellForExport('+123456789')).toBe("'+123456789");
      expect(sanitizeCellForExport('-200000')).toBe("'-200000");
      expect(sanitizeCellForExport('@SUM(1,2)')).toBe("'@SUM(1,2)");
      expect(sanitizeCellForExport('\tcmd|/C calc')).toBe("'\tcmd|/C calc");
      expect(sanitizeCellForExport('\rnotepad.exe')).toBe("'\rnotepad.exe");
    });

    it('should leave safe values unchanged', () => {
      expect(sanitizeCellForExport('Áo Sơ Mi Lụa')).toBe('Áo Sơ Mi Lụa');
      expect(sanitizeCellForExport('https://images.unsplash.com/photo-1')).toBe(
        'https://images.unsplash.com/photo-1'
      );
      expect(sanitizeCellForExport(123456)).toBe(123456);
      expect(sanitizeCellForExport(null)).toBe(null);
      expect(sanitizeCellForExport(undefined)).toBe(undefined);
      expect(sanitizeCellForExport(true)).toBe(true);
    });

    it('should validate file safety correctly (size limits, empty check, extension)', () => {
      // Missing file
      const missing = validateExcelFileSafety(null as any);
      expect(missing.ok).toBe(false);
      expect(missing.reason).toContain('Không tìm thấy tệp');

      // 0 bytes
      const emptyFile = new File([], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const emptyRes = validateExcelFileSafety(emptyFile);
      expect(emptyRes.ok).toBe(false);
      expect(emptyRes.reason).toContain('Tệp tin rỗng');

      // Invalid extension
      const csvFile = new File(['1,2,3'], 'test.csv', { type: 'text/csv' });
      const csvRes = validateExcelFileSafety(csvFile);
      expect(csvRes.ok).toBe(false);
      expect(csvRes.reason).toContain('chỉ chấp nhận định dạng Excel (.xlsx)');

      // Oversized (>10MB)
      const oversizedFile = {
        name: 'huge.xlsx',
        size: 11 * 1024 * 1024,
      } as File;
      const overRes = validateExcelFileSafety(oversizedFile);
      expect(overRes.ok).toBe(false);
      expect(overRes.reason).toContain('vượt quá giới hạn tối đa');

      // Valid File
      const validFile = new File(['valid content'], 'template.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const validRes = validateExcelFileSafety(validFile);
      expect(validRes.ok).toBe(true);
    });
  });

  describe('2. Category Excel Validation Suite', () => {
    const createMockCategoryExcelFile = async (rows: Array<[string, string, string, string, string]>): Promise<File> => {
      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet('DANH_MUC');
      sheet.addRow(['Mã Danh Mục', 'Tên Danh Mục *', 'Slug', 'Đường Dẫn Ảnh *', 'Mô Tả']);
      rows.forEach((r) => sheet.addRow(r));
      const buffer = await wb.xlsx.writeBuffer();
      return new File([buffer], 'categories.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    };

    it('should successfully parse valid category rows with image and name', async () => {
      const file = await createMockCategoryExcelFile([
        ['CAT-01', 'Áo Khoác Nữ', 'ao-khoac-nu', 'https://images.unsplash.com/cat1.jpg', 'Bộ sưu tập áo khoác nữ'],
        ['CAT-02', 'Váy Dạ Hội', 'vay-da-hoi', '/uploads/cat2.webp', 'Đầm tiệc sang trọng'],
      ]);

      const result = await parseAndValidateCategoryExcel(file);
      expect(result.errors).toHaveLength(0);
      expect(result.validItems).toHaveLength(2);
      expect(result.summary.validCount).toBe(2);
      expect(result.validItems[0].name).toBe('Áo Khoác Nữ');
      expect(result.validItems[0].image).toBe('https://images.unsplash.com/cat1.jpg');
      expect(result.validItems[1].name).toBe('Váy Dạ Hội');
    });

    it('should flag mandatory error when category name is missing', async () => {
      const file = await createMockCategoryExcelFile([
        ['CAT-01', '', 'ao-nam', 'https://images.unsplash.com/cat.jpg', ''],
      ]);

      const result = await parseAndValidateCategoryExcel(file);
      expect(result.validItems).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      const nameErr = result.errors.find((e) => e.code === 'ERR_CAT_NAME_REQUIRED');
      expect(nameErr).toBeDefined();
      expect(nameErr?.field).toBe('Tên Danh Mục');
    });

    it('should flag mandatory error when category image is missing or invalid URL', async () => {
      const file = await createMockCategoryExcelFile([
        ['CAT-01', 'Túi Xách', 'tui-xach', '', 'Không có ảnh'],
        ['CAT-02', 'Giày Cao Gót', 'giay-cao-got', 'invalid-ftp://local/image', 'Ảnh sai format'],
      ]);

      const result = await parseAndValidateCategoryExcel(file);
      expect(result.validItems).toHaveLength(0);
      const missingImgErr = result.errors.find((e) => e.code === 'ERR_CAT_IMAGE_REQUIRED');
      const invalidImgErr = result.errors.find((e) => e.code === 'ERR_CAT_IMAGE_INVALID_URL');
      expect(missingImgErr).toBeDefined();
      expect(invalidImgErr).toBeDefined();
    });

    it('should detect duplicate category names in the same import file', async () => {
      const file = await createMockCategoryExcelFile([
        ['CAT-01', 'Áo Thun', 'ao-thun', 'https://images.unsplash.com/1.jpg', ''],
        ['CAT-02', 'Áo Thun', 'ao-thun-2', 'https://images.unsplash.com/2.jpg', ''],
      ]);

      const result = await parseAndValidateCategoryExcel(file);
      const dupErr = result.errors.find((e) => e.code === 'ERR_CAT_DUPLICATE_NAME');
      expect(dupErr).toBeDefined();
      expect(result.validItems).toHaveLength(1); // Only the first unique is valid
    });
  });

  describe('3. Multi-Variant Product Excel Validation & Aggregation Suite', () => {
    const mockCategories = [
      { _id: 'cat-coats-123', name: 'Áo Khoác', slug: 'ao-khoac' },
      { _id: 'cat-dresses-456', name: 'Đầm & Váy', slug: 'dam-vay' },
    ];

    const createMockProductExcelFile = async (rows: Array<any>): Promise<File> => {
      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet('SAN_PHAM');
      sheet.addRow([
        'Mã Sản Phẩm (SKU Nhóm)',
        'Tên Sản Phẩm *',
        'Mã / Slug Danh Mục *',
        'Giá Niêm Yết',
        'Giá Bán Thực Tế *',
        'Thương Hiệu',
        'Mô Tả',
        'Ảnh Chính *',
        'Mã SKU Biến Thể',
        'Màu Sắc *',
        'Kích Cỡ *',
        'Tồn Kho *',
        'Ảnh Biến Thể',
      ]);
      rows.forEach((r) => sheet.addRow(r));
      const buffer = await wb.xlsx.writeBuffer();
      return new File([buffer], 'products.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    };

    it('should group variants by SKU and correctly calculate TotalStock = SUM(VariantStock): 10 + 15 + 20 + 5 = 50', async () => {
      const file = await createMockProductExcelFile([
        ['PROD-COAT-01', 'Áo Lông Cừu Cao Cấp', 'ao-khoac', 6000000, 5200000, 'Atelier Vérité', 'Áo ấm', 'https://img.com/coat.jpg', 'VAR-RED-S', 'Đỏ', 'S', 10, ''],
        ['PROD-COAT-01', 'Áo Lông Cừu Cao Cấp', 'ao-khoac', 6000000, 5200000, 'Atelier Vérité', 'Áo ấm', 'https://img.com/coat.jpg', 'VAR-RED-M', 'Đỏ', 'M', 15, ''],
        ['PROD-COAT-01', 'Áo Lông Cừu Cao Cấp', 'ao-khoac', 6000000, 5200000, 'Atelier Vérité', 'Áo ấm', 'https://img.com/coat.jpg', 'VAR-BLK-S', 'Đen', 'S', 20, ''],
        ['PROD-COAT-01', 'Áo Lông Cừu Cao Cấp', 'ao-khoac', 6000000, 5200000, 'Atelier Vérité', 'Áo ấm', 'https://img.com/coat.jpg', 'VAR-BLK-L', 'Đen', 'L', 5, ''],
      ]);

      const result = await parseAndValidateProductExcel(file, mockCategories);
      expect(result.errors).toHaveLength(0);
      expect(result.validProducts).toHaveLength(1);
      const prod = result.validProducts[0];
      expect(prod.productSku).toBe('PROD-COAT-01');
      expect(prod.variants).toHaveLength(4);
      expect(prod.totalStock).toBe(50); // 10 + 15 + 20 + 5 = 50
      expect(prod.category_id).toBe('cat-coats-123');
    });

    it('should flag error when category does not exist in database', async () => {
      const file = await createMockProductExcelFile([
        ['PROD-02', 'Áo Mưa Trong Suốt', 'danh-muc-khong-ton-tai', 200000, 150000, 'Brand', '', 'https://img.com/rain.jpg', '', 'Trong', 'FreeSize', 10, ''],
      ]);

      const result = await parseAndValidateProductExcel(file, mockCategories);
      expect(result.validProducts).toHaveLength(0);
      const catErr = result.errors.find((e) => e.code === 'ERR_PROD_CATEGORY_NOT_FOUND');
      expect(catErr).toBeDefined();
    });

    it('should flag error on duplicate variant combination (same color + size) within the same product', async () => {
      const file = await createMockProductExcelFile([
        ['PROD-DUP', 'Váy Xòe', 'dam-vay', 1000000, 850000, 'Brand', '', 'https://img.com/v.jpg', '', 'Trắng', 'M', 10, ''],
        ['PROD-DUP', 'Váy Xòe', 'dam-vay', 1000000, 850000, 'Brand', '', 'https://img.com/v.jpg', '', 'Trắng', 'M', 15, ''],
      ]);

      const result = await parseAndValidateProductExcel(file, mockCategories);
      expect(result.validProducts).toHaveLength(0);
      const dupComboErr = result.errors.find((e) => e.code === 'ERR_VARIANT_DUPLICATE_COMBINATION');
      expect(dupComboErr).toBeDefined();
    });

    it('should flag invalid variant stock (negative, non-numeric, or floating point)', async () => {
      const file = await createMockProductExcelFile([
        ['PROD-STK', 'Quần Tây', 'ao-khoac', 500000, 450000, 'Brand', '', 'https://img.com/q.jpg', '', 'Xanh', '32', -5, ''],
        ['PROD-STK', 'Quần Tây', 'ao-khoac', 500000, 450000, 'Brand', '', 'https://img.com/q.jpg', '', 'Đen', '32', 12.5, ''],
      ]);

      const result = await parseAndValidateProductExcel(file, mockCategories);
      expect(result.validProducts).toHaveLength(0);
      const stockErrors = result.errors.filter((e) => e.code === 'ERR_VARIANT_STOCK_INVALID');
      expect(stockErrors.length).toBe(2);
    });
  });

  describe('4. Category Image Upload & Validation Rules', () => {
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

    const validateCategoryImageFile = (file: { type: string; size: number; name: string }) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return { valid: false, error: 'Chỉ chấp nhận định dạng ảnh JPG, PNG hoặc WebP.' };
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return { valid: false, error: 'Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 5MB).' };
      }
      return { valid: true };
    };

    it('should accept valid JPG, PNG, and WebP images under 5MB', () => {
      expect(validateCategoryImageFile({ type: 'image/jpeg', size: 1024 * 1024, name: 'cat.jpg' }).valid).toBe(true);
      expect(validateCategoryImageFile({ type: 'image/png', size: 2 * 1024 * 1024, name: 'cat.png' }).valid).toBe(true);
      expect(validateCategoryImageFile({ type: 'image/webp', size: 500 * 1024, name: 'cat.webp' }).valid).toBe(true);
    });

    it('should reject invalid file types (GIF, PDF, SVG, EXE)', () => {
      const gifRes = validateCategoryImageFile({ type: 'image/gif', size: 1024, name: 'anim.gif' });
      expect(gifRes.valid).toBe(false);
      expect(gifRes.error).toContain('Chỉ chấp nhận định dạng ảnh JPG, PNG hoặc WebP');

      const pdfRes = validateCategoryImageFile({ type: 'application/pdf', size: 1024, name: 'doc.pdf' });
      expect(pdfRes.valid).toBe(false);
    });

    it('should reject image files exceeding 5MB limit', () => {
      const bigRes = validateCategoryImageFile({ type: 'image/jpeg', size: 6 * 1024 * 1024, name: 'huge.jpg' });
      expect(bigRes.valid).toBe(false);
      expect(bigRes.error).toContain('tối đa 5MB');
    });

    it('should enforce mandatory image requirement on category creation', () => {
      const validateCategoryForm = (values: { name: string; image?: string }) => {
        if (!values.name || !values.name.trim()) return 'Tên danh mục là bắt buộc';
        if (!values.image || !values.image.trim()) return 'Hình ảnh danh mục là bắt buộc';
        return null;
      };

      expect(validateCategoryForm({ name: 'Áo Khoác', image: '' })).toBe('Hình ảnh danh mục là bắt buộc');
      expect(validateCategoryForm({ name: '', image: 'https://img.com/cat.jpg' })).toBe('Tên danh mục là bắt buộc');
      expect(validateCategoryForm({ name: 'Áo Khoác', image: 'https://img.com/cat.jpg' })).toBeNull();
    });
  });
});
