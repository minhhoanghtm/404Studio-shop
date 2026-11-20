import { test, expect } from '@playwright/test';

test.describe('Real Data Shopping & Safe Order Creation Suite (Non-Mock)', () => {
  test('E2E Flow: Clear storage, view real products from API, add from detail page, and checkout successfully', async ({
    page,
  }) => {
    // 1. Clear localStorage to ensure fresh session without legacy mock items
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // 2. Navigate to Catalog (/products) and verify real products from Backend API
    await page.goto('/products', { waitUntil: 'networkidle' });

    // Expect real products to be visible
    const productLinks = page.locator('a[href^="/products/"]');
    await expect(productLinks.first()).toBeVisible({ timeout: 10000 });

    // Check that at least one real product from DB is loaded
    const productSlugs = await productLinks.evaluateAll((links) =>
      links.map((el) => el.getAttribute('href')?.replace('/products/', '')).filter(Boolean)
    );
    expect(productSlugs.length).toBeGreaterThan(0);
    const targetSlug = productSlugs[0] as string;

    // 3. Navigate to product detail page (/products/:slug)
    await page.goto(`/products/${targetSlug}`, { waitUntil: 'networkidle' });

    // Verify product stage and heading
    const productHeading = page.locator('h1.font-display');
    await expect(productHeading).toBeVisible({ timeout: 10000 });

    // Verify it is NOT the mock fallback "Sản phẩm không khả dụng"
    await expect(page.getByText('Sản phẩm không khả dụng')).not.toBeVisible();

    // Select available size if multiple exist
    const sizeButtons = page.locator('button[aria-label*="Kích cỡ"]');
    if ((await sizeButtons.count()) > 0) {
      await sizeButtons.first().click();
    }

    // Click Add to Cart
    const addToCartBtn = page.getByRole('button', { name: /Thêm vào giỏ hàng|Thêm vào túi/i });
    await expect(addToCartBtn).toBeEnabled();
    await addToCartBtn.click();

    // Verify Cart Drawer opens and item is present
    const drawer = page.locator('div[role="dialog"][aria-label="Giỏ hàng"]');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    // Check that no mock error banner exists in Drawer
    await expect(drawer.getByText(/sản phẩm mẫu chưa có mã Backend/i)).not.toBeVisible();

    // Click checkout from drawer directly
    const drawerCheckoutBtn = drawer.getByRole('button', { name: /Tiến hành thanh toán/i });
    await expect(drawerCheckoutBtn).toBeEnabled();
    await drawerCheckoutBtn.click();

    // 4. On Checkout Page (/checkout)
    await page.waitForURL('**/checkout', { timeout: 10000 });

    // Verify no mock error banner exists on Checkout page
    await expect(page.getByText(/sản phẩm dữ liệu mẫu chưa có mã Backend/i)).not.toBeVisible();

    // Fill in shipping information
    await page.fill('input[name="firstName"]', 'Minh');
    await page.fill('input[name="lastName"]', 'Hoàng');
    await page.fill('input[name="phone"]', '0901234567');
    await page.fill('input[name="addressLine1"]', '88 Đồng Khởi');
    await page.fill('input[name="city"]', 'TP. Hồ Chí Minh');
    await page.fill('input[name="postalCode"]', '700000');

    // Agree to required policy & delivery checkboxes in CheckoutSummary
    const checkboxes = page.locator('input[type="checkbox"]');
    const cbCount = await checkboxes.count();
    for (let i = 0; i < Math.min(cbCount, 2); i++) {
      const cb = checkboxes.nth(i);
      if (!(await cb.isChecked())) {
        await cb.check();
      }
    }

    // Place order
    const placeOrderBtn = page.getByRole('button', { name: /Xác nhận & Hoàn tất đơn hàng/i });
    await expect(placeOrderBtn).toBeEnabled();
    await placeOrderBtn.click();

    // Verify order completed and navigated to /order-success
    await page.waitForURL('**/order-success**', { timeout: 20000 });
    expect(page.url()).toContain('/order-success');
    await expect(page.getByRole('heading', { name: /Đơn hàng của quý khách đã được xác nhận/i })).toBeVisible();
  });
});
