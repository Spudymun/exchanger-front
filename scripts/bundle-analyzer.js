/**
 * Bundle Size Analyzer Script
 * Анализ размера бандла с лимитами согласно CODE_REVIEW_PROTOCOLS.md
 */

import { writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Bundle size limits (в KB) согласно CODE_REVIEW_PROTOCOLS.md
const BUNDLE_SIZE_LIMITS = {
  main: 250, // Main bundle
  vendor: 500, // Vendor libraries
  chunks: 150, // Individual chunks
  total: 800, // Total JS size
};

const BYTES_TO_KB = 1024;

function getChunkStats(staticPath) {
  return readdirSync(staticPath)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const stats = statSync(join(staticPath, file));
      return {
        name: file,
        size: stats.size,
        sizeKB: Math.round(stats.size / BYTES_TO_KB),
      };
    })
    .sort((a, b) => b.size - a.size);
}

function determineChunkLimit(chunkName) {
  if (chunkName.includes('main') || chunkName.includes('app')) {
    return BUNDLE_SIZE_LIMITS.main;
  }
  if (chunkName.includes('vendor') || chunkName.includes('framework')) {
    return BUNDLE_SIZE_LIMITS.vendor;
  }
  return BUNDLE_SIZE_LIMITS.chunks;
}

function analyzeChunks(chunks) {
  let hasViolations = false;
  let totalSizeKB = 0;

  console.log('\n📊 Bundle Size Analysis\n');
  console.log('Asset Name                          Size (KB)   Limit (KB)   Status');
  console.log('─'.repeat(80));

  for (const chunk of chunks) {
    const { sizeKB, name } = chunk;
    totalSizeKB += sizeKB;

    const limit = determineChunkLimit(name);
    const status = sizeKB <= limit ? '✅ PASS' : '❌ FAIL';

    if (sizeKB > limit) hasViolations = true;

    console.log(
      `${name.padEnd(35)} ${sizeKB.toString().padStart(8)} ${limit.toString().padStart(11)}   ${status}`
    );
  }

  return { hasViolations, totalSizeKB };
}

function generateReport(hasViolations, totalSizeKB, chunks) {
  console.log('─'.repeat(80));
  console.log(`\nTotal JavaScript Size: ${totalSizeKB} KB`);
  console.log(`Total Size Limit: ${BUNDLE_SIZE_LIMITS.total} KB`);

  if (totalSizeKB > BUNDLE_SIZE_LIMITS.total) {
    console.log(
      `❌ FAIL - Total size exceeds limit by ${totalSizeKB - BUNDLE_SIZE_LIMITS.total} KB`
    );
  } else {
    console.log(
      `✅ PASS - Total size within limit (${BUNDLE_SIZE_LIMITS.total - totalSizeKB} KB remaining)`
    );
  }

  // Сохраняем отчет
  const report = {
    timestamp: new Date().toISOString(),
    totalSizeKB,
    limit: BUNDLE_SIZE_LIMITS.total,
    chunks: chunks.map(c => ({ name: c.name, sizeKB: c.sizeKB })),
    violations: hasViolations || totalSizeKB > BUNDLE_SIZE_LIMITS.total,
  };

  writeFileSync(join(__dirname, '../bundle-stats.json'), JSON.stringify(report, null, 2));

  console.log('\n📄 Bundle report saved to: bundle-stats.json');
}

function showRecommendations() {
  console.error('\n❌ Bundle size limits exceeded!');
  console.error('🔧 Recommendations:');
  console.error('  1. Enable code splitting for large components');
  console.error('  2. Use dynamic imports for non-critical code');
  console.error('  3. Review and optimize heavy dependencies');
  console.error('  4. Enable tree shaking for unused exports');
}

export function analyzeBundleSize() {
  const buildStatsPath = join(__dirname, '../apps/web/.next/static');

  if (!existsSync(buildStatsPath)) {
    console.error('❌ Build stats not found. Run: npm run build first');
    process.exit(1);
  }

  try {
    const staticPath = join(__dirname, '../apps/web/.next/static/chunks');

    if (!existsSync(staticPath)) {
      console.error('❌ Static chunks not found. Build may have failed.');
      process.exit(1);
    }

    const chunks = getChunkStats(staticPath);
    const { hasViolations, totalSizeKB } = analyzeChunks(chunks);

    // Всегда сохраняем отчет перед проверкой violations
    const totalViolations = totalSizeKB > BUNDLE_SIZE_LIMITS.total;
    generateReport(hasViolations || totalViolations, totalSizeKB, chunks);

    if (hasViolations || totalViolations) {
      showRecommendations();
      process.exit(1);
    }

    console.log('\n✅ All bundle sizes within limits');
  } catch (error) {
    console.error('❌ Error analyzing bundle:', error.message);
    process.exit(1);
  }
}

export { BUNDLE_SIZE_LIMITS };

// Запуск если файл выполняется напрямую
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1].endsWith('bundle-analyzer.js')
) {
  analyzeBundleSize();
}
