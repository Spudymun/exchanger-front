/**
 * Next.js Instrumentation Hook
 * Вызывается ОДИН РАЗ при старте сервера (Node.js environment)
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * @architecture Production-ready bootstrap для BullMQ Worker
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getTelegramWorker, shutdownTelegramWorker } = await import('./src/workers');
    const { startManualRateChecker } = await import('./src/services/manual-rate-checker');
    
    // Запуск Worker сразу при старте сервера
    await getTelegramWorker().catch((error) => {
      console.error('[Instrumentation] Failed to start Worker:', error);
      // Не падаем - graceful degradation
    });

    console.log('[Instrumentation] BullMQ Worker initialized');

    // Запуск Manual Rate Checker (проверка устаревших курсов)
    startManualRateChecker();
    console.log('[Instrumentation] Manual Rate Checker initialized');

    // ✅ Graceful shutdown handlers
    let shutdownInitiated = false;

    const handleShutdown = async (signal: string) => {
      if (shutdownInitiated) return;
      shutdownInitiated = true;

      console.log(`[Instrumentation] Shutdown initiated: ${signal}`);
      await shutdownTelegramWorker();
      process.exit(0);
    };

    process.once('SIGTERM', () => void handleShutdown('SIGTERM'));
    process.once('SIGINT', () => void handleShutdown('SIGINT'));
  }
}
