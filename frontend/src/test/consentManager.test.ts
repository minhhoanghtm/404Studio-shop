import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CANONICAL_POLICY_VERSION,
  DEFAULT_CATEGORIES,
} from '../shared/consent/types';
import {
  loadConsentRecord,
  saveConsentRecord,
  clearNonEssentialStorage,
} from '../shared/consent/ConsentStorage';
import { TrackingRegistry } from '../shared/tracking/TrackingRegistry';

describe('Consent Manager & Prior Consent Blocking (Phase 11 Compliance)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = '';
    TrackingRegistry.updateCategories(DEFAULT_CATEGORIES);
  });

  it('1. should return null on first visit when no consent is stored', () => {
    const record = loadConsentRecord();
    expect(record).toBeNull();
    expect(TrackingRegistry.isCategoryAllowed('analytics')).toBe(false);
    expect(TrackingRegistry.isCategoryAllowed('marketing')).toBe(false);
    expect(TrackingRegistry.isCategoryAllowed('personalization')).toBe(false);
    expect(TrackingRegistry.isCategoryAllowed('necessary')).toBe(true);
  });

  it('2. should enforce prior consent blocking on trackPageView when analytics is not consented', () => {
    const gtagSpy = vi.fn();
    (window as any).gtag = gtagSpy;

    TrackingRegistry.updateCategories({
      necessary: true,
      analytics: false,
      personalization: false,
      marketing: false,
    });

    TrackingRegistry.trackPageView('/products/verite-01');
    expect(gtagSpy).not.toHaveBeenCalled();
  });

  it('3. should allow trackPageView only when analytics category is explicitly consented', () => {
    const gtagSpy = vi.fn();
    (window as any).gtag = gtagSpy;

    TrackingRegistry.updateCategories({
      necessary: true,
      analytics: true,
      personalization: false,
      marketing: false,
    });

    TrackingRegistry.trackPageView('/products/verite-01', 'Sản Phẩm 01');
    expect(gtagSpy).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/products/verite-01',
      page_title: 'Sản Phẩm 01',
    });
  });

  it('4. should save and restore valid consent record with canonical policy version', () => {
    const testRecord = {
      choice: 'ALL_ACCEPTED' as const,
      categories: {
        necessary: true,
        analytics: true,
        personalization: true,
        marketing: true,
      },
      policyVersion: CANONICAL_POLICY_VERSION,
      timestamp: new Date().toISOString(),
      source: 'banner' as const,
      anonymousId: 'test-uuid-1234',
    };

    saveConsentRecord(testRecord);
    const restored = loadConsentRecord();

    expect(restored).not.toBeNull();
    expect(restored?.choice).toBe('ALL_ACCEPTED');
    expect(restored?.categories.analytics).toBe(true);
    expect(restored?.policyVersion).toBe('2026-11-07');
  });

  it('5. should invalidate outdated consent record and require re-consent', () => {
    const outdatedRecord = {
      choice: 'ALL_ACCEPTED' as const,
      categories: {
        necessary: true,
        analytics: true,
        personalization: true,
        marketing: true,
      },
      policyVersion: '2023-01-01', // Outdated prior version
      timestamp: new Date().toISOString(),
      source: 'banner' as const,
      anonymousId: 'test-uuid-old',
    };

    localStorage.setItem('atelier_privacy_consent', JSON.stringify(outdatedRecord));
    const loaded = loadConsentRecord();
    expect(loaded).toBeNull(); // Forces reconsent
  });

  it('6. should clean up optional tracking cookies and storage upon withdrawal', () => {
    document.cookie = '_ga=GA1.2.123456789.1234567890; path=/';
    document.cookie = '_fbp=fb.1.1234567890; path=/';
    sessionStorage.setItem('track_event_last', 'click_cta');

    clearNonEssentialStorage();

    // Verify non-essential storage cleared
    expect(sessionStorage.getItem('track_event_last')).toBeNull();
  });
});
