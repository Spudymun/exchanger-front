#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('\x1b[44m\x1b[37m🔍 ПРОВЕРКА ТЕХНИЧЕСКОГО ДОЛГА\x1b[0m\n');

// Список паттернов для поиска технического долга
const techDebtPatterns = [
    { pattern: 'TODO', description: 'TODO комментарии' },
    { pattern: 'FIXME', description: 'FIXME комментарии' },
    { pattern: 'HACK', description: 'HACK комментарии' },
    { pattern: 'TEMP', description: 'Временные решения' },
    { pattern: 'XXX', description: 'XXX маркеры' },
    { pattern: '@ts-ignore', description: 'TypeScript игнорирования' },
    { pattern: ': any\\b', description: 'any типы' },
];

let totalIssues = 0;

console.log('Поиск маркеров технического долга...\n');

async function checkPattern(pattern, description) {
    try {
        const { stdout } = await execAsync(`git grep -n "${pattern}" -- "*.ts" "*.tsx" "*.js" "*.jsx" "*.mjs" || true`);
        
        if (!stdout.trim()) {
            console.log(`\x1b[32m✅ ${description}: не найдено\x1b[0m`);
            return 0;
        }
        
        const lines = stdout.trim().split('\n');
        console.log(`\x1b[31m❌ ${description}: ${lines.length} найдено\x1b[0m`);
        
        // Показываем первые 3 результата как примеры
        lines.slice(0, 3).forEach(line => {
            console.log(`   ${line}`);
        });
        
        const remainingCount = lines.length - 3;
        if (remainingCount > 0) {
            console.log(`   ... и еще ${remainingCount} совпадений`);
        }
        console.log('');
        
        return lines.length;
    } catch {
        console.log(`\x1b[33m⚠️  ${description}: ошибка поиска\x1b[0m`);
        return 0;
    }
}

for (const { pattern, description } of techDebtPatterns) {
    const issueCount = await checkPattern(pattern, description);
    totalIssues += issueCount;
}

console.log('\n' + '='.repeat(50));

if (totalIssues === 0) {
    console.log('\x1b[42m\x1b[30m 🎉 ОТЛИЧНО! Технический долг не найден! \x1b[0m');
    console.log('\x1b[32m✅ Код готов к коммиту согласно Правилу 13\x1b[0m');
    process.exit(0);
} else {
    console.log(`\x1b[41m\x1b[37m ⚠️  НАЙДЕНО ${totalIssues} проблем технического долга! \x1b[0m`);
    console.log('\x1b[31m❌ Необходимо устранить перед коммитом (Правило 13)\x1b[0m');
    console.log('\n\x1b[44m\x1b[37mКоманды для проверки:\x1b[0m');
    console.log('npm run lint');
    console.log('npm run build');
    console.log('npm run test');
    process.exit(1);
}
