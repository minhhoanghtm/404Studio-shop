import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resolveDestinationUrl,
  isSafeUrl,
  sanitizeUrl,
  getDestinationPreview,
} from '../shared/campaigns/destinationResolver';
import {
  canShowCampaignPopup,
  recordCampaignDismissal,
  clearCampaignDismissals,
} from '../shared/campaigns/frequencyManager';
import { Campaign } from '../shared/campaigns/types';

describe('Promotional Campaigns — Destination Resolver & Security', () => {
  it('correctly resolves Product destination to canonical route', () => {
    expect(resolveDestinationUrl('product', 'ao-khoac-da-tweed')).toBe('/products/ao-khoac-da-tweed');
    expect(resolveDestinationUrl('product', '')).toBe('/products');
  });

  it('correctly resolves Category destination with query parameter', () => {
    expect(resolveDestinationUrl('category', 'dam-da-hoi')).toBe('/products?category=dam-da-hoi');
    expect(resolveDestinationUrl('category', '')).toBe('/products');
  });

  it('correctly resolves Collection destination', () => {
    expect(resolveDestinationUrl('collection', 'thu-dong-2026')).toBe('/collections/thu-dong-2026');
    expect(resolveDestinationUrl('collection', '')).toBe('/collections');
  });

  it('correctly resolves Lookbook destination', () => {
    expect(resolveDestinationUrl('lookbook', 'haute-couture-2026')).toBe('/lookbooks/haute-couture-2026');
    expect(resolveDestinationUrl('lookbook', '')).toBe('/lookbooks');
  });

  it('correctly resolves Voucher destination', () => {
    expect(resolveDestinationUrl('voucher')).toBe('/vouchers');
  });

  it('correctly resolves Sale Page destination', () => {
    expect(resolveDestinationUrl('sale_page')).toBe('/collections/sale');
  });

  it('correctly resolves safe custom URLs', () => {
    expect(resolveDestinationUrl('url', undefined, '/about')).toBe('/about');
    expect(resolveDestinationUrl('url', undefined, 'https://atelierverite.com/special')).toBe(
      'https://atelierverite.com/special'
    );
  });

  it('blocks dangerous protocol injections in isSafeUrl', () => {
    // XSS / Script injection
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('JAVASCRIPT:alert(document.cookie)')).toBe(false);
    expect(isSafeUrl('javascript:void(0)')).toBe(false);

    // Data URI schemes
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeUrl('data:image/svg+xml;base64,PHN2Zw==')).toBe(false);

    // Local file protocols
    expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeUrl('file://C:/Windows/win.ini')).toBe(false);

    // VBScript & Blob protocols
    expect(isSafeUrl('vbscript:msgbox("test")')).toBe(false);
    expect(isSafeUrl('blob:https://example.com/uuid')).toBe(false);

    // Protocol-relative URLs (open redirect vector)
    expect(isSafeUrl('//malicious-site.com/phishing')).toBe(false);
    expect(isSafeUrl('/\\evil.com')).toBe(false);

    // Empty or non-string
    expect(isSafeUrl('')).toBe(false);
    expect(isSafeUrl(null as any)).toBe(false);
  });

  it('sanitizes unsafe URLs to fallback route', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('/');
    expect(sanitizeUrl('data:text/html,evil', '/products')).toBe('/products');
    expect(sanitizeUrl('/products/safe-slug')).toBe('/products/safe-slug');
  });

  it('generates accurate preview and validity flag in getDestinationPreview', () => {
    const validPreview = getDestinationPreview('product', 'ao-len-cashmere');
    expect(validPreview.url).toBe('/products/ao-len-cashmere');
    expect(validPreview.isValid).toBe(true);

    const dangerousPreview = getDestinationPreview('url', undefined, 'javascript:malicious()');
    expect(dangerousPreview.url).toBe('/');
    expect(dangerousPreview.isValid).toBe(true); // fallback is valid '/'
  });
});

describe('Promotional Campaigns — Frequency Cap Manager', () => {
  const TEST_CAMP_ID = 'campaign-test-101';

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    clearCampaignDismissals();
  });

  it('allows showing campaign popup on initial visit (once_per_session)', () => {
    expect(canShowCampaignPopup(TEST_CAMP_ID, 'once_per_session')).toBe(true);
  });

  it('suppresses popup after dismissal within the same session', () => {
    expect(canShowCampaignPopup(TEST_CAMP_ID, 'once_per_session')).toBe(true);
    recordCampaignDismissal(TEST_CAMP_ID, 'once_per_session');
    expect(canShowCampaignPopup(TEST_CAMP_ID, 'once_per_session')).toBe(false);
  });

  it('manages daily dismissal (once_per_day)', () => {
    expect(canShowCampaignPopup(TEST_CAMP_ID, 'once_per_day')).toBe(true);
    recordCampaignDismissal(TEST_CAMP_ID, 'once_per_day');

    // Same day -> suppressed
    expect(canShowCampaignPopup(TEST_CAMP_ID, 'once_per_day')).toBe(false);

    // Fast-forward 25 hours
    const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
    localStorage.setItem(`atelier_camp_day_${TEST_CAMP_ID}`, twentyFiveHoursAgo.toString());
    sessionStorage.removeItem(`atelier_camp_session_${TEST_CAMP_ID}`);

    expect(canShowCampaignPopup(TEST_CAMP_ID, 'once_per_day')).toBe(true);
  });

  it('always allows display when frequency is set to always', () => {
    expect(canShowCampaignPopup(TEST_CAMP_ID, 'always')).toBe(true);
    recordCampaignDismissal(TEST_CAMP_ID, 'always');
    expect(canShowCampaignPopup(TEST_CAMP_ID, 'always')).toBe(true);
  });

  it('clears dismissals properly on demand', () => {
    recordCampaignDismissal(TEST_CAMP_ID, 'once_per_session');
    expect(canShowCampaignPopup(TEST_CAMP_ID, 'once_per_session')).toBe(false);

    clearCampaignDismissals(TEST_CAMP_ID);
    expect(canShowCampaignPopup(TEST_CAMP_ID, 'once_per_session')).toBe(true);
  });
});

describe('Promotional Campaigns — Priority & Sorting Logic', () => {
  const mockCampaigns: Campaign[] = [
    {
      _id: 'camp-low',
      name: 'Chiến dịch thường',
      slug: 'chien-dich-thuong',
      type: 'flash_sale',
      status: 'active',
      startAt: new Date(Date.now() - 3600000).toISOString(),
      endAt: new Date(Date.now() + 86400000).toISOString(),
      priority: 5,
    },
    {
      _id: 'camp-high',
      name: 'Chiến dịch VIP Flash Sale',
      slug: 'chien-dich-vip',
      type: 'flash_sale',
      status: 'active',
      startAt: new Date(Date.now() - 3600000).toISOString(),
      endAt: new Date(Date.now() + 86400000).toISOString(),
      priority: 99,
    },
    {
      _id: 'camp-mid',
      name: 'Chiến dịch mùa Thu',
      slug: 'chien-dich-mua-thu',
      type: 'seasonal',
      status: 'active',
      startAt: new Date(Date.now() - 3600000).toISOString(),
      endAt: new Date(Date.now() + 86400000).toISOString(),
      priority: 50,
    },
  ];

  it('correctly sorts campaigns by priority descending', () => {
    const sorted = [...mockCampaigns].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    expect(sorted[0]._id).toBe('camp-high');
    expect(sorted[1]._id).toBe('camp-mid');
    expect(sorted[2]._id).toBe('camp-low');
  });

  it('picks the highest priority campaign that is not dismissed', () => {
    sessionStorage.clear();
    // Dismiss the high priority one
    recordCampaignDismissal('camp-high', 'once_per_session');

    const sorted = [...mockCampaigns].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const eligible = sorted.find((c) => canShowCampaignPopup(c._id, 'once_per_session'));

    expect(eligible?._id).toBe('camp-mid');
  });
});
