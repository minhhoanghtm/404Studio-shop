import { test, expect } from '@playwright/test';

test.describe('Admin Product Management & Multi-Variant Inventory E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss consent banner by setting stored consent
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
      // Pre-seed admin authentication state
      localStorage.setItem(
        'atelier_patron_auth',
        JSON.stringify({
          state: {
            user: {
              _id: 'admin_test_director',
              name: 'Creative Director',
              email: 'director@atelierverite.com',
              role: 'admin',
            },
            token: 'mock-jwt-admin-token',
            accessToken: 'mock-jwt-admin-token',
            isAuthenticated: true,
          },
        })
      );
    });
  });

  // =========================================================================
  // SCENARIO 1: ADMIN PRODUCTS LIST & NAVIGATION
  // =========================================================================
  test('Scenario 1: Should navigate to Admin Products list and render Vietnamese controls', async ({ page }) => {
    await page.goto('/admin/products');
    await page.waitForLoadState('domcontentloaded');

    // Verify Page Header & Subtitle
    await expect(page.locator('h1')).toContainText(/Quản Lý Sản Phẩm/i);
    await expect(page.getByText('Danh mục sản phẩm, biến thể kích thước', { exact: false })).toBeVisible();

    // Verify Sidebar contains updated terminology "Quản Lý Sản Phẩm"
    const sidebarProductLink = page.getByRole('link', { name: /Quản Lý Sản Phẩm/i });
    await expect(sidebarProductLink.first()).toBeVisible();

    // Verify Search Input
    const searchInput = page.getByPlaceholder(/Tìm sản phẩm theo tên hoặc mã slug/i);
    await expect(searchInput).toBeVisible();

    // Verify CTA "Thêm Sản Phẩm Mới"
    const createBtn = page.getByRole('link', { name: /Thêm Sản Phẩm Mới/i }).first();
    await expect(createBtn).toBeVisible();

    // Verify Filter dropdowns
    const selects = page.locator('select');
    await expect(selects.first()).toBeVisible();
  });

  // =========================================================================
  // SCENARIO 2: MULTI-VARIANT PRODUCT FORM & AUTOMATIC INVENTORY CALCULATION
  // =========================================================================
  test('Scenario 2: Should calculate dynamic total stock from variants and validate constraints', async ({ page }) => {
    await page.goto('/admin/products/new');
    await page.waitForLoadState('domcontentloaded');

    // Verify Page Header
    await expect(page.locator('h1')).toContainText(/Thêm Sản Phẩm Mới/i);

    // Fill Product Name
    const nameInput = page.getByPlaceholder(/VD: Áo Khoác Dạ Len Biella Cashmere Coat/i);
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Áo Khoác Dạ Lông Cừu Biella');

    // Verify Variant Section Header
    await expect(page.getByText('Quản Lý Biến Thể Sản Phẩm (Màu Sắc & Kích Cỡ)')).toBeVisible();

    // Verify initial auto-calculated total stock badge (default template variants sum: 15 + 20 + 10 = 45)
    await expect(page.getByText(/45 đơn vị/i)).toBeVisible();
    await expect(page.getByText('3 biến thể', { exact: true })).toBeVisible();

    // Find the stock input of the first variant row and change value from 10 to 30
    const stockInputs = page.locator('table input[type="number"]');
    const firstStockInput = stockInputs.first();
    await firstStockInput.fill('30');

    // Verify dynamic total stock recalculates: 30 + 15 + 20 = 65
    await expect(page.getByText(/65 đơn vị/i)).toBeVisible();

    // Delete one variant row
    const deleteBtns = page.locator('button[title*="Xóa biến thể này"]');
    const initialDeleteBtnCount = await deleteBtns.count();
    expect(initialDeleteBtnCount).toBeGreaterThan(0);

    // Click delete on the last row (stock 20)
    await deleteBtns.last().click();

    // Verify total stock recalculates: 65 - 20 = 45
    await expect(page.getByText(/45 đơn vị/i)).toBeVisible();
    await expect(page.getByText('2 biến thể', { exact: true })).toBeVisible();

    // Test Adding a new single variant row
    const addRowBtn = page.getByRole('button', { name: /\+ Thêm Dòng Biến Thể Mới/i });
    await addRowBtn.click();
    await expect(page.getByText('3 biến thể', { exact: true })).toBeVisible();

    // Fill the new row with stock 25
    const updatedStockInputs = page.locator('table input[type="number"]');
    await updatedStockInputs.last().fill('25');

    // Total stock becomes: 45 + 25 = 70
    await expect(page.getByText(/70 đơn vị/i)).toBeVisible();

    // Verify summary card at the bottom reflects live stock
    await expect(page.getByText(/Tổng tồn kho tự động được tính là/i)).toBeVisible();
    await expect(page.locator('span.font-mono.font-bold.text-emerald-400').last()).toHaveText('70');
  });

  // =========================================================================
  // SCENARIO 3: STOREFRONT TERMINOLOGY VERIFICATION
  // =========================================================================
  test('Scenario 3: Should verify e-commerce terminology uses "sản phẩm" across public pages', async ({ page }) => {
    // Check Cart Page empty state
    await page.goto('/cart');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(/Túi mua sắm của quý khách đang trống/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Khám phá bộ sưu tập/i })).toBeVisible();

    // Check footer terminology
    await expect(page.getByRole('link', { name: /Toàn bộ danh mục sản phẩm/i })).toBeVisible();

    // Check Lookup Page
    await page.goto('/order-lookup');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1, h2').first()).toContainText(/Tra Cứu.*Đơn Hàng/i);
    await expect(page.getByText(/sản phẩm/i).first()).toBeVisible();
  });
});
