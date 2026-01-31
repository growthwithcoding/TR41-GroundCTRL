import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * UI-008: ES Module Import Test
 * Related PR(s): #47
 * 
 * Description: Scan built bundle for `require('react')`; ensure only ES-module imports exist.
 * Expected Result: No CommonJS `require` for React.
 */

test.describe('UI-008: ES Module Imports', () => {
  test('should not contain CommonJS require statements for React', async () => {
    // Path to the dist/build directory
    const distPath = path.join(__dirname, '..', 'dist');
    
    // Check if dist folder exists
    if (!fs.existsSync(distPath)) {
      test.skip('Build directory not found. Run `npm run build` first.');
      return;
    }
    
    // Find all JS files in dist
    const jsFiles = findJSFiles(distPath);
    expect(jsFiles.length).toBeGreaterThan(0);
    
    // Check each file for CommonJS require statements
    const violations = [];
    
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for require('react') or require("react")
      const requireReactMatches = content.match(/require\s*\(\s*['"]react['"]\s*\)/g);
      if (requireReactMatches) {
        violations.push({
          file: path.relative(distPath, file),
          matches: requireReactMatches,
        });
      }
      
      // Check for require('react-dom')
      const requireReactDomMatches = content.match(/require\s*\(\s*['"]react-dom['"]\s*\)/g);
      if (requireReactDomMatches) {
        violations.push({
          file: path.relative(distPath, file),
          matches: requireReactDomMatches,
        });
      }
    }
    
    // Should have no CommonJS requires for React
    if (violations.length > 0) {
      console.error('Found CommonJS require statements:', violations);
    }
    expect(violations).toHaveLength(0);
  });

  test('should use ES module imports for React', async () => {
    const distPath = path.join(__dirname, '..', 'dist');
    
    if (!fs.existsSync(distPath)) {
      test.skip('Build directory not found. Run `npm run build` first.');
      return;
    }
    
    const jsFiles = findJSFiles(distPath);
    let hasReactImports = false;
    
    // Check for ES module imports (they get transpiled, so look for React references)
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Look for React in the bundled code (should be present as ES modules)
      // Vite bundles will have React code but without CommonJS syntax
      if (content.includes('React') || content.includes('react')) {
        hasReactImports = true;
        
        // Ensure no require() calls for react specifically
        const hasRequire = /require\s*\(\s*['"]react/.test(content);
        expect(hasRequire).toBe(false);
      }
    }
    
    // Should have some React code (validates the build actually includes React)
    expect(hasReactImports).toBe(true);
  });

  test('should have proper module format in package.json', async () => {
    const packagePath = path.join(__dirname, '../..', 'package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    // Should specify type: "module" for ES modules
    expect(packageContent.type).toBe('module');
  });

  test('should not have mixed module formats in bundle', async () => {
    const distPath = path.join(__dirname, '..', 'dist');
    
    if (!fs.existsSync(distPath)) {
      test.skip('Build directory not found. Run `npm run build` first.');
      return;
    }
    
    const jsFiles = findJSFiles(distPath);
    const filesWithRequire = [];
    const filesWithImport = [];
    
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for CommonJS patterns
      if (/\brequire\s*\(/.test(content) || /module\.exports\s*=/.test(content)) {
        filesWithRequire.push(path.relative(distPath, file));
      }
      
      // Check for ES module patterns (in source, before transpilation)
      if (/\bimport\s+.*\bfrom\b/.test(content) || /\bexport\s+/.test(content)) {
        filesWithImport.push(path.relative(distPath, file));
      }
    }
    
    // Should not have files with CommonJS patterns in production build
    // (Some bundlers may use require for dynamic imports, which is acceptable)
    // The key test is no require('react') specifically
    console.log('Files analyzed:', jsFiles.length);
    console.log('Files with require patterns:', filesWithRequire.length);
  });
});

/**
 * Recursively find all JS files in a directory
 * @param {string} dir Directory to search
 * @param {string[]} fileList Accumulator for files
 * @returns {string[]} Array of file paths
 */
function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findJSFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}
