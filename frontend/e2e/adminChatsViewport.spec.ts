import { test, expect } from '@playwright/test';

test.describe('Admin Chats Full-Viewport Layout & Independent Scrolling E2E Suite', () => {
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

  // =========================================================================
  // SCENARIO 1: DESKTOP 1920x1080 & LAPTOP 1366x768 NO DOCUMENT SCROLL
  // =========================================================================
  test('Scenario 1: Desktop & Laptop viewports maintain zero document scroll and dual independent scroll areas', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/admin/chats');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Page Titles
    await expect(page.locator('h1')).toContainText(/Hộp Thư CSKH Trực Tuyến/i);

    // 2. Verify Document Scroll is strictly constrained (scrollHeight <= clientHeight + 2px tolerance)
    const isDocScrollConstrained = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollHeight <= window.innerHeight + 2;
    });
    expect(isDocScrollConstrained).toBe(true);

    // 3. Verify Both Columns are rendered side-by-side
    const convListScroll = page.locator('[data-testid="conversation-list-scroll"]');
    const msgListScroll = page.locator('[data-testid="message-list-scroll"]');
    await expect(convListScroll).toBeVisible();
    await expect(msgListScroll).toBeVisible();

    // 4. Test on Laptop Viewport 1366x768
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(300);

    const isLaptopConstrained = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollHeight <= window.innerHeight + 2;
    });
    expect(isLaptopConstrained).toBe(true);

    // 5. Verify independent scroll container for message list
    const msgScrollHeight = await msgListScroll.evaluate((el) => el.scrollHeight);
    const msgClientHeight = await msgListScroll.evaluate((el) => el.clientHeight);
    expect(msgScrollHeight).toBeGreaterThanOrEqual(msgClientHeight);

    // Scroll message list to top
    await msgListScroll.evaluate((el) => {
      el.scrollTop = 0;
      el.dispatchEvent(new Event('scroll'));
    });
    await page.waitForTimeout(300);

    // Scroll to bottom button should appear when scrolled up
    const scrollToBottomBtn = page.getByRole('button', { name: /Xuống tin nhắn mới nhất/i });
    await expect(scrollToBottomBtn).toBeVisible();

    // Click button to return to bottom
    await scrollToBottomBtn.click();
    await page.waitForTimeout(300);
    await expect(scrollToBottomBtn).not.toBeVisible();
  });

  // =========================================================================
  // SCENARIO 2: MESSAGE SENDING, AUTO-SCROLL & PINNED COMPOSER
  // =========================================================================
  test('Scenario 2: Sending a message appends bubble, triggers auto-scroll, and pins composer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/chats');
    await page.waitForLoadState('domcontentloaded');

    const composerTextarea = page.getByPlaceholder(/Nhập nội dung tư vấn/i);
    await expect(composerTextarea).toBeVisible();

    // Composer must be visible and within viewport
    const composerBox = await composerTextarea.boundingBox();
    expect(composerBox).not.toBeNull();
    expect(composerBox!.y + composerBox!.height).toBeLessThanOrEqual(900);

    // Type a new consultation response
    const testMessageText = `Atelier xin xác nhận thông số tay áo của Bà đã được lưu vào hồ sơ may đo lúc ${Date.now()}.`;
    await composerTextarea.fill(testMessageText);

    // Click Send button
    const sendBtn = page.getByRole('button', { name: /Gửi/i });
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    // Verify message appears in message window
    await expect(
      page.locator('[data-testid="message-list-scroll"]').getByText(testMessageText)
    ).toBeVisible();

    // Document must STILL not scroll
    const isDocConstrained = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollHeight <= window.innerHeight + 2;
    });
    expect(isDocConstrained).toBe(true);
  });

  // =========================================================================
  // SCENARIO 3: CONVERSATION SWITCHING & SEARCH FILTERING
  // =========================================================================
  test('Scenario 3: Conversation switching updates message panel and search filters list cleanly', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/chats');
    await page.waitForLoadState('domcontentloaded');

    // Switch to Jean-Luc Moreau
    const jeanLucButton = page.getByRole('button', { name: /Jean-Luc Moreau/i });
    await expect(jeanLucButton).toBeVisible();
    await jeanLucButton.click();

    // Verify Conversation Header displays Jean-Luc Moreau
    await expect(page.locator('section').getByText('Jean-Luc Moreau')).toBeVisible();
    await expect(page.getByText(/bộ Suit Lụa Midnight/i)).toBeVisible();

    // Search for Charlotte
    const searchInput = page.getByPlaceholder(/Tìm khách hàng hoặc tin nhắn/i);
    await searchInput.fill('Charlotte');

    // Victoria Sterling and Jean-Luc Moreau should not be visible in search results
    await expect(page.getByRole('button', { name: /Victoria Sterling/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Charlotte Vane/i })).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(page.getByRole('button', { name: /Victoria Sterling/i })).toBeVisible();
  });

  // =========================================================================
  // SCENARIO 4: TABLET (768x1024) RESPONSIVE DUAL-PANE NO OVERFLOW
  // =========================================================================
  test('Scenario 4: Tablet 768x1024 renders balanced two-column layout without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin/chats');
    await page.waitForLoadState('domcontentloaded');

    // Verify document constraints
    const isTabletConstrained = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollHeight <= window.innerHeight + 2 && doc.scrollWidth <= window.innerWidth;
    });
    expect(isTabletConstrained).toBe(true);

    // Verify both panels are visible
    await expect(page.locator('[data-testid="conversation-list-scroll"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-list-scroll"]')).toBeVisible();

    // Composer must remain visible
    const composer = page.getByPlaceholder(/Nhập nội dung tư vấn/i);
    await expect(composer).toBeVisible();
  });

  // =========================================================================
  // SCENARIO 5: MOBILE (390x844 & 375x667) 1-COLUMN FLOW WITH BACK NAVIGATION
  // =========================================================================
  test('Scenario 5: Mobile viewports support 1-column drilldown and seamless back navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin/chats');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Document has zero document-level scroll
    const isMobileConstrained = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollHeight <= window.innerHeight + 2 && doc.scrollWidth <= window.innerWidth;
    });
    expect(isMobileConstrained).toBe(true);

    // 2. Click conversation on mobile to enter messages view
    const charlotteBtn = page.getByRole('button', { name: /Charlotte Vane/i });
    await charlotteBtn.click();

    // In messages view on mobile: Message list and back button should be visible
    const backBtn = page.getByRole('button', { name: /Quay lại danh sách/i });
    await expect(backBtn).toBeVisible();

    const composerTextarea = page.getByPlaceholder(/Nhập nội dung tư vấn/i);
    await expect(composerTextarea).toBeVisible();

    // 3. Test Back Navigation
    await backBtn.click();

    // Should return to conversation list
    await expect(charlotteBtn).toBeVisible();

    // 4. Test on compact mobile 375x667
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const isCompactConstrained = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollHeight <= window.innerHeight + 2 && doc.scrollWidth <= window.innerWidth;
    });
    expect(isCompactConstrained).toBe(true);
  });
});
