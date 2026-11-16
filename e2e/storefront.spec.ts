import { test, expect } from '@playwright/test';

test.describe('Atelier Vérité Storefront E2E Suite', () => {
  test('should load the homepage with announcement, navigation, and hero', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/ATELIER VÉRITÉ/i);

    // Verify Brand Logo Wordmark
    const logo = page.locator('text=ATELIER VÉRITÉ').first();
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

    const themeBtn = page.locator('button[aria-label*="chế độ"]').first();
    await themeBtn.click();

    const currentClass = await html.getAttribute('class');
    expect(currentClass).toBeTruthy();
  });

  test('should navigate to products catalog, filter and sort products', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('h1')).toContainText(/Kho Lưu trữ|Tác phẩm/i);

    // Verify product cards exist
    const cards = page.locator('.group.relative.flex.flex-col');
    await expect(cards.first()).toBeVisible();

    // Click Category Filter
    const womenBtn = page.getByRole('button', { name: 'Thời trang Nữ', exact: true });
    if (await womenBtn.isVisible()) {
      await womenBtn.click();
      await expect(page.locator('h1')).toContainText(/Thời trang Nữ/i);
    }
  });

  test('should view product detail and add to bag', async ({ page }) => {
    await page.goto('/products/sculpted-wool-coat');
    await expect(page.locator('h1')).toContainText(/Áo Khoác Dạ Kiến Trúc Len Nguyên Chất/i);

    // Select Size
    const sizeBtn = page.locator('button:has-text("38 FR")').first();
    if (await sizeBtn.isVisible()) {
      await sizeBtn.click();
    }

    // Click Add to Bag
    const addToBagBtn = page.locator('button:has-text("Thêm vào giỏ hàng")');
    await addToBagBtn.click();

    // Verify Cart Drawer opens
    const drawerTitle = page.locator('h3:has-text("Túi mua sắm")');
    await expect(drawerTitle).toBeVisible();
  });

  test('should toggle product wishlist state and view wishlist', async ({ page }) => {
    // Go directly to product detail page where wishlist button is prominent
    await page.goto('/products/sculpted-wool-coat');

    const wishlistBtn = page.locator('button[aria-label*="yêu thích"]').first();
    await wishlistBtn.click();

    // Navigate to wishlist page
    await page.goto('/wishlist');
    await expect(page.locator('h1')).toContainText(/Danh sách yêu thích/i);
    await expect(page.locator('text=Áo Khoác Dạ Kiến Trúc Len Nguyên Chất')).toBeVisible();
  });

  test('should open quick search modal and find silhouettes', async ({ page }) => {
    await page.goto('/');

    const searchBtn = page.locator('button[aria-label*="Tìm kiếm"]:visible').first();
    await searchBtn.click();

    const searchInput = page.getByPlaceholder(/Tìm kiếm/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Lụa');
    await expect(page.locator('text=Tác phẩm tương thích')).toBeVisible();
  });

  test('should navigate through full checkout simulation', async ({ page }) => {
    // Add product to bag first
    await page.goto('/products/sculpted-wool-coat');
    const sizeBtn = page.locator('button:has-text("38 FR")').first();
    if (await sizeBtn.isVisible()) {
      await sizeBtn.click();
    }
    const addToBagBtn = page.locator('button:has-text("Thêm vào giỏ hàng")');
    await addToBagBtn.click();

    // Wait for cart state to persist
    await page.waitForTimeout(500);

    // Navigate to checkout
    await page.goto('/checkout');
    await expect(page.locator('h1')).toContainText(/Hoàn tất sở hữu/i, { timeout: 10000 });

    // Submit checkout form
    const authorizeBtn = page.locator('button:has-text("Xác nhận & Hoàn tất đơn hàng")');
    await authorizeBtn.click();

    // Verify redirect to order-success
    await page.waitForURL(/order-success/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText(/Đơn hàng của quý khách đã được xác nhận/i, { timeout: 10000 });
  });

  test('should handle 404 route gracefully', async ({ page }) => {
    await page.goto('/non-existent-luxury-silhouette');
    await expect(page.locator('h1')).toContainText('404');
    await expect(page.locator('text=Kiểu Dáng Yêu Cầu Không Tồn Tại')).toBeVisible();
  });

  test('should view vouchers catalog and copy promo code', async ({ page }) => {
    await page.goto('/vouchers');
    await expect(page.locator('h1')).toContainText(/Phiếu Ưu Đãi Atelier/i);
    await expect(page.locator('text=VANGUARD15')).toBeVisible();

    const copyBtn = page.locator('button:has-text("Sao Chép")').first();
    await copyBtn.click();
    await expect(page.locator('text=Đã Chép').first()).toBeVisible({ timeout: 5000 });
  });

  test('should lookup order status on /order-lookup', async ({ page }) => {
    await page.goto('/order-lookup');
    await expect(page.locator('h1')).toContainText(/Tra Cứu Tiến Trình Đơn Hàng/i);

    const orderInput = page.getByPlaceholder(/Mã đơn hàng/i);
    const phoneInput = page.getByPlaceholder(/Số điện thoại/i);
    await orderInput.fill('ORD-8924');
    await phoneInput.fill('0901234567');

    const submitBtn = page.locator('button:has-text("Tra Cứu Lịch Trình")');
    await submitBtn.click();

    await expect(page.locator('span:has-text("ORD-8924")').first()).toBeVisible({ timeout: 5000 });
  });

  test('should open Stylist AI assistant modal', async ({ page }) => {
    await page.goto('/');
    const aiBtn = page.locator('button[aria-label="Tư vấn Stylist AI"]');
    await aiBtn.click();

    await expect(page.locator('h3:has-text("Stylist AI Atelier Vérité")')).toBeVisible();
    await expect(page.locator('text=Kính chào quý khách')).toBeVisible();
  });

  test('should access admin portal dashboard and products table', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText(/Tổng Quan Vận Hành/i);
    await expect(page.locator('text=Tổng Doanh Thu Quý')).toBeVisible();

    await page.goto('/admin/products');
    await expect(page.locator('h1')).toContainText(/Quản Lý Tác Phẩm Thời Trang/i);
    await expect(page.locator('text=Thêm Tác Phẩm Mới')).toBeVisible();
  });
});
