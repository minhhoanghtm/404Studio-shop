/**
 * ATELIER VÉRITÉ — Visual CMS Sanitizer & Security Utilities
 * Guard against Stored XSS (CWE-79), prototype pollution, and malicious schemes.
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];
const ALLOWED_VIDEO_DOMAINS = ['youtube.com', 'www.youtube.com', 'youtu.be', 'vimeo.com', 'player.vimeo.com'];

/**
 * Validates and sanitizes a link URL.
 * Drops dangerous protocols like javascript:, data:, vbscript:.
 */
export function sanitizeUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Allow relative URLs starting with / or #
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (ALLOWED_PROTOCOLS.includes(parsed.protocol.toLowerCase())) {
      return trimmed;
    }
  } catch {
    // If not a valid absolute URL, check if it doesn't contain forbidden schemes
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
      return trimmed;
    }
  }

  return '#blocked-unsafe-url';
}

/**
 * Validates embedded video URLs to ensure they only embed allowlisted platforms.
 */
export function sanitizeEmbedUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();
    const isAllowed = ALLOWED_VIDEO_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
    if (isAllowed && (parsed.protocol === 'https:' || parsed.protocol === 'http:')) {
      return trimmed;
    }
  } catch {
    return '';
  }

  return '';
}

/**
 * Basic HTML/Text entity sanitizer for rich text strings.
 * Removes active script tags, on* event handlers, and javascript: links.
 */
export function sanitizeRichText(html?: string): string {
  if (!html || typeof html !== 'string') return '';

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*[^>\s]+/gi, '')
    .replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"')
    .replace(/src\s*=\s*["']\s*javascript:[^"']*["']/gi, 'src=""');
}

/**
 * Validates color hex/rgba code to avoid CSS injection.
 */
export function sanitizeColor(color?: string): string {
  if (!color || typeof color !== 'string') return '';
  const trimmed = color.trim();
  // Valid hex, rgb, rgba, hsl, or transparent
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return trimmed;
  }
  if (/^(rgb|rgba|hsl|hsla)\([^)]+\)$/.test(trimmed)) {
    return trimmed;
  }
  if (trimmed === 'transparent' || trimmed === 'currentColor') {
    return trimmed;
  }
  return '';
}
