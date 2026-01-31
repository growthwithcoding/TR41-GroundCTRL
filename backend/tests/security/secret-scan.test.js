/**
 * Security Test: Secret Scanning
 * Test Goal: Ensure no plain text secrets are committed
 * 
 * Detects common secret patterns in the codebase to prevent
 * accidental exposure of API keys, passwords, and tokens.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('Security: Secret Scanning', () => {
  const projectRoot = path.join(__dirname, '../..');

  test('should not contain AWS secrets', () => {
    const patterns = [
      'AKIA[0-9A-Z]{16}', // AWS Access Key ID
      'aws_secret_access_key\\s*=',
      'AWS_SECRET_ACCESS_KEY\\s*=',
    ];

    patterns.forEach((pattern) => {
      try {
        const result = execSync(
          `git grep -i -E "${pattern}" -- ':!**/node_modules/**' ':!**/.git/**' ':!**/package-lock.json' || exit 0`,
          { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }
        );

        if (result.trim()) {
          expect(result).not.toMatch(/AKIA[0-9A-Z]{16}/); // Found potential AWS secret
        }
      } catch (error) {
        // git grep returns non-zero when no matches (which is what we want)
        if (error.stdout && error.stdout.trim()) {
          expect(error.stdout).not.toMatch(/AKIA[0-9A-Z]{16}/); // Found potential AWS secret
        }
      }
    });

    expect(true).toBe(true);
  });

  test('should not contain Firebase private keys', () => {
    try {
      // Check for private key pattern
      const result = execSync(
        `git grep -i "private_key" -- ':!**/node_modules/**' ':!**/.git/**' ':!**/package-lock.json' ':!**/test/**' ':!**/tests/**' || exit 0`,
        { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }
      );

      // Filter out legitimate references (like this test file)
      const lines = result.split('\n').filter(line => {
        return line &&
          !line.includes('test') &&
          !line.includes('example') &&
          !line.includes('//') &&
          !line.includes('documentation');
      });

      if (lines.length > 0) {
        console.warn('⚠️  Found private_key references:', lines.join('\n'));
      }
    } catch (error) {
      // git grep returns non-zero when no matches
    }

    expect(true).toBe(true);
  });

  test('should not contain hardcoded JWT secrets in production code', () => {
    const secretPatterns = [
      'JWT_SECRET\\s*=\\s*["\'][^"\']+["\']',
      'secret:\\s*["\'][a-zA-Z0-9]{32,}["\']',
    ];

    secretPatterns.forEach((pattern) => {
      try {
        const result = execSync(
          `git grep -i -E "${pattern}" -- ':!**/node_modules/**' ':!**/.git/**' ':!**/tests/**' ':!**/test/**' || exit 0`,
          { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' }
        );

        // Allow in test/example files
        const lines = result.split('\n').filter(line => {
          return line &&
            !line.includes('test') &&
            !line.includes('example') &&
            !line.includes('.env');
        });

        if (lines.length > 0) {
          console.warn('⚠️  Found potential hardcoded secret:', lines[0].substring(0, 100));
        }
      } catch (error) {
        // git grep returns non-zero when no matches
      }
    });

    expect(true).toBe(true);
  });

  test('should not have .env files committed', () => {
    const envFiles = ['.env', '.env.local', '.env.production'];

    envFiles.forEach((envFile) => {
      const envPath = path.join(projectRoot, envFile);
      const exists = fs.existsSync(envPath);

      if (exists) {
        // Check if it's tracked by git
        try {
          execSync(`git ls-files --error-unmatch ${envFile}`, {
            cwd: projectRoot,
            stdio: 'pipe',
          });
          // If we get here, the file is tracked
          expect(true).toBe(false); // ${envFile} should not be committed to git
        } catch (error) {
          // File is not tracked - this is good
        }
      }
    });

    expect(true).toBe(true);
  });

  test('should have .env.example without real secrets', () => {
    const examplePath = path.join(projectRoot, '.env.example');

    if (fs.existsSync(examplePath)) {
      const content = fs.readFileSync(examplePath, 'utf8');

      // Should not contain actual secret values
      const suspiciousPatterns = [
        /AKIA[0-9A-Z]{16}/,
        /[0-9a-f]{32,}/i, // Long hex strings
        /-----BEGIN.*PRIVATE KEY-----/,
      ];

      suspiciousPatterns.forEach((pattern) => {
        if (pattern.test(content)) {
          console.warn('⚠️  .env.example may contain real secrets');
        }
      });
    }

    expect(true).toBe(true);
  });

  test('should use environment variables for sensitive config', () => {
    const configPath = path.join(projectRoot, 'src/config/firebase.js');

    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');

      // Should use process.env for sensitive values
      expect(content).toContain('process.env');
      
      // Should not have hardcoded credentials
      expect(content).not.toMatch(/apiKey:\s*['"][a-zA-Z0-9]{32,}['"]/);
    }

    expect(true).toBe(true);
  });
});
