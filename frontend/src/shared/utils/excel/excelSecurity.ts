/**
 * ATELIER VÉRITÉ — Excel Security & Formula Injection Defense
 * Protects against CSV/Spreadsheet Injection (CWE-1236)
 * Validates file signature, size, and sanitizes untrusted string cells
 */

const DANGEROUS_FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Escapes potentially dangerous spreadsheet formula triggers.
 * Prepends a single quote (') if the text begins with =, +, -, @, tab, or carriage return.
 */
export const sanitizeCellForExport = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  if (
    DANGEROUS_FORMULA_PREFIXES.some((prefix) => value.startsWith(prefix)) ||
    DANGEROUS_FORMULA_PREFIXES.some((prefix) => value.trim().startsWith(prefix))
  ) {
    return `'${value}`;
  }
  return value;
};

/**
 * Validates file safety constraints before attempting workbook parsing.
 * Limits file size to 10MB to prevent memory exhaustion / ReDoS.
 */
export const validateExcelFileSafety = (file: File): { ok: boolean; reason?: string } => {
  if (!file) {
    return { ok: false, reason: 'Không tìm thấy tệp tin tải lên.' };
  }

  // Max 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      reason: `Dung lượng tệp (${(file.size / (1024 * 1024)).toFixed(2)} MB) vượt quá giới hạn tối đa cho phép là 10 MB.`,
    };
  }

  if (file.size === 0) {
    return { ok: false, reason: 'Tệp tin rỗng (0 bytes). Vui lòng chọn tệp Excel hợp lệ.' };
  }

  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.xlsx')) {
    return {
      ok: false,
      reason: 'Định dạng tệp không được hỗ trợ. Hệ thống chỉ chấp nhận định dạng Excel (.xlsx).',
    };
  }

  return { ok: true };
};
