#!/usr/bin/env node
/**
 * Fix Audit Collection Names
 * Replaces 'auditLogs' with 'audit_logs' in all audit test files
 */

const fs = require('fs');
const path = require('path');

const testFiles = [
  'backend/tests/security/audit-timestamp.test.js',
  'backend/tests/security/audit-anonymous.test.js',
  'backend/tests/security/audit-custom-metadata.test.js',
  'backend/tests/security/audit-payload-sanitisation.test.js'
];

testFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`Fixing ${filePath}...`);
    let content = fs.readFileSync(fullPath, 'utf8');
    const before = content;
    
    // Replace all instances of .collection('auditLogs') with .collection('audit_logs')
    content = content.replace(/\.collection\('auditLogs'\)/g, ".collection('audit_logs')");
    
    if (content !== before) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✓ Fixed ${filePath}`);
    } else {
      console.log(`- No changes needed in ${filePath}`);
    }
  } else {
    console.log(`✗ File not found: ${filePath}`);
  }
});

console.log('\nDone!');
