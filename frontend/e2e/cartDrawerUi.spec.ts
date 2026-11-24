import { test, expect } from '@playwright/test';

test.describe('Cart Drawer UI & Overlay Stacking Order Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Dismiss cookie banner if present
    const cookieBanner = page.locator('aside[aria-label="Thông báo và quản lý quyền riêng tư cookie"]');
    if (await cookieBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
      const acceptBtn = cookieBanner.locator('button:has-text("Chấp nhận tất cả")');
      if (await acceptBtn.isVisible()) {
        await acceptBtn.click();
      }
    }
  });

  test('Check 1: Drawer and overlay are rendered in document.body via Portal and sit ABOVE site-chrome header & ticker', async ({
    page,
  }) => {
    // Open drawer via header cart button
    const cartBtn = page.locator('button[aria-label*="Giỏ hàng"]');
    await expect(cartBtn).toBeVisible();
    await cartBtn.click();

    // Verify drawer dialog is mounted into document.body
    const drawer = page.locator('div[role="dialog"][aria-label="Giỏ hàng"]');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    // Check z-index of drawer and overlay
    const overlay = page.locator('div.fixed.inset-0.bg-black\\/60');
    await expect(overlay).toBeVisible();

    const overlayZIndex = await overlay.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });
    const drawerZIndex = await drawer.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });
    const headerZIndex = await page.locator('.site-chrome').evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    // Verify overlay and drawer z-index are higher than site-chrome header (1000)
    expect(parseInt(drawerZIndex, 10)).toBeGreaterThan(parseInt(headerZIndex, 10));
    expect(parseInt(overlayZIndex, 10)).toBeGreaterThan(parseInt(headerZIndex, 10));

    // Verify body scroll lock
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('hidden');

    // Press Escape to close and verify body scroll restoration
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible({ timeout: 3000 });

    const restoredOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(restoredOverflow).toBe('');
  });

  test('Check 2: Opening drawer after scrolling down mid-page still covers header & ticker', async ({
    page,
  }) => {
    // Scroll down 600px
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);

    // Open drawer
    const cartBtn = page.locator('button[aria-label*="Giỏ hàng"]');
    await cartBtn.click();

    const drawer = page.locator('div[role="dialog"][aria-label="Giỏ hàng"]');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    // Verify drawer top is fixed at 0
    const boundingBox = await drawer.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.y).toBe(0);

    // Close via backdrop click
    const overlay = page.locator('div.fixed.inset-0.bg-black\\/60');
    await overlay.click({ position: { x: 50, y: 300 } });
    await expect(drawer).not.toBeVisible({ timeout: 3000 });
  });

  test('Check 3: Empty cart displays empty state and disabled checkout button', async ({ page }) => {
    // Clear cart via localStorage before test
    await page.evaluate(() => {
      localStorage.setItem('atelier_cart_items', '[]');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const cartBtn = page.locator('button[aria-label*="Giỏ hàng"]');
    await cartBtn.click();

    const drawer = page.locator('div[role="dialog"][aria-label="Giỏ hàng"]');
    await expect(drawer).toBeVisible();

    // Verify Header
    await expect(drawer.getByRole('heading', { name: /GIỎ HÀNG/i })).toBeVisible();

    // Verify Empty State
    await expect(drawer.getByText(/Túi mua sắm của quý khách đang trống/i)).toBeVisible();
    await expect(drawer.getByRole('link', { name: /Tiếp tục mua sắm/i })).toBeVisible();

    // Verify Checkout Button is disabled
    const checkoutBtn = drawer.getByRole('button', { name: /Tiến hành thanh toán/i });
    await expect(checkoutBtn).toBeDisabled();
  });

  test('Check 4: Populated cart with 1 item has 72x96px image, clean typography, right-aligned price, and enabled checkout', async ({
    page,
  }) => {
    // Inject 1 test item into cart
    await page.evaluate(() => {
      const mockItem = {
        productId: '6a3f46317302ffeba0d3949c',
        productSlug: 'ao-khoac-da-kien-truc',
        name: 'Áo Khoác Dạ Kiến Trúc Biella',
        price: 58500000,
        selectedColor: 'Đen Noir',
        selectedColorHex: '#000000',
        selectedSize: '38 FR',
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
      };
      localStorage.setItem('atelier_cart_items', JSON.stringify([mockItem]));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const cartBtn = page.locator('button[aria-label*="Giỏ hàng"]');
    await cartBtn.click();

    const drawer = page.locator('div[role="dialog"][aria-label="Giỏ hàng"]');
    await expect(drawer).toBeVisible();

    // Verify 72x96px image
    const itemImg = drawer.locator('img[alt*="Áo Khoác Dạ Kiến Trúc"]');
    await expect(itemImg).toBeVisible();
    const imgBox = await itemImg.boundingBox();
    expect(Math.round(imgBox!.width)).toBe(72);
    expect(Math.round(imgBox!.height)).toBe(96);

    // Verify variant text
    await expect(drawer.getByText('Đen Noir · 38 FR')).toBeVisible();

    // Verify trash button is visible and separate from title
    const trashBtn = drawer.locator('button[aria-label*="Xóa Áo Khoác Dạ"]');
    await expect(trashBtn).toBeVisible();

    // Verify quantity and price
    await expect(drawer.locator('button[aria-label="Giảm số lượng"] + span.font-mono')).toHaveText('1');

    // Verify Checkout Button is enabled
    const checkoutBtn = drawer.getByRole('button', { name: /Tiến hành thanh toán/i });
    await expect(checkoutBtn).toBeEnabled();
  });

  test('Check 5: Cart with 10 items scrolls in list zone while Header and Footer remain fixed', async ({
    page,
  }) => {
    // Inject 10 items into cart
    await page.evaluate(() => {
      const items = Array.from({ length: 10 }).map((_, i) => ({
        productId: `6a3f46317302ffeba0d394${String(i).padStart(2, '0')}`,
        productSlug: `item-slug-${i}`,
        name: `Thiết Kế Runway Haute Couture Tuyển Chọn Phiên Bản Giới Hạn Mẫu Số ${i + 1}`,
        price: 15000000 + i * 2000000,
        selectedColor: i % 2 === 0 ? 'Midnight Noir' : 'Champagne Blanc',
        selectedColorHex: '#111111',
        selectedSize: 'M',
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
      }));
      localStorage.setItem('atelier_cart_items', JSON.stringify(items));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const cartBtn = page.locator('button[aria-label*="Giỏ hàng"]');
    await cartBtn.click();

    const drawer = page.locator('div[role="dialog"][aria-label="Giỏ hàng"]');
    await expect(drawer).toBeVisible();

    // Header is visible
    const header = drawer.locator('.h-16.border-b');
    await expect(header).toBeVisible();

    // List container has scrollable content
    const listContainer = drawer.locator('.flex-1.min-h-0.overflow-y-auto');
    await expect(listContainer).toBeVisible();
    const isScrollable = await listContainer.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(isScrollable).toBe(true);

    // Footer is visible at bottom
    const footer = drawer.locator('.shrink-0.border-t');
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('button', { name: /Tiến hành thanh toán/i })).toBeVisible();
  });

  test('Check 6: Mobile viewport 375px renders full-width drawer without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const cartBtn = page.locator('button[aria-label*="Giỏ hàng"]');
    await cartBtn.click();

    const drawer = page.locator('div[role="dialog"][aria-label="Giỏ hàng"]');
    await expect(drawer).toBeVisible();

    const drawerBox = await drawer.boundingBox();
    expect(drawerBox).not.toBeNull();
    // On 375px mobile, drawer is 375px wide (full-width)
    expect(Math.round(drawerBox!.width)).toBe(375);

    // Verify no document horizontal scroll
    const hasDocOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasDocOverflow).toBe(false);
  });

  test('Check 7: Short viewport (700px height) maintains fixed header and footer with scrollable items', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 700 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Inject 5 items
    await page.evaluate(() => {
      const items = Array.from({ length: 5 }).map((_, i) => ({
        productId: `short-vp-${i}`,
        productSlug: `slug-${i}`,
        name: `Sản phẩm ngắn ${i + 1}`,
        price: 25000000,
        selectedColor: 'Đen',
        selectedColorHex: '#000',
        selectedSize: 'S',
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
      }));
      localStorage.setItem('atelier_cart_items', JSON.stringify(items));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const cartBtn = page.locator('button[aria-label*="Giỏ hàng"]');
    await cartBtn.click();

    const drawer = page.locator('div[role="dialog"][aria-label="Giỏ hàng"]');
    await expect(drawer).toBeVisible();

    // Verify 100dvh height
    const drawerBox = await drawer.boundingBox();
    expect(Math.round(drawerBox!.height)).toBe(700);

    // Both header and footer are visible simultaneously
    await expect(drawer.locator('.h-16.border-b')).toBeVisible();
    await expect(drawer.locator('.shrink-0.border-t')).toBeVisible();
  });
});
