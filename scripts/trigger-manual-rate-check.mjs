#!/usr/bin/env node

/**
 * 🧪 ТЕСТОВЫЙ ТРИГГЕР: Вызов РЕАЛЬНОЙ проверки manual rates с Telegram уведомлением
 * 
 * Использование:
 *   1. Запустить telegram-bot: npm run dev:telegram
 *   2. Запустить этот скрипт: node scripts/trigger-manual-rate-check.mjs
 * 
 * @author AI Agent
 * @date 2025-10-16
 */

import { resolve } from 'node:path';

import { config } from 'dotenv';

config({ path: resolve(process.cwd(), 'apps/web/.env') });

console.log('🔍 Triggering Manual Rate Check (same as 9:00 AM scheduled job)');
console.log('='.repeat(70));

async function main() {
  const telegramBotUrl = process.env.TELEGRAM_BOT_URL || 'http://localhost:3003';
  
  console.log(`📡 Sending request to ${telegramBotUrl}/api/trigger-manual-rate-check\n`);

  try {
    const response = await fetch(`${telegramBotUrl}/api/trigger-manual-rate-check`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Если есть авторизация, добавьте её здесь
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Manual rate check completed');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    console.log('💡 Check Telegram for notifications if any rates were outdated');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Make sure telegram-bot is running: npm run dev:telegram');
    console.error('   2. Check TELEGRAM_BOT_URL in apps/web/.env');
    console.error('   3. Check DATABASE_URL in apps/web/.env');
    console.error('   4. Ensure PostgreSQL is running');
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
