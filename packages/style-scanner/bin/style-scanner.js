#!/usr/bin/env node
/**
 * Style Scanner CLI
 * Интерфейс командной строки для сканера стилей
 */

/* eslint-disable */

console.log('Style Scanner CLI starting...');

try {
  const chalkModule = await import('chalk');
  const chalk = chalkModule.default;
  const { program } = await import('commander');

  console.log('Dependencies loaded successfully');

  /**
   * Настройка CLI команд
   */
  function setupCLI() {
    program
      .name('style-scanner')
      .description('Automated style documentation generator for React components')
      .version('1.0.0');

    program
      .command('scan')
      .description('Scan components and generate style documentation')
      .option('-o, --out <dir>', 'Output directory', 'style-docs')
      .option(
        '-p, --pattern <pattern>',
        'File pattern to scan',
        JSON.stringify(['apps/*/app/**/page.{ts,tsx}', 'apps/*/src/app/**/page.{ts,tsx}'])
      )
      .option('-v, --verbose', 'Verbose output', false)
      .option('-q, --quiet', 'Minimal output', false)
      .option('--dry-run', 'Dry run without writing files', false)
      .action(async options => {
        if (!options.quiet) {
          console.log(chalk.blue('🔍 Starting style scan...'));
          console.log(chalk.gray(`Output: ${options.out}`));
          console.log(chalk.gray(`Pattern: ${options.pattern}`));
        }

        try {
          // Динамический импорт модулей
          const { scanStyles } = await import('../dist/core/main-scanner.js');
          const { generateMarkdownDocs } = await import('../dist/services/markdown-generator.js');

          if (!options.quiet) {
            console.log(chalk.blue('🔍 Starting comprehensive style scanning...'));
            console.log(chalk.gray(`Output: ${options.out}`));
          }

          // Запуск полного сканирования
          const scanResult = await scanStyles({
            outputDir: options.out,
            verbose: options.verbose && !options.quiet,
            dryRun: options.dryRun,
          });

          // Генерация Markdown документации если не dry-run
          if (!options.dryRun) {
            if (!options.quiet) {
              console.log(chalk.blue('📝 Generating Markdown documentation...'));
            }

            await generateMarkdownDocs(scanResult, {
              outputDir: options.out,
              verbose: options.verbose && !options.quiet,
            });
          }

          // Вывод результатов
          if (options.quiet) {
            console.log(
              chalk.green(
                `✅ ${scanResult.summary.totalComponents} components, ${scanResult.summary.totalErrors} errors`
              )
            );
          } else {
            console.log(chalk.green(`\n✅ Scan completed!`));
            console.log(chalk.cyan(`� Summary:`));
            console.log(chalk.gray(`   📄 Pages scanned: ${scanResult.summary.totalPages}`));
            console.log(
              chalk.gray(`   🧩 Components found: ${scanResult.summary.totalComponents}`)
            );
            console.log(chalk.gray(`   ⚠️  Errors: ${scanResult.summary.totalErrors}`));
            console.log(chalk.gray(`   ⏱️  Duration: ${scanResult.summary.scanDuration}ms`));
          }

          if (options.verbose && !options.quiet) {
            console.log(chalk.cyan(`\n📋 Detailed results:`));
            scanResult.pages.forEach(page => {
              console.log(
                chalk.yellow(`  📄 ${page.pagePath}: ${page.components.length} components`)
              );
              if (page.errors.length > 0) {
                console.log(chalk.red(`    ❌ Errors in this page:`));
                page.errors.forEach(error => {
                  console.log(
                    chalk.red(`      - ${error.type}: ${error.message} (${error.filePath})`)
                  );
                });
              }
            });
          }

          // Принудительное завершение процесса
          process.exit(0);
        } catch (error) {
          console.error(chalk.red(`❌ Scan failed: ${error}`));
          process.exit(1);
        }
      });

    return program;
  }

  /**
   * Запуск CLI
   */
  async function main() {
    const cli = setupCLI();
    await cli.parseAsync();
  }

  await main();
} catch (error) {
  console.error('❌ CLI Error:', error.message);
  process.exit(1);
}
