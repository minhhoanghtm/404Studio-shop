import { ConsentCategories, TrackerDefinition } from '../consent/types';
import { deleteCookiesByPrefixes } from '../consent/ConsentStorage';

// Internal registry of known services
export const TRACKER_DEFINITIONS: TrackerDefinition[] = [
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    category: 'analytics',
    provider: 'Google LLC',
    scriptUrl: 'https://www.googletagmanager.com/gtag/js?id=G-ATELIERVERITE',
    cookiePrefixes: ['_ga', '_gid', '_gat'],
  },
  {
    id: 'meta_pixel',
    name: 'Meta Pixel',
    category: 'marketing',
    provider: 'Meta Platforms Inc.',
    scriptUrl: 'https://connect.facebook.net/en_US/fbevents.js',
    cookiePrefixes: ['_fbp', '_fbc'],
  },
  {
    id: 'tiktok_pixel',
    name: 'TikTok Pixel',
    category: 'marketing',
    provider: 'TikTok Pte. Ltd.',
    scriptUrl: 'https://analytics.tiktok.com/i18n/pixel/events.js',
    cookiePrefixes: ['_ttp'],
  },
];

class TrackingRegistryClass {
  private activeCategories: ConsentCategories = {
    necessary: true,
    analytics: false,
    personalization: false,
    marketing: false,
  };

  private loadedScripts: Set<string> = new Set();
  private eventQueue: Array<{ category: keyof ConsentCategories; eventName: string; payload: unknown }> = [];

  constructor() {
    this.installNoopStubs();
  }

  /**
   * Install harmless sandbox stubs so optional tracking invocations don't break UI execution
   */
  private installNoopStubs() {
    if (typeof window === 'undefined') return;

    const w = window as unknown as Record<string, unknown>;

    // Stubs that drop calls without network requests
    if (!w.dataLayer) w.dataLayer = [];
    if (!w.gtag) {
      w.gtag = (...args: unknown[]) => {
        if (this.activeCategories.analytics) {
          // Only if analytics explicitly consented
          (w.dataLayer as unknown[]).push(args);
        }
      };
    }

    if (!w.fbq) {
      w.fbq = () => {
        // Noop when marketing not consented
      };
    }
  }

  /**
   * Update active categories based on consented record
   */
  public updateCategories(categories: ConsentCategories) {
    this.activeCategories = { ...categories, necessary: true };

    // If analytics disabled, clean up
    if (!this.activeCategories.analytics) {
      this.disableCategory('analytics');
    }

    // If marketing disabled, clean up
    if (!this.activeCategories.marketing) {
      this.disableCategory('marketing');
    }

    // If analytics enabled, initialize registered analytics trackers
    if (this.activeCategories.analytics) {
      this.enableCategory('analytics');
    }

    // If marketing enabled, initialize registered marketing trackers
    if (this.activeCategories.marketing) {
      this.enableCategory('marketing');
    }
  }

  public isCategoryAllowed(category: keyof ConsentCategories): boolean {
    return Boolean(this.activeCategories[category]);
  }

  public enableCategory(category: keyof ConsentCategories) {
    if (typeof window === 'undefined') return;
    this.activeCategories[category] = true;

    // Load any trackers mapped to this category
    const trackers = TRACKER_DEFINITIONS.filter((t) => t.category === category);
    for (const tracker of trackers) {
      if (tracker.scriptUrl && !this.loadedScripts.has(tracker.id)) {
        // In this implementation, scripts are only loaded dynamically if consent is granted
        this.loadedScripts.add(tracker.id);
        tracker.initFn?.();
      }
    }
  }

  public disableCategory(category: keyof ConsentCategories) {
    if (typeof window === 'undefined') return;
    this.activeCategories[category] = false;

    // Delete cookies
    const trackers = TRACKER_DEFINITIONS.filter((t) => t.category === category);
    for (const tracker of trackers) {
      deleteCookiesByPrefixes(tracker.cookiePrefixes);
      tracker.cleanupFn?.();
    }
  }

  /**
   * Safe pageview recording: strictly NOOP if analytics not consented
   */
  public trackPageView(path: string, title?: string) {
    if (!this.activeCategories.analytics) {
      return; // HARD DROP - No tracking before consent
    }

    // Dispatch to authorized trackers
    const w = window as unknown as Record<string, unknown>;
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
      });
    }
  }

  /**
   * Safe custom event: strictly checks category permission
   */
  public trackEvent(category: keyof ConsentCategories, eventName: string, payload: Record<string, unknown> = {}) {
    if (!this.isCategoryAllowed(category)) {
      return; // HARD DROP
    }

    const w = window as unknown as Record<string, unknown>;
    if (category === 'analytics' && typeof w.gtag === 'function') {
      w.gtag('event', eventName, payload);
    } else if (category === 'marketing' && typeof w.fbq === 'function') {
      w.fbq('trackCustom', eventName, payload);
    }
  }
}

export const TrackingRegistry = new TrackingRegistryClass();
