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

// Паттерны для поиска РЕАЛЬНОГО технического долга (то, что линтеры НЕ проверяют)
const techDebtPatterns = [
    // 1. ХАРДКОД - URL, IP, пароли, токены, магические числа
    { 
        pattern: 'localhost|127\\.0\\.0\\.1|192\\.168\\.|10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.',
        description: 'Хардкод localhost/IP адресов',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes, ...documentationFiles],
        excludePatterns: ['example', 'demo', 'placeholder', 'test', 'spec']
    },
    { 
        pattern: 'password.*[\'"`][a-zA-Z0-9]{4,}[\'"`]|token.*[\'"`][a-zA-Z0-9]{10,}[\'"`]',
        description: 'Хардкод паролей/токенов в коде',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes, ...documentationFiles],
        excludePatterns: ['example', 'demo', 'test', 'mock', 'placeholder', 'YOUR_TOKEN', 'your-password']
    },
    { 
        pattern: 'api\\.openai\\.com|sk-[a-zA-Z0-9]{48}|ghp_[a-zA-Z0-9]{36}',
        description: 'Хардкод API ключей',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes, ...documentationFiles],
        excludePatterns: ['example', 'demo', 'placeholder']
    },
    
    // 2. АРХИТЕКТУРНЫЕ ПРОБЛЕМЫ - циклические зависимости, нарушения слоев
    { 
        pattern: 'import.*\\.\\./\\.\\./\\.\\./\\.\\./',
        description: 'Глубокие относительные импорты (>3 уровней)',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes],
        excludePatterns: []
    },
    { 
        pattern: 'fetch\\(|axios\\.|http\\.',
        description: 'Прямые HTTP вызовы (нарушение архитектуры)',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes, 'packages/api-client/*'],
        excludePatterns: ['api-client', 'http-client', 'service']
    },
    
    // 3. ПРОИЗВОДИТЕЛЬНОСТЬ - блокирующие операции, утечки памяти
    { 
        pattern: 'setInterval\\(|setTimeout\\(.*[5-9][0-9]{3,}', // >5 секунд
        description: 'Долгие таймеры (потенциальные утечки)',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes],
        excludePatterns: ['poll', 'heartbeat', 'keepalive']
    },
    { 
        pattern: 'for.*length|while.*length.*>',
        description: 'Неоптимальные циклы с повторным вычислением length',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes],
        excludePatterns: []
    },
    
    // 4. БЕЗОПАСНОСТЬ - уязвимости, небезопасные операции
    { 
        pattern: 'innerHTML\\s*=|outerHTML\\s*=|document\\.write\\(',
        description: 'Небезопасные операции с DOM (XSS)',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes],
        excludePatterns: ['sanitize', 'escape', 'safe']
    },
    { 
        pattern: '\\beval\\s*\\(|new\\s+Function\\s*\\(',
        description: 'Опасные операции eval/Function',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes],
        excludePatterns: []
    },
    
    // 5. ПОЛЬЗОВАТЕЛЬСКИЙ ОПЫТ - отсутствие обработки ошибок
    { 
        pattern: '\\.then\\([^}]*\\)\\s*$|\\.catch\\(\\)\\s*$',
        description: 'Promise без обработки ошибок',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes],
        excludePatterns: ['void', 'ignore', 'suppress']
    },
    { 
        pattern: 'alert\\(|confirm\\(|prompt\\(',
        description: 'Использование нативных диалогов (плохой UX)',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes],
        excludePatterns: []
    },
    
    // 6. КАЧЕСТВО КОДА - магические числа, дублирование
    { 
        pattern: '\\b(100|200|300|400|500|600|700|800|900|1000|1200|1400|1600|1800|2000)\\b',
        description: 'Магические числа (должны быть константами)',
        excludeFiles: [...testFiles, ...storyFiles, ...toolingFiles, ...commonExcludes],
        excludePatterns: ['px', 'ms', 'width', 'height', 'delay', 'timeout', 'status']
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

// Дополнительные архитектурные проверки (то, что линтеры НЕ проверяют)
async function additionalChecks() {
    let issues = 0;
    
    // Проверка на дублирование кода
    issues += await checkCodeDuplication();
    
    // Проверка на отсутствие типизации в критичных местах
    issues += await checkMissingTypes();
    
    // Проверка на нарушения архитектуры
    issues += await checkArchitectureViolations();
    
    // Проверка на неиспользуемые файлы
    issues += await checkUnusedFiles();
    
    return issues;
}

// Проверка дублирования кода
async function checkCodeDuplication() {
    try {
        // Ищем одинаковые строки кода (потенциальное дублирование)
        const command = process.platform === 'win32'
            ? `powershell -Command "Get-ChildItem -Path packages,apps -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Where-Object {$_.Length -gt 0} | ForEach-Object { Get-Content $_.FullName | Where-Object {$_.Trim().Length -gt 20 -and $_ -notmatch '^\\s*(//|/\\*|\\*|import|export|interface|type)' } | Group-Object | Where-Object {$_.Count -gt 2} | Select-Object -First 3 Name,Count }"`
            : `find packages apps -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -h "^[[:space:]]*[^/].*" | grep -v "^[[:space:]]*import\\|^[[:space:]]*export\\|^[[:space:]]*interface\\|^[[:space:]]*type" | sort | uniq -c | sort -nr | head -5 | awk '$1 > 2'`;
        
        const { stdout } = await execAsync(command);
        if (stdout.trim()) {
            console.log('\x1b[33m⚠️  Потенциальное дублирование кода:\x1b[0m');
            console.log(stdout);
            return 1;
        }
        return 0;
    } catch {
        return 0;
    }
}

// Проверка отсутствия типизации в критичных местах
async function checkMissingTypes() {
    try {
        const command = process.platform === 'win32'
            ? `findstr /R /N "function.*\\(.*\\)\\s*{|export.*function.*\\(.*\\)\\s*{|const.*=.*\\(.*\\).*=>|let.*=.*\\(.*\\).*=>" packages\\*.ts packages\\*.tsx apps\\*.ts apps\\*.tsx 2>nul | findstr /V ": any\\|: string\\|: number\\|: boolean\\|: void\\|<.*>" || echo ""`
            : `grep -rn "function.*(.*)\\s*{\\|export.*function.*(.*)\\s*{\\|const.*=.*(.*).* =>\\|let.*=.*(.*).* =>" packages/ apps/ --include="*.ts" --include="*.tsx" | grep -v ": any\\|: string\\|: number\\|: boolean\\|: void\\|<.*>" || true`;
        
        const { stdout } = await execAsync(command);
        if (stdout.trim() && stdout.trim() !== '""') {
            console.log('\x1b[33m⚠️  Функции без явной типизации:\x1b[0m');
            const lines = stdout.trim().split('\n').slice(0, 3);
            lines.forEach(line => console.log(`   ${line}`));
            return 1;
        }
        return 0;
    } catch {
        return 0;
    }
}

// Проверка нарушений архитектуры
async function checkArchitectureViolations() {
    try {
        // UI компоненты не должны импортировать бизнес-логику
        const command = process.platform === 'win32'
            ? `findstr /R /N "import.*from.*api-client\\|import.*from.*hooks.*trading\\|import.*from.*exchange-core" packages\\ui\\*.ts packages\\ui\\*.tsx 2>nul || echo ""`
            : `grep -rn "import.*from.*api-client\\|import.*from.*hooks.*trading\\|import.*from.*exchange-core" packages/ui/ --include="*.ts" --include="*.tsx" 2>/dev/null || true`;
        
        const { stdout } = await execAsync(command);
        if (stdout.trim() && stdout.trim() !== '""') {
            console.log('\x1b[31m❌ Нарушение архитектуры: UI импортирует бизнес-логику\x1b[0m');
            const lines = stdout.trim().split('\n');
            lines.forEach(line => console.log(`   ${line}`));
            return 1;
        }
        return 0;
    } catch {
        return 0;
    }
}

// Проверка неиспользуемых файлов
async function checkUnusedFiles() {
    try {
        const command = process.platform === 'win32'
            ? `powershell -Command "Get-ChildItem -Path packages,apps -Recurse -Include *.ts,*.tsx | Where-Object {$_.Name -notmatch '(test|spec|stories|config|setup|index)' -and (Get-Content $_.FullName | Measure-Object -Line).Lines -lt 10 -and (Get-Content $_.FullName | Select-String 'export|import' | Measure-Object).Count -lt 2}"`
            : `find packages apps -name "*.ts" -o -name "*.tsx" | grep -v -E '(test|spec|stories|config|setup|index)' | xargs wc -l | awk '$1 < 10 {print $2}' | head -3`;
        
        const { stdout } = await execAsync(command);
        if (stdout.trim()) {
            console.log('\x1b[33mℹ️  Потенциально неиспользуемые файлы:\x1b[0m');
            const lines = stdout.trim().split('\n').slice(0, 3);
            lines.forEach(line => console.log(`   ${line}`));
        }
        return 0; // Не блокируем коммит
    } catch {
        return 0;
    }
}

// Основное выполнение всех проверок
for (const { pattern, description, excludeFiles, excludePatterns } of techDebtPatterns) {
    foundIssues += await checkPattern(pattern, description, excludeFiles, excludePatterns);
}

// Выполняем дополнительные архитектурные проверки
foundIssues += await additionalChecks();

console.log('='.repeat(50));

if (foundIssues > 0) {
    console.log(`\x1b[41m\x1b[37m ❌ НАЙДЕН ТЕХНИЧЕСКИЙ ДОЛГ! \x1b[0m`);
    console.log('\x1b[31m❌ КОММИТ ЗАБЛОКИРОВАН (Правило 13)\x1b[0m\n');
    console.log('\x1b[43m\x1b[30m🔧 Найденные проблемы требуют внимания:\x1b[0m');
    console.log('   • Хардкод в коде (URL, пароли, магические числа)');
    console.log('   • Архитектурные нарушения (неправильные импорты)');
    console.log('   • Проблемы безопасности (XSS, eval)');
    console.log('   • Проблемы производительности (неоптимальные циклы)');
    console.log('');
    console.log('\x1b[43m\x1b[30m🔍 Команды для диагностики:\x1b[0m');
    console.log('   git grep -n "localhost\\|127.0.0.1\\|password.*="');
    console.log('   git grep -n "innerHTML\\|eval\\|setTimeout.*[0-9]{4}"');
    console.log('');
    process.exit(1);
} else {
    console.log('\x1b[42m\x1b[30m ✅ Архитектурных проблем не найдено! Коммит разрешен. \x1b[0m');
    console.log('');
    process.exit(0);
}
