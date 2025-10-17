#!/usr/bin/env node

/**
 * Setup Telegram Webhook for Production
 * 
 * Регистрирует webhook URL в Telegram Bot API с secret_token для безопасности.
 * 
 * Usage:
 *   Development: node scripts/telegram-bot/setup-webhook.mjs --env dev
 *   Production:  node scripts/telegram-bot/setup-webhook.mjs --env prod
 */

import { randomBytes } from 'node:crypto';

import { config } from 'dotenv';

// Загрузка .env файла
config();

const TELEGRAM_API_BASE = 'https://api.telegram.org';

/**
 * Генерирует случайный secret token для webhook
 */
function generateSecretToken() {
  return randomBytes(32).toString('hex');
}

/**
 * Устанавливает webhook в Telegram Bot API
 */
async function setWebhook(webhookUrl, secretToken) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not found in environment variables');
  }

  const url = `${TELEGRAM_API_BASE}/bot${botToken}/setWebhook`;
  
  console.log('🔧 Setting webhook...');
  console.log(`   URL: ${webhookUrl}`);
  console.log(`   Secret: ${secretToken.substring(0, 8)}...`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secretToken,
      max_connections: 40,
      allowed_updates: ['message', 'callback_query'],
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
  }

  console.log('✅ Webhook set successfully!');
  return data;
}

/**
 * Проверяет текущий статус webhook
 */
async function getWebhookInfo() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not found in environment variables');
  }

  const url = `${TELEGRAM_API_BASE}/bot${botToken}/getWebhookInfo`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
  }

  return data.result;
}

/**
 * Удаляет webhook (для тестирования)
 */
async function deleteWebhook() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not found in environment variables');
  }

  const url = `${TELEGRAM_API_BASE}/bot${botToken}/deleteWebhook`;
  
  const response = await fetch(url, { method: 'POST' });
  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
  }

  console.log('🗑️  Webhook deleted');
  return data;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const envArg = args.find(arg => arg.startsWith('--env='));
  const env = envArg ? envArg.split('=')[1] : 'dev';
  
  const command = args[0];

  console.log('🤖 Telegram Webhook Setup');
  console.log(`   Environment: ${env}`);
  console.log('');

  // Команда: удалить webhook
  if (command === 'delete') {
    await deleteWebhook();
    return;
  }

  // Команда: показать статус
  if (command === 'status') {
    const info = await getWebhookInfo();
    console.log('📊 Current webhook status:');
    console.log(JSON.stringify(info, null, 2));
    return;
  }

  // Команда: установить webhook
  let webhookUrl;
  let secretToken;

  if (env === 'dev') {
    // Development: использовать ngrok URL из переменной окружения
    webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error('❌ TELEGRAM_WEBHOOK_URL not found in .env');
      console.log('');
      console.log('Steps to setup development webhook:');
      console.log('1. Start ngrok: ngrok http 3000');
      console.log('2. Add to .env: TELEGRAM_WEBHOOK_URL=https://YOUR_NGROK_URL.ngrok.io/api/telegram/webhook');
      console.log('3. Run this script again');
      process.exit(1);
    }

    // Генерируем новый secret token для dev
    // secretToken = generateSecretToken();
    secretToken = process.env.TELEGRAM_WEBHOOK_SECRET || generateSecretToken();

    console.log('⚠️  Add this to your .env file:');
    console.log('');
    console.log(`TELEGRAM_WEBHOOK_SECRET=${secretToken}`);
    console.log('');
    
  } else if (env === 'prod') {
    // Production: использовать production domain
    const productionDomain = process.env.VERCEL_URL || process.env.PRODUCTION_URL;
    
    if (!productionDomain) {
      console.error('❌ VERCEL_URL or PRODUCTION_URL not found');
      console.log('');
      console.log('Add to your production environment:');
      console.log('PRODUCTION_URL=https://yourdomain.com');
      process.exit(1);
    }

    webhookUrl = `https://${productionDomain}/api/telegram/webhook`;
    
    // В production используем существующий secret или генерируем новый
    secretToken = process.env.TELEGRAM_WEBHOOK_SECRET || generateSecretToken();
    
    if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
      console.log('⚠️  TELEGRAM_WEBHOOK_SECRET not found - generated new one');
      console.log('');
      console.log('Add this to your production environment variables:');
      console.log('');
      console.log(`TELEGRAM_WEBHOOK_SECRET=${secretToken}`);
      console.log('');
    }
  }

  await setWebhook(webhookUrl, secretToken);

  // Показываем текущий статус
  console.log('');
  const info = await getWebhookInfo();
  console.log('📊 Webhook info:');
  console.log(`   URL: ${info.url}`);
  console.log(`   Pending updates: ${info.pending_update_count}`);
  console.log(`   Max connections: ${info.max_connections || 'default (40)'}`);
  
  if (info.last_error_date) {
    console.log(`   ⚠️  Last error: ${info.last_error_message}`);
  }
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
