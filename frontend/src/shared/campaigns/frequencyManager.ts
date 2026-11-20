import { DisplayFrequency } from './types';

const SESSION_PREFIX = 'atelier_camp_session_';
const LOCAL_PREFIX = 'atelier_camp_day_';
const FOREVER_PREFIX = 'atelier_camp_forever_';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Checks whether a promotional campaign popup can be displayed according to frequency policy.
 */
export function canShowCampaignPopup(
  campaignId: string,
  frequency: DisplayFrequency = 'once_per_session'
): boolean {
  if (!campaignId || !isBrowser()) return false;

  try {
    switch (frequency) {
      case 'always':
        return true;

      case 'once_per_session': {
        const sessionDismissed = window.sessionStorage?.getItem(`${SESSION_PREFIX}${campaignId}`);
        return !sessionDismissed;
      }

      case 'once_per_day': {
        const storedTs = window.localStorage?.getItem(`${LOCAL_PREFIX}${campaignId}`);
        if (!storedTs) return true;
        const ts = parseInt(storedTs, 10);
        if (isNaN(ts)) return true;
        const now = Date.now();
        // If more than 24 hours have elapsed, allow display again
        return now - ts > ONE_DAY_MS;
      }

      case 'once_forever': {
        const dismissed = window.localStorage?.getItem(`${FOREVER_PREFIX}${campaignId}`);
        return !dismissed;
      }

      default:
        return true;
    }
  } catch {
    // If storage is restricted (e.g. private mode quota error), fallback to permissive or in-memory
    return true;
  }
}

/**
 * Records a dismissal or user close action for the campaign popup.
 */
export function recordCampaignDismissal(
  campaignId: string,
  frequency: DisplayFrequency = 'once_per_session'
): void {
  if (!campaignId || !isBrowser()) return;

  try {
    const now = Date.now().toString();

    // Always record in sessionStorage to avoid re-triggering during the same tab navigation
    window.sessionStorage?.setItem(`${SESSION_PREFIX}${campaignId}`, 'true');

    if (frequency === 'once_per_day') {
      window.localStorage?.setItem(`${LOCAL_PREFIX}${campaignId}`, now);
    } else if (frequency === 'once_forever') {
      window.localStorage?.setItem(`${FOREVER_PREFIX}${campaignId}`, now);
    }
  } catch (err) {
    console.warn('[FrequencyManager] Storage write warning:', err);
  }
}

/**
 * Utility to clear dismissals (useful for tests and admin previews).
 */
export function clearCampaignDismissals(campaignId?: string): void {
  if (!isBrowser()) return;

  try {
    if (campaignId) {
      window.sessionStorage?.removeItem(`${SESSION_PREFIX}${campaignId}`);
      window.localStorage?.removeItem(`${LOCAL_PREFIX}${campaignId}`);
      window.localStorage?.removeItem(`${FOREVER_PREFIX}${campaignId}`);
    } else {
      // Clear all
      Object.keys(window.sessionStorage || {}).forEach((key) => {
        if (key.startsWith(SESSION_PREFIX)) window.sessionStorage.removeItem(key);
      });
      Object.keys(window.localStorage || {}).forEach((key) => {
        if (key.startsWith(LOCAL_PREFIX) || key.startsWith(FOREVER_PREFIX)) {
          window.localStorage.removeItem(key);
        }
      });
    }
  } catch {
    // ignore
  }
}
