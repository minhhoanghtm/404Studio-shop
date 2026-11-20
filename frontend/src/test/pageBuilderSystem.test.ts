/**
 * ATELIER VÉRITÉ — Visual Page Builder & CMS System Unit Tests
 * Verifies block library registry, templates, legal validator, sanitizer, and WCAG contrast.
 */

import { describe, it, expect } from 'vitest';
import {
  BLOCK_DEFINITIONS,
  createBlockInstance,
  PAGE_TEMPLATES,
  validateLegalPageForPublish,
  isStatutoryLegalPage,
  sanitizeUrl,
  sanitizeEmbedUrl,
  sanitizeRichText,
  sanitizeColor,
} from '@/shared/cms';
import { calculateContrastRatio } from '@/pages/AdminPageBuilder/components/contrastUtils';
import { PageDocument, EditorSection } from '@/shared/cms/types';

describe('CMS Block Library & Template Engine', () => {
  it('registers blocks across all 6 core categories', () => {
    const categories = new Set(BLOCK_DEFINITIONS.map((b) => b.category));
    expect(categories.has('content')).toBe(true);
    expect(categories.has('media')).toBe(true);
    expect(categories.has('layout')).toBe(true);
    expect(categories.has('commerce')).toBe(true);
    expect(categories.has('interactive')).toBe(true);
    expect(categories.has('legal')).toBe(true);
    expect(BLOCK_DEFINITIONS.length).toBeGreaterThanOrEqual(25);
  });

  it('creates unique block instances with cloned default contents', () => {
    const block1 = createBlockInstance('heading');
    const block2 = createBlockInstance('heading');

    expect(block1.id).not.toBe(block2.id);
    expect(block1.type).toBe('heading');
    expect(block1.content.text).toBe('Tiêu Đề Nội Dung');

    // Mutating block1 should not mutate block2
    block1.content.text = 'Modified';
    expect(block2.content.text).toBe('Tiêu Đề Nội Dung');
  });

  it('provides all 4 pre-configured templates with non-empty sections and blocks', () => {
    expect(PAGE_TEMPLATES.length).toBeGreaterThanOrEqual(4);

    const lookbookTmpl = PAGE_TEMPLATES.find((t) => t.id === 'template_lookbook');
    const aboutTmpl = PAGE_TEMPLATES.find((t) => t.id === 'template_about');
    const legalTmpl = PAGE_TEMPLATES.find((t) => t.id === 'template_legal_policy');
    const campaignTmpl = PAGE_TEMPLATES.find((t) => t.id === 'template_campaign');

    expect(lookbookTmpl).toBeDefined();
    expect(aboutTmpl).toBeDefined();
    expect(legalTmpl).toBeDefined();
    expect(campaignTmpl).toBeDefined();

    expect(lookbookTmpl!.sections.length).toBeGreaterThanOrEqual(3);
    expect(aboutTmpl!.sections.length).toBeGreaterThanOrEqual(3);
    expect(legalTmpl!.sections.length).toBeGreaterThanOrEqual(2);
    expect(campaignTmpl!.sections.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Statutory Legal Validator (Law 91/2025/QH15 & Decree 356/2025/NĐ-CP)', () => {
  it('identifies statutory legal pages by slug or type', () => {
    expect(isStatutoryLegalPage({ type: 'policy', slug: 'any' })).toBe(true);
    expect(isStatutoryLegalPage({ type: 'landing', slug: 'privacy-policy' })).toBe(true);
    expect(isStatutoryLegalPage({ type: 'landing', slug: 'dieu-khoan-su-dung' })).toBe(true);
    expect(isStatutoryLegalPage({ type: 'landing', slug: 'chinh-sach-cookie' })).toBe(true);
    expect(isStatutoryLegalPage({ type: 'lookbook', slug: 'lookbook-winter' })).toBe(false);
  });

  it('passes validation for a fully compliant legal template', () => {
    const legalTmpl = PAGE_TEMPLATES.find((t) => t.id === 'template_legal_policy')!;
    const mockPage: Partial<PageDocument> = {
      title: legalTmpl.defaultTitle,
      slug: legalTmpl.defaultSlug,
      type: legalTmpl.type,
      sections: legalTmpl.sections,
    };

    const result = validateLegalPageForPublish(mockPage);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('fails validation when mandatory effective date or version is stripped from a legal policy', () => {
    const legalTmpl = PAGE_TEMPLATES.find((t) => t.id === 'template_legal_policy')!;
    // Clone sections and strip effective_date and policy_version
    const strippedSections: EditorSection[] = JSON.parse(JSON.stringify(legalTmpl.sections));
    strippedSections.forEach((s) => {
      s.blocks = s.blocks.filter(
        (b) => b.type !== 'effective_date' && b.type !== 'policy_version'
      );
    });

    const mockPage: Partial<PageDocument> = {
      title: 'Chính Sách Bảo Mật Rút Gọn',
      slug: 'privacy-policy',
      type: 'policy',
      sections: strippedSections,
    };

    const result = validateLegalPageForPublish(mockPage);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('hiệu lực'))).toBe(true);
  });

  it('fails validation when user rights are missing from a privacy policy', () => {
    const mockPage: Partial<PageDocument> = {
      title: 'Chính Sách Bảo Mật Thiếu Điều Khoản Quyền',
      slug: 'privacy-policy',
      type: 'policy',
      sections: [
        {
          id: 'sec_1',
          type: 'story',
          order: 0,
          isActive: true,
          blocks: [
            createBlockInstance('effective_date'),
            createBlockInstance('policy_version'),
            {
              ...createBlockInstance('paragraph'),
              content: { text: 'Nội dung chung chung về xưởng may Atelier Vérité, giới thiệu tác phẩm thời trang may đo.' },
            },
          ],
        },
      ],
    };

    const result = validateLegalPageForPublish(mockPage);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Quyền của chủ thể dữ liệu'))).toBe(true);
  });

  it('bypasses statutory legal checks for commercial lookbooks and campaigns', () => {
    const mockPage: Partial<PageDocument> = {
      title: 'Runway Lookbook Capsule',
      slug: 'runway-lookbook',
      type: 'lookbook',
      sections: [
        {
          id: 'sec_1',
          type: 'hero',
          order: 0,
          isActive: true,
          blocks: [createBlockInstance('heading')],
        },
      ],
    };

    const result = validateLegalPageForPublish(mockPage);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});

describe('Sanitizer & Security Utilities (CWE-79 Defense)', () => {
  it('blocks dangerous URL schemes while allowing safe protocols', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('#blocked-unsafe-url');
    expect(sanitizeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe('#blocked-unsafe-url');
    expect(sanitizeUrl('vbscript:msgbox("xss")')).toBe('#blocked-unsafe-url');

    expect(sanitizeUrl('https://atelier-verite.com/products')).toBe('https://atelier-verite.com/products');
    expect(sanitizeUrl('/collections')).toBe('/collections');
    expect(sanitizeUrl('#section-1')).toBe('#section-1');
    expect(sanitizeUrl('mailto:concierge@atelier-verite.com')).toBe('mailto:concierge@atelier-verite.com');
  });

  it('restricts embedded video URLs to allowlisted domains', () => {
    expect(sanitizeEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(sanitizeEmbedUrl('https://player.vimeo.com/video/76979871')).toBe('https://player.vimeo.com/video/76979871');

    // Untrusted or malicious domains must be blocked
    expect(sanitizeEmbedUrl('https://malicious-site.com/video.mp4')).toBe('');
    expect(sanitizeEmbedUrl('javascript:void(0)')).toBe('');
  });

  it('sanitizes rich text against stored XSS and inline event handlers', () => {
    const maliciousHtml = '<p>Đoạn văn</p><script>alert("hacked")</script><img src="x" onerror="alert(1)" /><a href="javascript:steal()">Click</a>';
    const clean = sanitizeRichText(maliciousHtml);

    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('onerror=');
    expect(clean).not.toContain('javascript:steal()');
    expect(clean).toContain('<p>Đoạn văn</p>');
  });

  it('validates color codes to prevent CSS injection', () => {
    expect(sanitizeColor('#ffffff')).toBe('#ffffff');
    expect(sanitizeColor('#d4af37')).toBe('#d4af37');
    expect(sanitizeColor('rgba(255, 255, 255, 0.8)')).toBe('rgba(255, 255, 255, 0.8)');
    expect(sanitizeColor('transparent')).toBe('transparent');

    expect(sanitizeColor('red; background: url(javascript:alert(1))')).toBe('');
    expect(sanitizeColor('expression(alert(1))')).toBe('');
  });
});

describe('WCAG AA Color Contrast Calculation', () => {
  it('verifies contrast ratio between foreground and background', () => {
    // White (#ffffff) on Dark (#0b0b0e) ~ 19:1 (Exceeds AA 4.5:1 and AAA 7.0:1)
    const highContrast = calculateContrastRatio('#ffffff', '#0b0b0e');
    expect(highContrast).toBeGreaterThan(15);

    // Gold (#d4af37) on Dark (#0b0b0e) ~ 10:1 (Exceeds AA 4.5:1)
    const goldContrast = calculateContrastRatio('#d4af37', '#0b0b0e');
    expect(goldContrast).toBeGreaterThan(7.0);

    // Dark grey on black (Low contrast) < 4.5:1
    const lowContrast = calculateContrastRatio('#2a2a2a', '#0b0b0e');
    expect(lowContrast).toBeLessThan(4.5);
  });
});
