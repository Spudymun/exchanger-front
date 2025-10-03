#!/usr/bin/env node

import { execSync } from 'node:child_process';

const API_BASE_URL = 'http://localhost:3000';
const CONCURRENT_ORDERS = 10;
const TIMEOUT_MS = 30000;

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function colorLog(text, color = 'reset') {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

function generateUniqueTestOrders(count) {
  const timestamp = Date.now();
  const orders = [];
  
  for (let i = 1; i <= count; i++) {
    const randomSeed = Math.floor(Math.random() * 1000);
    const uniqueId = `${timestamp}${randomSeed}${i}`;
    
    // Валидные карты с алгоритмом Луна (реальные украинские банки)
    const cardNumbers = [
      '5168748752963604', // ПриватБанк Mastercard
      '4149495642619387', // ПриватБанк Visa
      '5363549685864189', // Монобанк Mastercard
      '4731183258837352', // ПУМБ Visa
      '5580141225841179', // Райффайзен Mastercard
      '4149623394045515', // Ощадбанк Visa
      '5404729272600797', // УкрСиббанк Mastercard
      '4552318604426460', // Альфа-Банк Visa
      '5168746667725621', // ПриватБанк Mastercard #2
      '4731189552593153'  // ПУМБ Visa #2
    ];
    const cardNumber = cardNumbers[i - 1] || cardNumbers[0];
    
    const currency = 'USDT'; // Using only USDT for testing
    
    // USDT суммы в правильном диапазоне (10-5000)
    const cryptoAmount = 10 + (i % 5); // 10-14 USDT
    
    orders.push({
      email: `loadtest${i}-${uniqueId}@example.com`,
      cryptoAmount: cryptoAmount,
      uahAmount: cryptoAmount * 41, // Примерный курс
      currency: currency,
      tokenStandard: 'TRC-20', // Always TRC-20 for USDT
      fixedExchangeRate: 41.0,
      paymentDetails: {
        cardNumber: cardNumber,
        bankDetails: ['ПриватБанк', 'Монобанк', 'ПУМБ', 'Райффайзен'][i % 4]
      }
    });
  }
  
  return orders;
}

async function prepareDatabase() {
  try {
    colorLog('🔄 Resetting database...', 'yellow');
    execSync('npm run db:reset:web', { stdio: 'inherit' });
    colorLog('✅ Database reset successful', 'green');
    
    colorLog('🌱 Seeding database...', 'yellow');
    execSync('npm run db:seeds', { stdio: 'inherit' });
    colorLog('✅ Database seeding successful', 'green');
  } catch (error) {
    colorLog(`❌ Database preparation failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function createOrder(orderData, orderIndex) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/trpc/exchange.createOrder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'load-test-nodejs/1.0'
      },
      body: JSON.stringify({
        json: orderData
      }),
      timeout: TIMEOUT_MS
    });
    
    const responseTime = Date.now() - startTime;
    const responseText = await response.text();
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      return {
        success: true,
        orderIndex: orderIndex + 1,
        responseTime,
        orderId: data.result?.data?.orderId || data.result?.orderId,
        status: data.result?.data?.status || data.result?.status,
        depositAddress: data.result?.data?.depositAddress || data.result?.depositAddress
      };
    } else {
      return {
        success: false,
        orderIndex: orderIndex + 1,
        responseTime,
        error: `HTTP ${response.status} ${response.statusText}`,
        statusCode: response.status,
        responseBody: responseText
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      orderIndex: orderIndex + 1,
      responseTime,
      error: error.message,
      statusCode: null,
      responseBody: null
    };
  }
}

async function runConcurrentTest() {
  colorLog('🔥 Running concurrent requests...', 'yellow');
  
  const orders = generateUniqueTestOrders(CONCURRENT_ORDERS);
  const startTime = Date.now();
  
  // Создаем все Promise'ы одновременно для настоящего concurrent тестирования
  const promises = orders.map((order, index) => {
    colorLog(`📤 Starting order ${index + 1}: ${order.email}`, 'blue');
    return createOrder(order, index);
  });
  
  // Ждем все результаты
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  return {
    results,
    totalTime,
    startTime: new Date(startTime),
    endTime: new Date()
  };
}

function displayResults(testResults) {
  const { results, totalTime } = testResults;
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  colorLog('\n📊 LOAD TEST RESULTS', 'magenta');
  colorLog('='.repeat(40), 'gray');
  colorLog(`📈 Total Requests: ${results.length}`, 'reset');
  colorLog(`✅ Successful: ${successful.length}`, 'green');
  colorLog(`❌ Failed: ${failed.length}`, 'red');
  colorLog(`⏱️  Total Time: ${totalTime} ms`, 'yellow');
  
  if (successful.length > 0) {
    const avgResponseTime = successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length;
    const minResponseTime = Math.min(...successful.map(r => r.responseTime));
    const maxResponseTime = Math.max(...successful.map(r => r.responseTime));
    
    colorLog('📊 Response Time Stats (successful requests):', 'cyan');
    colorLog(`   Average: ${Math.round(avgResponseTime)} ms`, 'reset');
    colorLog(`   Min: ${minResponseTime} ms`, 'reset');
    colorLog(`   Max: ${maxResponseTime} ms`, 'reset');
  }
  
  if (failed.length > 0) {
    colorLog('\n❌ Failed Requests:', 'red');
    for (const failure of failed) {
      colorLog(`   Order ${failure.orderIndex}: ${failure.error}`, 'red');
      if (failure.responseBody && failure.responseBody.trim()) {
        try {
          const errorData = JSON.parse(failure.responseBody);
          if (errorData.error?.json?.message) {
            colorLog(`      Details: ${errorData.error.json.message}`, 'yellow');
          } else {
            colorLog(`      Response: ${failure.responseBody.substring(0, 200)}...`, 'yellow');
          }
        } catch {
          colorLog(`      Response: ${failure.responseBody.substring(0, 200)}...`, 'yellow');
        }
      }
    }
  }
  
  if (successful.length > 0) {
    colorLog('\n✅ Successful Orders:', 'green');
    for (const success of successful) {
      colorLog(`   Order ${success.orderIndex}: ID=${success.orderId || 'N/A'}, Status=${success.status || 'N/A'}, Time=${success.responseTime}ms`, 'green');
    }
  }
  
  colorLog('');
  if (failed.length === 0) {
    colorLog('🎉 All requests completed successfully!', 'green');
  } else if (successful.length > failed.length) {
    colorLog('⚠️  Test completed with some failures', 'yellow');
  } else {
    colorLog('🚨 Test completed with significant failures', 'red');
  }
}

async function checkDatabaseResults() {
  try {
    colorLog('\n🔍 Checking database results...', 'yellow');
    const output = execSync('docker exec exchanger-postgres psql -U exchanger_user -d exchanger_db -c "SELECT COUNT(*) as total_orders, status, currency FROM orders GROUP BY status, currency;"', { encoding: 'utf8' });
    colorLog('📊 Database state:', 'cyan');
    colorLog(output, 'reset');
  } catch (error) {
    colorLog(`⚠️  Could not check database: ${error.message}`, 'yellow');
  }
}

async function main() {
  colorLog('🧪 LOAD TEST: Order Creation System', 'magenta');
  colorLog('='.repeat(50), 'gray');
  colorLog(`🚀 Starting load test: ${CONCURRENT_ORDERS} concurrent orders`, 'green');
  colorLog(`📊 Target API: ${API_BASE_URL}/api/trpc/exchange.createOrder`, 'cyan');
  colorLog(`⏱️  Timeout: ${TIMEOUT_MS / 1000} seconds`, 'yellow');
  colorLog('');
  
  // Подготовка базы данных
  await prepareDatabase();
  colorLog('');
  
  // Запуск тестирования
  const testResults = await runConcurrentTest();
  
  // Отображение результатов
  displayResults(testResults);
  
  // Проверка базы данных
  await checkDatabaseResults();
  
  colorLog('🏁 Load test completed!', 'green');
}

main().catch(error => {
  colorLog(`💥 Fatal error: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
});