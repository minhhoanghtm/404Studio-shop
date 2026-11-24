import { test, expect } from '@playwright/test';

// Helper to create a fake unexpired JWT with specific role
const createFakeJwt = (role: string = 'admin', expiresInSec: number = 3600): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const payload = btoa(JSON.stringify({ userId: 'user-e2e-test', role, exp }));
  return `${header}.${payload}.signature`;
};

// Helper to create an expired JWT
const createExpiredJwt = (role: string = 'admin'): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) - 300; // Expired 5 mins ago
  const payload = btoa(JSON.stringify({ userId: 'user-e2e-test', role, exp }));
  return `${header}.${payload}.signature`;
};

test.describe('Refresh Token Flow & Auto-Logout E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss consent banner
    await page.addInitScript(() => {
      localStorage.setItem(
        'atelier_privacy_consent',
        JSON.stringify({
          choice: 'ALL_ACCEPTED',
          categories: { necessary: true, analytics: true, personalization: true, marketing: true },
          timestamp: new Date().toISOString(),
          policyVersion: '2026-11-07',
          source: 'banner',
        })
      );
    });
  });

  // =========================================================================
  // SCENARIO 1: Broken session (missing refresh token) opens /admin -> redirect to /login
  // =========================================================================
  test('Scenario 1: Missing refresh token with expired access token immediately redirects to /login without displaying "Thiếu refresh token" banner', async ({
    page,
  }) => {
    const expiredToken = createExpiredJwt('admin');

    await page.addInitScript((token) => {
      // Set access token only (no refresh token) and expired
      localStorage.setItem(
        'atelier_patron_auth',
        JSON.stringify({
          state: {
            token,
            accessToken: token,
            isAuthenticated: true,
            user: { _id: 'u1', fullName: 'Admin User', role: 'admin' },
          },
        })
      );
    }, expiredToken);

    await page.goto('/admin');
    await page.waitForURL(/\/login\?redirect=%2Fadmin/, { timeout: 8000 });

    // Verify redirected to login with redirect parameter
    expect(page.url()).toContain('/login');
    expect(page.url()).toContain('redirect=%2Fadmin');

    // Verify the page NEVER shows "Thiếu refresh token" or retry button
    const errorBanner = page.getByText(/Thiếu refresh token/i);
    await expect(errorBanner).not.toBeVisible();
  });

  // =========================================================================
  // SCENARIO 2: Access token expired -> automatically refreshes and succeeds
  // =========================================================================
  test('Scenario 2: Expired access token triggers single refresh and completes request successfully', async ({
    page,
  }) => {
    const expiredToken = createExpiredJwt('admin');
    const freshToken = createFakeJwt('admin', 1800);

    let refreshCallCount = 0;

    await page.route('**/api/auth/refresh', async (route) => {
      refreshCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: freshToken,
            refreshToken: 'new-e2e-rotated-rt',
            user: { id: 'u1', fullName: 'Admin Patron', role: 'admin' },
          },
        }),
      });
    });

    await page.route('**/api/user/me', async (route) => {
      const authHeader = route.request().headers()['authorization'] || '';
      if (authHeader.includes(freshToken)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'u1', fullName: 'Admin Patron', role: 'admin', tier: 'admin' },
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Token đã hết hạn' }),
        });
      }
    });

    await page.addInitScript(
      ({ token, rt }) => {
        localStorage.setItem(
          'atelier_patron_auth',
          JSON.stringify({
            state: {
              token,
              accessToken: token,
              refreshToken: rt,
              isAuthenticated: true,
              user: { id: 'u1', fullName: 'Admin Patron', role: 'admin' },
            },
          })
        );
      },
      { token: expiredToken, rt: 'valid-refresh-token' }
    );

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Wait until refresh has occurred and localStorage is updated with the fresh token
    await expect.poll(async () => {
      const stored = await page.evaluate(() => localStorage.getItem('atelier_patron_auth'));
      return stored?.includes(freshToken);
    }, { timeout: 8000 }).toBe(true);

    expect(refreshCallCount).toBeGreaterThanOrEqual(1);
  });

  // =========================================================================
  // SCENARIO 3: 5 parallel requests when expired -> only 1 single refresh call (Single-Flight)
  // =========================================================================
  test('Scenario 3: 5 concurrent requests when token expired execute exactly 1 refresh call', async ({
    page,
  }) => {
    const expiredToken = createExpiredJwt('admin');
    const freshToken = createFakeJwt('admin', 1800);

    let refreshCallCount = 0;

    await page.route('**/api/auth/refresh', async (route) => {
      refreshCallCount++;
      // Simulate small delay in refresh to test queuing
      await new Promise((r) => setTimeout(r, 120));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: freshToken,
            refreshToken: 'single-flight-rt',
            user: { id: 'u1', fullName: 'Admin Patron', role: 'admin' },
          },
        }),
      });
    });

    await page.route('**/api/tracking/admin/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { views: 100 } }),
      });
    });

    await page.route('**/api/admin/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });

    await page.route('**/api/user/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'u1', fullName: 'Admin Patron', role: 'admin', tier: 'admin', vipTier: 'admin' },
        }),
      });
    });

    await page.addInitScript(
      ({ token, rt }) => {
        localStorage.setItem(
          'atelier_patron_auth',
          JSON.stringify({
            state: {
              token,
              accessToken: token,
              refreshToken: rt,
              isAuthenticated: true,
              user: { id: 'u1', fullName: 'Admin Patron', role: 'admin' },
            },
          })
        );
      },
      { token: expiredToken, rt: 'parallel-rt' }
    );

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Reset refresh count before running parallel batch
    refreshCallCount = 0;

    // Trigger 5 concurrent API requests via window.fetch in the browser with expired token
    const results = await page.evaluate(async (expToken) => {
      const raw = localStorage.getItem('atelier_patron_auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.state.token = expToken;
        parsed.state.accessToken = expToken;
        localStorage.setItem('atelier_patron_auth', JSON.stringify(parsed));
      }

      const endpoints = [
        '/api/tracking/admin/overview',
        '/api/tracking/admin/funnel',
        '/api/tracking/admin/activity',
        '/api/tracking/admin/overview',
        '/api/tracking/admin/funnel',
      ];
      // Use the client's exported api or fetch
      const clientModule = await import('/src/shared/api/client.ts');
      return await Promise.all(endpoints.map((ep) => clientModule.api.get(ep)));
    }, expiredToken);

    expect(results).toHaveLength(5);
    // Single-flight ensures exactly 1 refresh request was sent for all 5 concurrent calls
    expect(refreshCallCount).toBe(1);
  });

  // =========================================================================
  // SCENARIO 4: Refresh token expired / invalid -> auto-logout & redirect to login
  // =========================================================================
  test('Scenario 4: Expired refresh token returns 401 REFRESH_EXPIRED and triggers automatic logout and redirect', async ({
    page,
  }) => {
    const expiredToken = createExpiredJwt('admin');

    await page.route('**/api/auth/refresh', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'REFRESH_EXPIRED',
          message: 'Refresh token đã hết hạn',
        }),
      });
    });

    await page.addInitScript(
      ({ token, rt }) => {
        localStorage.setItem(
          'atelier_patron_auth',
          JSON.stringify({
            state: {
              token,
              accessToken: token,
              refreshToken: rt,
              isAuthenticated: true,
              user: { id: 'u1', fullName: 'Admin Patron', role: 'admin', vipTier: 'admin' },
            },
          })
        );
      },
      { token: expiredToken, rt: 'expired-rt' }
    );

    await page.goto('/admin');
    await page.waitForURL(/\/login/, { timeout: 8000 });
    await page.waitForLoadState('domcontentloaded');

    // Verify localStorage auth state was cleared
    const storedAuth = await page.evaluate(() => localStorage.getItem('atelier_patron_auth'));
    expect(storedAuth).toBeNull();

    // Verify toast or notice "Phiên đăng nhập đã hết hạn" appears
    await expect(page.getByText(/Phiên đăng nhập đã hết hạn/i).first()).toBeVisible();
  });

  // =========================================================================
  // SCENARIO 5: Logout in Tab 1 synchronizes and logs out Tab 2
  // =========================================================================
  test('Scenario 5: Multi-tab synchronization automatically logs out Tab 2 when Tab 1 logs out', async ({
    context,
  }) => {
    const validToken = createFakeJwt('admin', 3600);

    // Intercept only backend REST API calls (starting with /api/), NOT Vite source files like /src/shared/api/
    await context.route((url) => url.pathname.startsWith('/api/'), async (route) => {
      const url = route.request().url();
      if (url.includes('/api/auth/refresh')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              accessToken: validToken,
              refreshToken: 'multi-tab-rt',
              user: { id: 'u1', fullName: 'Admin Patron', role: 'admin' },
            },
          }),
        });
      } else if (url.includes('/api/user/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'u1', fullName: 'Admin Patron', role: 'admin', tier: 'admin', vipTier: 'admin' },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {} }),
        });
      }
    });

    await context.addInitScript(
      ({ token, rt }) => {
        localStorage.setItem(
          'atelier_privacy_consent',
          JSON.stringify({
            choice: 'ALL_ACCEPTED',
            categories: { necessary: true, analytics: true, personalization: true, marketing: true },
            timestamp: new Date().toISOString(),
            policyVersion: '2026-11-07',
            source: 'banner',
          })
        );
        localStorage.setItem(
          'atelier_patron_auth',
          JSON.stringify({
            state: {
              token,
              accessToken: token,
              refreshToken: rt,
              isAuthenticated: true,
              user: { id: 'u1', fullName: 'Admin Patron', role: 'admin', vipTier: 'admin' },
            },
          })
        );
      },
      { token: validToken, rt: 'multi-tab-rt' }
    );

    // Tab 1
    const page1 = await context.newPage();
    await page1.goto('/admin');
    await page1.waitForLoadState('domcontentloaded');

    // Tab 2
    const page2 = await context.newPage();
    await page2.goto('/admin');
    await page2.waitForLoadState('domcontentloaded');

    // Both tabs are on /admin
    expect(page1.url()).toContain('/admin');
    expect(page2.url()).toContain('/admin');

    // Trigger logout in Tab 1 (broadcasts logout across tabs via BroadcastChannel + storage event)
    await page1.evaluate(() => {
      localStorage.removeItem('atelier_patron_auth');
      if ((window as any).__ATELIER_AUTH_SYNC__) {
        (window as any).__ATELIER_AUTH_SYNC__.broadcastAuthLogout();
      } else {
        localStorage.setItem(
          'atelier_auth_event',
          JSON.stringify({ type: 'logout', timestamp: Date.now() })
        );
      }
    });

    // Tab 2 should automatically detect the logout event and redirect to /login
    await expect(page2).toHaveURL(/\/login/, { timeout: 8000 });
    expect(page2.url()).toContain('/login');
  });
});
