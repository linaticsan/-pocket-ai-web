const { test, expect } = require('@playwright/test');

async function openPocket(page) {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message || String(error)));
  await page.goto('/?v=step33-stable-mascot-hit-target', { waitUntil: 'domcontentloaded' });
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

test('Pocket mascot click runs a silent game animation from its room position', async ({ page }) => {
  const errors = await openPocket(page);
  const mascot = page.locator('#homeMascot');
  await expect(mascot).toBeVisible();
  await mascot.hover();
  await page.waitForTimeout(120);
  await mascot.click();
  await expect(mascot).toHaveClass(/is-game-running/);
  await expect(mascot).not.toHaveClass(/is-game-running/, { timeout: 2500 });
  await expect(page.locator('[data-sound],#soundVolume,#soundTest')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('pocket-sound-v1'))).toBeNull();
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
    await expect(page.locator('body > main')).toHaveAttribute('inert', '');
    await expect(page.locator('#paDesktopSidebar .pa-side-close')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator('html')).not.toHaveClass(/pa-nav-open/);
    await expect(page.locator('#paSidebarToggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('body > main')).not.toHaveAttribute('inert', '');
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


async function expectMobileHomeGeometry(page) {
  const geometry = await page.evaluate(() => {
    const rect = sel => document.querySelector(sel)?.getBoundingClientRect();
    const room = rect('#pocketRoom');
    const controls = rect('#home .room-mini-controls');
    const xp = rect('#pocketXP');
    const composer = rect('#homeComposer');
    const roomObjects = [...document.querySelectorAll('#pocketRoom .room-object')].map(el => el.getBoundingClientRect());
    const viewportWidth = innerWidth;
    return {
      viewportWidth,
      docWidth: document.documentElement.scrollWidth,
      room, controls, xp, composer,
      roomObjects: roomObjects.map(r => ({left:r.left,right:r.right,top:r.top,bottom:r.bottom}))
    };
  });

  expect(geometry.docWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.room.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.room.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.controls.top).toBeGreaterThanOrEqual(geometry.room.bottom - 1);
  expect(geometry.composer.top).toBeGreaterThanOrEqual(geometry.controls.bottom - 1);
  expect(geometry.xp.top).toBeGreaterThanOrEqual(geometry.room.top - 1);
  expect(geometry.xp.bottom).toBeLessThanOrEqual(geometry.room.bottom + 1);
  for (const object of geometry.roomObjects) {
    expect(object.left).toBeGreaterThanOrEqual(geometry.room.left - 1);
    expect(object.right).toBeLessThanOrEqual(geometry.room.right + 1);
    expect(object.top).toBeGreaterThanOrEqual(geometry.room.top - 1);
    expect(object.bottom).toBeLessThanOrEqual(geometry.room.bottom + 1);
  }
}

test.describe('mobile Home layout', () => {
  test('390px layout has no Pocket Room or page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = await openPocket(page);
    await expectMobileHomeGeometry(page);
    await expectNoPageErrors(errors);
  });

  test('320px layout remains compact without overlap', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    const errors = await openPocket(page);
    await expectMobileHomeGeometry(page);
    await expect(page.locator('#home .quick-grid')).toHaveCSS('grid-template-columns', /.+/);
    const quickColumns = await page.locator('#home .quick-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(quickColumns).toBe(1);
    await expectNoPageErrors(errors);
  });
});


async function expectDesktopGeometry(page, expectedColumns=4) {
  const geometry = await page.evaluate(() => {
    const rect = sel => document.querySelector(sel)?.getBoundingClientRect();
    const sidebar = rect('#paDesktopSidebar');
    const header = rect('.topbar');
    const main = rect('body > main');
    const step1 = rect('#home .home-step1');
    const hero = rect('#home .home-hero');
    const copy = rect('#home .home-hero-copy');
    const room = rect('#pocketRoom');
    const quick = document.querySelector('#home .quick-grid');
    return {
      viewportWidth: innerWidth,
      docWidth: document.documentElement.scrollWidth,
      sidebar, header, main, step1, hero, copy, room,
      quickColumns: quick ? getComputedStyle(quick).gridTemplateColumns.split(' ').length : 0
    };
  });

  expect(geometry.docWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.sidebar.right).toBeLessThanOrEqual(geometry.main.left + 1);
  expect(Math.abs(geometry.header.left - geometry.sidebar.right)).toBeLessThanOrEqual(1);
  expect(geometry.step1.left).toBeGreaterThanOrEqual(geometry.main.left - 1);
  expect(geometry.step1.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.step1.width).toBeLessThanOrEqual(1242);
  expect(geometry.copy.right).toBeLessThanOrEqual(geometry.room.left + 6);
  expect(geometry.room.right).toBeLessThanOrEqual(geometry.hero.right + 1);
  expect(geometry.quickColumns).toBe(expectedColumns);
}

test.describe('desktop Home layout', () => {
  test('1440px desktop uses a centered workspace and true two-column hero', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = await openPocket(page);
    await expectDesktopGeometry(page, 4);
    await expect(page.locator('#paDesktopSidebar')).toBeVisible();
    await expect(page.locator('#paSidebarToggle')).toBeHidden();
    await expectNoPageErrors(errors);
  });

  test('1024px desktop remains desktop-like without collapsing into phone proportions', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    const errors = await openPocket(page);
    await expectDesktopGeometry(page, 4);
    await expect(page.locator('#home .home-hero')).toHaveCSS('display', 'grid');
    await expectNoPageErrors(errors);
  });
});


async function openWorkspace(page, id) {
  await page.evaluate(async target => {
    const result = window.PocketNav?.show?.(target);
    if (result && typeof result.then === 'function') await result;
  }, id);
  await expect(page.locator('#'+id)).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(80);
}

test.describe('desktop feature workspace consistency', () => {
  test('major tools share one desktop frame at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = await openPocket(page);

    const ids = ['local','files','surface','library','coding','chat'];
    const frames = [];

    for (const id of ids) {
      await openWorkspace(page, id);
      if (id==='coding') await expect(page.locator('#coding .code-toolbar')).toBeVisible();
      if (id==='library') await expect(page.locator('#library .lib53-tabs')).toBeVisible();
      if (id==='chat') await expect(page.locator('#chat .v3-chat-shell')).toBeVisible();

      const frame = await page.locator('#'+id).evaluate(el => {
        const r = el.getBoundingClientRect();
        return {
          id: el.id,
          left:r.left,
          right:r.right,
          top:r.top,
          width:r.width,
          viewport:innerWidth,
          docWidth:document.documentElement.scrollWidth
        };
      });
      frames.push(frame);
    }

    for (const frame of frames) {
      expect(frame.docWidth).toBeLessThanOrEqual(frame.viewport + 1);
      expect(frame.left).toBeGreaterThanOrEqual(240);
      expect(frame.right).toBeLessThanOrEqual(frame.viewport + 1);
      expect(frame.width).toBeGreaterThan(900);
      expect(frame.width).toBeLessThanOrEqual(1242);
      expect(frame.top).toBeGreaterThanOrEqual(80);
      expect(frame.top).toBeLessThanOrEqual(110);
    }

    const lefts = frames.map(x => x.left);
    const rights = frames.map(x => x.right);
    const tops = frames.map(x => x.top);
    expect(Math.max(...lefts)-Math.min(...lefts)).toBeLessThanOrEqual(2);
    expect(Math.max(...rights)-Math.min(...rights)).toBeLessThanOrEqual(2);
    expect(Math.max(...tops)-Math.min(...tops)).toBeLessThanOrEqual(2);

    await expectNoPageErrors(errors);
  });
});
