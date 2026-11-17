import { test, expect } from '@playwright/test';

test.describe('Light/Dark Mode Theme System E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Test 1: Theme Toggle button exists in Header with proper accessibility attributes', async ({ page }) => {
    const toggleButton = page.locator('header [data-testid="theme-toggle-button"]');
    await expect(toggleButton).toBeVisible();

    const ariaLabel = await toggleButton.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/Chuyển sang chế độ (sáng|tối)/);

    const title = await toggleButton.getAttribute('title');
    expect(title).toMatch(/Chuyển sang chế độ (sáng|tối)/);
  });

  test('Test 2: Toggling switches between Light and Dark mode, updating HTML class, aria-label, and localStorage', async ({ page }) => {
    const toggleButton = page.locator('header [data-testid="theme-toggle-button"]');
    const html = page.locator('html');

    // First ensure we start in a known theme (dark)
    await page.evaluate(() => {
      localStorage.setItem('atelier_theme', 'dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Verify initial Dark mode state
    await expect(html).toHaveClass(/dark/);
    await expect(html).not.toHaveClass(/light/);
    await expect(toggleButton).toHaveAttribute('aria-label', 'Chuyển sang chế độ sáng');
    await expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: 'test-results/theme-dark-mode.png', fullPage: false });

    // Click toggle to switch Dark -> Light
    await toggleButton.click();

    // Verify transition to Light mode
    await expect(html).toHaveClass(/light/);
    await expect(html).not.toHaveClass(/dark/);
    await expect(toggleButton).toHaveAttribute('aria-label', 'Chuyển sang chế độ tối');
    await expect(toggleButton).toHaveAttribute('aria-pressed', 'false');

    const savedLight = await page.evaluate(() => localStorage.getItem('atelier_theme'));
    expect(savedLight).toBe('light');
    await page.screenshot({ path: 'test-results/theme-light-mode.png', fullPage: false });

    // Click toggle to switch Light -> Dark
    await toggleButton.click();

    // Verify transition back to Dark mode
    await expect(html).toHaveClass(/dark/);
    await expect(html).not.toHaveClass(/light/);
    await expect(toggleButton).toHaveAttribute('aria-label', 'Chuyển sang chế độ sáng');
    await expect(toggleButton).toHaveAttribute('aria-pressed', 'true');

    const savedDark = await page.evaluate(() => localStorage.getItem('atelier_theme'));
    expect(savedDark).toBe('dark');
  });

  test('Test 3: Theme preference persists across page reloads and route navigation', async ({ page }) => {
    const html = page.locator('html');
    const toggleButton = page.locator('header [data-testid="theme-toggle-button"]');

    // Set to Light mode via toggle
    await page.evaluate(() => {
      localStorage.setItem('atelier_theme', 'dark');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await toggleButton.click();
    await expect(html).toHaveClass(/light/);

    // Reload page and ensure Light mode persists
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(html).toHaveClass(/light/);
    const persistedAfterReload = await page.evaluate(() => localStorage.getItem('atelier_theme'));
    expect(persistedAfterReload).toBe('light');

    // Navigate to Products page and ensure Light mode persists
    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');
    await expect(html).toHaveClass(/light/);

    // Switch back to Dark mode on Products page
    const productsToggleButton = page.locator('header [data-testid="theme-toggle-button"]');
    await productsToggleButton.click();
    await expect(html).toHaveClass(/dark/);

    // Navigate back to Home and ensure Dark mode persists
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(html).toHaveClass(/dark/);
    const persistedDark = await page.evaluate(() => localStorage.getItem('atelier_theme'));
    expect(persistedDark).toBe('dark');
  });
});
