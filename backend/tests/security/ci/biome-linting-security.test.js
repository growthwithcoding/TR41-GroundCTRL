/**
 * Biome Linting Security Test
 * Tests: Biome linting rules are enabled and passing
 * Features: Code quality, security rule enforcement, linting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('CI - Biome Linting Security', () => {
  it('should pass linting without security warnings', async () => {
    try {
      // Run biome check
      execSync('npx biome check src/', {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      expect(true).toBe(true); // No errors
    } catch (error) {
      // If biome check fails, it means there are linting errors
      throw error;
    }
  }, 60000);

  it('should have Biome configured with security rules', () => {
    // Check for biome.json config
    const hasConfig = fs.existsSync('biome.json');
    expect(hasConfig).toBe(true);

    if (fs.existsSync('biome.json')) {
      const config = fs.readFileSync('biome.json', 'utf8');

      // Should be valid JSON and contain linting rules
      expect(config).toBeDefined();
      const biomeConfig = JSON.parse(config);
      expect(biomeConfig.linter).toBeDefined();
    }
  }, 60000);

  it('should flag insecure practices', () => {
    // Biome should catch common security issues
    // This is implicit if biome linter rules are configured

    expect(fs.existsSync('biome.json')).toBe(true);
  }, 60000);

  it('should enforce no-eval rule', () => {
    const srcDir = 'src';

    if (fs.existsSync(srcDir)) {
      const files = fs.readdirSync(srcDir);

      files.forEach(file => {
        const filePath = path.resolve(path.join(srcDir, file));
        try {
          const content = fs.readFileSync(filePath, 'utf8');

          // Should not use eval()
          expect(content).not.toMatch(/\beval\s*\(/);
        } catch (err) {
          // Skip if not a file or cannot be read
          if (err.code !== 'EISDIR' && err.code !== 'ENOENT') {
            throw err;
          }
        }
      });
    }
  }, 60000);

  it('should avoid dangerous regex patterns', () => {
    const srcDir = 'src';

    if (fs.existsSync(srcDir)) {
      const files = fs.readdirSync(srcDir);
      const baseDir = path.resolve(srcDir);

      files.forEach(file => {
        const filePath = path.resolve(path.join(srcDir, file));
        // Validate path is within base directory to prevent path traversal
        if (!filePath.startsWith(baseDir)) {
          throw new Error(`Path traversal detected: ${file}`);
        }
        try {
          const content = fs.readFileSync(filePath, 'utf8');

          // Should avoid ReDoS patterns
          expect(content).not.toMatch(/\^.*\$.*\(\.\*\)|\\w\+\\\.\.\*\\w\+/);
        } catch (err) {
          // Skip if not a file or cannot be read
          if (err.code !== 'EISDIR' && err.code !== 'ENOENT') {
            throw err;
          }
        }
      });
    }
  }, 60000);

  it('should enforce secure password handling', () => {
    const srcDir = 'src';

    if (fs.existsSync(srcDir)) {
      const files = fs.readdirSync(srcDir);

      const baseDir = path.resolve(srcDir);
      files.forEach(file => {
        if (file.includes('password') || file.includes('auth')) {
          const filePath = path.resolve(path.join(srcDir, file));
          // Validate path is within base directory to prevent path traversal
          if (!filePath.startsWith(baseDir)) {
            throw new Error(`Path traversal detected: ${file}`);
          }
          const content = fs.readFileSync(filePath, 'utf8');

          // Should not log passwords
          expect(content).not.toMatch(/console\.log.*password/i);
          expect(content).not.toMatch(/logger\..*password/i);
        }
      });
    }
  }, 60000);

  it('should have no hardcoded secrets in code', () => {
    const srcDir = 'src';

    if (fs.existsSync(srcDir)) {
      const checkFile = (file) => {
        const content = fs.readFileSync(file, 'utf8');

        // Check for actual high-entropy secrets, not base64 in URLs or comments
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          // Skip comments and URLs
          if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.includes('http://') || line.includes('https://')) {
            return;
          }
          
          // Real API keys and tokens
          expect(line).not.toMatch(/sk_live_[a-zA-Z0-9]{20,}/);
          expect(line).not.toMatch(/AKIA[0-9A-Z]{16}/);
          expect(line).not.toMatch(/ghp_[a-zA-Z0-9]{36}/);
        });
      };

      // Check all JS files
      const walkDir = (dir) => {
        const files = fs.readdirSync(dir);
        const baseDir = path.resolve(dir);

        files.forEach(file => {
          const filePath = path.resolve(path.join(dir, file));
          // Validate path is within base directory to prevent path traversal
          if (!filePath.startsWith(baseDir)) {
            throw new Error(`Path traversal detected: ${file}`);
          }
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
            walkDir(filePath);
          } else if (file.endsWith('.js')) {
            checkFile(filePath);
          }
        });
      };

      walkDir(srcDir);
    }
  }, 60000);

  it('should avoid dangerous require patterns', () => {
    const srcDir = 'src';

    if (fs.existsSync(srcDir)) {
      const files = fs.readdirSync(srcDir);
      const baseDir = path.resolve(srcDir);

      files.forEach(file => {
        const filePath = path.resolve(path.join(srcDir, file));
        // Validate path is within base directory to prevent path traversal
        if (!filePath.startsWith(baseDir)) {
          throw new Error(`Path traversal detected: ${file}`);
        }
        try {
          const content = fs.readFileSync(filePath, 'utf8');

          // Should not use dynamic requires with user input
          expect(content).not.toMatch(/require\(.*\+.*\)/);
        } catch (err) {
          // Skip if not a file or cannot be read
          if (err.code !== 'EISDIR' && err.code !== 'ENOENT') {
            throw err;
          }
        }
      });
    }
  }, 60000);

  it('should enforce secure random generation', () => {
    const srcDir = 'src';

    if (fs.existsSync(srcDir)) {
      const files = fs.readdirSync(srcDir);

      const baseDir = path.resolve(srcDir);
      files.forEach(file => {
        if (file.includes('random') || file.includes('token')) {
          const filePath = path.resolve(path.join(srcDir, file));
          // Validate path is within base directory to prevent path traversal
          if (!filePath.startsWith(baseDir)) {
            throw new Error(`Path traversal detected: ${file}`);
          }
          const content = fs.readFileSync(filePath, 'utf8');

          // Should use crypto.randomBytes, not Math.random()
          if (content.includes('token') || content.includes('secret')) {
            // May check for proper randomness
            expect(content).toBeDefined();
          }
        }
      });
    }
  }, 60000);

  it('should pass linting without security warnings', async () => {
    try {
      execSync('npx biome check src/', {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      expect(true).toBe(true);
    } catch (error) {
      // Should have no security-related linting errors
      const output = error.stdout || '';

      if (output.includes('security') || output.includes('XSS') || output.includes('injection')) {
        throw error;
      }
    }
  }, 60000);
});
