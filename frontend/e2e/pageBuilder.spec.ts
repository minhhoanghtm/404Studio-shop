import { test, expect } from '@playwright/test';

test.describe('Admin Visual Page Builder & Dynamic CMS E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Pre-seed privacy consent so cookie banner never intercepts clicks
    await page.addInitScript(() => {
      localStorage.setItem(
        'atelier_privacy_consent',
        JSON.stringify({
          choice: 'ALL_ACCEPTED',
          categories: {
            necessary: true,
            analytics: true,
            personalization: true,
            marketing: true,
          },
          timestamp: new Date().toISOString(),
          policyVersion: '2026-11-07',
          source: 'banner',
        })
      );

      // 2. Pre-seed admin session for admin route authentication
      const mockAdmin = {
        _id: 'admin-cms-architect',
        name: 'Directeur Général',
        email: 'admin@atelierverite.com',
        role: 'admin',
      };

      const authState = {
        state: {
          user: mockAdmin,
          token: 'e2e-cms-admin-token',
          accessToken: 'e2e-cms-admin-token',
          isAuthenticated: true,
        },
        version: 0,
      };

      localStorage.setItem('atelier_patron_auth', JSON.stringify(authState));
      localStorage.setItem('atelier_auth', JSON.stringify(authState));
    });

    // Mock banners, campaigns, and recommendations by default to prevent timeouts
    await page.route('**/api/banners/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: [] }),
      });
    });

    await page.route('**/api/campaigns/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: [] }),
      });
    });

    await page.route('**/api/recommendations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: { recommendations: [] } }),
      });
    });
  });

  test('Scenario 1: Admin navigates to Visual Page Builder list page', async ({ page }) => {
    await page.route('**/api/admin/pages?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            pages: [
              {
                _id: 'page_lb_1',
                title: 'Lookbook Mùa Đông 2026',
                slug: 'lookbook-mua-dong-2026',
                type: 'lookbook',
                status: 'published',
                isFeatured: true,
                viewCount: 1420,
                updatedAt: new Date().toISOString(),
              },
              {
                _id: 'page_about_1',
                title: 'Về Chúng Tôi — Di Sản May Đo',
                slug: 've-chung-toi',
                type: 'about',
                status: 'draft',
                isFeatured: false,
                viewCount: 310,
                updatedAt: new Date().toISOString(),
              },
            ],
            total: 2,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        }),
      });
    });

    await page.goto('/admin/page-builder');

    // Verify Page Header
    await expect(page.getByRole('heading', { name: 'Thiết Kế Trang & Quản Lý Nội Dung' })).toBeVisible();

    // Verify Action button
    const createBtn = page.getByRole('link', { name: /Thiết Kế Trang Mới/i });
    await expect(createBtn).toBeVisible();

    // Verify Table Rows
    await expect(page.getByText('Lookbook Mùa Đông 2026')).toBeVisible();
    await expect(page.getByText('/lookbook-mua-dong-2026')).toBeVisible();
    await expect(page.getByText('Về Chúng Tôi — Di Sản May Đo')).toBeVisible();
  });

  test('Scenario 2: Visual Editor loads and applies pre-configured template', async ({ page }) => {
    await page.goto('/admin/page-builder/new');

    // Verify top bar status and template button
    await expect(page.locator('header').getByText('Bản Nháp')).toBeVisible();
    await expect(page.getByRole('button', { name: /Mẫu Bố Cục/i })).toBeVisible();

    // Click Templates button
    await page.getByRole('button', { name: /Mẫu Bố Cục/i }).click();

    // Verify Template Modal
    await expect(page.getByRole('heading', { name: 'Thư Viện Mẫu Trang (Page Templates)' })).toBeVisible();
    await expect(page.getByText('Mẫu Lookbook Thời Trang (Capsule Runway)')).toBeVisible();
    await expect(page.getByText('Mẫu Giới Thiệu Thương Hiệu (About Us Heritage)')).toBeVisible();
    await expect(page.getByText('Mẫu Chính Sách Pháp Lý (Statutory Legal Policy)')).toBeVisible();

    // Select Lookbook template
    await page.getByRole('button', { name: 'Áp Dụng Mẫu Này' }).first().click();

    // Modal closes and Lookbook headings appear in canvas
    await expect(page.getByRole('heading', { name: 'DẠ KHÚC ĐỘC BẢN' })).toBeVisible();
  });

  test('Scenario 3: Selecting a block opens Inspector and updates live preview', async ({ page }) => {
    await page.goto('/admin/page-builder/new');

    const isSmallScreen = await page.evaluate(() => window.innerWidth < 1280);

    // Click on the default heading block in canvas
    const headingBlock = page.locator('[data-block-type="heading"]').first();
    await expect(headingBlock).toBeVisible();
    await headingBlock.click();

    // If small screen, open the Properties Drawer
    if (isSmallScreen) {
      const drawerBtn = page.locator('header button[title="Thuộc Tính"]');
      await expect(drawerBtn).toBeVisible();
      await drawerBtn.click();
    }

    // Right inspector should show Content fields
    await expect(page.getByText('Văn Bản Tiêu Đề')).toBeVisible();

    // Fill new heading text
    const titleInput = page.locator('input[value="Tiêu Đề Nội Dung"]');
    await titleInput.fill('BỘ SƯU TẬP HAUTE COUTURE ĐỘC BẢN');

    // If small screen, close drawer to inspect canvas
    if (isSmallScreen) {
      const closeBtn = page.getByRole('button', { name: 'Đóng bảng thuộc tính' });
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }

    // Verify live update in canvas
    await expect(page.getByRole('heading', { name: 'BỘ SƯU TẬP HAUTE COUTURE ĐỘC BẢN' })).toBeVisible();
  });

  test('Scenario 4: Adding new block from Block Library', async ({ page }) => {
    await page.goto('/admin/page-builder/new');

    const isSmallScreen = await page.evaluate(() => window.innerWidth < 1280);

    // If small screen, open the Left Drawer
    if (isSmallScreen) {
      const drawerBtn = page.locator('header button[title="Khối & Cấu Trúc"]');
      await expect(drawerBtn).toBeVisible();
      await drawerBtn.click();
    }

    // Ensure left tab is 'Thư Viện Khối'
    await page.getByRole('button', { name: /Thư Viện Khối/i }).click();

    // Click on "Trích Dẫn (Quote)"
    const quoteItem = page.getByText('Trích Dẫn (Quote)');
    await expect(quoteItem).toBeVisible();
    await quoteItem.click();

    // If small screen, close drawer to view canvas
    if (isSmallScreen) {
      const closeBtn = page.getByRole('button', { name: 'Đóng bảng khối' });
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }

    // Verify quote appears in canvas
    await expect(
      page.locator('main').getByText(/Sự tối giản không phải là thiếu hụt/i).first()
    ).toBeVisible();
  });

  test('Scenario 5: Multi-device responsive switcher changes viewport frame', async ({ page }) => {
    await page.goto('/admin/page-builder/new');

    // Select Mobile viewport
    const mobileBtn = page.getByTitle('Màn hình Điện thoại (Mobile)');
    await expect(mobileBtn).toBeVisible();
    await mobileBtn.click();

    // Verify frame has mobile width class
    const canvasContainer = page.locator('main > div');
    await expect(canvasContainer).toHaveClass(/w-\[390px\]/);

    // Select Tablet viewport
    const tabletBtn = page.getByTitle('Màn hình Máy tính bảng (Tablet)');
    await tabletBtn.click();
    await expect(canvasContainer).toHaveClass(/w-\[768px\]/);

    // Select Desktop viewport
    const desktopBtn = page.getByTitle('Màn hình Máy tính (Desktop)');
    await desktopBtn.click();
    await expect(canvasContainer).toHaveClass(/w-full/);
  });

  test('Scenario 6: Legal Validation prevents publishing statutory policy with missing clauses', async ({ page }) => {
    await page.goto('/admin/page-builder/new');

    const isSmallScreen = await page.evaluate(() => window.innerWidth < 1280);

    // Unselect block to reveal Page Settings
    await page.locator('main').click({ position: { x: 10, y: 10 } });

    // If small screen, open the Properties Drawer
    if (isSmallScreen) {
      const drawerBtn = page.locator('header button[title="Thuộc Tính"]');
      await expect(drawerBtn).toBeVisible();
      await drawerBtn.click();
    }

    // Set page type to policy and slug to privacy-policy
    const slugInput = page.locator('input[value^="trang-moi"]');
    await slugInput.fill('privacy-policy');

    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption('policy');

    // If small screen, close drawer to access publish button
    if (isSmallScreen) {
      const closeBtn = page.getByRole('button', { name: 'Đóng bảng thuộc tính' });
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }

    // Attempt to publish without mandatory legal blocks
    await page.getByRole('button', { name: /Xuất Bản/i }).click();

    // Legal modal must block publish
    await expect(
      page.getByText(/Không Thể Xuất Bản: Thiếu Quy Định Pháp Lý Bắt Buộc/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Luật Bảo vệ dữ liệu cá nhân số 91\/2025\/QH15/i)
    ).toBeVisible();

    // Dismiss modal
    await page.getByRole('button', { name: /Đã Hiểu, Quay Lại Bổ Sung/i }).click();
    await expect(
      page.getByText(/Không Thể Xuất Bản: Thiếu Quy Định Pháp Lý Bắt Buộc/i)
    ).not.toBeVisible();
  });

  test('Scenario 7: Storefront About page renders dynamic sections when published', async ({ page }) => {
    await page.route('**/api/pages/ve-chung-toi', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            _id: 'page_about_live',
            title: 'Về Chúng Tôi — Di Sản May Đo Atelier Vérité',
            slug: 've-chung-toi',
            type: 'about',
            status: 'published',
            sections: [
              {
                _id: 'sec_about_1',
                type: 'hero',
                title: 'Hero Brand',
                order: 0,
                isActive: true,
                data: {
                  blocks: [
                    {
                      id: 'b1',
                      type: 'heading',
                      category: 'content',
                      label: 'Tiêu Đề',
                      content: {
                        text: 'DI SẢN MAY ĐO THỦ CÔNG ĐƯƠNG ĐẠI',
                        level: 'h1',
                        tagline: 'ATELIER VÉRITÉ PARIS 2026',
                      },
                      styles: { fontFamily: 'serif', textAlign: 'center' },
                    },
                    {
                      id: 'b2',
                      type: 'paragraph',
                      category: 'content',
                      label: 'Đoạn Văn',
                      content: {
                        text: 'Nơi mỗi đường kim mũi chỉ là lời cam kết về vẻ đẹp nguyên bản và phẩm giá trường cửu của người mặc.',
                      },
                      styles: { textAlign: 'center' },
                    },
                  ],
                },
              },
            ],
          },
        }),
      });
    });

    await page.goto('/about');

    // Verify dynamic content from CMS
    await expect(page.getByText(/Đã đồng bộ CMS Backend/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'DI SẢN MAY ĐO THỦ CÔNG ĐƯƠNG ĐẠI' })).toBeVisible();
  });
});
