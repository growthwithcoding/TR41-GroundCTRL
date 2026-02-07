/**
 * Test Helper Utilities for GroundCTRL E2E Tests
 */

/**
 * Generate a unique test user email
 * @returns {string} Unique email address
 */
export function generateTestEmail() {
  const timestamp = Date.now();
  const random = require('crypto').randomBytes(4).toString('hex');
  return `test-${timestamp}-${random}@groundctrl.test`;
}

/**
 * Generate a test callSign
 * @returns {string} Test callSign
 */
export function generateTestCallSign() {
  const random = require('crypto').randomBytes(3).toString('hex').toUpperCase();
  return `TEST-${random}`;
}

/**
 * Generate a strong test password
 * @returns {string} Test password
 */
export function generateTestPassword() {
  return 'TestPassword123!@#';
}

/**
 * Wait for network to be idle
 * @param {import('@playwright/test').Page} page
 */
export async function waitForNetworkIdle(page) {
  await page.waitForLoadState('networkidle');
}

/**
 * Check for console errors on the page
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Array>} Array of console errors
 */
export async function getConsoleErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * Login helper function
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
export async function login(page, email, password) {
  await page.goto('/');
  // Note: This app uses Firebase Auth, so traditional login forms don't exist
  // Authentication is handled through Firebase UI or modals
  // This helper needs to be updated to work with Firebase Auth
}

/**
 * Register a new user helper function
 * @param {import('@playwright/test').Page} page
 * @param {Object} userData
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {string} userData.callSign
 */
export async function register(page, userData) {
  await page.goto('/');
  // Note: This app uses Firebase Auth, so traditional register forms don't exist
  // Authentication is handled through Firebase UI or modals
  // This helper needs to be updated to work with Firebase Auth
  
  await page.click('button[type="submit"]');
}

/**
 * Check if element is visible in viewport
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @returns {Promise<boolean>}
 */
export async function isVisibleInViewport(page, selector) {
  return await page.locator(selector).isVisible();
}

/**
 * Get computed style of an element
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} property
 * @returns {Promise<string>}
 */
export async function getComputedStyle(page, selector, property) {
  return await page.locator(selector).evaluate((el, prop) => {
    return window.getComputedStyle(el).getPropertyValue(prop);
  }, property);
}
