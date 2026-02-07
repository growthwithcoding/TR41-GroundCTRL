/**
 * Global Test Teardown
 * Runs once after all test suites complete
 */

module.exports = async () => {
  // Final cleanup of any remaining Firebase apps
  try {
    const admin = require('firebase-admin');
    const apps = admin.apps;
    if (apps && apps.length > 0) {
      console.log(`Cleaning up ${apps.length} Firebase app(s)...`);
      await Promise.all(apps.map(app => app.delete()));
    }
  } catch (error) {
    // Ignore cleanup errors
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Small delay to allow cleanup
  await new Promise(resolve => setTimeout(resolve, 500));
};