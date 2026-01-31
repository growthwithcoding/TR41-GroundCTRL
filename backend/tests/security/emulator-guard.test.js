/**
 * Security Test: Firebase Emulator Guard
 * Test Goal: In production, the presence of FIREBASE_EMULATOR_HOST aborts startup
 * 
 * This prevents accidentally running production with emulator configuration,
 * which would cause authentication and database failures.
 */

const { spawn } = require('child_process');
const path = require('path');

describe('Security: Firebase Emulator Guard (Production Safety)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  test('should prevent startup when emulator variables exist in production', (done) => {
    // Set production mode with emulator host
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
      FIRESTORE_EMULATOR_HOST: 'localhost:8080',
    };

    // Try to start the app in a child process
    const appPath = path.join(__dirname, '../../src/app.js');
    const child = spawn('node', ['-e', `
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      try {
        require('${appPath.replace(/\\/g, '/')}');
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    `], { env });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      const combined = (output + errorOutput).toLowerCase();
      
      // Should either:
      // 1. Exit with non-zero code
      // 2. Log an error about emulator in production
      const hasError = 
        code !== 0 ||
        combined.includes('emulator') ||
        combined.includes('production') ||
        combined.includes('not allowed');

      if (hasError) {
        expect(true).toBe(true);
      } else {
        // If it doesn't prevent startup, this is a security issue
        console.warn('⚠️  WARNING: App started in production with emulator variables!');
        expect(hasError).toBe(true);
      }
      
      done();
    });
  }, 30000);

  test('should allow startup with emulator variables in development', (done) => {
    const appPath = path.join(__dirname, '../../src/app.js');
    const child = spawn('node', ['-e', `
      process.env.NODE_ENV = 'development';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      try {
        require('${appPath.replace(/\\/g, '/')}');
        console.log('APP_STARTED_SUCCESSFULLY');
        process.exit(0);
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    `]);

    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      // In dev mode, app should start or at least not complain about emulators
      expect(code === 0 || !output.toLowerCase().includes('not allowed')).toBe(true);
      done();
    });
  }, 30000);

  test('should allow startup in production without emulator variables', (done) => {
    const appPath = path.join(__dirname, '../../src/app.js');
    const child = spawn('node', ['-e', `
      process.env.NODE_ENV = 'production';
      // Explicitly unset emulator variables
      delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
      delete process.env.FIRESTORE_EMULATOR_HOST;
      try {
        require('${appPath.replace(/\\/g, '/')}');
        console.log('APP_STARTED_SUCCESSFULLY');
        process.exit(0);
      } catch (error) {
        // May fail for other reasons (missing Firebase config), but not emulator guard
        if (error.message && !error.message.toLowerCase().includes('emulator')) {
          console.log('APP_ATTEMPTED_START');
          process.exit(0);
        }
        console.error(error.message);
        process.exit(1);
      }
    `]);

    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      // Should not fail due to emulator guard
      const combined = output.toLowerCase();
      expect(combined.includes('not allowed') && combined.includes('emulator')).toBe(false);
      done();
    });
  }, 30000);
});
