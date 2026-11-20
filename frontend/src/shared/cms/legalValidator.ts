/**
 * ATELIER VÉRITÉ — Statutory Legal Policy Validator
 * Ensures compliance with Vietnam Law 91/2025/QH15 & Decree 356/2025/NĐ-CP.
 * Mandatory legal disclosures cannot be stripped, omitted, or hidden on legal pages prior to publishing.
 */

import { PageDocument, EditorSection, BlockItem } from './types';

export interface LegalValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Checks if a given page slug/type represents a mandatory statutory legal disclosure page.
 */
export function isStatutoryLegalPage(page: Partial<PageDocument>): boolean {
  if (page.type === 'policy') return true;
  const slug = (page.slug || '').toLowerCase();
  const title = (page.title || '').toLowerCase();

  const legalKeywords = [
    'privacy',
    'bao-mat',
    'terms',
    'dieu-khoan',
    'cookie',
    'returns',
    'tra-hang',
    'refund',
    'hoan-tien',
    'shipping',
    'giao-hang',
    'payment',
    'thanh-toan',
  ];

  return legalKeywords.some((kw) => slug.includes(kw) || title.includes(kw));
}

/**
 * Validates sections and blocks against mandatory legal disclosure criteria before publishing.
 */
export function validateLegalPageForPublish(page: Partial<PageDocument>): LegalValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isStatutoryLegalPage(page)) {
    return { isValid: true, errors: [], warnings: [] };
  }

  const sections = (page.sections || []) as EditorSection[];
  const allBlocks: BlockItem[] = [];

  sections.forEach((sec) => {
    if (sec.blocks && Array.isArray(sec.blocks)) {
      allBlocks.push(...sec.blocks);
    }
  });

  const blockTypes = new Set(allBlocks.map((b) => b.type));

  // Extract combined text for keyword verification
  const fullText = allBlocks
    .map((b) => {
      const c = b.content || {};
      return `${c.title || ''} ${c.heading || ''} ${c.text || ''} ${c.content || ''} ${c.body || ''}`;
    })
    .join(' ')
    .toLowerCase();

  const slug = (page.slug || '').toLowerCase();

  // 1. Mandatory Effective Date & Policy Version
  const hasEffectiveDateBlock = blockTypes.has('effective_date');
  const hasVersionBlock = blockTypes.has('policy_version');
  const hasDateInText = fullText.includes('hiệu lực') || fullText.includes('effective date') || fullText.includes('áp dụng từ');
  const hasVersionInText = fullText.includes('phiên bản') || fullText.includes('version') || fullText.includes('v1.') || fullText.includes('v2.');

  if (!hasEffectiveDateBlock && !hasDateInText) {
    errors.push('Trang pháp lý bắt buộc phải có ngày có hiệu lực (Effective Date) rõ ràng.');
  }

  if (!hasVersionBlock && !hasVersionInText) {
    errors.push('Trang pháp lý bắt buộc phải có thông tin phiên bản chính sách (Policy Version).');
  }

  // 2. Specific requirements for Privacy Policies (Luật 91/2025/QH15)
  if (slug.includes('privacy') || slug.includes('bao-mat')) {
    const hasUserRights =
      fullText.includes('quyền của chủ thể') ||
      fullText.includes('quyền của khách hàng') ||
      fullText.includes('quyền được biết') ||
      fullText.includes('quyền truy cập') ||
      fullText.includes('yêu cầu chỉnh sửa') ||
      fullText.includes('rút lại sự đồng ý') ||
      fullText.includes('user rights');

    const hasDataController =
      fullText.includes('đơn vị kiểm soát') ||
      fullText.includes('atelier vérité') ||
      fullText.includes('công ty') ||
      fullText.includes('chúng tôi');

    const hasDataDeletion =
      blockTypes.has('privacy_request_trigger') ||
      fullText.includes('xóa dữ liệu') ||
      fullText.includes('data deletion') ||
      fullText.includes('quyền yêu cầu xóa');

    if (!hasUserRights) {
      errors.push('Chính sách bảo mật thiếu điều khoản quy định Quyền của chủ thể dữ liệu (theo Luật 91/2025/QH15).');
    }

    if (!hasDataController) {
      errors.push('Chính sách bảo mật thiếu định danh Đơn vị kiểm soát & xử lý dữ liệu.');
    }

    if (!hasDataDeletion) {
      warnings.push('Nên bổ sung nút hoặc đường dẫn cho phép người dùng gửi Yêu cầu xóa dữ liệu cá nhân.');
    }
  }

  // 3. Specific requirements for Cookie Policies
  if (slug.includes('cookie')) {
    const hasCookieCategories =
      blockTypes.has('cookie_table') ||
      fullText.includes('cần thiết') ||
      fullText.includes('phân tích') ||
      fullText.includes('tiếp thị');

    const hasConsentLink =
      blockTypes.has('consent_trigger') ||
      fullText.includes('tùy chọn cookie') ||
      fullText.includes('cài đặt cookie');

    if (!hasCookieCategories) {
      errors.push('Chính sách Cookie bắt buộc phải phân loại các nhóm cookie (Cần thiết, Phân tích, Tiếp thị).');
    }

    if (!hasConsentLink) {
      warnings.push('Nên bổ sung công cụ/đường dẫn Mở bảng tùy chọn Cookie cho người dùng.');
    }
  }

  // 4. Specific requirements for Returns & Refunds
  if (slug.includes('returns') || slug.includes('tra-hang') || slug.includes('refund')) {
    const hasReturnConditions =
      fullText.includes('điều kiện') ||
      fullText.includes('thời hạn') ||
      fullText.includes('ngày') ||
      fullText.includes('nguyên tem');

    if (!hasReturnConditions) {
      errors.push('Chính sách đổi trả phải nêu rõ Thời hạn và Điều kiện hàng hóa hợp lệ.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
