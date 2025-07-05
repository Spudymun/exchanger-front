#!/usr/bin/env node

/**
 * Final validation script after technical audit
 * Run with: node scripts/validate-cleanup.js
 */

const { execSync } = require('node:child_process');
const fs = require('node:fs');

console.log('🔍 Running final validation checks...\n');

const checks = [
  {
    name: 'ESLint',
    command: 'npm run lint',
    description: 'Code quality and style consistency',
  },
  {
    name: 'Tests',
    command: 'npm run test',
    description: 'All unit and integration tests',
  },
  {
    name: 'Type Checking',
    command: 'npx turbo run check-types',
    description: 'TypeScript type validation',
  },
];

const results = [];

for (const check of checks) {
  try {
    console.log(`🧪 Running ${check.name}...`);
    execSync(check.command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    results.push({ ...check, status: '✅ PASS' });
    console.log(`✅ ${check.name} passed\n`);
  } catch {
    results.push({ ...check, status: '❌ FAIL' });
    console.log(`❌ ${check.name} failed\n`);
  }
}

// Check project structure
console.log('📁 Validating project structure...');
const requiredFiles = [
  'ARCHITECTURE.md',
  'API_DOCS.md',
  'CLEANUP_REPORT.md',
  'I18N_STATUS.md',
  '.husky/pre-commit',
  '.lintstagedrc.json',
  '.prettierrc.json',
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
if (missingFiles.length === 0) {
  results.push({
    name: 'Documentation',
    status: '✅ PASS',
    description: 'All required docs present',
  });
  console.log('✅ All documentation files present\n');
} else {
  results.push({
    name: 'Documentation',
    status: '❌ FAIL',
    description: `Missing: ${missingFiles.join(', ')}`,
  });
  console.log(`❌ Missing files: ${missingFiles.join(', ')}\n`);
}

// Summary
console.log('📊 FINAL AUDIT RESULTS');
console.log('='.repeat(50));
for (const result of results) {
  console.log(`${result.status} ${result.name}: ${result.description}`);
}

const allPassed = results.every(r => r.status.includes('✅'));
console.log('='.repeat(50));

if (allPassed) {
  console.log('🎉 ALL CHECKS PASSED! Project is production-ready.');
  console.log('\n📋 Ready for:');
  console.log('   • Development: npm run dev');
  console.log('   • Production: npm run build && npm start');
  console.log('   • Testing: npm run test:e2e');
  console.log('   • Deployment: Ready for CI/CD pipeline');
} else {
  console.log('⚠️  Some checks failed. Please review and fix issues.');
  process.exit(1);
}
