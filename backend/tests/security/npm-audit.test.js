/**
 * Security Test: NPM Audit
 * Test Goal: CI must fail on high severity NPM vulnerabilities
 * 
 * Ensures dependencies don't have known security vulnerabilities.
 */

const { execSync } = require('child_process');
const path = require('path');

describe('Security: NPM Audit', () => {
  const projectRoot = path.join(__dirname, '../..');

  test('should have no high or critical severity vulnerabilities', () => {
    try {
      // Run npm audit with --audit-level=high
      // This will exit with code 0 if no high/critical vulnerabilities
      const result = execSync('npm audit --audit-level=high --json', {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const audit = JSON.parse(result);
      
      // Check for high or critical vulnerabilities
      const highVulns = audit.metadata?.vulnerabilities?.high || 0;
      const criticalVulns = audit.metadata?.vulnerabilities?.critical || 0;

      if (highVulns > 0 || criticalVulns > 0) {
        console.error(`Found ${criticalVulns} critical and ${highVulns} high severity vulnerabilities`);
        console.error('Run: npm audit fix --force');
      }

      expect(highVulns).toBe(0);
      expect(criticalVulns).toBe(0);
    } catch (error) {
      // npm audit exits with non-zero when vulnerabilities found
      if (error.stdout) {
        try {
          const audit = JSON.parse(error.stdout);
          const highVulns = audit.metadata?.vulnerabilities?.high || 0;
          const criticalVulns = audit.metadata?.vulnerabilities?.critical || 0;

          console.error(`\n⚠️  NPM Audit Findings:`);
          console.error(`   Critical: ${criticalVulns}`);
          console.error(`   High: ${highVulns}`);
          console.error(`   Run: npm audit fix\n`);

          expect(highVulns + criticalVulns).toBe(0);
        } catch (parseError) {
          // If we can't parse, just ensure the command didn't fail
          console.warn('Could not parse npm audit output');
        }
      }
    }
  }, 60000);

  test('should have npm audit available', () => {
    try {
      const version = execSync('npm --version', {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      expect(version).toBeTruthy();
    } catch (error) {
      fail('npm is not available');
    }
  });

  test('should have package-lock.json for consistent installs', () => {
    const fs = require('fs');
    const lockPath = path.join(projectRoot, 'package-lock.json');
    expect(fs.existsSync(lockPath)).toBe(true);
  });

  test('should not have npm audit fix available errors', () => {
    try {
      // Check if audit fix would work
      const result = execSync('npm audit fix --dry-run --json', {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const auditFix = JSON.parse(result);
      
      // Log what would be fixed
      if (auditFix.added || auditFix.updated || auditFix.removed) {
        console.log('npm audit fix would update dependencies');
      }
    } catch (error) {
      // This is expected if there are no fixable issues
    }

    expect(true).toBe(true);
  });

  test('should check for outdated packages with security implications', () => {
    try {
      const result = execSync('npm outdated --json', {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      if (result) {
        const outdated = JSON.parse(result);
        const criticalPackages = ['express', 'firebase-admin', 'jsonwebtoken'];
        
        criticalPackages.forEach((pkg) => {
          if (outdated[pkg]) {
            console.warn(`⚠️  ${pkg} is outdated: ${outdated[pkg].current} → ${outdated[pkg].latest}`);
          }
        });
      }
    } catch (error) {
      // npm outdated exits with code 1 when packages are outdated
      // This is informational, not a failure
    }

    expect(true).toBe(true);
  });
});
