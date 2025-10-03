// 🧪 Нагрузочное тестирование Order System (Node.js) - РЕАЛЬНАЯ ВЕРСИЯ
// 
// ЦЕЛЬ: Тестирование создания 10 одновременных заявок
// АРХИТЕКТУРА: Основано на РЕАЛЬНОМ коде exchange.ts роутера

// 🎯 ТЕСТОВЫЕ ДАННЫЕ - ТОЧНО по securityEnhancedCreateExchangeOrderSchema
const testOrders = [
  {
    email: 'loadtest1@example.com',
    cryptoAmount: 100,
    uahAmount: 4100, // ОБЯЗАТЕЛЬНОЕ поле
    currency: 'USDT-TRC20',
    tokenStandard: 'TRC-20',  // OPTIONAL из VALID_TOKEN_STANDARDS
    fixedExchangeRate: 41.0,  // OPTIONAL из схемы
    paymentDetails: {
      cardNumber: '4149 4978 0323 7281',  // securityEnhancedCardNumberSchema
      bankDetails: 'ПриватБанк'            // XSS protected string
    }
  },
  {
    email: 'loadtest2@example.com',
    cryptoAmount: 50,
    uahAmount: 2050,
    currency: 'BTC',
    fixedExchangeRate: 41.0,
    paymentDetails: {
      cardNumber: '5168 7454 1111 2222',
      bankDetails: 'Монобанк'
    }
  },
  {
    email: 'loadtest3@example.com',
    cryptoAmount: 200,
    uahAmount: 8200,
    currency: 'ETH',
    fixedExchangeRate: 41.0,
    paymentDetails: {
      cardNumber: '4149 4978 3333 4444',
      bankDetails: 'ПриватБанк'
    }
  },
  {
    email: 'loadtest4@example.com',
    cryptoAmount: 75,
    uahAmount: 3075,
    currency: 'USDT-TRC20',
    tokenStandard: 'TRC-20',
    fixedExchangeRate: 41.0,
    paymentDetails: {
      cardNumber: '5168 7454 5555 6666',
      bankDetails: 'Монобанк'
    }
  },
  {
    email: 'loadtest5@example.com',
    cryptoAmount: 120,
    uahAmount: 4920,
    currency: 'BTC',
    fixedExchangeRate: 41.0,
    paymentDetails: {
      cardNumber: '4149 4978 7777 8888',
      bankDetails: 'ПриватБанк'
    }
  },
  {
    email: 'loadtest6@example.com',
    cryptoAmount: 90,
    uahAmount: 3690,
    currency: 'ETH',
    fixedExchangeRate: 41.0,
    paymentDetails: {
      cardNumber: '5168 7454 9999 0000',
      bankDetails: 'Монобанк'
    }
  },
  {
    email: 'loadtest7@example.com',
    cryptoAmount: 150,
    uahAmount: 6150,
    currency: 'USDT-TRC20',
    tokenStandard: 'TRC-20',
    fixedExchangeRate: 41.0,
    paymentDetails: {
      cardNumber: '4149 4978 1111 3333',
      bankDetails: 'ПриватБанк'
    }
  },
  {
    email: 'loadtest8@example.com',
    cryptoAmount: 60,
    uahAmount: 2460,
    currency: 'BTC',
    fixedExchangeRate: 41.0,
    paymentDetails: {
      cardNumber: '5168 7454 4444 7777',
      bankDetails: 'Монобанк'
    }
  },
  {
    email: 'loadtest9@example.com',
    cryptoAmount: 80,
    uahAmount: 3280,
    currency: 'BTC',
    fixedExchangeRate: 41.0,
    paymentDetails: {
      cardNumber: '4149 4978 5555 6666',
      bankDetails: 'Монобанк'
    }
  },
  {
    email: 'loadtest10@example.com',
    cryptoAmount: 175,
    uahAmount: 7175,
    currency: 'USDT-TRC20',
    tokenStandard: 'TRC-20',
    fixedExchangeRate: 41.0,
    paymentDetails: {
      cardNumber: '5168 7454 7777 8888',
      bankDetails: 'ПриватБанк'
    }
  }
];

// 🎯 КОНФИГУРАЦИЯ ТЕСТИРОВАНИЯ
const CONFIG = {
  // API endpoints - РЕАЛЬНЫЙ формат на основе appRouter
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  TRPC_ENDPOINT: '/api/trpc/exchange.createOrder',  // Прямой путь к procedure
  
  // Test parameters
  CONCURRENT_ORDERS: 10,
  TIMEOUT_MS: 30000,
  
  // Logging
  DETAILED_LOGGING: process.env.DETAILED_LOGGING === 'true'
};

console.log('🧪 LOAD TEST: Order Creation System');
console.log('='.repeat(50));
console.log(`🚀 Starting load test: ${CONFIG.CONCURRENT_ORDERS} concurrent orders`);
  console.log(`📊 Target API: ${CONFIG.API_BASE_URL}/api/trpc/exchange.createOrder`);
console.log(`⏱️  Timeout: ${CONFIG.TIMEOUT_MS}ms`);
console.log('');

// 🎯 СОЗДАНИЕ ОДНОЙ ЗАЯВКИ
async function createSingleOrder(orderData, orderIndex) {
  const startTime = performance.now();
  
  try {
    if (CONFIG.DETAILED_LOGGING) {
      console.log(`📤 Order ${orderIndex + 1}: Sending request...`);
    }

    // 🎯 ПРАВИЛЬНЫЙ tRPC запрос (проверено curl'ом)
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/trpc/exchange.createOrder`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'load-test-script/1.0'
      },
      body: JSON.stringify({
        // Правильный формат tRPC запроса
        json: {
          email: orderData.email,
          cryptoAmount: orderData.cryptoAmount,
          uahAmount: orderData.uahAmount,
          currency: orderData.currency,
          tokenStandard: orderData.tokenStandard,
          fixedExchangeRate: orderData.fixedExchangeRate,
          paymentDetails: orderData.paymentDetails
        }
      }),
      timeout: CONFIG.TIMEOUT_MS
    });

    const responseTime = performance.now() - startTime;
    const responseData = await response.json();

    if (response.ok) {
      if (CONFIG.DETAILED_LOGGING) {
        console.log(`✅ Order ${orderIndex + 1}: Success (${Math.round(responseTime)}ms)`);
      }
      
      return {
        success: true,
        responseTime,
        orderId: responseData.result?.data?.orderId,
        depositAddress: responseData.result?.data?.depositAddress,
        status: responseData.result?.data?.status,
        sessionInfo: responseData.result?.data?.sessionInfo,
        queueInfo: responseData.result?.data?.queueInfo
      };
    } else {
      console.log(`❌ Order ${orderIndex + 1}: API Error (${response.status})`);
      return {
        success: false,
        responseTime,
        error: responseData.error?.message || `HTTP ${response.status}`,
        statusCode: response.status
      };
    }
  } catch (error) {
    const responseTime = performance.now() - startTime;
    console.log(`💥 Order ${orderIndex + 1}: Network Error - ${error.message}`);
    
    return {
      success: false,
      responseTime,
      error: error.message,
      isNetworkError: true
    };
  }
}

// 🎯 КЛАСС ДЛЯ СБОРА МЕТРИК
class LoadTestMetrics {
  constructor() {
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }

  addResult(result) {
    this.results.push(result);
  }

  generateReport() {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    const summary = {
      totalOrders: this.results.length,
      successCount: successful.length,
      failureCount: failed.length,
      errorCount: failed.filter(r => r.isNetworkError).length,
      totalTime: this.endTime - this.startTime,
      successRate: (successful.length / this.results.length) * 100
    };

    const responseTimes = successful.map(r => r.responseTime);
    const responseStats = responseTimes.length > 0 ? {
      average: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      min: Math.min(...responseTimes),
      max: Math.max(...responseTimes)
    } : null;

    return {
      summary,
      responseStats,
      results: this.results,
      errors: failed.map(r => ({
        error: r.error,
        statusCode: r.statusCode,
        isNetworkError: r.isNetworkError
      }))
    };
  }
}

// 🎯 ГЛАВНАЯ ФУНКЦИЯ ТЕСТИРОВАНИЯ
async function runLoadTest() {
  const metrics = new LoadTestMetrics();
  
  // Проверка доступности API
  try {
    console.log('🔍 Checking API availability...');
    const healthCheck = await fetch(`${CONFIG.API_BASE_URL}/api/health`, { timeout: 5000 });
    if (healthCheck.ok) {
      console.log('✅ API is accessible');
    } else {
      console.log('⚠️  API returned non-200 status, continuing anyway...');
    }
  } catch {
    console.log('❌ API health check failed, continuing anyway...');
  }

  console.log('');
  console.log('🔥 Running concurrent requests...');
  
  metrics.startTime = performance.now();
  
  // Создаем все промисы одновременно
  const promises = [];
  for (let i = 0; i < CONFIG.CONCURRENT_ORDERS; i++) {
    const orderData = testOrders[i % testOrders.length];
    promises.push(createSingleOrder(orderData, i));
  }
  
  // Ждем завершения всех запросов
  const results = await Promise.all(promises);
  
  metrics.endTime = performance.now();
  
  // Добавляем результаты в метрики
  for (const result of results) metrics.addResult(result);
  
  return metrics.generateReport();
}

// 🎯 ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ
function displayResults(report) {
  console.log('');
  console.log('📊 LOAD TEST RESULTS');
  console.log('='.repeat(40));
  console.log(`📈 Performance:`);
  console.log(`   Total Orders: ${report.summary.totalOrders}`);
  console.log(`   ✅ Successful: ${report.summary.successCount}`);
  console.log(`   ❌ Failed: ${report.summary.failureCount}`);
  console.log(`   💥 Errors: ${report.summary.errorCount}`);
  console.log(`   📊 Success Rate: ${report.summary.successRate.toFixed(1)}%`);
  console.log(`   ⏱️  Total Time: ${Math.round(report.summary.totalTime)}ms`);
  
  if (report.responseStats) {
    console.log(`📊 Response Time (successful requests):`);
    console.log(`   Average: ${Math.round(report.responseStats.average)}ms`);
    console.log(`   Min: ${Math.round(report.responseStats.min)}ms`);
    console.log(`   Max: ${Math.round(report.responseStats.max)}ms`);
  }
  
  if (report.summary.failureCount > 0) {
    console.log('');
    console.log('❌ Failed Requests:');
    const errorGroups = {};
    for (const error of report.errors) {
      const key = error.error || 'Unknown error';
      errorGroups[key] = (errorGroups[key] || 0) + 1;
    }
    
    for (const [error, count] of Object.entries(errorGroups)) {
      console.log(`   ${count}x: ${error}`);
    }
  }
  
  if (CONFIG.DETAILED_LOGGING && report.summary.successCount > 0) {
    console.log('');
    console.log('✅ Successful Orders:');
    for (const [_index, result] of report.results.filter(r => r.success).entries()) {
      const time = Math.round(result.responseTime);
      const orderId = result.orderId ? result.orderId.substring(0, 8) + '...' : 'N/A';
      console.log(`   Order ID: ${orderId}, Status: ${result.status || 'unknown'}, Time: ${time}ms`);
    }
  }
  
  console.log('');
  if (report.summary.failureCount === 0) {
    console.log('🎉 All requests completed successfully!');
  } else if (report.summary.successCount > report.summary.failureCount * 2) {
    console.log('⚠️  Test completed with some failures');
  } else {
    console.log('🚨 Test completed with significant failures');
  }
}

// 🚀 ЗАПУСК ТЕСТИРОВАНИЯ
(async () => {
  try {
    const report = await runLoadTest();
    displayResults(report);
  } catch (error) {
    console.error('💥 Load test failed:', error.message);
    process.exit(1);
  }
})();

console.log('🏁 Load test completed!');