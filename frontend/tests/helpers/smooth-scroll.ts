import type { Page } from '@playwright/test';

export interface ScrollOptions {
  stepSize?: number; // 200-350 px
  stepDelayMs?: number; // 150-300 ms
  pauseAtTopMs?: number; // 1000-2000 ms
  pauseAtBottomMs?: number; // 1000-2000 ms
  pauseAtLandmarksMs?: number; // 1000-1500 ms
  isFixedViewportPage?: boolean;
  fixedScrollSelectors?: string[];
}

export async function executeSmoothScrollAndAudit(
  page: Page,
  options: ScrollOptions = {}
): Promise<{
  hasHorizontalOverflow: boolean;
  maxScrollY: number;
  landmarksEncountered: number;
  fixedContainersScrolled: number;
}> {
  const stepSize = options.stepSize || 250;
  const stepDelayMs = options.stepDelayMs || 200;
  const pauseAtTopMs = options.pauseAtTopMs || 1500;
  const pauseAtBottomMs = options.pauseAtBottomMs || 1500;
  const pauseAtLandmarksMs = options.pauseAtLandmarksMs || 1200;

  // 1. Initial pause at top to allow visual perception
  await page.waitForTimeout(pauseAtTopMs);

  // Check horizontal overflow
  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  if (options.isFixedViewportPage) {
    // Fixed Viewport Page (e.g. /admin/chats): scroll independent sub-containers
    let fixedContainersScrolled = 0;
    const selectors = options.fixedScrollSelectors || [
      '[data-testid="conversation-list"]',
      '[data-testid="message-list"]',
      '.overflow-y-auto',
    ];

    for (const sel of selectors) {
      const containerExists = await page.locator(sel).first().isVisible().catch(() => false);
      if (containerExists) {
        fixedContainersScrolled++;
        // Scroll this container slowly down
        await page.evaluate(
          async ({ selector, step, delay }) => {
            const el = document.querySelector(selector);
            if (!el) return;
            const scrollableHeight = el.scrollHeight - el.clientHeight;
            if (scrollableHeight <= 0) return;

            let current = 0;
            while (current < scrollableHeight) {
              current = Math.min(current + step, scrollableHeight);
              el.scrollTop = current;
              await new Promise((r) => setTimeout(r, delay));
            }
          },
          { selector: sel, step: stepSize, delay: stepDelayMs }
        );

        await page.waitForTimeout(1000);

        // Scroll back up gently
        await page.evaluate(
          async ({ selector, step, delay }) => {
            const el = document.querySelector(selector);
            if (!el) return;
            let current = el.scrollTop;
            while (current > 0) {
              current = Math.max(current - step * 1.5, 0);
              el.scrollTop = current;
              await new Promise((r) => setTimeout(r, delay / 2));
            }
          },
          { selector: sel, step: stepSize, delay: stepDelayMs }
        );
      }
    }

    await page.waitForTimeout(pauseAtBottomMs);
    return {
      hasHorizontalOverflow,
      maxScrollY: 0,
      landmarksEncountered: 0,
      fixedContainersScrolled,
    };
  }

  // Standard Page Smooth Scroll
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
  const maxScroll = Math.max(0, scrollHeight - clientHeight);

  let currentScroll = 0;
  let landmarksEncountered = 0;
  const landmarkThresholds = [
    Math.round(maxScroll * 0.25),
    Math.round(maxScroll * 0.5),
    Math.round(maxScroll * 0.75),
  ];

  while (currentScroll < maxScroll) {
    currentScroll = Math.min(currentScroll + stepSize, maxScroll);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), currentScroll);
    await page.waitForTimeout(stepDelayMs);

    // Pause at 25%, 50%, 75% landmarks
    for (let i = 0; i < landmarkThresholds.length; i++) {
      if (
        landmarkThresholds[i] > 0 &&
        currentScroll >= landmarkThresholds[i] &&
        currentScroll - stepSize < landmarkThresholds[i]
      ) {
        landmarksEncountered++;
        await page.waitForTimeout(pauseAtLandmarksMs);
      }
    }
  }

  // Pause at bottom / footer
  await page.waitForTimeout(pauseAtBottomMs);

  return {
    hasHorizontalOverflow,
    maxScrollY: currentScroll,
    landmarksEncountered,
    fixedContainersScrolled: 0,
  };
}
