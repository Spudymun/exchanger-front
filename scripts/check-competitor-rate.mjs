/**
 * Проверка курса конкурента и анализ их маржи
 */

const ELITE_OBMEN_RATE = 41.073786; // Курс со скриншота

async function checkBinanceP2P() {
  try {
    const response = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset: 'USDT',
        fiat: 'UAH',
        tradeType: 'BUY',
        merchantCheck: true,
        page: 1,
        rows: 15,
        transAmount: '2600',
        payTypes: ['Monobank', 'PrivatBank', 'ABank'],
        countries: ['UA'],
        publisherType: 'merchant',
      }),
    });

    const data = await response.json();
    
    if (!data.success || !data.data || data.data.length === 0) {
      console.error('❌ Failed to fetch P2P data');
      return;
    }

    console.log('📊 BINANCE P2P ANALYSIS\n');
    console.log('TOP 10 MERCHANT ADS:');
    console.log('─'.repeat(80));

    const topAds = data.data.slice(0, 10);
    for (const [i, ad] of topAds.entries()) {
      const price = parseFloat(ad.adv.price);
      const liquidity = parseFloat(ad.adv.surplusAmount);
      const orders = ad.advertiser.monthOrderCount;
      const finishRate = (ad.advertiser.monthFinishRate * 100).toFixed(1);
      const positiveRate = (ad.advertiser.positiveRate * 100).toFixed(1);
      
      console.log(`${i + 1}. ${price.toFixed(2)} UAH | Liq: ${liquidity.toFixed(0)} USDT | Orders: ${orders} | Finish: ${finishRate}% | Positive: ${positiveRate}%`);
    }

    // Рассчитываем средний курс по топ-5
    const top5 = topAds.slice(0, 5);
    const avgPrice = top5.reduce((sum, ad) => sum + parseFloat(ad.adv.price), 0) / top5.length;
    
    // Рассчитываем weighted average как в вашем коде
    const totalLiquidity = top5.reduce((sum, ad) => sum + parseFloat(ad.adv.surplusAmount), 0);
    const weightedAvg = top5.reduce((sum, ad) => {
      const price = parseFloat(ad.adv.price);
      const liquidity = parseFloat(ad.adv.surplusAmount);
      const weight = liquidity / totalLiquidity;
      return sum + price * weight;
    }, 0);

    console.log('\n' + '─'.repeat(80));
    console.log('📈 MARKET RATES:');
    console.log(`   Simple Average (Top 5):      ${avgPrice.toFixed(2)} UAH`);
    console.log(`   Weighted Average (Top 5):    ${weightedAvg.toFixed(2)} UAH`);
    console.log(`   Best offer (cheapest):       ${parseFloat(topAds[0].adv.price).toFixed(2)} UAH`);
    
    console.log('\n' + '─'.repeat(80));
    console.log('🔍 COMPETITOR ANALYSIS:');
    console.log(`   EliteObmen rate:             ${ELITE_OBMEN_RATE.toFixed(2)} UAH`);
    
    const marginFromWeighted = ((1 - ELITE_OBMEN_RATE / weightedAvg) * 100).toFixed(2);
    const marginFromAvg = ((1 - ELITE_OBMEN_RATE / avgPrice) * 100).toFixed(2);
    const marginFromBest = ((1 - ELITE_OBMEN_RATE / parseFloat(topAds[0].adv.price)) * 100).toFixed(2);
    
    console.log(`   Margin vs Weighted Avg:      ${marginFromWeighted}%`);
    console.log(`   Margin vs Simple Avg:        ${marginFromAvg}%`);
    console.log(`   Margin vs Best offer:        ${marginFromBest}%`);

    console.log('\n' + '─'.repeat(80));
    console.log('💰 PROFITABILITY ANALYSIS (1000 USDT deal):');
    
    // ВАЖНО: EliteObmen курс 41.07 UAH - это КУРС КЛИЕНТУ (сколько UAH клиент получит)
    // Они ПОКУПАЮТ USDT у клиента, значит они ПЛАТЯТ клиенту 41.07 UAH за 1 USDT
    // Затем они ПРОДАЮТ этот USDT на P2P за 44.37 UAH
    
    console.log(`\n   ⚠️  ВАЖНО: EliteObmen ПОКУПАЕТ у клиента (клиент получает 41.07 UAH/USDT)`);
    console.log(`            Затем EliteObmen ПРОДАЕТ на P2P за ${weightedAvg.toFixed(2)} UAH/USDT`);
    
    const elitePayToClient = 1000 * ELITE_OBMEN_RATE; // Сколько платят клиенту
    const eliteSellOnP2P = 1000 * weightedAvg; // Сколько получают от продажи на P2P
    const bankFeeCards = 5; // Максимум 5 грн за перевод на карту клиенту
    const eliteGrossProfit = eliteSellOnP2P - elitePayToClient;
    const eliteNetProfit = eliteGrossProfit - bankFeeCards;
    const eliteProfitPercent = (eliteNetProfit / elitePayToClient * 100).toFixed(2);
    
    console.log(`\n   EliteObmen (схема без налогов):`);
    console.log(`   - Pay to client:    ${elitePayToClient.toFixed(2)} UAH (buy from client)`);
    console.log(`   - Sell on P2P:      ${eliteSellOnP2P.toFixed(2)} UAH (sell to P2P buyer)`);
    console.log(`   - Gross profit:     ${eliteGrossProfit.toFixed(2)} UAH`);
    console.log(`   - Bank fee:         ${bankFeeCards} UAH`);
    console.log(`   - NET PROFIT:       ${eliteNetProfit.toFixed(2)} UAH (${eliteProfitPercent}%)`);
    console.log(`   - Effective margin: ${((eliteGrossProfit / eliteSellOnP2P) * 100).toFixed(2)}%`);

    // Расчет для ФОП (легальная схема)
    console.log(`\n   ФОП Legal @ 7.5% margin (с налогами):`);
    
    const fopMargin = 0.075; // 7.5% маржа
    const fopRateToClient = weightedAvg * (1 - fopMargin);
    const fopPayToClient = 1000 * fopRateToClient;
    const fopSellOnP2P = 1000 * weightedAvg;
    const fopGrossProfit = fopSellOnP2P - fopPayToClient;
    
    const fopTax = 0.0517; // 5.17% налог ОТ ОБОРОТА (от суммы продажи)
    const fopBankFee = 0.0075; // 0.75% банк ОТ ОБОРОТА
    const fopTaxAmount = fopSellOnP2P * fopTax;
    const fopBankFeeAmount = fopSellOnP2P * fopBankFee;
    const fopNetProfit = fopGrossProfit - fopTaxAmount - fopBankFeeAmount;
    
    console.log(`   - Rate to client:   ${fopRateToClient.toFixed(2)} UAH (7.5% margin)`);
    console.log(`   - Pay to client:    ${fopPayToClient.toFixed(2)} UAH`);
    console.log(`   - Sell on P2P:      ${fopSellOnP2P.toFixed(2)} UAH`);
    console.log(`   - Gross profit:     ${fopGrossProfit.toFixed(2)} UAH`);
    console.log(`   - Taxes (5.17%):    ${fopTaxAmount.toFixed(2)} UAH`);
    console.log(`   - Bank fees (0.75%): ${fopBankFeeAmount.toFixed(2)} UAH`);
    console.log(`   - NET PROFIT:       ${fopNetProfit.toFixed(2)} UAH (${(fopNetProfit / fopPayToClient * 100).toFixed(2)}%)`);
    
    // Сравнение с маржой 4.2% (текущая конфигурация)
    console.log(`\n   ФОП @ 4.2% margin (текущая конфигурация - УБЫТОЧНА!):`);
    const currentMargin = 0.042;
    const currentRateToClient = weightedAvg * (1 - currentMargin);
    const currentPayToClient = 1000 * currentRateToClient;
    const currentSellOnP2P = 1000 * weightedAvg;
    const currentGrossProfit = currentSellOnP2P - currentPayToClient;
    const currentTaxAmount = currentSellOnP2P * fopTax;
    const currentBankFeeAmount = currentSellOnP2P * fopBankFee;
    const currentNetProfit = currentGrossProfit - currentTaxAmount - currentBankFeeAmount;
    
    console.log(`   - Rate to client:   ${currentRateToClient.toFixed(2)} UAH (4.2% margin)`);
    console.log(`   - Pay to client:    ${currentPayToClient.toFixed(2)} UAH`);
    console.log(`   - Sell on P2P:      ${currentSellOnP2P.toFixed(2)} UAH`);
    console.log(`   - Gross profit:     ${currentGrossProfit.toFixed(2)} UAH`);
    console.log(`   - Taxes (5.17%):    ${currentTaxAmount.toFixed(2)} UAH`);
    console.log(`   - Bank fees (0.75%): ${currentBankFeeAmount.toFixed(2)} UAH`);
    console.log(`   - NET PROFIT:       ${currentNetProfit.toFixed(2)} UAH ❌ УБЫТОК!`);

    console.log('\n' + '─'.repeat(80));
    console.log('🎯 CONCLUSION:');
    console.log(`\n   EliteObmen работает с маржой ~${marginFromWeighted}%`);
    console.log(`   Это возможно ТОЛЬКО при использовании серой схемы (сеть карт БЕЗ налогов)`);
    console.log(`\n   Для легального ФОП минимальная маржа: 6.92% (5.92% расходы + 1% прибыль)`);
    console.log(`   Ваша текущая маржа 4.2% УБЫТОЧНА для ФОП!`);
    console.log(`\n   Рекомендация: Используйте 7.5% маржу для ФОП или 4.2% только для теста серой схемы`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBinanceP2P();
