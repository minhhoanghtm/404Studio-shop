import { test, expect } from '@playwright/test';

test.describe('Promotional Campaigns, Sale Popups & Smart Redirects E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Pre-seed consent so Cookie Consent modal doesn't block the screen
    await page.addInitScript(() => {
      localStorage.setItem(
        'atelier_privacy_consent',
        JSON.stringify({
          choice: 'ALL_ACCEPTED',
          categories: {
            necessary: true,
            analytics: true,
            personalization: true,
            marketing: true,
          },
          timestamp: new Date().toISOString(),
          policyVersion: '2026-11-07',
          source: 'banner',
        })
      );

      // Pre-seed admin session for admin route access
      const mockAdmin = {
        _id: 'admin-campaign-lead',
        name: 'Directeur Artistique',
        email: 'director@atelierverite.com',
        role: 'admin',
      };

      const authState = {
        state: {
          user: mockAdmin,
          token: 'e2e-admin-token',
          accessToken: 'e2e-admin-token',
          isAuthenticated: true,
        },
        version: 0,
      };

      localStorage.setItem('atelier_patron_auth', JSON.stringify(authState));
      localStorage.setItem('atelier_auth', JSON.stringify(authState));
    });

    // Mock all banner endpoints by default to avoid slow proxy timeouts
    await page.route('**/api/banners/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [],
        }),
      });
    });

    // Mock recommendations by default to keep home page fast
    await page.route('**/api/recommendations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            mode: 'empty',
            products: [],
          },
        }),
      });
    });

    // Mock catalog endpoints so homepage loads instantly
    await page.route('**/api/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: [] }),
      });
    });
    await page.route('**/api/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: [] }),
      });
    });
    await page.route('**/api/lookbooks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: [] }),
      });
    });
  });

  // =========================================================================
  // SCENARIO 1 & 2: STOREFRONT PROMOTIONAL POPUP APPEARANCE & SMART CTA
  // =========================================================================
  test('Scenario 1 & 2: Promotional popup displays on entry and CTA button navigates correctly', async ({ page }) => {
    // Intercept active campaigns API to ensure a predictable active campaign is returned
    await page.route('**/api/campaigns/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            serverTime: new Date().toISOString(),
            campaigns: [
              {
                _id: 'camp-e2e-sale',
                name: 'Haute Couture Winter Gala',
                slug: 'winter-gala-sale',
                type: 'flash_sale',
                status: 'active',
                startAt: new Date(Date.now() - 3600000).toISOString(),
                endAt: new Date(Date.now() + 86400000).toISOString(),
                priority: 100,
                bannerId: {
                  _id: 'banner-e2e-01',
                  title: 'Haute Couture Winter Gala',
                  subtitle: 'Đặc quyền sở hữu các thiết kế kinh điển với mức ưu đãi lên đến 40%.',
                  imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200',
                  buttonText: 'Khám Phá Ưu Đãi',
                  targetType: 'sale_page',
                  linkUrl: '/collections/sale',
                },
                remainingSeconds: 7200,
              },
            ],
          },
        }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Promotional popup should become visible
    const popup = page.locator('[data-testid="promotional-popup"]');
    await expect(popup).toBeVisible({ timeout: 25000 });

    // 2. Headline & Subtitle verification
    await expect(page.locator('#campaign-popup-title')).toContainText('Haute Couture Winter Gala');
    await expect(page.locator('#campaign-popup-desc')).toContainText('Đặc quyền sở hữu');

    // 3. Countdown timer check
    await expect(page.getByText('Ưu Đãi Kết Thúc Sau:')).toBeVisible();

    // 4. CTA Button click & smart redirect to /collections/sale
    const ctaBtn = page.locator('[data-testid="popup-cta"]');
    await expect(ctaBtn).toContainText('Khám Phá Ưu Đãi');
    await ctaBtn.click();

    // Popup closes and URL transitions
    await expect(popup).not.toBeVisible();
    await expect(page).toHaveURL(/\/collections\/sale/);
  });

  // =========================================================================
  // SCENARIO 3: POPUP DISMISSAL & FREQUENCY CAP (NO RE-POPPING)
  // =========================================================================
  test('Scenario 3: Dismissing popup suppresses it from displaying on subsequent navigation', async ({ page }) => {
    await page.route('**/api/campaigns/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            serverTime: new Date().toISOString(),
            campaigns: [
              {
                _id: 'camp-dismiss-test',
                name: 'Private Atelier Preview',
                slug: 'private-preview',
                type: 'seasonal',
                status: 'active',
                startAt: new Date(Date.now() - 3600000).toISOString(),
                endAt: new Date(Date.now() + 86400000).toISOString(),
                priority: 50,
                bannerId: {
                  title: 'Private Atelier Preview',
                  subtitle: 'Ưu đãi dành riêng cho hội viên.',
                  imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200',
                  buttonText: 'Xem Ngay',
                },
              },
            ],
          },
        }),
      });
    });

    await page.goto('/');
    const popup = page.locator('[data-testid="promotional-popup"]');
    await expect(popup).toBeVisible({ timeout: 25000 });

    // Close via 'X' button
    const closeBtn = page.locator('[data-testid="popup-close"]');
    await closeBtn.click();
    await expect(popup).not.toBeVisible();

    // Navigate to another page (e.g. /products)
    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');

    // Wait a moment: popup must NOT reappear
    await page.waitForTimeout(1000);
    await expect(popup).not.toBeVisible();
  });

  // =========================================================================
  // SCENARIO 4: KEYBOARD ESCAPE & FOCUS TRAP
  // =========================================================================
  test('Scenario 4: Escape key dismisses the promotional popup modal', async ({ page }) => {
    await page.route('**/api/campaigns/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            serverTime: new Date().toISOString(),
            campaigns: [
              {
                _id: 'camp-esc-test',
                name: 'Mid-Season Couture',
                slug: 'mid-season',
                type: 'flash_sale',
                status: 'active',
                startAt: new Date(Date.now() - 3600000).toISOString(),
                endAt: new Date(Date.now() + 86400000).toISOString(),
                priority: 20,
                bannerId: {
                  title: 'Mid-Season Couture',
                  imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200',
                },
              },
            ],
          },
        }),
      });
    });

    await page.goto('/');
    const popup = page.locator('[data-testid="promotional-popup"]');
    await expect(popup).toBeVisible({ timeout: 25000 });

    // Focus close button before pressing Escape to ensure focus is inside modal
    await page.locator('[data-testid="popup-close"]').focus();
    await page.keyboard.press('Escape');
    await expect(popup).not.toBeVisible();
  });

  // =========================================================================
  // SCENARIO 5: ADMIN CAMPAIGNS DASHBOARD & CONTROLS
  // =========================================================================
  test('Scenario 5: Admin navigates to /admin/campaigns and views list & action controls', async ({ page }) => {
    await page.goto('/admin/campaigns');
    await page.waitForLoadState('domcontentloaded');

    // Check Header
    await expect(page.getByRole('heading', { name: /Chiến Dịch & Khuyến Mãi/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Danh Sách Chiến Dịch Quảng Bá')).toBeVisible();

    // Check Filters
    await expect(page.getByPlaceholder('Tìm kiếm theo tên chiến dịch hoặc slug...')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();

    // Check Create button
    const createBtn = page.getByRole('link', { name: /Tạo Chiến Dịch Mới/i });
    await expect(createBtn).toBeVisible();
  });

  // =========================================================================
  // SCENARIO 6: ADMIN DESTINATION SELECTOR & REAL-TIME VALIDATION
  // =========================================================================
  test('Scenario 6: Destination Selector supports types and validates safe URLs', async ({ page }) => {
    await page.goto('/admin/campaigns/new');
    await page.waitForLoadState('domcontentloaded');

    // Check form title
    await expect(page.getByRole('heading', { name: /Tạo Chiến Dịch Mới/i })).toBeVisible({ timeout: 10000 });

    // Check Destination Selector Header
    await expect(page.getByText('Bộ Chọn Điểm Đến Thông Minh (Smart Redirect)')).toBeVisible();

    // Test Destination Type buttons
    await expect(page.getByRole('button', { name: 'Sản Phẩm' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Danh Mục' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Voucher' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Trang Sale' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tùy Chỉnh' })).toBeVisible();

    // Switch to Voucher
    await page.getByRole('button', { name: 'Voucher' }).click();
    await expect(page.getByText('/vouchers', { exact: true })).toBeVisible();

    // Switch to Custom URL and input dangerous javascript: payload
    await page.getByRole('button', { name: 'Tùy Chỉnh' }).click();
    const urlInput = page.getByPlaceholder(/ví dụ: \/products\/ao-khoac/i);
    await urlInput.fill('javascript:alert("xss")');

    // Security warning should appear
    await expect(page.getByText(/URL Không An Toàn/i)).toBeVisible();
    await expect(page.getByText(/Cảnh báo an ninh/i)).toBeVisible();

    // Input safe route
    await urlInput.fill('/products/dam-da-hoi-tulle');
    await expect(page.getByText(/URL An Toàn/i)).toBeVisible();
  });
});
