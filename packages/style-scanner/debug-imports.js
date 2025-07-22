import { ComponentScanner } from './dist/scanner.js';

async function debugImports() {
  const scanner = new ComponentScanner({ verbose: true });

  try {
    const results = await scanner.scanProject({
      outputDir: 'debug',
      pattern: ['apps/*/app/**/page.{ts,tsx}'],
      exclude: [],
      verbose: true,
      dryRun: true,
    });

    console.log('\n=== DEBUG IMPORTS ===');

    for (const result of results) {
      if (result.projectName === 'web') {
        console.log(`\nProject: ${result.projectName}`);

        for (const pageResult of result.pages) {
          console.log(`\nPage: ${pageResult.pagePath}`);

          const exchangeFormAction = pageResult.components.find(
            c => c.name === 'ExchangeFormAction'
          );

          if (exchangeFormAction) {
            console.log('\n--- ExchangeFormAction ---');
            console.log('File:', exchangeFormAction.filePath);
            console.log('Tailwind classes:', exchangeFormAction.styles.tailwind.length);
            console.log('Imports:', JSON.stringify(exchangeFormAction.imports, null, 2));
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

debugImports();
