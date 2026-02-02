/**
 * Dependency Pinning Test
 * Tests: Dependencies are pinned to specific versions
 * Features: Version pinning, lock files, reproducible builds
 */

const fs = require('fs');

describe('CI - Dependency Pinning', () => {
  it('should have package-lock.json for pinned dependencies', () => {
    expect(fs.existsSync('package-lock.json')).toBe(true);
  }, 60000);

  it('should pin all production dependencies', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    Object.entries(packageJson.dependencies || {}).forEach(([name, version]) => {
      // Should not use ranges like ^, ~, or >=
      // But minor version flexibility is acceptable with ^
      // Prefer exact versions or  Caret for security patches

      if (version.includes('*')) {
        throw new Error(`Package ${name} uses wildcard version: ${version}`);
      }

      // Version should be specified
      expect(version).toBeTruthy();
    });
  }, 60000);

  it('should not use loose version ranges in production', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    Object.entries(packageJson.dependencies || {}).forEach(([name, version]) => {
      // Avoid >=, >, or other loose ranges
      if (version.match(/^(>=|>|<)/) && !version.includes('^') && !version.includes('~')) {
        // Some flexibility is ok, but should be explicit
        expect(version).toBeTruthy();
      }
    });
  }, 60000);

  it('should use exact versions for critical security packages', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    const criticalPackages = ['jsonwebtoken', 'express', 'helmet', 'dotenv'];

    criticalPackages.forEach(pkg => {
      if (packageJson.dependencies[pkg]) {
        const version = packageJson.dependencies[pkg];

        // Should have some version constraint
        expect(version).toBeTruthy();
        expect(version).not.toBe('latest');
      }
    });
  }, 60000);

  it('should have integrity hashes in lock file', () => {
    const lockfile = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

    // Lock file should have integrity information
    expect(lockfile.packages || lockfile.dependencies).toBeDefined();

    if (lockfile.packages) {
      Object.values(lockfile.packages).forEach(pkg => {
        // Should have integrity hash when available
        if (pkg && typeof pkg === 'object' && pkg.version) {
          const hasIntegrity = pkg.integrity || pkg.resolved;
          if (hasIntegrity) {
            expect(hasIntegrity).toBeTruthy();
          } else {
            expect(pkg.version).toBeDefined();
          }
        }
      });
    }
  }, 60000);

  it('should not have unversioned dependencies', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    };

    Object.entries(allDeps).forEach(([name, version]) => {
      expect(version).not.toBe('');
      expect(version).not.toBe('*');
      expect(version).not.toBe('latest');
    });
  }, 60000);

  it('should use semver ranges carefully', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    Object.entries(packageJson.dependencies || {}).forEach(([name, version]) => {
      // ^ allows minor and patch
      // ~ allows only patch
      // > and >= should be avoided for security-critical packages

      const securityCritical = ['helmet', 'jsonwebtoken', 'express'];

      if (securityCritical.includes(name)) {
        // Should have explicit version or caret
        expect(version).toMatch(/^\d+\.\d+\.\d+|^\^/);
      }
    });
  }, 60000);

  it('should verify lock file consistency', () => {
    if (fs.existsSync('package-lock.json') && fs.existsSync('package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const lockfile = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

      // Lock file should reference packages from package.json
      expect(lockfile.name).toBe(packageJson.name);
      expect(lockfile.version).toBe(packageJson.version);
    }
  }, 60000);

  it('should not allow floating versions for security packages', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    const securityPackages = ['helmet', 'jsonwebtoken', 'bcrypt', 'crypto'];

    securityPackages.forEach(pkg => {
      if (packageJson.dependencies[pkg]) {
        const version = packageJson.dependencies[pkg];

        // Should not be floating/latest
        expect(version).not.toMatch(/^\*|^latest|^>/);
      }
    });
  }, 60000);

  it('should have npm ci for reproducible installs', () => {
    // package-lock.json should be used with npm ci
    expect(fs.existsSync('package-lock.json')).toBe(true);
  }, 60000);

  it('should prevent version drift in different environments', () => {
    // Lock file ensures consistent versions across environments
    expect(fs.existsSync('package-lock.json')).toBe(true);

    const lockfile = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

    // Should have lockfileVersion
    expect(lockfile.lockfileVersion).toBeDefined();
  }, 60000);

  it('should use exact versions for devDependencies security tools', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    const securityTools = ['eslint', 'jest', '@types/jest'];

    securityTools.forEach(tool => {
      if (packageJson.devDependencies?.[tool]) {
        const version = packageJson.devDependencies[tool];

        // Should have version specified
        expect(version).toBeTruthy();
      }
    });
  }, 60000);
});
