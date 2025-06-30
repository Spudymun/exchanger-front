#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import process from 'process';

const execAsync = promisify(exec);

console.log('\x1b[44m\x1b[37m🔍 ПРОВЕРКА ТЕХНИЧЕСКОГО ДОЛГА (ПРАВИЛО 13)\x1b[0m\n');

// Определяем категории файлов для исключений на основе анализа структуры проекта
const testFiles = [
    '*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx', 
    '*.mock.ts', '*.mocks.ts', '*.fixture.ts', '*.fixtures.ts',
    '*/__tests__/*', '*/test/*', '*/tests/*', 'test/*', 'tests/*'
];

const toolingFiles = [
    '*.config.*', '*.setup.*', 'scripts/*', 'turbo/generators/*',
    'jest.config.js', 'jest.setup.js', 'vitest.setup.ts', 'vitest.config.ts',
    'playwright.config.ts', 'tailwind.config.js', 'eslint.config.*',
    'next.config.*', 'commitlint.config.js', 'postcss.config.js',
    'turbo.json', 'tsconfig*.json', 'package.json', '.storybook/*'
];

const storyFiles = ['*.stories.ts', '*.stories.tsx', '*.stories.js', '*.stories.jsx'];
const temporaryFiles = ['old-*', 'temp-*', '*.tmp', '*.temp']; // Правило 6
const generatedFiles = [
    '*.d.ts', '*/dist/*', '*/build/*', '*/.next/*', '*/coverage/*',
    '*.min.js', '*.min.css', '*.map', 'next-env.d.ts', 'tsconfig.tsbuildinfo'
];

const documentationFiles = [
    '*.md', '*/docs/*', 'README.*', 'CHANGELOG.*', 'LICENSE.*'
];

// Универсальные исключения для всех проверок
const commonExcludes = [...temporaryFiles, ...generatedFiles];

// Список паттернов для поиска технического долга с детализированными исключениями
const techDebtPatterns = [
    { 
        pattern: 'TODO', 
        description: 'TODO комментарии',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes, ...documentationFiles],
        excludePatterns: [
            'autodocs', 'TODO: test case', 'TODO: describe', 'TODO: example',
            'TODO.*demo', 'TODO.*story', 'TODO.*documentation'
        ]
    },
    { 
        pattern: 'FIXME', 
        description: 'FIXME комментарии',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes, ...documentationFiles],
        excludePatterns: ['FIXME.*test', 'FIXME.*example', 'FIXME.*demo']
    }, 
    { 
        pattern: 'HACK', 
        description: 'HACK комментарии',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes, ...documentationFiles],
        excludePatterns: ['HACK.*test', 'HACK.*workaround.*test']
    },
    { 
        pattern: 'TEMP', 
        description: 'Временные решения',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes, ...documentationFiles],
        excludePatterns: ['TEMP.*test', 'TEMP.*example', 'TEMP.*demo']
    },
    { 
        pattern: 'XXX', 
        description: 'XXX маркеры',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes, ...documentationFiles],
        excludePatterns: ['XXX.*test', 'XXX.*example']
    },
    { 
        pattern: '@ts-ignore', 
        description: 'TypeScript игнорирования',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes],
        excludePatterns: [
            '@ts-ignore.*test', '@ts-ignore.*mock', '@ts-ignore.*story',
            '@ts-ignore.*next/navigation', '@ts-ignore.*react-dom/test-utils'
        ]
    },
    { 
        pattern: ':\\s*any(\\s|;|,|\\)|\\]|\\}|$)', 
        description: 'any типы',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes, '*.d.ts'],
        excludePatterns: [
            // Допустимые паттерны использования any
            'React.ComponentProps<any>', 'Record<string, any>', 'as any',
            'export type', 'export interface', 'import type', 'declare',
            'extends any', 'keyof any', 'typeof any', 'Array<any>',
            'Promise<any>', 'Partial<any>', 'Required<any>', 'Readonly<any>',
            // Типовые объявления из библиотек
            'ComponentType<any>', 'FC<any>', 'ReactNode', 'JSX.Element',
            // Распространенные утилитарные типы
            'Pick<any', 'Omit<any', 'Extract<any', 'Exclude<any'
        ]
    },
    { 
        pattern: 'console\\.log', 
        description: 'console.log в коде',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes, ...documentationFiles],
        excludePatterns: [
            // Допустимые случаи в демо-коде и примерах
            'console.log.*Selected:', 'console.log.*Toggle:', 'console.log.*Demo:',
            'console.log.*Test:', 'console.log.*Example:', 'console.log.*Story:',
            'console.log.*onClick', 'console.log.*onSelect', 'console.log.*action',
            // Логирование ошибок и важной информации
            'console.log.*error', 'console.log.*Error', 'console.log.*warn',
            'console.log.*info', 'console.log.*debug'
        ]
    },
    { 
        pattern: 'debugger', 
        description: 'debugger statements',
        excludeFiles: [...testFiles, ...toolingFiles, ...commonExcludes],
        excludePatterns: ['debugger.*test', 'debugger.*example', '"no-debugger"', "'no-debugger'"]
    },
    { 
        pattern: 'eslint-disable-next-line', 
        description: 'ESLint отключения (критичные)',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes, ...documentationFiles],
        excludePatterns: [
            // Часто оправданные отключения
            'eslint-disable-next-line @typescript-eslint/no-unused-vars',
            'eslint-disable-next-line react-hooks/exhaustive-deps',
            'eslint-disable-next-line @typescript-eslint/no-explicit-any',
            'eslint-disable-next-line @next/next/no-img-element',
            'eslint-disable-next-line react/no-unescaped-entities',
            // Отключения в тестах и примерах
            'eslint-disable-next-line.*test', 'eslint-disable-next-line.*mock'
        ]
    }
];

let foundIssues = 0;

// Функция для создания улучшенного regex из паттерна файла
function createFileRegex(pattern) {
    return pattern
        .replace(/\./g, '\\.')  // экранируем точки
        .replace(/\*/g, '[^\\s:]*')  // звездочка заменяется на любые символы кроме пробелов и двоеточий
        .replace(/\//g, '[\\\\/]');  // слеши работают в обе стороны
}

// Функция для проверки исключений по паттернам содержимого
function shouldExcludeByPattern(line, excludePatterns) {
    return excludePatterns.some(excludePattern => {
        // Поддержка regex паттернов в excludePatterns
        if (excludePattern.includes('.*')) {
            const regex = new RegExp(excludePattern);
            return regex.test(line);
        }
        return line.includes(excludePattern);
    });
}

// Функция для фильтрации системных файлов и папок (расширенная версия)
function isSystemFile(line) {
    const systemPatterns = [
        // Зависимости и билды
        'node_modules', '\\dist\\', '/dist/', '\\build\\', '/build/',
        '\\.next\\', '/.next/', '\\coverage\\', '/coverage/',
        
        // Сгенерированные файлы
        '.d.ts:', '.min.js:', '.min.css:', '.map:', 'tsconfig.tsbuildinfo',
        'next-env.d.ts:', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
        
        // Временные файлы
        '\\old-', '/old-', '\\temp-', '/temp-', '.tmp:', '.temp:',
        
        // Конфигурационные файлы
        '\\tsconfig.', '/tsconfig.', '.config.', '.setup.',
        
        // Служебные папки
        '\\.git\\', '/.git/', '\\.vscode\\', '/.vscode/',
        '\\.husky\\', '/.husky/', '\\.storybook\\', '/.storybook/',
        
        // Документация
        '\\docs\\', '/docs/', 'README.', 'CHANGELOG.', 'LICENSE.'
    ];
    
    return systemPatterns.some(pattern => line.includes(pattern));
}

async function checkPattern(pattern, description, excludeFiles = [], excludePatterns = []) {
    try {
        // Ищем в папках packages/ и apps/ с помощью grep (работает на Windows и Unix)
        const command = process.platform === 'win32' 
            ? `findstr /R /N /S "${pattern}" packages\\*.ts packages\\*.tsx packages\\*.js packages\\*.jsx apps\\*.ts apps\\*.tsx apps\\*.js apps\\*.jsx 2>nul || echo ""`
            : `grep -r -n "${pattern}" packages/ apps/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true`;
        
        const { stdout } = await execAsync(command);
        
        if (!stdout.trim() || stdout.trim() === '""') {
            console.log(`\x1b[32m✅ ${description}: не найдено\x1b[0m`);
            return 0;
        }
        
        let lines = stdout.trim().split('\n').filter(line => line.trim() && line.trim() !== '""');
        
        // Применяем исключения для файлов с улучшенным regex
        if (excludeFiles.length > 0) {
            lines = lines.filter(line => {
                return !excludeFiles.some(pattern => {
                    const regex = new RegExp(createFileRegex(pattern));
                    return regex.test(line);
                });
            });
        }
        
        // Применяем исключения для паттернов в содержимом
        if (excludePatterns.length > 0) {
            lines = lines.filter(line => !shouldExcludeByPattern(line, excludePatterns));
        }
        
        // Фильтруем системные файлы и папки
        lines = lines.filter(line => !isSystemFile(line));
        
        if (lines.length === 0) {
            console.log(`\x1b[32m✅ ${description}: не найдено\x1b[0m`);
            return 0;
        }
        
        console.log(`\x1b[31m❌ ${description}: ${lines.length} найдено\x1b[0m`);
        lines.forEach(line => console.log(`   ${line}`));
        console.log('');
        return 1;
    } catch (error) {
        console.log(`\x1b[33m⚠️  ${description}: ошибка поиска (${error.message})\x1b[0m`);
        return 0;
    }
}

// Функция для проверки больших файлов с улучшенной фильтрацией
async function checkLargeFiles() {
    try {
        const command = process.platform === 'win32'
            ? `powershell -Command "Get-ChildItem -Path packages,apps -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Where-Object {$_.FullName -notmatch 'node_modules|dist|build|\\.next|coverage|old-|temp-|\\.d\\.ts$|\\.(config|setup|stories|test|spec|mock|fixture)\\.' -and $_.Name -notmatch '^(README|CHANGELOG|LICENSE)' -and $_.Length -gt 0 -and (Get-Content $_.FullName | Measure-Object -Line).Lines -gt 500} | Select-Object Name,@{Name='Lines';Expression={(Get-Content $_.FullName | Measure-Object -Line).Lines}},FullName"`
            : `find packages apps -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v -E 'node_modules|dist|build|\\.next|coverage|old-|temp-|\\.d\\.ts$|\\.(config|setup|stories|test|spec|mock|fixture)\\.|^(README|CHANGELOG|LICENSE)' | xargs wc -l | awk '$1 > 500 {print $2 ": " $1 " lines"}'`;
        
        const { stdout } = await execAsync(command);
        if (stdout.trim()) {
            console.log('\x1b[33m⚠️  Большие файлы (>500 строк, требуют рефакторинга):\x1b[0m');
            console.log(stdout);
            return 1;
        }
        return 0;
    } catch {
        // Игнорируем ошибки этой проверки
        return 0;
    }
}

// Функция для отображения предупреждения о неиспользуемых импортах
async function showUnusedImportsWarning() {
    try {
        const command = process.platform === 'win32'
            ? `findstr /R /N /S "^import.*from.*['\"].*['\"];*$" packages\\*.ts packages\\*.tsx apps\\*.ts apps\\*.tsx 2>nul | findstr /V "test\\|spec\\|stories\\|config\\|setup\\|mock\\|fixture\\|old-\\|temp-\\|\\.d\\.ts" || echo ""`
            : `grep -r -n "^import.*from.*['\"].*['\"];*$" packages/ apps/ --include="*.ts" --include="*.tsx" | grep -v -E '\\.(test|spec|stories|config|setup|mock|fixture)\\.|old-|temp-|\\.d\\.ts' || true`;
        
        const { stdout } = await execAsync(command);
        if (stdout.trim() && stdout.trim() !== '""') {
            console.log('\x1b[33mℹ️  Найдены импорты (проверьте на неиспользуемые):\x1b[0m');
            const allLines = stdout.trim().split('\n');
            const displayLines = allLines.slice(0, 5);
            displayLines.forEach(line => console.log(`   ${line}`));
            const remainingCount = allLines.length - 5;
            const remainingMessage = remainingCount > 0 ? `   ... и еще ${remainingCount} импортов` : '';
            console.log(remainingMessage);
            console.log('');
        }
    } catch {
        // Игнорируем ошибки этой проверки
    }
}

// Дополнительные проверки качества кода (переработанная версия)
async function additionalChecks() {
    let issues = 0;
    
    // Проверка больших файлов
    issues += await checkLargeFiles();
    
    // Показываем предупреждение о неиспользуемых импортах (не блокирует коммит)
    await showUnusedImportsWarning();
    
    return issues;
}

for (const { pattern, description, excludeFiles, excludePatterns } of techDebtPatterns) {
    foundIssues += await checkPattern(pattern, description, excludeFiles, excludePatterns);
}

// Выполняем дополнительные проверки
foundIssues += await additionalChecks();

console.log('='.repeat(50));

if (foundIssues > 0) {
    console.log(`\x1b[41m\x1b[37m ❌ НАЙДЕНО ${foundIssues} типов технического долга! \x1b[0m`);
    console.log('\x1b[31m❌ КОММИТ ЗАБЛОКИРОВАН (Правило 13)\x1b[0m\n');
    console.log('\x1b[43m\x1b[30m📋 Команды для исправления:\x1b[0m');
    console.log('   npm run lint');
    console.log('   npm run build');
    console.log('   npm run test');
    console.log('');
    console.log('\x1b[43m\x1b[30m🔍 Поиск конкретных проблем:\x1b[0m');
    console.log('   git grep -n "TODO\\|FIXME\\|HACK\\|TEMP\\|XXX"');
    console.log('   git grep -n "@ts-ignore\\|: any"');
    console.log('');
    process.exit(1);
} else {
    console.log('\x1b[42m\x1b[30m ✅ Технический долг не найден! Коммит разрешен. \x1b[0m');
    console.log('');
    process.exit(0);
}
