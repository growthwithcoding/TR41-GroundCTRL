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
      await Promise.all(apps.map(app => app.delete()));
    }
  } catch (error) {
    // Ignore errors if firebase-admin not initialized or already closed
  }
  
  // Clear all timers and mocks
  jest.clearAllTimers();
  jest.clearAllMocks();
});
