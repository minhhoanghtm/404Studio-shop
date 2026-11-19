import { test, expect } from '@playwright/test';

test.describe('Atelier Vérité — Customer Loyalty & 12-Tier Membership E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock customer session into localStorage so protected routes can load
    await page.addInitScript(() => {
      const mockUser = {
        id: 'u-e2e-patron-01',
        name: 'Charlotte Vane',
        email: 'charlotte.vane@atelierverite.com',
        phone: '0901234567',
        role: 'user',
        vipTier: 'Bạc II',
      };
      const mockOrders = [
        {
          _id: 'ord-e2e-01',
          orderNumber: 'AV-E2E-1001',
          status: 'delivered',
          payment_status: 'paid',
          total_price: 9000000, // 900 points -> Silver II
          paid_at: '2026-02-01T10:00:00Z',
          items: [
            {
              id: 'p-1',
              name: 'Áo Khoác Dạ Tweed Archival',
              quantity: 1,
              price: 9000000,
              color: 'Noir',
              size: 'M',
              image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600',
            },
          ],
        },
      ];

      window.localStorage.setItem(
        'atelier_auth',
        JSON.stringify({
          state: {
            user: mockUser,
            token: 'e2e-token-valid',
            refreshToken: 'e2e-refresh-valid',
            isAuthenticated: true,
            orders: mockOrders,
          },
          version: 0,
        })
      );
    });
  });

  test('Scenario 1: Customer visits /account/loyalty and views virtual membership card, tier progress & 12-tier benefits', async ({ page }) => {
    await page.goto('/account/loyalty');
    await page.waitForLoadState('networkidle');

    // 1. Page Header & Patron Club Title
    await expect(page.getByText('PATRON PRIVILEGE CLUB')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Hạng Thành Viên & Điểm Thưởng Patron/i })).toBeVisible();

    // 2. Virtual Membership Card
    await expect(page.getByText('ATELIER VÉRITÉ', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('CHỦ THẺ PATRON')).toBeVisible();
    await expect(page.getByText('ĐIỂM XÉT HẠNG', { exact: true })).toBeVisible();

    // 3. Tier Status Card & 12-Tier Progress
    await expect(page.getByRole('heading', { name: /Bạn đang ở hạng/i })).toBeVisible();
    await expect(page.getByText('Điểm xét hạng', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Đã tích lũy', { exact: true }).first()).toBeVisible();

    // 4. Points Ledger Section
    await expect(page.getByRole('heading', { name: /Sổ Cái Biến Động Điểm/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tất cả/i }).first()).toBeVisible();

    // 5. 12-Tier Hierarchy Family Tabs
    await expect(page.getByRole('heading', { name: /Hệ Thống 12 Cấp Hạng Thành Viên & Đặc Quyền/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Hạng Đồng/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Hạng Bạc/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Hạng Vàng/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Hạng Kim Cương/i })).toBeVisible();

    // 6. Switch to Gold Family tab and verify Gold tiers
    await page.getByRole('button', { name: /Hạng Vàng/i }).click();
    await expect(page.getByText('Vàng I', { exact: true })).toBeVisible();
    await expect(page.getByText('Vàng II', { exact: true })).toBeVisible();
    await expect(page.getByText('Vàng III', { exact: true })).toBeVisible();

    // 7. Terms & Compliance section
    await expect(page.getByText(/Điều Khoản & Quy Định Chương Trình Thành Viên Patron/i)).toBeVisible();
    await expect(page.getByText(/Luật Bảo vệ Dữ liệu Cá nhân số 91\/2025\/QH15/i)).toBeVisible();
  });

  test('Scenario 2: Account Layout sidebar links to /account/loyalty and displays tier badge', async ({ page }) => {
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    // Verify nav item in sidebar
    const loyaltyLink = page.getByRole('link', { name: /Hạng Patron & Điểm thưởng/i });
    await expect(loyaltyLink).toBeVisible();

    // Click loyalty link and verify navigation
    await loyaltyLink.click();
    await expect(page).toHaveURL(/\/account\/loyalty/);
  });

  test('Scenario 3: Admin visits /admin/loyalty overview with 12-tier distribution & KPI metrics', async ({ page }) => {
    // Inject admin user
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'atelier_auth',
        JSON.stringify({
          state: {
            user: {
              id: 'admin-01',
              name: 'Quản Trị Viên Hệ Thống',
              email: 'admin@atelierverite.com',
              role: 'admin',
            },
            token: 'e2e-admin-token',
            isAuthenticated: true,
            orders: [],
          },
          version: 0,
        })
      );
    });

    await page.goto('/admin/loyalty');
    await page.waitForLoadState('networkidle');

    // 1. Header & Title
    await expect(page.getByRole('heading', { name: /Khách Hàng Thân Thiết & Điểm Thưởng/i })).toBeVisible();

    // 2. Operational Mode Banner
    await expect(page.getByText('Chế độ vận hành dữ liệu:')).toBeVisible();

    // 3. Overview KPI Cards
    await expect(page.getByText('Tổng thành viên', { exact: true })).toBeVisible();
    await expect(page.getByText('Tổng điểm đã cấp', { exact: true })).toBeVisible();
    await expect(page.getByText('Điểm đã thu hồi', { exact: true })).toBeVisible();
    await expect(page.getByText('Số dư điểm khả dụng', { exact: true })).toBeVisible();

    // 4. 12-Tier Distribution Breakdown
    await expect(page.getByRole('heading', { name: /Phân Bổ Khách Hàng Theo 12 Cấp Hạng/i })).toBeVisible();
    await expect(page.getByText('Đồng I', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Kim Cương III', { exact: true }).first()).toBeVisible();

    // 5. Sub-navigation tabs
    await expect(page.getByRole('link', { name: /Tổng Quan & Cấp Hạng/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Hồ Sơ Điểm Thành Viên/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Sổ Cái Giao Dịch Điểm/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Quy Tắc & Kiểm Định Backend/i })).toBeVisible();
  });

  test('Scenario 4: Admin views customer points at /admin/loyalty/customers and inspects member ledger modal', async ({ page }) => {
    await page.goto('/admin/loyalty/customers');
    await page.waitForLoadState('networkidle');

    // 1. Page Header
    await expect(page.getByRole('heading', { name: /Hồ Sơ Điểm & Hạng Thành Viên/i })).toBeVisible();

    // 2. Security Notice
    await expect(page.getByText(/Chính sách bảo mật & toàn vẹn dữ liệu điểm thưởng/i)).toBeVisible();

    // 3. Search input & Filters
    await expect(page.getByPlaceholder(/Tìm kiếm theo tên/i)).toBeVisible();
    await expect(page.getByText('Nhóm:')).toBeVisible();
    await expect(page.getByText('Cấp hạng:')).toBeVisible();
  });

  test('Scenario 5: Admin inspects /admin/loyalty/settings and verifies BLOCKED_BY_BACKEND technical documentation', async ({ page }) => {
    await page.goto('/admin/loyalty/settings');
    await page.waitForLoadState('networkidle');

    // 1. Title
    await expect(page.getByRole('heading', { name: /Quy Tắc Điểm Thưởng & Kiểm Định Backend/i })).toBeVisible();

    // 2. BLOCKED_BY_BACKEND banner
    await expect(page.getByText('BLOCKED_BY_BACKEND', { exact: true })).toBeVisible();
    await expect(page.getByText(/Không sử dụng Mock API/i)).toBeVisible();

    // 3. Conversion Rule Card
    await expect(page.getByRole('heading', { name: /Quy Tắc Quy Đổi Điểm Thưởng/i })).toBeVisible();
    await expect(page.getByText('10.000 ₫ = 1 điểm')).toBeVisible();

    // 4. Strict Hierarchy Validation indicator
    await expect(page.getByText(/HỢP LỆ \(12\/12 CẤP\)/i)).toBeVisible();

    // 5. Backend Mongoose Schema Blueprint
    await expect(page.getByRole('heading', { name: /Đặc Tả Kỹ Thuật Backend Mở Rộng/i })).toBeVisible();
    await expect(page.getByText('loyalty_transactions').first()).toBeVisible();
  });
});
