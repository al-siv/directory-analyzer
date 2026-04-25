import { test, expect, _electron as electron } from '@playwright/test';
import { join } from 'path';

test.describe('Directory Analyzer E2E', () => {
  test('main window opens and shows title', async () => {
    const electronApp = await electron.launch({
      args: [join(__dirname, '../../out/main/index.js')],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const window = await electronApp.firstWindow();
    await expect(window.locator('text=Directory Analyzer')).toBeVisible();
    await expect(window.locator('text=Browse')).toBeVisible();

    await electronApp.close();
  });
});
