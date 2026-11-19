import { test, expect } from '@playwright/test';

test.describe('Admin Order & Analytics Excel Export E2E Suite', () => {
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
              name: 'Executive Patron Admin',
              email: 'admin@atelierverite.com',
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

  test('Scenario 1: Orders page renders Excel Export button, search bar, status filters, and modal', async ({
    page,
  }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('domcontentloaded');

    // Verify Title & Subtitle
    await expect(page.locator('h1')).toContainText(/Quản Lý Đơn Hàng/i);
    await expect(
      page.getByText('xuất báo cáo Excel', { exact: false })
    ).toBeVisible();

    // Verify Search & Status Select
    const searchInput = page.getByPlaceholder(/Tìm theo mã đơn/i);
    await expect(searchInput).toBeVisible();

    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible();

    // Verify Export Excel Button
    const exportExcelBtn = page.getByRole('button', { name: /Xuất Excel/i });
    await expect(exportExcelBtn).toBeVisible();

    // Click Export Excel to open Modal
    await exportExcelBtn.click();

    // Verify Modal Heading & Scope Options
    await expect(page.getByText('Xuất Dữ Liệu Đơn Hàng Ra Excel')).toBeVisible();
    await expect(page.getByText('Tất cả đơn phù hợp bộ lọc')).toBeVisible();
    await expect(page.getByText('Trang hiện tại')).toBeVisible();
    await expect(page.getByText('Các đơn hàng đã chọn')).toBeVisible();

    // Verify Item Breakdown Checkbox
    await expect(page.getByText(/Kèm Chi Tiết Sản Phẩm & Biến Thể/i)).toBeVisible();

    // Verify Security Note
    await expect(page.getByText(/Khử trùng công thức/i)).toBeVisible();

    // Cancel / Close Modal
    const cancelBtn = page.getByRole('button', { name: /^Hủy$/i });
    await cancelBtn.click();
    await expect(page.getByText('Xuất Dữ Liệu Đơn Hàng Ra Excel')).not.toBeVisible();
  });

  test('Scenario 2: Table checkbox selection updates selected count in toolbar', async ({
    page,
  }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('domcontentloaded');

    // Wait for table to render
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Find table row checkboxes
    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    const rowCount = await rowCheckboxes.count();

    if (rowCount > 0) {
      // Toggle the first row checkbox
      await rowCheckboxes.first().click();

      // Verify the badge on "Xuất Excel" button indicates at least 1 selected
      const exportBtn = page.getByRole('button', { name: /Xuất Excel/i });
      await expect(exportBtn.locator('span.rounded-full')).toContainText('1');

      // Open Export Modal
      await exportBtn.click();
      await expect(page.getByText('Xuất Dữ Liệu Đơn Hàng Ra Excel')).toBeVisible();

      // Check that "Chỉ các đơn hàng được chọn" radio is enabled
      const selectedRadio = page.locator('input[value="selected"]');
      await expect(selectedRadio).toBeEnabled();

      // Close modal
      await page.getByRole('button', { name: /^Hủy$/i }).click();
    }
  });

  test('Scenario 3: Single order detail modal contains "Xuất Excel Đơn Này" action', async ({
    page,
  }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('domcontentloaded');

    // Check if any order view button exists
    const viewButtons = page.locator('tbody tr button[title="Xem chi tiết đơn hàng"]');
    const count = await viewButtons.count();

    if (count > 0) {
      await viewButtons.first().click();

      // Verify Detail Modal is open
      await expect(page.getByText(/Chi Tiết Đơn Hàng/i)).toBeVisible();

      // Verify "Xuất Excel Đơn Này" button is present
      const exportSingleBtn = page.getByRole('button', { name: /Xuất Excel Đơn Này/i });
      await expect(exportSingleBtn).toBeVisible();

      // Close Detail Modal
      const closeBtn = page.locator('div[role="dialog"]').getByRole('button').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('Scenario 4: Admin Dashboard page renders "Xuất Báo Cáo Excel" button', async ({
    page,
  }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Verify Dashboard Title
    await expect(page.locator('h1')).toContainText(/Tổng Quan Vận Hành/i);

    // Verify "Xuất Báo Cáo Excel" button
    const exportReportBtn = page.getByRole('button', { name: /Xuất Báo Cáo Excel/i });
    await expect(exportReportBtn).toBeVisible();
    await expect(exportReportBtn).toBeEnabled();

    // Verify Recent Orders section
    await expect(page.getByText(/Đơn Hàng Thu Thập Gần Đây/i)).toBeVisible();
  });

  test('Scenario 5: Admin Tracking page renders "Xuất Báo Cáo Excel" button with real data badge', async ({
    page,
  }) => {
    await page.goto('/admin/tracking');
    await page.waitForLoadState('domcontentloaded');

    // Verify Title
    await expect(page.locator('h1')).toContainText(/Bảng Phân Tích Hành Vi & Tracking/i);

    // Verify 100% Real API Data indicator
    await expect(page.getByText('100% Real API Data')).toBeVisible();

    // Verify "Xuất Báo Cáo Excel" button
    const exportTrackingReportBtn = page.getByRole('button', { name: /Xuất Báo Cáo Excel/i });
    await expect(exportTrackingReportBtn).toBeVisible();
    await expect(exportTrackingReportBtn).toBeEnabled();
  });
});
