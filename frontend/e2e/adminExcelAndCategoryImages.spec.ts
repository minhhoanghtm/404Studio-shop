import { test, expect } from '@playwright/test';

test.describe('Admin Category Images & Excel Import/Export E2E Suite', () => {
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

  test('Scenario 1: Category Management renders image columns, toolbar Excel buttons, and modal uploader', async ({
    page,
  }) => {
    await page.goto('/admin/categories');
    await page.waitForLoadState('domcontentloaded');

    // Verify Title & Subtitle
    await expect(page.locator('h1')).toContainText(/Quản Lý Danh Mục/i);
    await expect(
      page.getByText('Quản lý cấu trúc cây danh mục', { exact: false })
    ).toBeVisible();

    // Verify Toolbar Buttons
    const downloadTemplateBtn = page.getByRole('button', { name: /Tải Mẫu/i });
    await expect(downloadTemplateBtn).toBeVisible();

    const importExcelBtn = page.getByRole('button', { name: /Nhập Excel/i });
    await expect(importExcelBtn).toBeVisible();

    const exportExcelBtn = page.getByRole('button', { name: /Xuất Excel/i });
    await expect(exportExcelBtn).toBeVisible();

    const addCategoryBtn = page.getByRole('button', { name: /Thêm Danh Mục Mới/i }).first();
    await expect(addCategoryBtn).toBeVisible();

    // Click "Thêm Danh Mục Mới" to open modal
    await addCategoryBtn.click();
    await expect(page.getByRole('heading', { name: /Tạo Danh Mục Thời Trang Mới/i })).toBeVisible();

    // Verify Image Uploader is present inside modal
    await expect(page.getByText(/Hình Ảnh Đại Diện Danh Mục/i)).toBeVisible();
    await expect(page.getByText(/kéo thả tệp vào đây/i)).toBeVisible();

    // Toggle direct URL mode
    const directUrlBtn = page.getByRole('button', { name: /Dán đường dẫn URL/i });
    await expect(directUrlBtn).toBeVisible();
    await directUrlBtn.click();

    const urlInput = page.getByPlaceholder(/Dán đường dẫn ảnh HTTPS/i);
    await expect(urlInput).toBeVisible();

    // Close Modal
    const cancelBtn = page.getByRole('button', { name: /^Hủy$/i });
    await cancelBtn.click();
    await expect(page.getByRole('heading', { name: /Tạo Danh Mục Thời Trang Mới/i })).not.toBeVisible();
  });

  test('Scenario 2: Category Excel Import Modal opens, displays instructions, and allows closing', async ({
    page,
  }) => {
    await page.goto('/admin/categories');
    await page.waitForLoadState('domcontentloaded');

    // Click "Nhập Excel"
    const importExcelBtn = page.getByRole('button', { name: /Nhập Excel/i });
    await importExcelBtn.click();

    // Verify Modal Header
    await expect(page.getByText(/Nhập Danh Mục Từ Tệp Excel/i)).toBeVisible();

    // Verify Upload Zone
    await expect(page.getByText(/Chọn tệp Excel/i)).toBeVisible();
    await expect(page.getByText(/Dung lượng tối đa: 10 MB/i)).toBeVisible();

    // Verify Safe Mode Note
    await expect(page.getByText(/Chế độ an toàn/i)).toBeVisible();

    // Close Modal
    const closeBtn = page.getByRole('button', { name: /Đóng/i });
    await closeBtn.click();
    await expect(page.getByText(/Nhập Danh Mục Từ Tệp Excel/i)).not.toBeVisible();
  });

  test('Scenario 3: Product Management renders Excel toolbar buttons and multi-variant import modal', async ({
    page,
  }) => {
    await page.goto('/admin/products');
    await page.waitForLoadState('domcontentloaded');

    // Verify Toolbar Buttons
    const downloadTemplateBtn = page.getByRole('button', { name: /Tải Mẫu/i });
    await expect(downloadTemplateBtn).toBeVisible();

    const importExcelBtn = page.getByRole('button', { name: /Nhập Excel/i });
    await expect(importExcelBtn).toBeVisible();

    const exportExcelBtn = page.getByRole('button', { name: /Xuất Excel/i });
    await expect(exportExcelBtn).toBeVisible();

    // Open Product Excel Import Modal
    await importExcelBtn.click();

    // Verify Product Import Modal Header
    await expect(page.getByText(/Nhập Sản Phẩm & Biến Thể Từ Tệp Excel/i)).toBeVisible();

    // Verify Multi-variant Guidance Callout
    await expect(page.getByText(/Cấu Trúc Đa Biến Thể & Tồn Kho/i)).toBeVisible();
    await expect(page.getByText(/TotalStock = SUM\(VariantStock\)/i)).toBeVisible();

    // Close Modal
    const closeBtn = page.getByRole('button', { name: /Đóng/i });
    await closeBtn.click();
    await expect(page.getByText(/Nhập Sản Phẩm & Biến Thể Từ Tệp Excel/i)).not.toBeVisible();
  });
});
