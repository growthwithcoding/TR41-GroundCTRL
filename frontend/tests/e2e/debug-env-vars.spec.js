import { test } from '@playwright/test';

test('debug environment variables', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  
  // Check console log that shows Firebase config
  const logs = [];
  page.on('console', msg => {
    if (msg.text().includes('Firebase')) {
      logs.push(msg.text());
    }
  });
  
  await page.reload();
  await page.waitForTimeout(1000);
  
  console.log('\n=== Firebase Console Logs ===');
  logs.forEach(log => console.log(log));
});
