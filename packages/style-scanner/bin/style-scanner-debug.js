#!/usr/bin/env node
/**
 * Style Scanner CLI - Debug Version
 */

console.log('Style Scanner CLI starting...');

try {
  const chalk = await import('chalk');
  const { program } = await import('commander');

  console.log('Dependencies loaded successfully');

  program
    .name('style-scanner')
    .description('Automated style documentation generator for React components')
    .version('1.0.0');

  program
    .command('scan')
    .description('Scan components and generate style documentation')
    .option('-o, --out <dir>', 'Output directory', 'docs')
    .option('-p, --pattern <pattern>', 'File pattern to scan', 'apps/*/src/app/**/*.{ts,tsx}')
    .option('-v, --verbose', 'Verbose output', false)
    .option('--dry-run', 'Dry run without writing files', false)
    .action(async options => {
      console.log(chalk.blue('🔍 Starting style scan...'));
      console.log(chalk.gray(`Output: ${options.out}`));
      console.log(chalk.gray(`Pattern: ${options.pattern}`));

      console.log(chalk.yellow('⚠️  Full scanning implementation coming soon'));
      console.log(chalk.green('✅ Scan completed'));
    });

  await program.parseAsync();
} catch (error) {
  console.error('❌ CLI Error:', error.message);
  process.exit(1);
}
