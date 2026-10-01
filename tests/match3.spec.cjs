const { test, expect } = require('@playwright/test');

test.describe('Luma Grove match-3', () => {
  test('loads a data-driven level and completes a legal player move', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/match3/index.html?level=00001&seed=812739');
    await expect(page.locator('[data-level-name]')).toContainText('Moonseed Meadow');
    await expect(page.locator('[data-board] .cell')).toHaveCount(64);
    await expect(page.locator('[data-state]')).toHaveText('PLAYER_INPUT');

    const before = Number(await page.locator('[data-moves]').textContent());
    const move = await page.evaluate(() => window.lumaEngine.snapshot().legalMoves[0]);
    expect(move).toBeTruthy();

    await page.locator(`.cell[data-row="${move[0].row}"][data-col="${move[0].column}"]`).click();
    await page.locator(`.cell[data-row="${move[1].row}"][data-col="${move[1].column}"]`).click();
    await expect.poll(async () => Number(await page.locator('[data-moves]').textContent())).toBe(before - 1);
    await expect(page.locator('[data-state]')).toHaveText(/PLAYER_INPUT|WIN|LOSE/);
    expect(errors).toEqual([]);
  });

  test('browser engine tests pass', async ({ page }) => {
    await page.goto('/match3/tests.html');
    const results = page.locator('[data-tests]');
    await expect(results).toContainText('7 passed · 0 failed');
    await expect(results).not.toContainText('✗');
  });

  test('level editor renders and validates draft', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/match3/editor.html');
    await expect(page.locator('[data-editor-board] .editor-cell')).toHaveCount(64);
    await expect(page.locator('[data-validation]')).toContainText('Valid level');
    await page.locator('[data-tool="ice"]').click();
    await page.locator('[data-editor-board] .editor-cell').nth(10).click();
    await expect(page.locator('[data-editor-board] .editor-cell').nth(10)).toHaveClass(/has-blocker/);
    expect(errors).toEqual([]);
  });
});
