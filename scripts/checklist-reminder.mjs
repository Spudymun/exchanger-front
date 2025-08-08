#!/usr/bin/env node

import process from 'node:process';

// Если запущено не интерактивно, пропускаем
if (process.argv.includes('--skip-interactive')) {
    process.exit(0);
}

// Функция для создания задержки
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Очень заметное напоминание
console.log('');
console.log('\x1b[41m\x1b[37m                                                \x1b[0m');
console.log('\x1b[41m\x1b[37m  🔥 ВАЖНОЕ НАПОМИНАНИЕ! ОБНОВИТЕ ЧЕК-ЛИСТЫ!  \x1b[0m');
console.log('\x1b[41m\x1b[37m                                                \x1b[0m');
console.log('');
console.log('\x1b[43m\x1b[30m ⚠️  НЕ ЗАБУДЬТЕ ОБНОВИТЬ ЧЕКПОИНТЫ ЗАДАЧ!      \x1b[0m');
console.log('\x1b[43m\x1b[30m     docs/tasks/*-CHECKLIST.md                  \x1b[0m');
console.log('');
console.log('\x1b[42m\x1b[30m ✨ Коммит будет выполнен через 3 секунды...     \x1b[0m');
console.log('');

// Обратный отсчет с визуальным эффектом
for (let i = 3; i > 0; i--) {
    process.stdout.write(`\x1b[33m⏰ ${i}... \x1b[0m`);
    await sleep(1000);
}

console.log('');
console.log('\x1b[32m✅ Выполняю коммит...\x1b[0m');
console.log('');

// Просто напоминание, без блокировки коммита
process.exit(0);
