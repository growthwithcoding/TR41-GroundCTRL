/**
 * Global Test Teardown
 * Runs after each test file completes
 */

// This is executed in each test file's context after all tests
afterAll(async () => {
  // Flush AI queue to avoid lingering timers or pending tasks
  try {
    const aiQueue = require('../src/services/aiQueue');
    if (aiQueue?.clearQueue) {
      aiQueue.clearQueue();
    }
    if (aiQueue?.waitForIdle) {
      await aiQueue.waitForIdle();
    }
  } catch (error) {
    // Ignore errors if AI queue not initialized
  }

  // Close any Firebase Admin apps to prevent open handles
  try {
    const admin = require('firebase-admin');
    const apps = admin.apps;
    if (apps && apps.length > 0) {
      // Wait for all apps to be deleted
      await Promise.all(apps.map(app => app.delete()));
      // Give a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    // Ignore errors if firebase-admin not initialized or already closed
  }

  // Clear all timers and mocks
  jest.clearAllTimers();
  jest.clearAllMocks();

  // Force garbage collection if available (helps with open handles)
  if (global.gc) {
    global.gc();
  }
});
