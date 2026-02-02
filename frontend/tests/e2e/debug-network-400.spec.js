import { test } from '@playwright/test';

test('debug network 400 error', async ({ page }) => {
  const networkErrors = [];
  const consoleErrors = [];
  const requestFailures = [];
  
  // Listen to all requests
  page.on('requestfinished', async (request) => {
    const response = await request.response();
    if (response && response.status() >= 400) {
      networkErrors.push({
        url: request.url(),
        status: response.status(),
        method: request.method(),
      });
    }
  });

  page.on('requestfailed', (request) => {
    requestFailures.push({
      url: request.url(),
      failure: request.failure(),
      method: request.method(),
    });
  });

  // Listen to console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Wait a bit for any async requests
  await page.waitForTimeout(3000);
  
  console.log('\n=== Network Errors (4xx/5xx) ===');
  networkErrors.forEach(err => {
    console.log(`URL: ${err.url}`);
    console.log(`Method: ${err.method}`);
    console.log(`Status: ${err.status}`);
    console.log('---');
  });

  console.log('\n=== Request Failures ===');
  requestFailures.forEach(err => {
    console.log(`URL: ${err.url}`);
    console.log(`Method: ${err.method}`);
    console.log(`Failure: ${err.failure?.errorText || 'unknown'}`);
    console.log('---');
  });

  console.log('\n=== Console Errors ===');
  consoleErrors.forEach(err => {
    console.log(err);
  });
});
