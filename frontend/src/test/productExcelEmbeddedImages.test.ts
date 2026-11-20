import { describe, it, expect, vi } from 'vitest';
import ExcelJS from 'exceljs';
import {
  generateProductExcelTemplate,
  parseAndValidateProductExcel,
} from '../shared/utils/excel/productExcel';

// Small 1x1 transparent PNG buffer for mock image testing
const MOCK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('Product Excel Embedded Images Suite (Frontend)', () => {
  const mockCategories = [
    { _id: 'cat-001', id: 'cat-001', name: 'Áo Sơ Mi Cao Cấp', slug: 'ao-so-mi-cao-cap' },
    { _id: 'cat-002', id: 'cat-002', name: 'Quần Âu May Đo', slug: 'quan-au-may-do' },
  ];

  describe('1. Embedded Image Extraction from Excel', () => {
    it('should extract embedded images anchored to product image column and variant column', async () => {
      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet('DANH_SACH_SAN_PHAM');

      // Add Headers
      sheet.addRow([
        'Mã Sản Phẩm (SKU Nhóm) *',
        'Tên Sản Phẩm *',
        'Mã / Slug Danh Mục *',
        'Giá Niêm Yết Gốc (VNĐ)',
        'Giá Bán Thực Tế (VNĐ) *',
        'Thương Hiệu',
        'Mô Tả Sản Phẩm',
        'Ảnh Đại Diện (Nhúng trực tiếp vào ô) *',
        'Mã SKU Biến Thể',
        'Màu Sắc *',
        'Kích Cỡ *',
        'Tồn Kho Biến Thể *',
        'Ảnh Biến Thể (Nhúng vào ô)',
      ]);

      // Add Data Row with EMPTY text in image cell (Cell 8 and Cell 13)
      sheet.addRow([
        'PROD-TEST-EMBED',
        'Áo Sơ Mi Lụa Nhúng Ảnh',
        'ao-so-mi-cao-cap',
        '1200000',
        '950000',
        'Atelier Vérité',
        'Áo sơ mi cao cấp dệt lụa tự nhiên',
        '', // Empty text in image cell!
        'VAR-EMBED-01',
        'Trắng Ngà',
        'L',
        '15',
        '', // Empty text in variant image cell
      ]);

      // Embed image buffer using ExcelJS
      const binaryString = atob(MOCK_PNG_BASE64);
      const imageBuf = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imageBuf[i] = binaryString.charCodeAt(i);
      }
      const imageId = wb.addImage({
        buffer: imageBuf as any,
        extension: 'png',
      });

      // Anchor to Row 2, Column 8 (0-indexed: nativeRow = 1, nativeCol = 7)
      sheet.addImage(imageId, {
        tl: { col: 7, row: 1, nativeCol: 7, nativeRow: 1 } as any,
        ext: { width: 80, height: 80 },
        editAs: 'oneCell',
      });

      const excelBuffer = await wb.xlsx.writeBuffer();
      const testFile = new File([excelBuffer], 'embedded-test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await parseAndValidateProductExcel(testFile, mockCategories);

      expect(result.errors).toHaveLength(0);
      expect(result.validProducts).toHaveLength(1);

      const prod = result.validProducts[0];
      expect(prod.name).toBe('Áo Sơ Mi Lụa Nhúng Ảnh');
      expect(prod.productSku).toBe('PROD-TEST-EMBED');
      expect(prod.totalStock).toBe(15);
      expect(prod.variants).toHaveLength(1);

      // Embedded image should be extracted as base64 data URI
      expect(prod.displayProduct[0]).toMatch(/^data:image\/png;base64,/);
    });

    it('should support backward compatibility for legacy text URLs when embedded image is missing', async () => {
      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet('DANH_SACH_SAN_PHAM');

      sheet.addRow([
        'Mã Sản Phẩm (SKU Nhóm) *',
        'Tên Sản Phẩm *',
        'Mã / Slug Danh Mục *',
        'Giá Niêm Yết Gốc (VNĐ)',
        'Giá Bán Thực Tế (VNĐ) *',
        'Thương Hiệu',
        'Mô Tả Sản Phẩm',
        'Ảnh Đại Diện (Nhúng trực tiếp vào ô) *',
        'Mã SKU Biến Thể',
        'Màu Sắc *',
        'Kích Cỡ *',
        'Tồn Kho Biến Thể *',
        'Ảnh Biến Thể (Nhúng vào ô)',
      ]);

      // Row with legacy text URL
      sheet.addRow([
        'PROD-LEGACY',
        'Áo Polo Dệt Kim Cổ Điển',
        'cat-001',
        '850000',
        '650000',
        'Atelier Vérité',
        'Chất liệu cotton Ai Cập',
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
        'VAR-LEGACY-01',
        'Xanh Navy',
        'M',
        '20',
        '',
      ]);

      const excelBuffer = await wb.xlsx.writeBuffer();
      const testFile = new File([excelBuffer], 'legacy-test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await parseAndValidateProductExcel(testFile, mockCategories);

      expect(result.validProducts).toHaveLength(1);
      const prod = result.validProducts[0];
      expect(prod.displayProduct[0]).toBe('https://images.unsplash.com/photo-1521572267360-ee0c2909d518');

      // Should contain warning recommending embedded image
      const legacyWarning = result.warnings?.find((w) => w.message.toLowerCase().includes('khuyên dùng ảnh nhúng'));
      expect(legacyWarning).toBeDefined();
    });
  });

  describe('2. Template Generation Suite with Embedded Image Sizing', () => {
    it('should generate pre-sized cells (row height 60pt and col width 18) for image embedding', async () => {
      // Mock document.createElement and anchor click for download test in jsdom
      const linkClickSpy = vi.fn();
      const createElementOriginal = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const el = createElementOriginal(tagName);
        if (tagName === 'a') {
          el.click = linkClickSpy;
        }
        return el;
      });

      // Global URL.createObjectURL mock
      const createObjectURLSpy = vi.fn(() => 'blob:mock-url');
      const revokeObjectURLSpy = vi.fn();
      window.URL.createObjectURL = createObjectURLSpy as any;
      window.URL.revokeObjectURL = revokeObjectURLSpy as any;

      await generateProductExcelTemplate(mockCategories);

      expect(linkClickSpy).toHaveBeenCalled();
      expect(createObjectURLSpy).toHaveBeenCalled();
    });
  });

  describe('3. Multi-Variant Grouping and Stock Aggregation', () => {
    it('should aggregate variant stocks under the same productSku without duplicating product', async () => {
      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet('DANH_SACH_SAN_PHAM');

      sheet.addRow([
        'Mã Sản Phẩm (SKU Nhóm) *',
        'Tên Sản Phẩm *',
        'Mã / Slug Danh Mục *',
        'Giá Niêm Yết Gốc (VNĐ)',
        'Giá Bán Thực Tế (VNĐ) *',
        'Thương Hiệu',
        'Mô Tả Sản Phẩm',
        'Ảnh Đại Diện (Nhúng trực tiếp vào ô) *',
        'Mã SKU Biến Thể',
        'Màu Sắc *',
        'Kích Cỡ *',
        'Tồn Kho Biến Thể *',
        'Ảnh Biến Thể (Nhúng vào ô)',
      ]);

      // Row 1: Size S
      sheet.addRow([
        'PROD-GROUPED',
        'Quần Tây May Đo Ý',
        'quan-au-may-do',
        '2000000',
        '1750000',
        'Atelier Vérité',
        'Vải len lông cừu Merino',
        'https://images.unsplash.com/photo-test',
        'VAR-G-01',
        'Đen Charcoal',
        'S',
        '8',
        '',
      ]);

      // Row 2: Size M (Same SKU Nhóm)
      sheet.addRow([
        'PROD-GROUPED',
        'Quần Tây May Đo Ý',
        'quan-au-may-do',
        '2000000',
        '1750000',
        'Atelier Vérité',
        'Vải len lông cừu Merino',
        '',
        'VAR-G-02',
        'Đen Charcoal',
        'M',
        '12',
        '',
      ]);

      const excelBuffer = await wb.xlsx.writeBuffer();
      const testFile = new File([excelBuffer], 'grouped-test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await parseAndValidateProductExcel(testFile, mockCategories);

      expect(result.validProducts).toHaveLength(1);
      const prod = result.validProducts[0];
      expect(prod.variants).toHaveLength(2);
      expect(prod.totalStock).toBe(20); // 8 + 12
    });
  });
});
