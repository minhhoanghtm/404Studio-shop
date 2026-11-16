export type ConsentChoice =
  | 'UNKNOWN'
  | 'ESSENTIAL_ONLY'
  | 'CUSTOM'
  | 'ALL_ACCEPTED'
  | 'WITHDRAWN'
  | 'RECONSENT_REQUIRED';

export interface ConsentCategories {
  necessary: boolean; // Always true
  analytics: boolean;
  personalization: boolean;
  marketing: boolean;
}

export interface ConsentRecord {
  choice: ConsentChoice;
  categories: ConsentCategories;
  policyVersion: string;
  timestamp: string; // ISO 8601
  source: 'banner' | 'modal' | 'settings' | 'api';
  anonymousId: string;
  anonymousToken?: string;
}

export interface TrackerDefinition {
  id: string;
  name: string;
  category: keyof ConsentCategories;
  provider: string;
  scriptUrl?: string;
  cookiePrefixes: string[];
  initFn?: () => void;
  cleanupFn?: () => void;
}

export const CANONICAL_POLICY_VERSION = '2026-11-07';

export const DEFAULT_CATEGORIES: ConsentCategories = {
  necessary: true,
  analytics: false,
  personalization: false,
  marketing: false,
};
