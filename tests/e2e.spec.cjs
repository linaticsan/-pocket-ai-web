const { test, expect } = require('@playwright/test');

async function openPocket(page) {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message || String(error)));
  await page.goto('/?v=step20-browser-regression', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.PocketNav?.show && !!window.PocketTheme?.apply);
  await expect(page.locator('#home')).toBeVisible();
  await expect(page.locator('#bottomNav')).toHaveCount(0);
  return pageErrors;
}

async function expectNoPageErrors(pageErrors) {
  expect(pageErrors, 'uncaught browser errors').toEqual([]);
}

test('boots to one visible Home workspace with no legacy bottom navigation', async ({ page }) => {
  const errors = await openPocket(page);
  await expect(page.locator('body > main > .view.active:not([hidden])')).toHaveCount(1);
  await expect(page.locator('#home')).toHaveClass(/active/);
  await expect(page.locator('#pocketBoot')).toHaveCount(0, { timeout: 8000 });
  await expectNoPageErrors(errors);
});

test('desktop sidebar changes workspaces through the canonical navigation path', async ({ page }) => {
  const errors = await openPocket(page);
  await page.locator('#paDesktopSidebar [data-pa-side="chat"]').click();
  await expect(page.locator('#chat')).toBeVisible();
  await expect(page.locator('#home')).toBeHidden();

  await page.locator('#paDesktopSidebar [data-pa-side="files"]').click();
  await expect(page.locator('#files')).toBeVisible();
  await expect(page.locator('#chat')).toBeHidden();

  await page.locator('#paDesktopSidebar [data-pa-side="home"]').click();
  await expect(page.locator('#home')).toBeVisible();
  await expectNoPageErrors(errors);
});

test('theme selection is distinct and persists across reload', async ({ page }) => {
  const errors = await openPocket(page);
  await page.locator('#settingsOpen').click();
  await expect(page.locator('#settingsDialog')).toBeVisible();

  await page.locator('[data-theme-choice="dark"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.getItem('pocket-theme'))).toBe('dark');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#212121');

  await page.locator('#settingsDialog .close').click();
  await expect(page.locator('#settingsOpen')).toBeFocused();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.PocketTheme?.apply);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.locator('#settingsOpen').click();
  await page.locator('[data-theme-choice="sakura"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sakura');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#fff5fa');
  await expectNoPageErrors(errors);
});

test('sound preference is saved without requiring external audio files', async ({ page }) => {
  const errors = await openPocket(page);
  await page.locator('#settingsOpen').click();
  await page.locator('[data-sound="off"]').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('pocket-sound-v1') || '{}'));
  expect(stored.enabled).toBe(false);
  await expect(page.locator('[data-sound="off"]')).toHaveAttribute('aria-pressed', 'true');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.PocketTheme?.apply);
  await page.locator('#settingsOpen').click();
  await expect(page.locator('[data-sound="off"]')).toHaveAttribute('aria-pressed', 'true');
  await expectNoPageErrors(errors);
});

test('Pocket game dialog restores focus and catching a star awards zero XP', async ({ page }) => {
  const errors = await openPocket(page);
  const before = await page.evaluate(() => localStorage.getItem('pocket-progression-v1'));

  await page.locator('#roomPlayOpen').click();
  await expect(page.locator('#starGameDialog')).toBeVisible();
  await expect(page.locator('#starGameStart')).toBeFocused();

  await page.locator('#starGameStart').click();
  await expect(page.locator('.star-game-target')).toBeVisible();
  await page.locator('.star-game-target').click();
  await expect(page.locator('#starGameScore')).toHaveText('1');

  const after = await page.evaluate(() => localStorage.getItem('pocket-progression-v1'));
  expect(after).toBe(before);

  await page.locator('#starGameDialog .close').click();
  await expect(page.locator('#roomPlayOpen')).toBeFocused();
  await expectNoPageErrors(errors);
});

test.describe('mobile interactions', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('drawer traps focus, makes background inert, and restores the menu button', async ({ page }) => {
    const errors = await openPocket(page);
    await page.locator('#paSidebarToggle').click();

    await expect(page.locator('html')).toHaveClass(/pa-nav-open/);
    await expect(page.locator('#paSidebarToggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#paDesktopSidebar')).toHaveAttribute('role', 'dialog');
    await expect(page.locator('main')).toHaveAttribute('inert', '');
    await expect(page.locator('#paDesktopSidebar .pa-side-close')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator('html')).not.toHaveClass(/pa-nav-open/);
    await expect(page.locator('#paSidebarToggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('main')).not.toHaveAttribute('inert', '');
    await expect(page.locator('#paSidebarToggle')).toBeFocused();
    await expectNoPageErrors(errors);
  });

  test('Chat history drawer exposes close state and restores focus', async ({ page }) => {
    const errors = await openPocket(page);
    await page.locator('#paSidebarToggle').click();
    await page.locator('#paDesktopSidebar [data-pa-side="chat"]').click();

    await expect(page.locator('#chat')).toBeVisible();
    await page.waitForSelector('#v3MobileHistory');
    await page.locator('#v3MobileHistory').click();
    await expect(page.locator('#v3MobileHistory')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#v3HistoryClose')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator('#v3MobileHistory')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#v3MobileHistory')).toBeFocused();
    await expectNoPageErrors(errors);
  });
});

test('Code opens even when idle warmup has not run yet', async ({ page }) => {
  await page.addInitScript(() => {
    window.requestIdleCallback = () => 1;
    window.cancelIdleCallback = () => {};
  });
  const errors = await openPocket(page);
  await expect(page.locator('#coding')).toHaveCount(0);

  await page.locator('[data-quick="coding"]').click();
  await expect(page.locator('#coding')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#codeEditor')).toBeVisible();
  await expectNoPageErrors(errors);
});

test('service worker serves the Home shell after the browser goes offline', async ({ page, context }) => {
  const errors = await openPocket(page);
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('service worker unsupported');
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#home')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-network', 'offline');

  await context.setOffline(false);
  await expectNoPageErrors(errors);
});
