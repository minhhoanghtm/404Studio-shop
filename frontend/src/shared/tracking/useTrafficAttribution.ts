import { useEffect, useRef, useState } from 'react';
import { trackingApi } from '../api';
import { useConsentStore, waitForConsentSync } from '../consent/useConsentStore';
import { getOrCreateSessionId } from './useBehaviorTracking';

const RECORDED_SESSION_KEY = 'atelier_attributed_session';

const platforms = [
  { name: 'Facebook', aliases: ['facebook', 'fb', 'meta'], domains: ['facebook.com', 'fb.com', 'fb.me'] },
  { name: 'Instagram', aliases: ['instagram', 'ig'], domains: ['instagram.com'] },
  { name: 'TikTok', aliases: ['tiktok'], domains: ['tiktok.com'] },
  { name: 'Zalo', aliases: ['zalo'], domains: ['zalo.me', 'zalo.vn'] },
  { name: 'YouTube', aliases: ['youtube'], domains: ['youtube.com', 'youtu.be'] },
  { name: 'Google', aliases: ['google', 'google_ads', 'googleads'], domains: ['google.com', 'google.com.vn'] },
  { name: 'Bing', aliases: ['bing'], domains: ['bing.com'] },
  { name: 'Email', aliases: ['email', 'newsletter'], domains: [] },
];

function findPlatform(value: string) {
  return platforms.find(({ aliases, domains }) =>
    aliases.includes(value) || domains.some((domain) => value === domain || value.endsWith(`.${domain}`)),
  )?.name;
}

export function getEntrySource(url: URL, referrer: string): string {
  const source = url.searchParams.get('utm_source')?.trim().toLowerCase();
  if (source && /^[a-z0-9][a-z0-9_.-]{0,99}$/.test(source)) return findPlatform(source) || source;
  if (url.searchParams.get('utm_medium')?.trim().toLowerCase() === 'email') return 'Email';
  if (['gclid', 'gbraid', 'wbraid'].some((key) => url.searchParams.get(key))) return 'Google';
  if (url.searchParams.get('ttclid')) return 'TikTok';

  try {
    const referral = new URL(referrer);
    if (['http:', 'https:'].includes(referral.protocol) && referral.origin !== url.origin) {
      const host = referral.hostname.replace(/^www\./, '');
      return findPlatform(host) || host.slice(0, 100);
    }
  } catch {
    // Direct visits have no referrer URL.
  }
  if (url.searchParams.get('fbclid')) return 'Facebook / Instagram';
  return 'Trực tiếp / Không rõ';
}

export function useTrafficAttribution(pathname: string): void {
  const consent = useConsentStore((state) => state.consentRecord);
  const [entry] = useState(() => {
    const url = new URL(window.location.href);
    return { pathname: url.pathname.slice(0, 500), entrySource: getEntrySource(url, document.referrer) };
  });
  const submittedSession = useRef<string | null>(null);

  useEffect(() => {
    if (!consent?.categories.analytics || /^\/admin(?:\/|$)/i.test(entry.pathname) || /^\/admin(?:\/|$)/i.test(pathname)) {
      return;
    }
    try {
      const sessionId = getOrCreateSessionId();
      if (submittedSession.current === sessionId || sessionStorage.getItem(RECORDED_SESSION_KEY) === sessionId) return;

      submittedSession.current = sessionId;
      void (async () => {
        try {
          await waitForConsentSync();
          if (!useConsentStore.getState().consentRecord?.categories.analytics) return;
          const response = await trackingApi.trackEvent({
            event_type: 'session_start',
            event_id: `entry_${sessionId}`,
            anonymous_id: consent.anonymousId,
            session_id: sessionId,
            source: 'frontend_client',
            context: entry,
          });
          if (response.accepted !== false) sessionStorage.setItem(RECORDED_SESSION_KEY, sessionId);
        } catch {
          // Retry on the next navigation if the request failed.
        } finally {
          submittedSession.current = null;
        }
      })();
    } catch {
      // Analytics must not interrupt browsing when storage is unavailable.
    }
  }, [consent, entry, pathname]);
}
