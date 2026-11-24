import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackingApi } from '../shared/api';
import { useConsentStore } from '../shared/consent/useConsentStore';
import { CANONICAL_POLICY_VERSION, DEFAULT_CATEGORIES } from '../shared/consent/types';
import { getEntrySource, useTrafficAttribution } from '../shared/tracking/useTrafficAttribution';

vi.mock('../shared/api', () => ({
  trackingApi: { trackEvent: vi.fn() },
}));

describe('Website traffic attribution', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useConsentStore.setState({ consentRecord: null });
    vi.mocked(trackingApi.trackEvent).mockReset().mockResolvedValue({ success: true, accepted: true });
    window.history.replaceState(null, '', '/products?utm_source=ig&gclid=example');
  });

  it.each([
    ['?utm_source=IG', 'https://www.google.com', 'Instagram'],
    ['?gclid=example', '', 'Google'],
    ['?utm_medium=email', '', 'Email'],
    ['', 'https://l.facebook.com/redirect', 'Facebook'],
    ['', 'https://zalo.me/', 'Zalo'],
    ['', 'https://facebook.com.other.example/', 'facebook.com.other.example'],
    ['', 'https://store.example/products', 'Trực tiếp / Không rõ'],
    ['', '', 'Trực tiếp / Không rõ'],
  ])('classifies %s with referrer %s as %s', (search, referrer, expected) => {
    expect(getEntrySource(new URL(`https://store.example/${search}`), referrer)).toBe(expected);
  });

  it('records the landing source once after analytics consent, including across remounts', async () => {
    const { rerender, unmount } = renderHook(({ path }) => useTrafficAttribution(path), {
      initialProps: { path: '/products' },
    });
    expect(trackingApi.trackEvent).not.toHaveBeenCalled();

    window.history.replaceState(null, '', '/cart');
    rerender({ path: '/cart' });
    act(() => useConsentStore.setState({
      consentRecord: {
        choice: 'CUSTOM',
        categories: { ...DEFAULT_CATEGORIES, analytics: true },
        policyVersion: CANONICAL_POLICY_VERSION,
        timestamp: new Date().toISOString(),
        source: 'banner',
        anonymousId: '04a18622-6dfa-4cdb-81bf-b08277d2049f',
      },
    }));

    await waitFor(() => expect(sessionStorage.getItem('atelier_attributed_session')).toBeTruthy());
    expect(trackingApi.trackEvent).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'session_start',
      context: { pathname: '/products', entrySource: 'Instagram' },
    }));
    unmount();
    renderHook(() => useTrafficAttribution('/cart'));
    expect(trackingApi.trackEvent).toHaveBeenCalledTimes(1);
  });
});
