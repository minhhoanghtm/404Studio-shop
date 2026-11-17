import { create } from 'zustand';
import {
  CANONICAL_POLICY_VERSION,
  ConsentCategories,
  ConsentChoice,
  ConsentRecord,
  DEFAULT_CATEGORIES,
} from './types';
import {
  clearNonEssentialStorage,
  getOrCreateAnonymousId,
  loadConsentRecord,
  saveConsentRecord,
} from './ConsentStorage';
import { TrackingRegistry } from '../tracking/TrackingRegistry';

interface ConsentState {
  consentRecord: ConsentRecord | null;
  isBannerOpen: boolean;
  isPreferencesOpen: boolean;
  isInitialized: boolean;

  // Actions
  initializeConsent: () => void;
  acceptAll: () => void;
  rejectOptional: () => void;
  saveCustomPreferences: (categories: Partial<ConsentCategories>) => void;
  withdrawConsent: (category?: keyof ConsentCategories) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  syncWithBackend: (record: ConsentRecord) => Promise<void>;
}

export const useConsentStore = create<ConsentState>((set, get) => ({
  consentRecord: null,
  isBannerOpen: false,
  isPreferencesOpen: false,
  isInitialized: false,

  initializeConsent: () => {
    if (get().isInitialized) return;

    const stored = loadConsentRecord();
    const { anonymousId, anonymousToken } = getOrCreateAnonymousId();

    if (stored) {
      // Valid existing consent found
      TrackingRegistry.updateCategories(stored.categories);
      set({
        consentRecord: stored,
        isBannerOpen: false,
        isInitialized: true,
      });
    } else {
      // First visit or outdated policy version -> block all non-essential and show banner
      TrackingRegistry.updateCategories(DEFAULT_CATEGORIES);
      set({
        consentRecord: null,
        isBannerOpen: true,
        isInitialized: true,
      });
    }
  },

  acceptAll: () => {
    const { anonymousId, anonymousToken } = getOrCreateAnonymousId();
    const categories: ConsentCategories = {
      necessary: true,
      analytics: true,
      personalization: true,
      marketing: true,
    };

    const record: ConsentRecord = {
      choice: 'ALL_ACCEPTED',
      categories,
      policyVersion: CANONICAL_POLICY_VERSION,
      timestamp: new Date().toISOString(),
      source: 'banner',
      anonymousId,
      anonymousToken,
    };

    saveConsentRecord(record);
    TrackingRegistry.updateCategories(categories);

    set({
      consentRecord: record,
      isBannerOpen: false,
      isPreferencesOpen: false,
    });

    get().syncWithBackend(record);
  },

  rejectOptional: () => {
    const { anonymousId, anonymousToken } = getOrCreateAnonymousId();
    const categories: ConsentCategories = {
      necessary: true,
      analytics: false,
      personalization: false,
      marketing: false,
    };

    const record: ConsentRecord = {
      choice: 'ESSENTIAL_ONLY',
      categories,
      policyVersion: CANONICAL_POLICY_VERSION,
      timestamp: new Date().toISOString(),
      source: 'banner',
      anonymousId,
      anonymousToken,
    };

    clearNonEssentialStorage();
    saveConsentRecord(record);
    TrackingRegistry.updateCategories(categories);

    set({
      consentRecord: record,
      isBannerOpen: false,
      isPreferencesOpen: false,
    });

    get().syncWithBackend(record);
  },

  saveCustomPreferences: (customPartial: Partial<ConsentCategories>) => {
    const { anonymousId, anonymousToken } = getOrCreateAnonymousId();
    const categories: ConsentCategories = {
      necessary: true,
      analytics: Boolean(customPartial.analytics),
      personalization: Boolean(customPartial.personalization),
      marketing: Boolean(customPartial.marketing),
    };

    const isAllTrue = categories.analytics && categories.personalization && categories.marketing;
    const isAllFalse = !categories.analytics && !categories.personalization && !categories.marketing;
    const choice: ConsentChoice = isAllTrue ? 'ALL_ACCEPTED' : isAllFalse ? 'ESSENTIAL_ONLY' : 'CUSTOM';

    const record: ConsentRecord = {
      choice,
      categories,
      policyVersion: CANONICAL_POLICY_VERSION,
      timestamp: new Date().toISOString(),
      source: 'modal',
      anonymousId,
      anonymousToken,
    };

    if (!categories.analytics || !categories.marketing) {
      clearNonEssentialStorage();
    }

    saveConsentRecord(record);
    TrackingRegistry.updateCategories(categories);

    set({
      consentRecord: record,
      isBannerOpen: false,
      isPreferencesOpen: false,
    });

    get().syncWithBackend(record);
  },

  withdrawConsent: (category?: keyof ConsentCategories) => {
    const current = get().consentRecord;
    const { anonymousId, anonymousToken } = getOrCreateAnonymousId();

    let newCategories: ConsentCategories;
    let choice: ConsentChoice = 'WITHDRAWN';

    if (category && category !== 'necessary' && current) {
      newCategories = {
        ...current.categories,
        [category]: false,
      };
      choice = 'CUSTOM';
    } else {
      newCategories = {
        necessary: true,
        analytics: false,
        personalization: false,
        marketing: false,
      };
      choice = 'WITHDRAWN';
    }

    const record: ConsentRecord = {
      choice,
      categories: newCategories,
      policyVersion: CANONICAL_POLICY_VERSION,
      timestamp: new Date().toISOString(),
      source: 'settings',
      anonymousId,
      anonymousToken,
    };

    clearNonEssentialStorage();
    saveConsentRecord(record);
    TrackingRegistry.updateCategories(newCategories);

    set({
      consentRecord: record,
    });

    get().syncWithBackend(record);
  },

  openPreferences: () => set({ isPreferencesOpen: true }),
  closePreferences: () => set({ isPreferencesOpen: false }),

  syncWithBackend: async (record: ConsentRecord) => {
    try {
      const payload = {
        consent: record.choice === 'ALL_ACCEPTED' ? 'granted' : 'denied',
        choice: record.choice,
        categories: record.categories,
        policy_version: record.policyVersion,
        source: record.source,
        anonymous_id: record.anonymousId,
        anonymous_token: record.anonymousToken,
      };

      await fetch('/api/privacy/consent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Anonymous-ID': record.anonymousId,
          ...(record.anonymousToken ? { 'X-Anonymous-Token': record.anonymousToken } : {}),
        },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Safe silent failover if backend is running in offline mock mode
      });
    } catch {}
  },
}));
