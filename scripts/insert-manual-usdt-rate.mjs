import { resolve } from 'node:path';

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Загружаем переменные окружения из apps/web/.env
config({ path: resolve(process.cwd(), 'apps/web/.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('Make sure apps/web/.env exists and contains DATABASE_URL');
  process.exit(1);
}

const prisma = new PrismaClient();

async function insertManualUsdtRate() {
  try {
    console.log('Inserting manual USDT rate...');

    const result = await prisma.manualExchangeRate.upsert({
      where: {
        manual_rate_active_unique: {
          currency: 'USDT',
          isActive: true,
        },
      },
      update: {
        uahRate: 44.07,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
        comment:
          'Fallback курс БЕЗ маржи (44.07 UAH рыночный). SmartPricingService применит формулу: rate × (1 - 0.045 + 0.003) = rate × 0.958 для клиентского курса ~42.22 UAH.',
        updatedAt: new Date(),
      },
      create: {
        currency: 'USDT',
        uahRate: 44.07,
        isActive: true,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
        createdBy: 'system',
        comment:
          'Fallback курс БЕЗ маржи (44.07 UAH рыночный). SmartPricingService применит формулу: rate × (1 - 0.045 + 0.003) = rate × 0.958 для клиентского курса ~42.22 UAH.',
      },
    });

    console.log('✅ Manual USDT rate inserted/updated successfully:', {
      id: result.id,
      currency: result.currency,
      uahRate: result.uahRate.toString(),
      isActive: result.isActive,
      validUntil: result.validUntil,
      createdBy: result.createdBy,
      comment: result.comment,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });

    // Проверка
    const check = await prisma.manualExchangeRate.findFirst({
      where: {
        currency: 'USDT',
        isActive: true,
      },
    });

    console.log('\n📊 Current active USDT rate:', check);
  } catch (error) {
    console.error('❌ Error inserting manual rate:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

insertManualUsdtRate()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
