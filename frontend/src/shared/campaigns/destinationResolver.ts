import { DestinationType } from './types';

/**
 * Checks if a destination URL is strictly safe against XSS, open-redirect, or local protocol abuse.
 * Blocks: javascript:, data:, file:, vbscript:, protocol-relative URLs (//evil.com).
 */
export function isSafeUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;

  const trimmed = rawUrl.trim();
  if (trimmed === '') return false;

  // Block protocol-relative URLs
  if (trimmed.startsWith('//')) {
    return false;
  }

  // Check dangerous protocol prefixes
  const lower = trimmed.toLowerCase();
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'file:',
    'vbscript:',
    'blob:',
    'about:',
  ];

  for (const proto of dangerousProtocols) {
    if (lower.startsWith(proto) || lower.includes(` ${proto}`)) {
      return false;
    }
  }

  // If internal route, must start with single '/'
  if (trimmed.startsWith('/')) {
    // Avoid double slashes or backslashes
    return !trimmed.startsWith('//') && !trimmed.startsWith('/\\');
  }

  // If absolute external URL, must strictly start with https:// or http://
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL, falling back to a safe route if unsafe or invalid.
 */
export function sanitizeUrl(rawUrl: string, fallback: string = '/'): string {
  if (isSafeUrl(rawUrl)) {
    return rawUrl.trim();
  }
  return fallback;
}

/**
 * Resolves destination type and identifier into a canonical route for navigation.
 */
export function resolveDestinationUrl(
  destinationType: DestinationType,
  destinationId?: string,
  rawUrl?: string
): string {
  const cleanId = (destinationId || '').trim();

  switch (destinationType) {
    case 'product':
      if (!cleanId) return '/products';
      return `/products/${encodeURIComponent(cleanId)}`;

    case 'category':
      if (!cleanId) return '/products';
      return `/products?category=${encodeURIComponent(cleanId)}`;

    case 'collection':
      if (!cleanId) return '/collections';
      return `/collections/${encodeURIComponent(cleanId)}`;

    case 'lookbook':
      if (!cleanId) return '/lookbooks';
      return `/lookbooks/${encodeURIComponent(cleanId)}`;

    case 'voucher':
      return '/vouchers';

    case 'sale_page':
      return '/collections/sale';

    case 'url':
    case 'external':
      if (rawUrl && isSafeUrl(rawUrl)) {
        return rawUrl.trim();
      }
      return '/';

    default:
      return '/';
  }
}

/**
 * Returns human-readable label and preview for the given destination.
 */
export function getDestinationPreview(
  destinationType: DestinationType,
  destinationId?: string,
  rawUrl?: string
): { label: string; url: string; isValid: boolean } {
  const url = resolveDestinationUrl(destinationType, destinationId, rawUrl);
  const isValid = isSafeUrl(url);

  const labels: Record<DestinationType, string> = {
    product: 'Trang Chi Tiết Sản Phẩm',
    category: 'Danh Mục Sản Phẩm',
    collection: 'Bộ Sưu Tập Thời Trang',
    lookbook: 'Lookbook Thời Trang',
    voucher: 'Sàn Mã Giảm Giá & Ưu Đãi',
    sale_page: 'Trang Sự Kiện Giảm Giá (Sale)',
    url: 'Liên Kết Tùy Chỉnh',
    external: 'Liên Kết Ngoài / Tùy Chỉnh',
  };

  return {
    label: labels[destinationType] || 'Trang Đích',
    url,
    isValid,
  };
}
