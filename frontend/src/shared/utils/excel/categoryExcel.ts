import ExcelJS from 'exceljs';
import { sanitizeCellForExport, validateExcelFileSafety } from './excelSecurity';

export interface CategoryExcelRow {
  rowNumber: number;
  name: string;
  image: string;
  slug?: string;
  rawCode?: string;
}

export interface ExcelValidationError {
  sheet: string;
  row: number;
  col: string;
  field: string;
  code: string;
  message: string;
  fix: string;
}

export interface CategoryImportParseResult {
  validItems: CategoryExcelRow[];
  errors: ExcelValidationError[];
  summary: {
    totalRows: number;
    validCount: number;
    errorCount: number;
  };
}

/**
 * Generates the standardized Excel template for Category Import
 */
export const generateCategoryExcelTemplate = async (): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Atelier Vérité E-Commerce Engine';
  workbook.created = new Date();

  // 1. INSTRUCTION SHEET
  const instructionSheet = workbook.addWorksheet('HUONG_DAN', {
    views: [{ showGridLines: true }],
  });

  instructionSheet.columns = [
    { header: 'Hạng Mục', key: 'item', width: 25 },
    { header: 'Quy Định & Hướng Dẫn Chi Tiết', key: 'desc', width: 75 },
  ];

  instructionSheet.addRow({
    item: 'Tên Tệp Tin',
    desc: 'category-import-template.xlsx — Bản mẫu nhập danh mục chuẩn hóa',
  });
  instructionSheet.addRow({
    item: 'Yêu Cầu Bắt Buộc',
    desc: 'Cột "Tên Danh Mục *" và "Đường Dẫn Ảnh *" là bắt buộc đối với tất cả các dòng.',
  });
  instructionSheet.addRow({
    item: 'Quy Tắc Đường Dẫn Ảnh',
    desc: 'Phải là đường dẫn HTTPS hợp lệ trỏ tới ảnh (JPG, PNG, WEBP) hoặc ảnh đã tải lên hệ thống.',
  });
  instructionSheet.addRow({
    item: 'Quy Tắc Tên & Slug',
    desc: 'Tên danh mục không được trùng lặp. Hệ thống sẽ tự động tạo chuỗi định danh slug chuẩn SEO nếu để trống.',
  });
  instructionSheet.addRow({
    item: 'Quy Tắc An Toàn',
    desc: 'Không chèn công thức Excel (bắt đầu bằng =, +, -, @). Dữ liệu được kiểm duyệt tự động trước khi lưu.',
  });

  // Style header row of instruction
  instructionSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  instructionSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1A1A1A' },
  };

  // 2. DATA ENTRY SHEET
  const dataSheet = workbook.addWorksheet('DANH_MUC', {
    views: [{ showGridLines: true }],
  });

  dataSheet.columns = [
    { header: 'Mã Danh Mục (Tùy Chọn)', key: 'code', width: 22 },
    { header: 'Tên Danh Mục *', key: 'name', width: 35 },
    { header: 'Đường Dẫn Slug (Tùy Chọn)', key: 'slug', width: 25 },
    { header: 'Đường Dẫn Ảnh Đại Diện (Image URL) *', key: 'image', width: 55 },
    { header: 'Mô Tả Danh Mục', key: 'desc', width: 45 },
  ];

  const dataHeaderRow = dataSheet.getRow(1);
  dataHeaderRow.font = { bold: true, color: { argb: 'FFD4AF37' } }; // Champagne color
  dataHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF121212' },
  };
  dataHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
  dataHeaderRow.height = 28;

  // Add an empty guide row
  dataSheet.addRow({
    code: 'CAT-VD-01',
    name: 'Áo Khoác Dạ Len Biella (Ví dụ)',
    slug: 'ao-khoac-da-len-biella',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
    desc: 'Dòng áo khoác dạ cừu thủ công Haute Couture',
  });

  // 3. SAMPLE DATA SHEET
  const sampleSheet = workbook.addWorksheet('DU_LIEU_MAU', {
    views: [{ showGridLines: true }],
  });

  sampleSheet.columns = [
    { header: 'Mã Danh Mục', key: 'code', width: 20 },
    { header: 'Tên Danh Mục', key: 'name', width: 32 },
    { header: 'Slug', key: 'slug', width: 22 },
    { header: 'Đường Dẫn Ảnh', key: 'image', width: 55 },
    { header: 'Mô Tả Chi Tiết', key: 'desc', width: 40 },
  ];

  sampleSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sampleSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2A2A2A' },
  };

  sampleSheet.addRows([
    {
      code: 'CAT-OUTERWEAR',
      name: 'Áo Khoác Haute Couture',
      slug: 'ao-khoac-haute-couture',
      image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
      desc: 'Dạ len Cashmere Biella và Shearling đúc khối kiến trúc',
    },
    {
      code: 'CAT-GOWNS',
      name: 'Đầm Lụa Dạ Tiệc',
      slug: 'dam-lua-da-tiec',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
      desc: 'Cắt xéo 45 độ trên lụa Lyon 30-momme',
    },
    {
      code: 'CAT-TAILORING',
      name: 'Đồ May Đo Thượng Khách',
      slug: 'do-may-do-thuong-khach',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
      desc: 'Âu phục nam may đo thủ công, sơ mi lanh Normandy',
    },
    {
      code: 'CAT-ACCESSORIES',
      name: 'Phụ Kiện Da Thật & Trang Sức',
      slug: 'phu-kien-da-that-trang-suc',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
      desc: 'Da Box Calfskin tay cầm gỗ sồi và bạc Vermeil mạ vàng',
    },
  ]);

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer, 'category-import-template.xlsx');
};

/**
 * Exports current categories list to an Excel workbook
 */
export const exportCategoriesToExcel = async (categories: any[]): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Atelier Vérité Admin System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('DANH_SACH_DANH_MUC', {
    views: [{ showGridLines: true }],
  });

  sheet.columns = [
    { header: 'Mã Hệ Thống (_ID)', key: 'id', width: 28 },
    { header: 'Tên Danh Mục', key: 'name', width: 35 },
    { header: 'Slug Định Danh', key: 'slug', width: 28 },
    { header: 'Đường Dẫn Hình Ảnh', key: 'image', width: 55 },
    { header: 'Ngày Tạo', key: 'createdAt', width: 22 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFD4AF37' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF121212' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 26;

  categories.forEach((cat) => {
    sheet.addRow({
      id: sanitizeCellForExport(cat._id || cat.id || ''),
      name: sanitizeCellForExport(cat.name || ''),
      slug: sanitizeCellForExport(cat.slug || ''),
      image: sanitizeCellForExport(cat.image || ''),
      createdAt: cat.createdAt ? new Date(cat.createdAt).toLocaleString('vi-VN') : '',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = new Date().toISOString().split('T')[0];
  triggerDownload(buffer, `danh-sach-danh-muc-${dateStr}.xlsx`);
};

/**
 * Parses and strictly validates a Category Excel file before submission
 */
export const parseAndValidateCategoryExcel = async (
  file: File
): Promise<CategoryImportParseResult> => {
  const safety = validateExcelFileSafety(file);
  if (!safety.ok) {
    throw new Error(safety.reason);
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  // Look for DANH_MUC sheet, otherwise fallback to the first sheet
  const sheet = workbook.getWorksheet('DANH_MUC') || workbook.worksheets[0];
  if (!sheet) {
    throw new Error('Tệp Excel không chứa bảng tính (sheet) hợp lệ.');
  }

  const validItems: CategoryExcelRow[] = [];
  const errors: ExcelValidationError[] = [];
  const existingNamesInExcel = new Set<string>();

  // Determine header columns
  const headerRow = sheet.getRow(1);
  let nameColIdx = -1;
  let imageColIdx = -1;
  let slugColIdx = -1;
  let codeColIdx = -1;

  headerRow.eachCell((cell, colNumber) => {
    const val = String(cell.value || '').trim().toLowerCase();
    if (val.includes('tên') || val.includes('name')) {
      nameColIdx = colNumber;
    } else if (val.includes('ảnh') || val.includes('image') || val.includes('hình')) {
      imageColIdx = colNumber;
    } else if (val.includes('slug')) {
      slugColIdx = colNumber;
    } else if (val.includes('mã') || val.includes('code')) {
      codeColIdx = colNumber;
    }
  });

  if (nameColIdx === -1 || imageColIdx === -1) {
    // If headers couldn't be detected by keywords, fallback to default positions (col 2 for name, col 4 for image)
    nameColIdx = nameColIdx === -1 ? 2 : nameColIdx;
    imageColIdx = imageColIdx === -1 ? 4 : imageColIdx;
  }

  let totalRows = 0;

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    // Skip completely empty rows
    const isRowEmpty = !row.values || (Array.isArray(row.values) && row.values.every((v) => v === null || v === undefined || v === ''));
    if (isRowEmpty) continue;

    totalRows++;
    const rawName = String(row.getCell(nameColIdx).value || '').trim();
    const rawImage = String(row.getCell(imageColIdx).value || '').trim();
    const rawSlug = slugColIdx !== -1 ? String(row.getCell(slugColIdx).value || '').trim() : '';
    const rawCode = codeColIdx !== -1 ? String(row.getCell(codeColIdx).value || '').trim() : '';

    let hasRowError = false;

    // 1. Validate Category Name
    if (!rawName) {
      errors.push({
        sheet: sheet.name,
        row: r,
        col: getColumnLetter(nameColIdx),
        field: 'Tên Danh Mục',
        code: 'ERR_CAT_NAME_REQUIRED',
        message: 'Tên danh mục không được để trống.',
        fix: 'Nhập tên danh mục thời trang (VD: Áo Khoác, Đầm Dạ Hội).',
      });
      hasRowError = true;
    } else {
      const lowerName = rawName.toLowerCase();
      if (existingNamesInExcel.has(lowerName)) {
        errors.push({
          sheet: sheet.name,
          row: r,
          col: getColumnLetter(nameColIdx),
          field: 'Tên Danh Mục',
          code: 'ERR_CAT_DUPLICATE_NAME',
          message: `Tên danh mục "${rawName}" bị trùng lặp với dòng trước đó trong tệp Excel.`,
          fix: 'Đổi tên danh mục hoặc gộp dữ liệu thành một dòng duy nhất.',
        });
        hasRowError = true;
      } else {
        existingNamesInExcel.add(lowerName);
      }
    }

    // 2. Validate Category Image URL
    if (!rawImage) {
      errors.push({
        sheet: sheet.name,
        row: r,
        col: getColumnLetter(imageColIdx),
        field: 'Đường Dẫn Ảnh',
        code: 'ERR_CAT_IMAGE_REQUIRED',
        message: 'Hình ảnh danh mục là bắt buộc theo quy định của hệ thống.',
        fix: 'Cung cấp đường dẫn HTTPS hợp lệ trỏ tới ảnh danh mục (VD: https://.../image.jpg).',
      });
      hasRowError = true;
    } else if (!/^https?:\/\//i.test(rawImage) && !rawImage.startsWith('/uploads/')) {
      errors.push({
        sheet: sheet.name,
        row: r,
        col: getColumnLetter(imageColIdx),
        field: 'Đường Dẫn Ảnh',
        code: 'ERR_CAT_IMAGE_INVALID_URL',
        message: `Đường dẫn ảnh "${rawImage}" không đúng định dạng URL hợp lệ.`,
        fix: 'Sử dụng đường dẫn bắt đầu bằng https:// hoặc /uploads/.',
      });
      hasRowError = true;
    }

    if (!hasRowError) {
      validItems.push({
        rowNumber: r,
        name: rawName,
        image: rawImage,
        slug: rawSlug || undefined,
        rawCode: rawCode || undefined,
      });
    }
  }

  return {
    validItems,
    errors,
    summary: {
      totalRows,
      validCount: validItems.length,
      errorCount: errors.length,
    },
  };
};

/**
 * Triggers a native browser file download from an ArrayBuffer
 */
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
  return letter || 'B';
};
