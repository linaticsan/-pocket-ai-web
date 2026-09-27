const { test, expect } = require('@playwright/test');

async function openPocket(page) {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message || String(error)));
  await page.goto('/?v=step45-pocket-living-world', { waitUntil: 'domcontentloaded' });
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

test('all themes and motion modes stay canonical', async ({ page }) => {
  const errors = await openPocket(page);
  await page.locator('#settingsOpen').click();
  for (const theme of ['light','dark','sakura','green','oled']) {
    await page.locator('button[data-theme-choice="'+theme+'"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('button[data-theme-choice="'+theme+'"]')).toHaveAttribute('aria-pressed','true');
  }
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.locator('button[data-theme-choice="system"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme-choice', 'system');
  await expect(page.locator('button[data-theme-choice="system"]')).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(() => localStorage.getItem('pocket-theme'))).toBe('system');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  for (const motion of ['full','gentle','off']) {
    await page.locator('#settingsDialog [data-motion="'+motion+'"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', motion);
    await expect(page.locator('#settingsDialog [data-motion="'+motion+'"]')).toHaveAttribute('aria-pressed','true');
  }
  expect(await page.evaluate(() => localStorage.getItem('pocket-motion'))).toBe('off');
  await expectNoPageErrors(errors);
});

test('Home prioritizes AI workspaces and keeps gamification secondary', async ({ page }) => {
  const errors = await openPocket(page);
  await expect(page.locator('#homeComposer')).toBeVisible();
  await expect(page.locator('#home .home-hero-pocket [data-pocket-character]')).toBeVisible();
  await expect(page.locator('#home .quick-grid [data-quick]')).toHaveCount(3);
  await expect(page.locator('#home [data-quick="chat"]')).toHaveCount(0);
  await expect(page.locator('#pocketRoom [data-room-action]')).toHaveCount(0);
  await expect(page.locator('#pocketCompanion')).not.toHaveAttribute('open', '');
  await page.locator('#pocketCompanion > summary').click();
  await expect(page.locator('#homeMascot')).toBeVisible();
  await expect(page.locator('#pocketQuests')).toBeVisible();
  await expectNoPageErrors(errors);
});

test('Pocket identity appears across workspaces and animation modes are visibly different', async ({ page }) => {
  const errors = await openPocket(page);
  await page.waitForFunction(() => !!window.PocketMascotViews?.sync);
  await expect(page.locator('#home .home-hero-pocket [data-pocket-character]')).toBeVisible();

  await page.locator('#settingsOpen').click();
  const preview = page.locator('#settingsDialog [data-pocket-character][data-pocket-context="settings"]');
  await expect(preview).toBeVisible();

  await page.locator('#settingsDialog [data-motion="full"]').click();
  await expect(page.locator('#motionPreviewText')).toContainText('Full:');
  const fullAnimation = await preview.locator('.pocket-character__body').evaluate(el => getComputedStyle(el).animationName);
  expect(fullAnimation).toContain('pocket-shared-breathe');

  await page.locator('#settingsDialog [data-motion="gentle"]').click();
  await expect(page.locator('#motionPreviewText')).toContainText('Gentle:');
  const gentleDuration = await preview.locator('.pocket-character__body').evaluate(el => getComputedStyle(el).animationDuration);
  expect(gentleDuration).toBe('8s');

  await page.locator('#settingsDialog [data-motion="off"]').click();
  await expect(page.locator('#motionPreviewText')).toContainText('Off:');
  const offAnimation = await preview.locator('.pocket-character__body').evaluate(el => getComputedStyle(el).animationName);
  expect(offAnimation).toBe('none');
  await page.locator('#settingsDialog .close').click();

  await page.locator('#paDesktopSidebar [data-pa-side="chat"]').click();
  await page.waitForSelector('#v3ChatShell');
  await expect(page.locator('#messages .v3-welcome [data-pocket-character][data-pocket-context="chat"]')).toBeVisible();

  await page.locator('#v3Study').click();
  await expect(page.locator('#messages .v3-welcome [data-pocket-character]')).toHaveAttribute('data-pocket-state','study');

  await page.locator('#paDesktopSidebar [data-pa-side="surface"]').click();
  await expect(page.locator('#surface [data-pocket-character][data-pocket-context="research"]')).toBeVisible();

  await page.locator('#paDesktopSidebar [data-pa-side="files"]').click();
  await page.waitForFunction(() => !!window.PocketFiles);
  await expect(page.locator('#files .pocket-page-empty [data-pocket-character][data-pocket-context="files"]')).toBeVisible();

  await page.locator('#paDesktopSidebar [data-pa-side="coding"]').click();
  await page.waitForSelector('#coding');
  await expect(page.locator('#coding [data-pocket-character][data-pocket-context="coding"]')).toBeVisible();

  await page.locator('#paDesktopSidebar [data-pa-side="home"]').click();
  await expect(page.locator('#projectGrid .project-empty [data-pocket-character][data-pocket-context="projects"]')).toBeVisible();
  await expect(page.locator('#paDesktopSidebar .pa-side-brand [data-pocket-character][data-pocket-context="sidebar"]')).toBeVisible();
  await expect(page.locator('#paPocketLevel')).toBeVisible();
  await expectNoPageErrors(errors);
});

test('Pocket living-world movement stays bounded and can return home', async ({ page }) => {
  const errors = await openPocket(page);
  await page.waitForFunction(() => !!window.PocketMascotViews?.moveRandom && !!window.PocketMascot?.goHome);
  await page.locator('#settingsOpen').click();
  await page.locator('#settingsDialog [data-motion="full"]').click();
  await page.locator('#settingsDialog .close').click();

  const pocket = page.locator('#home .pocket-playground [data-pocket-character]');
  await expect(pocket).toBeVisible();
  const home = await pocket.boundingBox();
  expect(home).toBeTruthy();

  const seen = new Set();
  for (let i=0;i<12;i++) {
    await pocket.click();
    await page.waitForTimeout(1050);
    const box = await pocket.boundingBox();
    const playground = await page.locator('#home .pocket-playground').boundingBox();
    expect(box && playground).toBeTruthy();
    expect(box.x).toBeGreaterThanOrEqual(playground.x - 1);
    expect(box.x+box.width).toBeLessThanOrEqual(playground.x+playground.width + 1);
    expect(box.y).toBeGreaterThanOrEqual(playground.y - 1);
    expect(box.y+box.height).toBeLessThanOrEqual(playground.y+playground.height + 1);
    seen.add(Math.round(box.x/4)+':'+Math.round(box.y/4));
  }
  expect(seen.size).toBeGreaterThan(2);

  await page.evaluate(() => window.PocketMascot.goHome());
  await page.waitForTimeout(1100);
  const returned = await pocket.boundingBox();
  expect(Math.abs(returned.x-home.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(returned.y-home.y)).toBeLessThanOrEqual(2);

  const beforeRapid = await page.evaluate(() => {
    const el=document.querySelector('#home .pocket-playground [data-pocket-character]');
    return el?.getAnimations().length||0;
  });
  await pocket.click({ clickCount: 4, delay: 30 });
  await page.waitForTimeout(120);
  const rapid = await page.evaluate(() => {
    const el=document.querySelector('#home .pocket-playground [data-pocket-character]');
    return {moving:el?.classList.contains('is-pocket-moving'),animations:el?.getAnimations().length||0};
  });
  expect(rapid.animations).toBeLessThanOrEqual(beforeRapid + 3);

  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(550);
  const afterResize = await pocket.boundingBox();
  const resizedPlayground = await page.locator('#home .pocket-playground').boundingBox();
  expect(afterResize.x).toBeGreaterThanOrEqual(resizedPlayground.x - 1);
  expect(afterResize.x+afterResize.width).toBeLessThanOrEqual(resizedPlayground.x+resizedPlayground.width + 1);
  await expectNoPageErrors(errors);
});

test('seasonal environment is centralized, offline, motion-aware and workspace-aware', async ({ page }) => {
  const errors = await openPocket(page);
  await page.waitForFunction(() => !!window.PocketEnvironment?.getStatus);
  await expect(page.locator('#pocketEnvironment')).toHaveCount(1);
  await expect(page.locator('#pocketEnvironment')).toHaveCSS('pointer-events','none');

  const september = await page.evaluate(() => window.PocketEnvironment.getCurrentSeason(new Date('2026-09-27T12:00:00')));
  expect(september).toBe('autumn');

  await page.locator('#settingsOpen').click();
  await expect(page.locator('[data-env-season-choice="auto"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-env-season-choice="spring"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-env-season','spring');
  expect(await page.evaluate(() => localStorage.getItem('pocket-environment-season-v1'))).toBe('spring');

  await page.locator('[data-env-effects="full"]').click();
  await page.locator('[data-env-preview="sakura"]').click();
  await page.waitForTimeout(120);
  let status = await page.evaluate(() => window.PocketEnvironment.getStatus());
  expect(status.effect).toBe('sakura');
  expect(status.particles).toBeGreaterThanOrEqual(10);
  const activeFull = await page.locator('#pocketEnvironment .sakura').count();
  expect(activeFull).toBeGreaterThanOrEqual(10);

  await page.locator('[data-env-effects="gentle"]').click();
  await page.locator('[data-env-preview="snow"]').click();
  await page.waitForTimeout(120);
  status = await page.evaluate(() => window.PocketEnvironment.getStatus());
  expect(status.effectiveMode).toBe('gentle');
  expect(status.particles).toBeLessThan(activeFull);

  await page.locator('[data-env-effects="off"]').click();
  await expect(page.locator('#pocketEnvironment')).toHaveCSS('display','none');
  await page.locator('[data-env-effects="full"]').click();
  await page.locator('#settingsDialog .close').click();

  await page.evaluate(() => window.PocketEnvironment.preview('leaf'));
  await page.waitForTimeout(80);
  const homeOpacity = await page.locator('#pocketEnvironment').evaluate(el => parseFloat(getComputedStyle(el).opacity));
  await page.evaluate(() => window.PocketNav.show('coding'));
  await page.waitForTimeout(100);
  const codeOpacity = await page.locator('#pocketEnvironment').evaluate(el => parseFloat(getComputedStyle(el).opacity));
  expect(codeOpacity).toBeLessThan(homeOpacity * .2);

  await page.evaluate(() => window.PocketEnvironment.setWeather({type:'rain',intensity:.35,wind:.4}));
  status = await page.evaluate(() => window.PocketEnvironment.getStatus());
  expect(status.effect).toBe('rain');
  expect(status.wind).toBeCloseTo(.4,1);
  await expectNoPageErrors(errors);
});

test('Pocket mascot click keeps its room position and sound stays opt-in', async ({ page }) => {
  const errors = await openPocket(page);
  await page.locator('#pocketCompanion > summary').click();
  const mascot = page.locator('#homeMascot');
  await expect(mascot).toBeVisible();
  const before = await mascot.boundingBox();
  await page.waitForTimeout(700);
  const after = await mascot.boundingBox();
  expect(before && after && Math.abs(before.x-after.x)<0.5 && Math.abs(before.y-after.y)<0.5).toBeTruthy();
  await mascot.click();
  await expect(mascot).toHaveClass(/is-tap-reacting/);
  await expect(mascot).toHaveAttribute('data-mascot-state','happy');
  await expect(mascot).not.toHaveClass(/is-tap-reacting/, { timeout: 1500 });
  await expect(page.locator('[data-sound]')).toHaveCount(2);
  await expect(page.locator('#soundTest')).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem('pocket-sound-v1'))).toBeNull();
  await expectNoPageErrors(errors);
});

test('PocketMascot exposes canonical states and respects motion off', async ({ page }) => {
  const errors = await openPocket(page);
  await page.locator('#pocketCompanion > summary').click();
  await page.waitForFunction(() => !!window.PocketMascot?.setState);
  await page.evaluate(() => window.PocketMascot.setState('thinking',0));
  await expect(page.locator('#homeMascot')).toHaveAttribute('data-mascot-state','thinking');
  await page.evaluate(() => window.PocketMascot.react('success'));
  await expect(page.locator('#homeMascot')).toHaveAttribute('data-mascot-state','success');
  await page.locator('#settingsOpen').click();
  await page.locator('#settingsDialog [data-motion="off"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-motion','off');
  const animation = await page.locator('#homeMascot .pocket-mascot-visual').evaluate(el => getComputedStyle(el).animationName);
  expect(animation).toBe('none');
  await expectNoPageErrors(errors);
});


test('Pocket game dialog restores focus and catching a star awards zero XP', async ({ page }) => {
  const errors = await openPocket(page);
  const before = await page.evaluate(() => localStorage.getItem('pocket-progression-v1'));

  await page.locator('#pocketCompanion > summary').click();
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
  await expect(page.locator('#homeComposer')).toBeVisible();
  await expect(page.locator('#pocketCompanion')).not.toHaveAttribute('open', '');
  const closed = await page.evaluate(() => {
    const rect = sel => document.querySelector(sel)?.getBoundingClientRect();
    return {
      viewportWidth: innerWidth,
      docWidth: document.documentElement.scrollWidth,
      composer: rect('#homeComposer'),
      tools: rect('#home .home-tools'),
      companion: rect('#pocketCompanion')
    };
  });
  expect(closed.docWidth).toBeLessThanOrEqual(closed.viewportWidth + 1);
  expect(closed.composer.left).toBeGreaterThanOrEqual(-1);
  expect(closed.composer.right).toBeLessThanOrEqual(closed.viewportWidth + 1);
  expect(closed.tools.top).toBeGreaterThanOrEqual(closed.composer.bottom - 1);
  expect(closed.companion.top).toBeGreaterThanOrEqual(closed.tools.bottom - 1);

  await page.locator('#pocketCompanion > summary').click();
  const open = await page.evaluate(() => {
    const rect = sel => document.querySelector(sel)?.getBoundingClientRect();
    const room = rect('#pocketRoom');
    const controls = rect('#home .room-mini-controls');
    const xp = rect('#pocketXP');
    const companion = rect('#pocketCompanion');
    return {viewportWidth:innerWidth,docWidth:document.documentElement.scrollWidth,room,controls,xp,companion};
  });
  expect(open.docWidth).toBeLessThanOrEqual(open.viewportWidth + 1);
  expect(open.room.left).toBeGreaterThanOrEqual(open.companion.left - 1);
  expect(open.room.right).toBeLessThanOrEqual(open.companion.right + 1);
  expect(open.controls.top).toBeGreaterThanOrEqual(open.room.bottom - 1);
  expect(open.xp.top).toBeGreaterThanOrEqual(open.room.top - 1);
  expect(open.xp.bottom).toBeLessThanOrEqual(open.room.bottom + 1);
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


async function expectDesktopGeometry(page, expectedColumns=3, wide=false) {
  const geometry = await page.evaluate(() => {
    const rect = sel => document.querySelector(sel)?.getBoundingClientRect();
    const sidebar = rect('#paDesktopSidebar');
    const header = rect('.topbar');
    const main = rect('body > main');
    const step1 = rect('#home .home-step1');
    const hero = rect('#home .home-hero');
    const composer = rect('#homeComposer');
    const prompt = rect('#homePrompt');
    const send = rect('#home .home-send');
    const pocket = rect('#home .home-hero-pocket [data-pocket-character]');
    const tools = rect('#home .home-tools');
    const companion = rect('#pocketCompanion');
    const toolCards = [...document.querySelectorAll('#home .quick-grid>[data-quick]')].map(x=>x.getBoundingClientRect());
    const quick = document.querySelector('#home .quick-grid');
    const heroStyle = getComputedStyle(document.querySelector('#home .home-hero'));
    const h1Style = getComputedStyle(document.querySelector('#homeGreeting'));
    const inputStyle = getComputedStyle(document.querySelector('#homePrompt'));
    return {
      viewportWidth: innerWidth,
      docWidth: document.documentElement.scrollWidth,
      sidebar, header, main, step1, hero, composer, prompt, send, pocket, tools, companion, toolCards,
      quickColumns: quick ? getComputedStyle(quick).gridTemplateColumns.split(' ').length : 0,
      heroColumns: heroStyle.gridTemplateColumns.split(' ').length,
      h1Font:h1Style.fontFamily,
      inputFont:inputStyle.fontFamily
    };
  });

  expect(geometry.docWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.sidebar.width).toBeGreaterThanOrEqual(220);
  expect(geometry.sidebar.right).toBeLessThanOrEqual(geometry.main.left + 1);
  expect(Math.abs(geometry.header.left - geometry.sidebar.right)).toBeLessThanOrEqual(1);
  expect(geometry.step1.left).toBeGreaterThanOrEqual(geometry.main.left - 1);
  expect(geometry.step1.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.step1.width).toBeLessThanOrEqual(1242);
  expect(geometry.heroColumns).toBe(2);
  expect(geometry.hero.height).toBeGreaterThanOrEqual(300);
  expect(geometry.hero.height).toBeLessThanOrEqual(360);
  expect(geometry.pocket.left).toBeGreaterThan(geometry.composer.right - 1);
  expect(geometry.pocket.width).toBeGreaterThanOrEqual(130);
  expect(geometry.pocket.width).toBeLessThanOrEqual(170);
  expect(Math.abs((geometry.pocket.top+geometry.pocket.height/2)-(geometry.hero.top+geometry.hero.height/2))).toBeLessThanOrEqual(45);
  expect(geometry.composer.left).toBeGreaterThanOrEqual(geometry.hero.left - 1);
  expect(geometry.composer.right).toBeLessThanOrEqual(geometry.pocket.left + 1);
  expect(geometry.prompt.width).toBeGreaterThan(geometry.send.width*5);
  if(wide) expect(geometry.composer.width).toBeGreaterThanOrEqual(600);
  expect(geometry.composer.width).toBeLessThanOrEqual(730);
  expect(geometry.tools.top-geometry.hero.bottom).toBeGreaterThanOrEqual(20);
  expect(geometry.tools.top-geometry.hero.bottom).toBeLessThanOrEqual(36);
  expect(geometry.companion.top).toBeGreaterThanOrEqual(geometry.tools.bottom - 1);
  expect(geometry.quickColumns).toBe(expectedColumns);
  for(const card of geometry.toolCards){
    expect(card.height).toBeGreaterThanOrEqual(100);
    expect(card.height).toBeLessThanOrEqual(116);
  }
  expect(geometry.h1Font.toLowerCase()).toContain('sans');
  expect(geometry.inputFont.toLowerCase()).toContain('sans');
}

test('900px tablet uses drawer navigation instead of permanent sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  const errors = await openPocket(page);
  await expect(page.locator('#paSidebarToggle')).toBeVisible();
  const closed = await page.locator('#paDesktopSidebar').evaluate(el => {
    const r=el.getBoundingClientRect();
    return {right:r.right,left:r.left,transform:getComputedStyle(el).transform,mainLeft:document.querySelector('body > main').getBoundingClientRect().left};
  });
  expect(closed.right).toBeLessThanOrEqual(1);
  expect(closed.mainLeft).toBeLessThanOrEqual(25);
  await page.locator('#paSidebarToggle').click();
  await expect(page.locator('html')).toHaveClass(/pa-nav-open/);
  await expect(page.locator('#paDesktopSidebar')).toHaveAttribute('role','dialog');
  await page.waitForTimeout(280);
  const open = await page.locator('#paDesktopSidebar').evaluate(el => el.getBoundingClientRect());
  expect(open.left).toBeGreaterThanOrEqual(-1);
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).not.toHaveClass(/pa-nav-open/);
  await expectNoPageErrors(errors);
});

test('mobile Home stacks greeting, Pocket, composer, then Local AI', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await openPocket(page);
  const pos = await page.evaluate(() => {
    const r=s=>document.querySelector(s).getBoundingClientRect();
    return {welcome:r('#home .home-welcome'),pocket:r('#home .home-hero-pocket'),composer:r('#homeComposer'),status:r('#home .home-ai-status')};
  });
  expect(pos.pocket.top).toBeGreaterThanOrEqual(pos.welcome.bottom - 1);
  expect(pos.composer.top).toBeGreaterThanOrEqual(pos.pocket.bottom - 1);
  expect(pos.status.top).toBeGreaterThanOrEqual(pos.composer.bottom - 1);
  await expectNoPageErrors(errors);
});

test.describe('desktop Home layout', () => {
  test('1440px desktop uses a centered AI-first workspace', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = await openPocket(page);
    await expectDesktopGeometry(page, 3, true);
    await expect(page.locator('#paDesktopSidebar')).toBeVisible();
    await expect(page.locator('#paSidebarToggle')).toBeHidden();
    await expectNoPageErrors(errors);
  });

  test('1024px desktop remains desktop-like without collapsing into phone proportions', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    const errors = await openPocket(page);
    await expectDesktopGeometry(page, 3);
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
    expect(Math.max(...lefts)-Math.min(...lefts)).toBeLessThanOrEqual(4);
    expect(Math.max(...rights)-Math.min(...rights)).toBeLessThanOrEqual(4);
    expect(Math.max(...tops)-Math.min(...tops)).toBeLessThanOrEqual(4);

    await expectNoPageErrors(errors);
  });
});
