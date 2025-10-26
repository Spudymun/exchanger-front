/**
 * Скрипт для тестирования connection pool Prisma
 * 
 * Подключается к БД каждые 5 секунд, выполняет простой запрос
 * и показывает статистику соединений
 */

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://exchanger_user:exchanger_password@localhost:5432/exchanger_db?schema=public&connection_limit=5&pool_timeout=10&connect_timeout=5';

console.log('🔍 Тест Connection Pool Prisma\n');
console.log('📊 Параметры:');
console.log('   - Интервал: 5 секунд');
console.log('   - Итераций: 20');
console.log('   - Connection limit: 5');
console.log('   - Pool timeout: 10 секунд\n');

// Создаём Prisma Client с логированием
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'stdout' },
  ],
});

// Подсчёт запросов
let queryCount = 0;
prisma.$on('query', (e) => {
  queryCount++;
  console.log(`   └─ Query #${queryCount}: ${e.query.substring(0, 50)}... (${e.duration}ms)`);
});

/**
 * Выполняет простой запрос к БД и показывает детали соединений
 */
async function executeQuery(iteration) {
  const startTime = Date.now();
  
  try {
    // Получаем детальную информацию о соединениях
    const result = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = 'exchanger_db'
    `;
    
    const duration = Date.now() - startTime;
    const stats = result[0];
    
    console.log(`✅ Итерация #${iteration}:`);
    console.log(`   ├─ Время выполнения: ${duration}ms`);
    console.log(`   ├─ Всего соединений: ${stats.total_connections}`);
    console.log(`   ├─ Активных (active): ${stats.active_connections}`);
    console.log(`   └─ Ожидающих (idle): ${stats.idle_connections}`);
    
    return { 
      success: true, 
      duration, 
      connectionCount: Number(stats.total_connections),
      activeConnections: Number(stats.active_connections),
      idleConnections: Number(stats.idle_connections)
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Итерация #${iteration} - Ошибка:`);
    console.error(`   ├─ Время до ошибки: ${duration}ms`);
    console.error(`   └─ Ошибка: ${error.message}`);
    
    return { success: false, duration, error: error.message };
  }
}

/**
 * Основная функция тестирования
 */
async function runTest() {
  const results = [];
  const totalIterations = 20;
  const intervalMs = 500; // 5 секунд

  console.log(`🚀 Начинаю тест: ${new Date().toISOString()}\n`);

  for (let i = 1; i <= totalIterations; i++) {
    console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Итерация ${i}/${totalIterations}`);
    
    const result = await executeQuery(i);
    results.push(result);

    // Показываем статистику каждые 5 итераций
    if (i % 5 === 0) {
      const successCount = results.filter(r => r.success).length;
      const avgDuration = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.duration, 0) / successCount;
      
      console.log(`\n📈 Промежуточная статистика (${i} итераций):`);
      console.log(`   ├─ Успешных запросов: ${successCount}/${i}`);
      console.log(`   ├─ Среднее время: ${avgDuration.toFixed(2)}ms`);
      console.log(`   └─ Ошибок: ${i - successCount}`);
    }

    // Ждём 5 секунд перед следующей итерацией (кроме последней)
    if (i < totalIterations) {
      console.log(`   💤 Ожидание 5 секунд...`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  // Финальная статистика
  console.log(`\n\n🏁 Тест завершён: ${new Date().toISOString()}`);
  console.log(`\n📊 Итоговая статистика:`);
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const avgDuration = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.duration, 0) / successCount;
  const minDuration = Math.min(...results.filter(r => r.success).map(r => r.duration));
  const maxDuration = Math.max(...results.filter(r => r.success).map(r => r.duration));
  
  // Статистика по соединениям
  const successResults = results.filter(r => r.success);
  const avgConnections = successResults.reduce((sum, r) => sum + r.connectionCount, 0) / successResults.length;
  const maxConnections = Math.max(...successResults.map(r => r.connectionCount));
  const minConnections = Math.min(...successResults.map(r => r.connectionCount));

  console.log(`   📈 Производительность:`);
  console.log(`   ├─ Всего итераций: ${totalIterations}`);
  console.log(`   ├─ Успешных запросов: ${successCount} (${(successCount/totalIterations*100).toFixed(1)}%)`);
  console.log(`   ├─ Ошибок: ${failCount}`);
  console.log(`   ├─ Среднее время: ${avgDuration.toFixed(2)}ms`);
  console.log(`   ├─ Минимальное время: ${minDuration}ms`);
  console.log(`   ├─ Максимальное время: ${maxDuration}ms`);
  console.log(`   └─ Всего запросов к БД: ${queryCount}`);
  
  console.log(`\n   🔌 Соединения PostgreSQL:`);
  console.log(`   ├─ Среднее количество: ${avgConnections.toFixed(1)}`);
  console.log(`   ├─ Минимум: ${minConnections}`);
  console.log(`   ├─ Максимум: ${maxConnections}`);
  console.log(`   └─ Лимит pool: 5`);

  // Показываем текущие соединения перед выходом
  console.log(`\n🔌 Завершение теста...`);
  
  try {
    const connections = await prisma.$queryRaw`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE datname = 'exchanger_db'
    `;
    console.log(`   └─ Активных соединений в конце: ${connections[0]?.count || 0}`);
  } catch (error) {
    console.log(`   └─ Не удалось проверить соединения: ${error.message}`);
  }

  // await prisma.$disconnect();
}

// Обработка ошибок и graceful shutdown
process.on('SIGINT', async () => {
  console.log(`\n\n⚠️ Получен сигнал SIGINT - останавливаю тест...`);
  // await prisma.$disconnect();
  process.exit(0);
});

process.on('unhandledRejection', async (error) => {
  console.error('\n❌ Необработанная ошибка:', error);
  // await prisma.$disconnect();
  process.exit(1);
});

// Запуск теста
runTest().catch(async (error) => {
  console.error('\n❌ Критическая ошибка:', error);
  // await prisma.$disconnect();
  process.exit(1);
});
