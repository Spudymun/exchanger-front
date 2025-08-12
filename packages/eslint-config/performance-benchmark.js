/**
 * ESLint Performance Benchmarking утилита
 * Измерение и оптимизация производительности конфигурации
 */

import { execSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

// === BENCHMARK CONFIGURATION ===
const BENCHMARK_RUNS = 3;
const LINT_COMMAND = 'npm run lint';

/**
 * Запуск benchmark тестов
 */
export async function runPerformanceBenchmark() {
  console.log('🚀 Starting ESLint Performance Benchmark...\n');

  const results = [];

  for (let i = 1; i <= BENCHMARK_RUNS; i++) {
    console.log(`📊 Run ${i}/${BENCHMARK_RUNS}...`);

    const startTime = performance.now();

    try {
      const output = execSync(LINT_COMMAND, {
        encoding: 'utf8',
        timeout: 30000, // 30 seconds timeout
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Extract warnings/errors count
      const problemsMatch = output.match(/(\d+) problems?/);
      const problemsCount = problemsMatch ? parseInt(problemsMatch[1]) : 0;

      results.push({
        run: i,
        duration: Math.round(duration),
        problems: problemsCount,
        success: true,
      });

      console.log(`   ✅ Completed in ${Math.round(duration)}ms - ${problemsCount} problems\n`);
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      results.push({
        run: i,
        duration: Math.round(duration),
        problems: 'ERROR',
        success: false,
        error: error.message,
      });

      console.log(`   ❌ Failed in ${Math.round(duration)}ms - Error: ${error.message}\n`);
    }
  }

  return generateReport(results);
}

/**
 * Генерация отчета о производительности
 */
function generateReport(results) {
  const successfulRuns = results.filter(r => r.success);

  if (successfulRuns.length === 0) {
    return {
      status: 'FAILED',
      message: 'All benchmark runs failed',
      results,
    };
  }

  const durations = successfulRuns.map(r => r.duration);
  const problems = successfulRuns.map(r => r.problems);

  const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const avgProblems = Math.round(problems.reduce((a, b) => a + b, 0) / problems.length);

  // Performance evaluation
  let performanceRating;
  const recommendations = [];

  if (avgDuration < 2000) {
    performanceRating = '🚀 EXCELLENT';
  } else if (avgDuration < 5000) {
    performanceRating = '✅ GOOD';
  } else if (avgDuration < 10000) {
    performanceRating = '⚠️ SLOW';
    recommendations.push('Consider reducing file scope or optimizing rules');
  } else {
    performanceRating = '🐌 VERY SLOW';
    recommendations.push('CRITICAL: ESLint performance needs optimization');
    recommendations.push('Consider splitting configuration or using cache');
  }

  const report = {
    status: 'SUCCESS',
    performance: {
      rating: performanceRating,
      avgDuration,
      minDuration,
      maxDuration,
      avgProblems,
      consistency: maxDuration - minDuration,
    },
    recommendations,
    details: results,
  };

  // Console output
  console.log('📈 PERFORMANCE REPORT');
  console.log('='.repeat(50));
  console.log(`Performance Rating: ${performanceRating}`);
  console.log(`Average Duration: ${avgDuration}ms`);
  console.log(`Duration Range: ${minDuration}ms - ${maxDuration}ms`);
  console.log(`Average Problems: ${avgProblems}`);
  console.log(`Consistency Score: ${maxDuration - minDuration}ms variance`);

  if (recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    for (const [i, rec] of recommendations.entries()) {
      console.log(`${i + 1}. ${rec}`);
    }
  }

  console.log('\n🎯 BENCHMARK SUMMARY:');
  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    const duration = `${result.duration}ms`;
    const problems = result.success ? `${result.problems} problems` : result.error;
    console.log(`${status} Run ${result.run}: ${duration} - ${problems}`);
  }

  return report;
}

// === LAZY LOADING PERFORMANCE TEST ===
export function testLazyLoadingPerformance() {
  console.log('🔄 Testing Lazy Loading Performance...\n');

  const start = performance.now();

  // Simulate lazy loading
  import('./react.js').then(() => {
    const lazyTime = performance.now() - start;
    console.log(`React config lazy loaded in ${Math.round(lazyTime)}ms`);
  });

  import('./api.js').then(() => {
    const lazyTime = performance.now() - start;
    console.log(`API config lazy loaded in ${Math.round(lazyTime)}ms`);
  });
}

// === CACHE PERFORMANCE TEST ===
export async function testCachePerformance() {
  console.log('💾 Testing Cache Performance...\n');

  const { performanceMetrics } = await import('./lazy-loading.js');
  const report = performanceMetrics.getReport();

  console.log('Cache Performance Report:');
  console.log(`Total load time: ${report.totalTime}ms`);
  console.log(`Average config time: ${Math.round(report.averageTime)}ms`);

  if (report.slowestConfigs.length > 0) {
    console.log('\nSlowest configurations:');
    for (const [name, time] of report.slowestConfigs) {
      console.log(`  ${name}: ${time}ms`);
    }
  }
}

// Main execution - run benchmark when called directly
runPerformanceBenchmark()
  .then(() => {
    testLazyLoadingPerformance();
    return testCachePerformance();
  })
  .catch(console.error);

// Functions are already exported above individually
