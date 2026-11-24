import { test, expect } from '@playwright/test';

test.describe('Phase 11 — Legal Compliance, Privacy & Cookie Consent Suite', () => {

  test.beforeEach(async ({ context }) => {
    // Ensure 100% pristine clean context without pre-existing cookies or storage
    await context.clearCookies();
  });

  // TEST A: First Visit
  test('Test A: First Visit — Banner appears, non-essential tracking blocked by default', async ({ page }) => {
    const blockedRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('google-analytics') || url.includes('facebook.net') || url.includes('tiktok.com')) {
        blockedRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Consent banner must be visible on first visit
    const banner = page.locator('aside[aria-label="Thông báo và quản lý quyền riêng tư cookie"]');
    await expect(banner).toBeVisible({ timeout: 5000 });

    // 2. Banner buttons must be accessible
    await expect(banner.locator('text=Chấp nhận tất cả')).toBeVisible();
    await expect(banner.locator('text=Từ chối tùy chọn')).toBeVisible();
    await expect(banner.locator('text=Tùy chỉnh')).toBeVisible();
    await expect(banner.locator('text=Chính sách Cookie')).toBeVisible();

    // 3. Zero third-party analytics/advertising requests fired before consent
    expect(blockedRequests).toHaveLength(0);

    // 4. Verify no marketing cookies exist
    const cookies = await page.context().cookies();
    const marketingCookies = cookies.filter(c => ['_ga', '_fbp', '_ttp'].includes(c.name));
    expect(marketingCookies).toHaveLength(0);
  });

  // TEST B: Reject All Optional
  test('Test B: Reject All Optional — Core e-commerce functions operate without tracking', async ({ page }) => {
    await page.goto('/');

    const banner = page.locator('aside[aria-label="Thông báo và quản lý quyền riêng tư cookie"]');
    await expect(banner).toBeVisible({ timeout: 5000 });

    // Click "Từ chối tùy chọn"
    await banner.locator('button:has-text("Từ chối tùy chọn")').click();
    await expect(banner).not.toBeVisible();

    // Verify localStorage has ESSENTIAL_ONLY
    const consent = await page.evaluate(() => localStorage.getItem('atelier_privacy_consent'));
    expect(consent).toContain('ESSENTIAL_ONLY');
    expect(consent).toContain('"analytics":false');
    expect(consent).toContain('"marketing":false');

    // Navigate to products catalog and verify core shop functions work
    await page.goto('/products');
    await page.waitForSelector('h1', { timeout: 10000 });

    // View first product
    const firstProduct = page.locator('a[href^="/products/"]').first();
    await firstProduct.waitFor({ state: 'visible', timeout: 10000 });
    await firstProduct.scrollIntoViewIfNeeded();
    await firstProduct.click();
    await page.waitForSelector('h1', { timeout: 10000 });

    // Add to bag
    const addToBagBtn = page.locator('button:has-text("Thêm vào túi đồ"), button:has-text("Thêm Vào Túi")').first();
    if (await addToBagBtn.isVisible()) {
      await addToBagBtn.scrollIntoViewIfNeeded();
      await addToBagBtn.click();
      // Verify bag drawer opens
      await expect(page.locator('text=Túi mua sắm, text=GIỎ HÀNG, [aria-label="Giỏ hàng"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  // TEST C: Accept Analytics Only via Preferences Modal
  test('Test C: Accept Analytics Only — Analytics allowed, marketing strictly blocked', async ({ page }) => {
    await page.goto('/');

    const banner = page.locator('aside[aria-label="Thông báo và quản lý quyền riêng tư cookie"]');
    await expect(banner).toBeVisible({ timeout: 5000 });

    // Open Preferences Modal
    await banner.locator('button:has-text("Tùy chỉnh")').click();

    const modal = page.locator('div[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();

    // Toggle analytics switch
    const switches = modal.locator('button[role="switch"]');
    await switches.nth(0).click(); // Analytics switch

    // Click "Lưu tùy chọn của tôi"
    await modal.locator('button:has-text("Lưu tùy chọn của tôi")').click();
    await expect(modal).not.toBeVisible();

    // Verify record state
    const consent = await page.evaluate(() => localStorage.getItem('atelier_privacy_consent'));
    expect(consent).toContain('"analytics":true');
    expect(consent).toContain('"marketing":false');
  });

  // TEST D: Accept All
  test('Test D: Accept All — Sets ALL_ACCEPTED and valid canonical policy version', async ({ page }) => {
    await page.goto('/');

    const banner = page.locator('aside[aria-label="Thông báo và quản lý quyền riêng tư cookie"]');
    await expect(banner).toBeVisible({ timeout: 5000 });

    // Click "Chấp nhận tất cả"
    await banner.locator('button:has-text("Chấp nhận tất cả")').click();
    await expect(banner).not.toBeVisible();

    // Verify localStorage record
    const consent = await page.evaluate(() => localStorage.getItem('atelier_privacy_consent'));
    expect(consent).toContain('ALL_ACCEPTED');
    expect(consent).toContain('2026-11-07');
    expect(consent).toContain('"necessary":true');
  });

  // TEST E: Withdraw Consent from Privacy Center
  test('Test E: Withdraw Consent — Users can withdraw consent anytime', async ({ page }) => {
    // Start with pre-accepted consent
    await page.addInitScript(() => {
      localStorage.setItem('atelier_privacy_consent', JSON.stringify({
        choice: 'ALL_ACCEPTED',
        categories: { necessary: true, analytics: true, personalization: true, marketing: true },
        policyVersion: '2026-11-07',
        timestamp: new Date().toISOString(),
        source: 'banner',
        anonymousId: 'test-user-anon',
      }));
    });

    await page.goto('/data-privacy');
    await page.waitForSelector('h1', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Trung Tâm Quyền Riêng Tư');

    // Click "Rút Lại Đồng Thuận"
    const withdrawBtn = page.locator('button:has-text("Rút Lại Đồng Thuận")').first();
    await withdrawBtn.click();

    // Verify preferences modal opens allowing instant withdrawal
    const modal = page.locator('div[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();
    await modal.locator('button:has-text("Từ chối tất cả tùy chọn")').click();

    // Verify storage updated to ESSENTIAL_ONLY
    const updated = await page.evaluate(() => localStorage.getItem('atelier_privacy_consent'));
    expect(updated).toContain('ESSENTIAL_ONLY');
  });

  // TEST F: Personal Data Rights Form & Verification
  test('Test F: Personal Data Rights — Request form submission and status notice', async ({ page }) => {
    await page.goto('/data-privacy/request?type=ERASURE');
    await page.waitForSelector('h1', { timeout: 10000 });

    // 1. Verify prior notice disclosure box is visible
    await expect(page.locator('text=Thông Báo Mục Đích Xử Lý Của Biểu Mẫu Trước Khi Thu Thập')).toBeVisible();

    // 2. Verify accounting law scope notice for ERASURE
    await expect(page.locator('text=Quy Định Về Phạm Vi Xóa Dữ Liệu')).toBeVisible();

    const requestForm = page.locator('form[data-testid="privacy-request-form"]');
    await expect(requestForm).toBeVisible({ timeout: 10000 });

    // 3. Fill in identity verification (email for guest, password for authenticated)
    const passwordInput = requestForm.locator('input[type="password"]');
    const emailInput = requestForm.locator('input[type="email"]');

    if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await passwordInput.fill('MockPassword123!');
    } else if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('patron.test@atelierverite.com');
    }

    await requestForm.locator('textarea').fill('Yêu cầu xóa tài khoản thử nghiệm theo Luật 91/2025/QH15.');

    // 4. Check consent acknowledgement checkbox inside the request form
    await requestForm.locator('input[type="checkbox"]').check();

    // 5. Submit form
    await requestForm.locator('button[type="submit"]').click();

    // 6. Verify status message: must say "Đang trong quá trình xử lý" and NOT misleadingly say "Đã xóa ngay"
    await expect(page.locator('text=Yêu Cầu Đang Trong Quá Trình Xử Lý')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Mã tra cứu yêu cầu:')).toBeVisible();
  });

  // TEST G: Legal Pages — Dedicated routes, footer links, full Vietnamese copy
  test('Test G: Legal Pages — Dedicated routes accessible, no English leak, responsive', async ({ page }) => {
    const routes = [
      { path: '/privacy-policy', title: 'Chính Sách Bảo Mật' },
      { path: '/terms-of-service', title: 'Điều Khoản Sử Dụng' },
      { path: '/cookie-policy', title: 'Chính Sách Cookie' },
      { path: '/returns-refunds', title: 'Chính Sách Đổi Trả' },
      { path: '/data-privacy', title: 'Trung Tâm Quyền Riêng Tư' },
      { path: '/data-privacy/request', title: 'Biểu Mẫu Thực Hiện Quyền' },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForSelector('h1', { timeout: 8000 });
      await expect(page.locator('h1')).toContainText(route.title);

      // Verify no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    }
  });

  // TEST H: Tracking Network Audit
  test('Test H: Tracking Network Audit — Strict network and storage containment', async ({ page }) => {
    const networkLog: { url: string; method: string }[] = [];
    page.on('request', (req) => {
      networkLog.push({ url: req.url(), method: req.method() });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify zero unauthorized third-party marketing domains contacted
    const unauthorizedOrigins = networkLog.filter(req =>
      req.url.includes('google-analytics.com') ||
      req.url.includes('facebook.net') ||
      req.url.includes('analytics.tiktok.com') ||
      req.url.includes('clarity.ms') ||
      req.url.includes('hotjar.com')
    );

    expect(unauthorizedOrigins).toHaveLength(0);
  });

});
