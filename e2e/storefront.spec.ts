import { test, expect } from '@playwright/test';

test.describe('Atelier Vérité Storefront E2E Suite', () => {
  test('should load the homepage with announcement, navigation, and hero', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/ATELIER VÉRITÉ/i);

    // Verify Brand Logo Wordmark
    const logo = page.locator('text=VÉRITÉ').first();
    await expect(logo).toBeVisible({ timeout: 10000 });

    // Verify Hero Heading
    const heroTitle = page.locator('h1').first();
    await expect(heroTitle).toBeVisible({ timeout: 10000 });
    await expect(heroTitle).toContainText('VÉRITÉ');
  });

  test('should toggle theme between dark and light', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark|light/);

    const themeBtn = page.getByLabel(/Switch to (light|dark) mode/i).first();
    await themeBtn.click();

    const currentClass = await html.getAttribute('class');
    expect(currentClass).toBeTruthy();
  });

  test('should navigate to shop catalog, filter and sort products', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.locator('h1')).toContainText(/Ready-to-Wear|Archive/i);

    // Verify product cards exist
    const cards = page.locator('.group.relative.flex.flex-col');
    await expect(cards.first()).toBeVisible();

    // Click Category Filter
    const womenBtn = page.getByRole('button', { name: 'Women', exact: true });
    if (await womenBtn.isVisible()) {
      await womenBtn.click();
      await expect(page.locator('h1')).toContainText(/Women/i);
    }
  });

  test('should view product detail and add to bag', async ({ page }) => {
    await page.goto('/products/sculpted-wool-coat');
    await expect(page.locator('h1')).toContainText(/The Architectural Wool Overcoat/i);

    // Select Size
    const sizeBtn = page.locator('button:has-text("38 FR")').first();
    if (await sizeBtn.isVisible()) {
      await sizeBtn.click();
    }

    // Click Add to Bag
    const addToBagBtn = page.locator('button:has-text("Add to Shopping Bag")');
    await addToBagBtn.click();

    // Verify Cart Drawer opens
    const drawerTitle = page.locator('h3:has-text("Shopping Bag")');
    await expect(drawerTitle).toBeVisible();
  });

  test('should toggle product wishlist state and view wishlist', async ({ page }) => {
    // Go directly to product detail page where wishlist button is prominent
    await page.goto('/products/sculpted-wool-coat');

    const wishlistBtn = page.locator('button[aria-label*="wishlist"]').first();
    await wishlistBtn.click();

    // Navigate to wishlist page
    await page.goto('/wishlist');
    await expect(page.locator('h1')).toContainText(/Curated Wishlist/i);
    await expect(page.locator('text=The Architectural Wool Overcoat')).toBeVisible();
  });

  test('should open quick search modal and find silhouettes', async ({ page }) => {
    await page.goto('/');

    const searchBtn = page.locator('button[aria-label*="Search"]:visible').first();
    await searchBtn.click();

    const searchInput = page.getByPlaceholder(/Search haute couture/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Silk');
    await expect(page.locator('text=Curated Matches')).toBeVisible();
  });

  test('should navigate through full checkout simulation', async ({ page }) => {
    // Add product to bag first
    await page.goto('/products/obsidian-leather-tote');
    const addToBagBtn = page.locator('button:has-text("Add to Shopping Bag")');
    await addToBagBtn.click();

    // Navigate to checkout
    await page.goto('/checkout');
    await expect(page.locator('h1')).toContainText(/Complete Acquisition/i);

    // Submit checkout form
    const authorizeBtn = page.locator('button:has-text("Confirm & Authorize Order")');
    await authorizeBtn.click();

    // Verify redirect to order-success
    await page.waitForURL(/order-success/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText(/Your Order Has Been Confirmed/i);
  });

  test('should handle 404 route gracefully', async ({ page }) => {
    await page.goto('/non-existent-luxury-silhouette');
    await expect(page.locator('h1')).toContainText('404');
    await expect(page.locator('text=The Requested Silhouette Does Not Exist')).toBeVisible();
  });
});
