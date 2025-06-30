#!/usr/bin/env node

import process from 'process';

// Если запущено не интерактивно, пропускаем
if (process.argv.includes('--skip-interactive')) {
    process.exit(0);
}

// Функция для создания задержки
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Очень заметное напоминание о техническом долге
console.log('');
console.log('\x1b[41m\x1b[37m                                                    \x1b[0m');
console.log('\x1b[41m\x1b[37m  🚨 КРИТИЧЕСКОЕ НАПОМИНАНИЕ! ПРОВЕРЬТЕ ТЕХ ДОЛГ!  \x1b[0m');
console.log('\x1b[41m\x1b[37m                                                    \x1b[0m');
console.log('');
console.log('\x1b[43m\x1b[30m ⚠️  ОБЯЗАТЕЛЬНАЯ ПРОВЕРКА ПЕРЕД КОММИТОМ:          \x1b[0m');
console.log('\x1b[43m\x1b[30m     ❌ TODO, FIXME, HACK, TEMP, XXX               \x1b[0m');
console.log('\x1b[43m\x1b[30m     ❌ @ts-ignore, any, hardcode                  \x1b[0m');
console.log('\x1b[43m\x1b[30m     ❌ Временные решения и заглушки              \x1b[0m');
console.log('\x1b[43m\x1b[30m     ❌ Неиспользуемые импорты                    \x1b[0m');
console.log('\x1b[43m\x1b[30m     ❌ Ошибки компиляции и линтера               \x1b[0m');
console.log('');
console.log('\x1b[44m\x1b[37m 📋 КОМАНДЫ ДЛЯ ПРОВЕРКИ:                           \x1b[0m');
console.log('\x1b[44m\x1b[37m     npm run lint                                   \x1b[0m');
console.log('\x1b[44m\x1b[37m     npm run build                                  \x1b[0m');
console.log('\x1b[44m\x1b[37m     git grep -n "TODO\\|FIXME\\|HACK\\|TEMP\\|XXX"  \x1b[0m');
console.log('\x1b[44m\x1b[37m     git grep -n "@ts-ignore\\|: any"               \x1b[0m');
console.log('');
console.log('\x1b[45m\x1b[37m 🎯 ПРАВИЛО 13: КОД БЕЗ ТЕХНИЧЕСКОГО ДОЛГА!         \x1b[0m');
console.log('\x1b[45m\x1b[37m     Задача завершена ТОЛЬКО без техдолга!          \x1b[0m');
console.log('');
console.log('\x1b[42m\x1b[30m ✨ Коммит будет выполнен через 5 секунд...          \x1b[0m');
console.log('');

// Обратный отсчет с визуальным эффектом
for (let i = 5; i > 0; i--) {
    process.stdout.write(`\x1b[33m⏰ ${i}... \x1b[0m`);
    await sleep(1000);
}

console.log('');
console.log('\x1b[32m✅ Выполняю коммит... (НЕ ЗАБУДЬТЕ О ТЕХДОЛГЕ!)\x1b[0m');
console.log('');

// Просто напоминание, без блокировки коммита
process.exit(0);
