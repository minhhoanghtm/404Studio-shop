import { test, expect } from '@playwright/test';

test.describe('Home Page Intelligent Product Recommendation E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  // TEST 1: Initial Render & Section Visibility
  test('Test 1: Home recommendation section renders with luxury header and 4 tabs', async ({ page }) => {
    const section = page.locator('section[data-testid="home-recommendation-section"]');
    await expect(section).toBeVisible({ timeout: 15000 });

    // Verify 4 luxury tabs are visible
    await expect(page.locator('button[data-testid="rec-tab-for-you"]')).toBeVisible();
    await expect(page.locator('button[data-testid="rec-tab-trending"]')).toBeVisible();
    await expect(page.locator('button[data-testid="rec-tab-new-arrivals"]')).toBeVisible();
    await expect(page.locator('button[data-testid="rec-tab-best-sellers"]')).toBeVisible();

    // Verify product grid renders
    await expect(page.locator('div[data-testid="recommendation-product-grid"]')).toBeVisible();
  });

  // TEST 2: Prior Consent & Privacy Notice Indicator
  test('Test 2: Before personalization consent, unconsented fallback notice is displayed', async ({ page }) => {
    const notice = page.locator('div[data-testid="personalization-consent-notice"]');
    await expect(notice).toBeVisible({ timeout: 10000 });
    await expect(notice).toContainText('Quý khách đang xem danh mục phổ quát');

    // Click "Cài đặt quyền riêng tư"
    const settingsBtn = notice.locator('button');
    await settingsBtn.click();

    // Verify preferences modal opens
    await expect(page.locator('#cookie-preferences-title')).toBeVisible({ timeout: 5000 });
  });

  // TEST 3: Tab Switching & Smooth Transition
  test('Test 3: Switching tabs smoothly updates recommendations without UI flicker', async ({ page }) => {
    const section = page.locator('section[data-testid="home-recommendation-section"]');
    const trendingTab = section.locator('button[data-testid="rec-tab-trending"]');
    await trendingTab.click();

    // Section title updates to Trending
    await expect(section.locator('h2')).toContainText('Kiểu Dáng Được Tìm Kiếm Nhiều Nhất', { timeout: 5000 });
    await expect(section.locator('div[data-testid="recommendation-product-grid"]')).toBeVisible();

    // Switch to New Arrivals
    const newArrivalsTab = section.locator('button[data-testid="rec-tab-new-arrivals"]');
    await newArrivalsTab.click();
    await expect(section.locator('h2')).toContainText('Tác Phẩm Mới Ra Mắt', { timeout: 5000 });

    // Switch to Best Sellers
    const bestSellersTab = section.locator('button[data-testid="rec-tab-best-sellers"]');
    await bestSellersTab.click();
    await expect(section.locator('h2')).toContainText('Tác Phẩm Bán Chạy Nhất', { timeout: 5000 });
  });

  // TEST 4: Personalization Consent Grants Access to Bespoke Curation
  test('Test 4: Granting personalization consent removes notice and activates bespoke styling', async ({ page }) => {
    // Accept all cookies on the banner
    const acceptAllBtn = page.locator('button:has-text("Chấp nhận tất cả")');
    if ((await acceptAllBtn.count()) > 0 && (await acceptAllBtn.isVisible())) {
      await acceptAllBtn.click();
    }

    // Go back to 'for-you' tab
    const forYouTab = page.locator('button[data-testid="rec-tab-for-you"]');
    await forYouTab.click();

    // Notice pill should now be hidden
    await expect(page.locator('div[data-testid="personalization-consent-notice"]')).not.toBeVisible();

    // Section title reflects personalized state
    await expect(page.locator('h2:has-text("Dành Riêng Cho Quý Khách")')).toBeVisible();
  });

  // TEST 5: Product Card Elements & Responsiveness
  test('Test 5: Product cards display correct Vietnamese currency, image, and interactive elements', async ({ page }) => {
    const productGrid = page.locator('div[data-testid="recommendation-product-grid"]');
    await expect(productGrid).toBeVisible();

    const firstCard = productGrid.locator('> div').first();
    await expect(firstCard).toBeVisible();

    // Verify price formatting contains currency symbol ₫
    await expect(firstCard).toContainText('₫');

    // Verify card image is rendered
    const img = firstCard.locator('img').first();
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', /.+/);
  });
});
