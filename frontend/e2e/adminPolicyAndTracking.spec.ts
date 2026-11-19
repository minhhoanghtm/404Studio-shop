import { test, expect } from '@playwright/test';

test.describe('Admin Enterprise Policy Management & Tracking Analytics E2E Suite', () => {
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
  // SCENARIO 1: ADMIN POLICIES LIST & NAVIGATION
  // =========================================================================
  test('Scenario 1: Should navigate to Admin Policies list and render controls', async ({ page }) => {
    await page.goto('/admin/policies');
    await page.waitForLoadState('domcontentloaded');

    // Verify Page Header
    await expect(page.locator('h1')).toContainText(/Quản Lý Chính Sách Doanh Nghiệp/i);

    // Verify Metric Cards
    await expect(page.getByText('Tổng Chính Sách', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Đang Có Hiệu Lực', { exact: false })).toBeVisible();

    // Verify Table Headers
    await expect(page.locator('th:has-text("Tên Chính Sách")')).toBeVisible();
    await expect(page.locator('th:has-text("Phân Loại")')).toBeVisible();
    await expect(page.locator('th:has-text("Trạng Thái")')).toBeVisible();

    // Verify "Tạo Chính Sách Mới" CTA
    const createBtn = page.getByRole('link', { name: /Tạo Chính Sách Mới/i }).first();
    await expect(createBtn).toBeVisible();
  });

  // =========================================================================
  // SCENARIO 2: POLICY CREATION & FORM CONTROLS
  // =========================================================================
  test('Scenario 2: Should open Policy Editor, input fields and toggle preview', async ({ page }) => {
    await page.goto('/admin/policies/new');
    await page.waitForLoadState('domcontentloaded');

    // Verify Heading
    await expect(page.locator('h1, h2').first()).toContainText(/Khởi Tạo Chính Sách|Soạn Thảo/i);

    // Fill Title
    const titleInput = page.getByPlaceholder(/Chính Sách Bảo Mật/i);
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Chính Sách Vận Chuyển Hỏa Tốc Haute Couture');

    // Check slug auto-generation
    const slugInput = page.getByPlaceholder(/chinh-sach-bao-mat/i);
    await expect(slugInput).toHaveValue(/chinh-sach-van-chuyen/i);

    // Verify Rich Text Editor Toolbar buttons
    await expect(page.getByTitle('Tiêu đề H1')).toBeVisible();
    await expect(page.getByTitle('In đậm (Bold)')).toBeVisible();
    await expect(page.getByTitle('Danh sách dấu chấm (Unordered List)')).toBeVisible();

    // Toggle Preview Tab
    const previewTab = page.getByRole('button', { name: /Xem Trước/i });
    await previewTab.click();

    // Verify Preview Notice
    await expect(page.getByText(/Chế độ xem trước giao diện công khai/i)).toBeVisible();
    await expect(page.getByText(/Chính Sách Vận Chuyển Hỏa Tốc Haute Couture/i)).toBeVisible();

    // Toggle back to Editor Tab
    const editorTab = page.getByRole('button', { name: /Soạn Thảo/i });
    await editorTab.click();
    await expect(titleInput).toBeVisible();
  });

  // =========================================================================
  // SCENARIO 3: ADMIN TRACKING DASHBOARD & KPIS
  // =========================================================================
  test('Scenario 3: Should view Admin Tracking Dashboard, Funnel, and Event Volumes', async ({ page }) => {
    await page.goto('/admin/tracking');
    await page.waitForLoadState('domcontentloaded');

    // Verify Header
    await expect(page.locator('h1')).toContainText(/Bảng Phân Tích Hành Vi & Tracking/i);

    // Verify KPI Cards
    await expect(page.getByText('Tổng Sự Kiện Thu Thập', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Người Dùng Tương Tác', { exact: false })).toBeVisible();
    await expect(page.getByText('Phiên Truy Cập Hệ Thống', { exact: false })).toBeVisible();
    await expect(page.getByText('Tỷ Lệ Nhấp Gợi Ý (CTR)', { exact: false })).toBeVisible();
    await expect(page.getByText('Stylist AI Tương Tác', { exact: false })).toBeVisible();

    // Verify Sub-navigation links
    await expect(page.getByRole('link', { name: /Tổng Quan/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Hành Vi & Phiên Trực Tuyến/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Sự Kiện Hệ Thống/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Tác Phẩm & Phễu Chuyển Đổi/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Tuân Thủ Quyền Riêng Tư/i })).toBeVisible();
  });

  // =========================================================================
  // SCENARIO 4: SUB-PAGES NAVIGATION (USERS, EVENTS, PRODUCTS, CONSENT)
  // =========================================================================
  test('Scenario 4: Should navigate across all tracking sub-modules', async ({ page }) => {
    // 1. Users & Live Presence
    await page.goto('/admin/tracking/users');
    await expect(page.locator('h1')).toContainText(/Hành Vi Người Dùng & Quan Sát/i);
    await expect(page.getByText('Tổng Phiên Đang Mở', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Đang Tương Tác', { exact: false }).first()).toBeVisible();

    // 2. Events & Session Timeline
    await page.goto('/admin/tracking/events');
    await expect(page.locator('h1')).toContainText(/Quản Lý Sự Kiện & Hành Trình/i);
    await expect(page.getByText('Khối Lượng Sự Kiện Hệ Thống Theo Danh Mục', { exact: false })).toBeVisible();
    await expect(page.getByPlaceholder(/Nhập Session ID/i)).toBeVisible();

    // 3. Products & AI Performance
    await page.goto('/admin/tracking/products');
    await expect(page.locator('h1')).toContainText(/Phân Tích Tương Tác Tác Phẩm/i);
    await expect(page.getByText('Thuật Toán Gợi Ý Cá Nhân Hóa', { exact: false })).toBeVisible();
    await expect(page.getByText('Trợ Lý Stylist AI Maison', { exact: false })).toBeVisible();

    // 4. Privacy & Consent Compliance
    await page.goto('/admin/tracking/consent');
    await expect(page.locator('h1')).toContainText(/Quản Trị Tuân Thủ Quyền Riêng Tư/i);
    await expect(page.getByText('Phiên Bản Chính Sách', { exact: true })).toBeVisible();
    await expect(page.getByText('Sổ Theo Dõi Yêu Cầu Quyền Chủ Thể Dữ Liệu', { exact: false })).toBeVisible();
  });

  // =========================================================================
  // SCENARIO 5: PUBLIC LEGAL PAGES SYNCHRONIZATION
  // =========================================================================
  test('Scenario 5: Should render public statutory policy pages with backend synchronization', async ({ page }) => {
    // Privacy Policy Page
    await page.goto('/privacy-policy');
    await expect(page.locator('h1')).toContainText(/Chính Sách Bảo Mật/i);
    await expect(page.getByText('Phiên bản: 2026-11-07', { exact: false })).toBeVisible();

    // Terms of Service Page
    await page.goto('/terms-of-service');
    await expect(page.locator('h1')).toContainText(/Điều Khoản Sử Dụng/i);

    // Cookie Policy Page
    await page.goto('/cookie-policy');
    await expect(page.locator('h1')).toContainText(/Chính Sách Cookie/i);
    await expect(page.getByRole('button', { name: /Tùy chỉnh Cookie/i })).toBeVisible();

    // Returns & Refunds Page
    await page.goto('/returns-refunds');
    await expect(page.locator('h1')).toContainText(/Chính Sách Đổi Trả & Hoàn Tiền/i);
    await expect(page.getByText('Thời hạn đổi trả: 07 ngày', { exact: false })).toBeVisible();
  });
});
